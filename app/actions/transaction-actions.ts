"use server";

import { db } from "@/db";
import { transactions } from "@/db/schema";
import { desc } from "drizzle-orm";
import { TransactionCategory } from "@/types";

export async function getTransactions() {
  const rows = await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.date));

  return rows.map((r) => ({
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
}

import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// ...

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
  return await getTransactions();
}

import { eq } from "drizzle-orm";

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

  return await getTransactions();
}
