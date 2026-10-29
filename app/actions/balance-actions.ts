"use server";

import { db } from "@/db";
import { financialAccounts, balanceLogs } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { FinancialAccount, BalanceLog, AccountType } from "@/types";

const DEFAULT_ACCOUNTS: Array<{
  name: string;
  type: AccountType;
  accountNumber?: string;
}> = [
  { name: "Bank BRI", type: "bank" },
  { name: "Bank BCA", type: "bank" },
  { name: "Bank Mandiri", type: "bank" },
  { name: "Bank BNI", type: "bank" },
  { name: "DANA", type: "ewallet" },
  { name: "OVO", type: "ewallet" },
  { name: "GoPay", type: "ewallet" },
  { name: "ShopeePay", type: "ewallet" },
];

/**
 * Mengambil seluruh akun Bank & E-Wallet yang aktif.
 * Otomatis mengisi default data jika tabel masih kosong.
 */
export async function getFinancialAccounts(): Promise<FinancialAccount[]> {
  try {
    let accounts = await db
      .select()
      .from(financialAccounts)
      .where(eq(financialAccounts.isActive, true))
      .orderBy(financialAccounts.type, financialAccounts.name);

    // Seed default starter accounts if empty
    if (accounts.length === 0) {
      for (const item of DEFAULT_ACCOUNTS) {
        const id = crypto.randomUUID();
        await db.insert(financialAccounts).values({
          id,
          name: item.name,
          type: item.type,
          accountNumber: item.accountNumber || null,
          currentBalance: 0,
          isActive: true,
          createdAt: new Date(),
          lastUpdatedAt: new Date(),
        });
      }

      accounts = await db
        .select()
        .from(financialAccounts)
        .where(eq(financialAccounts.isActive, true))
        .orderBy(financialAccounts.type, financialAccounts.name);
    }

    return accounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type as AccountType,
      accountNumber: a.accountNumber,
      holderName: a.holderName,
      currentBalance: a.currentBalance,
      lastUpdatedBy: a.lastUpdatedBy,
      lastUpdatedAt: a.lastUpdatedAt ? a.lastUpdatedAt.toISOString() : null,
      createdAt: a.createdAt.toISOString(),
      isActive: a.isActive,
    }));
  } catch (error) {
    console.error("Gagal mengambil data akun keuangan:", error);
    return [];
  }
}

/**
 * Mencatat Saldo Baru (Opname Saldo).
 * Bisa dipanggil oleh Pegawai maupun Admin yang sedang login.
 * Pegawai TIDAK memiliki hak edit/hapus setelah berhasil disimpan.
 */
export async function recordBalance(params: {
  accountId: string;
  amount: number;
  notes?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return {
        success: false,
        error: "Silakan login terlebih dahulu untuk mencatat saldo.",
      };
    }

    if (isNaN(params.amount) || params.amount < 0) {
      return {
        success: false,
        error: "Nominal saldo harus berupa angka valid.",
      };
    }

    const logId = crypto.randomUUID();
    const now = new Date();
    const userName = session.user.name || "Karyawan";

    // 1. Simpan ke riwayat log saldo
    await db.insert(balanceLogs).values({
      id: logId,
      accountId: params.accountId,
      amount: params.amount,
      notes: params.notes?.trim() || null,
      userId: session.user.id,
      userName,
      createdAt: now,
    });

    // 2. Update saldo berjalan di akun bersangkutan
    await db
      .update(financialAccounts)
      .set({
        currentBalance: params.amount,
        lastUpdatedBy: userName,
        lastUpdatedAt: now,
      })
      .where(eq(financialAccounts.id, params.accountId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Gagal mencatat saldo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mencatat saldo.",
    };
  }
}

/**
 * Mengubah/Koreksi Catatan Saldo yang sudah diinput.
 * KHUSUS ADMIN: Pegawai ditolak (Unauthorized).
 */
export async function updateBalanceLog(params: {
  logId: string;
  amount: number;
  notes?: string;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return {
        success: false,
        error: "Akses ditolak: Hanya Admin yang berhak mengoreksi data saldo!",
      };
    }

    if (isNaN(params.amount) || params.amount < 0) {
      return {
        success: false,
        error: "Nominal saldo harus berupa angka valid.",
      };
    }

    const [existingLog] = await db
      .select()
      .from(balanceLogs)
      .where(eq(balanceLogs.id, params.logId))
      .limit(1);

    if (!existingLog) {
      return { success: false, error: "Catatan riwayat saldo tidak ditemukan." };
    }

    // Update log
    await db
      .update(balanceLogs)
      .set({
        amount: params.amount,
        notes: params.notes?.trim() || null,
      })
      .where(eq(balanceLogs.id, params.logId));

    // Periksa apakah ini log terbaru untuk akun terkait
    const [latestLog] = await db
      .select()
      .from(balanceLogs)
      .where(eq(balanceLogs.accountId, existingLog.accountId))
      .orderBy(desc(balanceLogs.createdAt))
      .limit(1);

    if (latestLog && latestLog.id === params.logId) {
      await db
        .update(financialAccounts)
        .set({
          currentBalance: params.amount,
          lastUpdatedBy: `${session.user.name} (Koreksi Admin)`,
          lastUpdatedAt: new Date(),
        })
        .where(eq(financialAccounts.id, existingLog.accountId));
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Gagal mengoreksi saldo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal mengoreksi saldo.",
    };
  }
}

