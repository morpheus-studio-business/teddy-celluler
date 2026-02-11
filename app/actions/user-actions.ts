"use server";

import { db } from "@/db";
import { user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  const result = await db.select().from(user).orderBy(desc(user.createdAt));
  return result.map((u) => ({
    ...u,
    createdAt: u.createdAt.toISOString(),
    role: (u.role as "admin" | "karyawan") || "karyawan",
  }));
}

export async function deleteUser(id: string) {
  try {
    await db.delete(user).where(eq(user.id, id));
    revalidatePath("/admin/karyawan");
    return await getUsers();
  } catch (error) {
    console.error("Error deleting user:", error);
    return await getUsers();
  }
}

export async function updateUserRole(id: string, role: "admin" | "karyawan") {
  try {
    await db.update(user).set({ role }).where(eq(user.id, id));
    revalidatePath("/admin/karyawan");
    return await getUsers();
  } catch (error) {
    console.error("Error updating user role:", error);
    return [];
  }
}
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// ... existing code ...

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: "admin" | "karyawan";
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session || session.user.role !== "admin") {
      throw new Error("Unauthorized");
    }

    const newUser = await auth.api.createUser({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role as any,
      },
    });

    revalidatePath("/admin/karyawan");
    return { success: true, user: newUser };
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    const message =
      error instanceof Error ? error.message : "Failed to create user";
    return { success: false, error: message };
  }
}
