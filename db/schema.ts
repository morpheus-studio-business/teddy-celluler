import {
  pgTable,
  text,
  integer,
  timestamp,
  pgEnum,
  boolean,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "karyawan"]);
export const categoryEnum = pgEnum("category", [
  "transfer",
  "withdraw",
  "voucher",
  "data_package",
  "pulsa",
  "e-wallet",
  "other",
  "general",
]);
export const txTypeEnum = pgEnum("tx_type", ["income", "expense"]);
export const feeCategoryEnum = pgEnum("fee_category", [
  "transfer",
  "withdraw",
  "e-wallet",
]);

// Better Auth Tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull(),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  role: text("role").notNull().default("karyawan"),
  banned: boolean("banned"),
  banReason: text("banReason"),
  banExpires: timestamp("banExpires"),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull(),
  updatedAt: timestamp("updatedAt").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt"),
  updatedAt: timestamp("updatedAt"),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey(),
  date: timestamp("date").notNull(),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  adminFee: integer("admin_fee").notNull().default(0),
  total: integer("total").notNull(),
  category: categoryEnum("category").notNull(),
  type: txTypeEnum("type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  creatorName: text("creator_name"),
  capitalPrice: integer("capital_price").default(0),
  productId: text("product_id"),
});

// Admin Fee Rules table
export const adminFeeRules = pgTable("admin_fee_rules", {
  id: text("id").primaryKey(),
  category: feeCategoryEnum("fee_category").notNull(),
  minAmount: integer("min_amount").notNull(),
  maxAmount: integer("max_amount").notNull(),
  adminFee: integer("admin_fee").notNull(),
});

export const productCategoryEnum = pgEnum("product_category", [
  "voucher",
  "data_package",
  "pulsa",
  "other",
]);

export const products = pgTable("products", {
  id: text("id").primaryKey(),
  category: productCategoryEnum("category").notNull(),
  provider: text("provider").notNull(),
  quota: text("quota"), // Optional, e.g., "1GB", "Unlimited"
  activePeriod: integer("active_period").notNull(), // in days
  capitalPrice: integer("capital_price").notNull(),
  sellingPrice: integer("selling_price").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