/**
 * Menghapus Catatan Saldo.
 * KHUSUS ADMIN: Pegawai ditolak (Unauthorized).
 */
export async function deleteBalanceLog(logId: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return {
        success: false,
        error: "Akses ditolak: Hanya Admin yang berhak menghapus catatan saldo!",
      };
    }

    const [existingLog] = await db
      .select()
      .from(balanceLogs)
      .where(eq(balanceLogs.id, logId))
      .limit(1);

    if (!existingLog) {
      return { success: false, error: "Catatan riwayat saldo tidak ditemukan." };
    }

    await db.delete(balanceLogs).where(eq(balanceLogs.id, logId));

    // Update saldo akun ke log sebelumnya jika log yang dihapus adalah yang terakhir
    const [prevLog] = await db
      .select()
      .from(balanceLogs)
      .where(eq(balanceLogs.accountId, existingLog.accountId))
      .orderBy(desc(balanceLogs.createdAt))
      .limit(1);

    await db
      .update(financialAccounts)
      .set({
        currentBalance: prevLog ? prevLog.amount : 0,
        lastUpdatedBy: prevLog ? prevLog.userName : null,
        lastUpdatedAt: prevLog ? prevLog.createdAt : new Date(),
      })
      .where(eq(financialAccounts.id, existingLog.accountId));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus log saldo:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus log saldo.",
    };
  }
}

/**
 * Mengambil Riwayat Catatan Saldo (Log Input).
 */
export async function getBalanceLogs(params?: {
  accountId?: string;
  limit?: number;
}): Promise<BalanceLog[]> {
  try {
    const limit = params?.limit || 50;

    const query = db
      .select({
        id: balanceLogs.id,
        accountId: balanceLogs.accountId,
        accountName: financialAccounts.name,
        accountType: financialAccounts.type,
        amount: balanceLogs.amount,
        notes: balanceLogs.notes,
        userId: balanceLogs.userId,
        userName: balanceLogs.userName,
        createdAt: balanceLogs.createdAt,
      })
      .from(balanceLogs)
      .leftJoin(
        financialAccounts,
        eq(balanceLogs.accountId, financialAccounts.id),
      )
      .orderBy(desc(balanceLogs.createdAt))
      .limit(limit);

    if (params?.accountId) {
      query.where(eq(balanceLogs.accountId, params.accountId));
    }

    const rows = await query;
    return rows.map((r) => ({
      id: r.id,
      accountId: r.accountId,
      accountName: r.accountName || undefined,
      accountType: (r.accountType as AccountType) || undefined,
      amount: r.amount,
      notes: r.notes,
      userId: r.userId,
      userName: r.userName,
      createdAt: r.createdAt.toISOString(),
    }));
  } catch (error) {
    console.error("Gagal mengambil riwayat saldo:", error);
    return [];
  }
}

/**
 * Menambahkan Akun Bank atau E-Wallet Baru (KHUSUS ADMIN).
 */
export async function createFinancialAccount(params: {
  name: string;
  type: AccountType;
  accountNumber?: string;
  holderName?: string;
  initialBalance?: number;
}) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return {
        success: false,
        error: "Hanya Admin yang berhak menambah akun rekening / e-wallet!",
      };
    }

    const id = crypto.randomUUID();
    const initialBalance = params.initialBalance || 0;
    const now = new Date();

    await db.insert(financialAccounts).values({
      id,
      name: params.name.trim(),
      type: params.type,
      accountNumber: params.accountNumber?.trim() || null,
      holderName: params.holderName?.trim() || null,
      currentBalance: initialBalance,
      lastUpdatedBy: session.user.name,
      lastUpdatedAt: now,
      createdAt: now,
      isActive: true,
    });

    if (initialBalance > 0) {
      await db.insert(balanceLogs).values({
        id: crypto.randomUUID(),
        accountId: id,
        amount: initialBalance,
        notes: "Saldo Awal Akun Baru",
        userId: session.user.id,
        userName: session.user.name,
        createdAt: now,
      });
    }

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Gagal menambah akun keuangan:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menambah akun keuangan.",
    };
  }
}

/**
 * Menghapus/Menonaktifkan Akun (KHUSUS ADMIN).
 */
export async function deleteFinancialAccount(id: string) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user || (session.user as { role?: string }).role !== "admin") {
      return {
        success: false,
        error: "Hanya Admin yang berhak menghapus akun rekening / e-wallet!",
      };
    }

    await db
      .update(financialAccounts)
      .set({ isActive: false })
      .where(eq(financialAccounts.id, id));

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("Gagal menghapus akun keuangan:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Gagal menghapus akun keuangan.",
    };
  }
}
