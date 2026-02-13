"use server";

import { db } from "@/db";
import { adminFeeRules } from "@/db/schema";
import { eq, and, lte, gte, asc } from "drizzle-orm";

export async function getAdminFeeRules() {
  const rows = await db
    .select()
    .from(adminFeeRules)
    .orderBy(asc(adminFeeRules.minAmount));
  return rows.map((r) => ({
    id: r.id,
    category: r.category as "transfer" | "withdraw" | "e-wallet",
    minAmount: r.minAmount,
    maxAmount: r.maxAmount,
    adminFee: r.adminFee,
  }));
}

export async function addAdminFeeRule(rule: {
  category: "transfer" | "withdraw" | "e-wallet";
  minAmount: number;
  maxAmount: number;
  adminFee: number;
}) {
  const id = Math.random().toString(36).substr(2, 9);
  await db.insert(adminFeeRules).values({
    id,
    category: rule.category,
    minAmount: rule.minAmount,
    maxAmount: rule.maxAmount,
    adminFee: rule.adminFee,
  });
  return await getAdminFeeRules();
}

export async function deleteAdminFeeRule(id: string) {
  await db.delete(adminFeeRules).where(eq(adminFeeRules.id, id));
  return await getAdminFeeRules();
}

export async function findAdminFee(
  category: "transfer" | "withdraw" | "e-wallet",
  amount: number,
): Promise<number | null> {
  const rows = await db
    .select()
    .from(adminFeeRules)
    .where(
      and(
        eq(adminFeeRules.category, category),
        lte(adminFeeRules.minAmount, amount),
        gte(adminFeeRules.maxAmount, amount),
      ),
    );
  return rows.length > 0 ? rows[0].adminFee : null;
}
