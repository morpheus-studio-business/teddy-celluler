"use server";

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { desc, eq, and, gte, lte, lt, count } from "drizzle-orm";
import { TransactionCategory, FilterType } from "@/types";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function getTransactions(
  params: {
    page?: number;
    limit?: number;
    category?: TransactionCategory | "all";
    dateFilter?: FilterType;
    startDate?: string;
    endDate?: string;
  } = {},
) {
  const page = params.page || 1;
  const limit = params.limit ?? 10; // Use nullish coalescing to allow 0
  const offset = (page - 1) * limit;

  // Build where conditions
  const conditions = [];

  // Category Filter
  if (params.category && params.category !== "all") {
    conditions.push(eq(transactions.category, params.category));
  }

  // Date Filter
  const now = new Date();
  if (params.dateFilter === "daily") {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    conditions.push(gte(transactions.date, today));
  } else if (params.dateFilter === "weekly") {
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    conditions.push(gte(transactions.date, oneWeekAgo));
  } else if (params.dateFilter === "monthly") {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    conditions.push(gte(transactions.date, startOfMonth));
  } else if (params.dateFilter === "yearly") {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    conditions.push(gte(transactions.date, startOfYear));
  } else if (params.dateFilter === "custom") {
    if (params.startDate) {
      const start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      conditions.push(gte(transactions.date, start));
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(transactions.date, end));
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  // Get total count
  const [totalResult] = await db
    .select({ count: count() })
    .from(transactions)
    .where(whereClause);
  const total = totalResult.count;
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;

  // Get data
  const baseQuery = db
    .select()
    .from(transactions)
    .where(whereClause)
    .orderBy(desc(transactions.date));

  const rows =
    limit > 0 ? await baseQuery.limit(limit).offset(offset) : await baseQuery;

  const data = rows.map((r) => ({
    id: r.id,
    date: r.date.toISOString(),
    description: r.description,
    amount: r.amount,
    adminFee: r.adminFee,
    total: r.total,
    category: r.category,
    type: r.type,
    creatorName: r.creatorName || "Unknown",
    capitalPrice: r.capitalPrice,
    productId: r.productId,
  }));

  return {
    data,
    meta: {
      total,
      totalPages,
      page,
      limit,
    },
  };
}

export async function addTransaction(data: {
  description: string;
  amount: number;
  adminFee: number;
  total: number;
  category: TransactionCategory;
  type: "income" | "expense";
  capitalPrice?: number;
  productId?: string;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const id = Math.random().toString(36).substr(2, 9);
  await db.insert(transactions).values({
    id,
    date: new Date(),
    description: data.description,
    amount: data.amount,
    adminFee: data.adminFee,
    total: data.total,
    category: data.category,
    type: data.type,
    userId: session?.user.id,
    creatorName: session?.user.name || "Unknown",
    capitalPrice: data.capitalPrice || 0,
    productId: data.productId,
  });

  return { success: true };
}

export async function updateTransaction(data: {
  id: string;
  description: string;
  amount: number;
  adminFee: number;
  total: number;
  category: TransactionCategory;
  type: "income" | "expense";
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized: Only admin can edit transactions");
  }

  await db
    .update(transactions)
    .set({
      description: data.description,
      amount: data.amount,
      adminFee: data.adminFee,
      total: data.total,
      category: data.category,
      type: data.type,
    })
    .where(eq(transactions.id, data.id));

  return { success: true };
}

export async function deleteTransaction(id: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || session.user.role !== "admin") {
    throw new Error("Unauthorized: Only admin can delete transactions");
  }

  await db.delete(transactions).where(eq(transactions.id, id));

  return { success: true };
}

export async function getTransactionStats(
  params: {
    category?: TransactionCategory | "all";
    dateFilter?: FilterType;
    startDate?: string;
    endDate?: string;
  } = {},
) {
  // 1. Determine Period Boundaries
  const now = new Date();
  let periodStart: Date | null = null;
  let periodEnd: Date | null = null;

  if (params.dateFilter === "daily") {
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    periodStart = today;
  } else if (params.dateFilter === "weekly") {
    periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (params.dateFilter === "monthly") {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (params.dateFilter === "yearly") {
    periodStart = new Date(now.getFullYear(), 0, 1);
  } else if (params.dateFilter === "custom") {
    if (params.startDate) {
      const start = new Date(params.startDate);
      start.setHours(0, 0, 0, 0);
      periodStart = start;
    }
    if (params.endDate) {
      const end = new Date(params.endDate);
      end.setHours(23, 59, 59, 999);
      periodEnd = end;
    }
  }

  // 2. Build Conditions for CURRENT PERIOD
  const currentPeriodConditions = [];
  if (params.category && params.category !== "all") {
    currentPeriodConditions.push(eq(transactions.category, params.category));
  }
  if (periodStart) {
    currentPeriodConditions.push(gte(transactions.date, periodStart));
  }
  if (periodEnd) {
    currentPeriodConditions.push(lte(transactions.date, periodEnd));
  }
  const currentPeriodWhere =
    currentPeriodConditions.length > 0
      ? and(...currentPeriodConditions)
      : undefined;

  // 3. Build Conditions for PREVIOUS BALANCE (Before Start Date)
  const previousConditions = [];
  if (params.category && params.category !== "all") {
    previousConditions.push(eq(transactions.category, params.category));
  }
  let hasPreviousParams = false;
  if (periodStart) {
    previousConditions.push(lt(transactions.date, periodStart));
    hasPreviousParams = true;
  }

  // Fetch Current Period Stats
  const currentData = await db
    .select({
      total: transactions.total,
      type: transactions.type,
    })
    .from(transactions)
    .where(currentPeriodWhere);

  const totalIncome = currentData
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.total, 0);

  const totalExpense = currentData
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.total, 0);

  const currentPeriodBalance = totalIncome - totalExpense;

  // Fetch Previous Balance
  let previousBalance = 0;
  if (hasPreviousParams) {
    const previousWhere =
      previousConditions.length > 0 ? and(...previousConditions) : undefined;
    const previousData = await db
      .select({
        total: transactions.total,
        type: transactions.type,
      })
      .from(transactions)
      .where(previousWhere);

    const prevIncome = previousData
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.total, 0);
    const prevExpense = previousData
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.total, 0);
    previousBalance = prevIncome - prevExpense;
  }

  const totalEndingBalance = previousBalance + currentPeriodBalance;

  return {
    totalIncome,
    totalExpense,
    previousBalance,
    currentPeriodBalance,
    totalEndingBalance,
  };
}
