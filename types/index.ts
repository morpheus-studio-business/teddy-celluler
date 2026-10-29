export type TransactionCategory =
  | "transfer"
  | "withdraw"
  | "voucher"
  | "data_package"
  | "pulsa"
  | "e-wallet"
  | "other"
  | "general";

export interface Transaction {
  id: string;
  date: string; // ISO String
  description: string; // "Transfer" / Note
  amount: number; // "Harga" (Nominal)
  adminFee: number; // "Admin"
  total: number; // "Jumlah" (Amount + Admin)
  category: TransactionCategory;
  type: "income" | "expense"; // Keeping this for internal balance logic, although user focused on service types.
  creatorName?: string;
  // Let's assume "Pemasukan" logic still applies to the fee or total?
  // Actually user didn't mention Balance logic changes yet.
  // Let's keep it simple: We just record the service.
  capitalPrice?: number | null;
  productId?: string | null;
}

export type FilterType =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "all"
  | "custom";

export interface AdminFeeRule {
  id: string;
  category: "transfer" | "withdraw" | "e-wallet";
  minAmount: number;
  maxAmount: number;
  adminFee: number;
}

export type UserRole = "admin" | "karyawan";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface Product {
  id: string;
  category: "voucher" | "data_package" | "pulsa" | "other";
  provider: string;
  quota: string | null;
  activePeriod: number;
  capitalPrice: number;
  sellingPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export type AccountType = "bank" | "ewallet";

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  accountNumber?: string | null;
  holderName?: string | null;
  currentBalance: number;
  lastUpdatedBy?: string | null;
  lastUpdatedAt?: string | null;
  createdAt?: string | Date;
  isActive: boolean;
}

export interface BalanceLog {
  id: string;
  accountId: string;
  accountName?: string;
  accountType?: AccountType;
  amount: number;
  notes?: string | null;
  userId?: string | null;
  userName: string;
  createdAt: string | Date;
}
