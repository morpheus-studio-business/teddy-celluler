"use server";

import { db } from "@/db";
import { products } from "@/db/schema";
import { revalidatePath } from "next/cache";
import { eq, desc } from "drizzle-orm";

interface CreateProductParams {
  category: "voucher" | "data_package" | "pulsa" | "other";
  provider: string;
  quota?: string;
  activePeriod: number;
  capitalPrice: number;
  sellingPrice: number;
}

export async function createProduct(params: CreateProductParams) {
  try {
    const id = crypto.randomUUID();

    await db.insert(products).values({
      id,
      category: params.category,
      provider: params.provider,
      quota: params.quota,
      activePeriod: params.activePeriod,
      capitalPrice: params.capitalPrice,
      sellingPrice: params.sellingPrice,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    revalidatePath(
      `/admin/${params.category === "voucher" ? "voucher" : params.category === "pulsa" ? "pulsa" : params.category === "data_package" ? "paket-data" : "aksesoris"}`,
    );

    return { success: true };
  } catch (error) {
    console.error("Failed to create product:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function getProducts(
  category: "voucher" | "data_package" | "pulsa" | "other",
) {
  try {
    const data = await db
      .select()
      .from(products)
      .where(eq(products.category, category))
      .orderBy(desc(products.createdAt));
    return data;
  } catch (error) {
    console.error("Failed to get products:", error);
    return [];
  }
}

export async function deleteProduct(id: string) {
  try {
    await db.delete(products).where(eq(products.id, id));
    revalidatePath("/admin/voucher");
    revalidatePath("/admin/paket-data");
    revalidatePath("/admin/pulsa");
    revalidatePath("/admin/aksesoris");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

export interface UpdateProductParams {
  id: string;
  category: "voucher" | "data_package" | "pulsa" | "other";
  provider: string;
  quota?: string;
  activePeriod: number;
  capitalPrice: number;
  sellingPrice: number;
}

export async function updateProduct(params: UpdateProductParams) {
  try {
    await db
      .update(products)
      .set({
        provider: params.provider,
        quota: params.quota,
        activePeriod: params.activePeriod,
        capitalPrice: params.capitalPrice,
        sellingPrice: params.sellingPrice,
        updatedAt: new Date(),
      })
      .where(eq(products.id, params.id));

    revalidatePath("/admin/voucher");
    revalidatePath("/admin/paket-data");
    revalidatePath("/admin/pulsa");
    revalidatePath("/admin/aksesoris");

    return { success: true };
  } catch (error) {
    console.error("Failed to update product:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

