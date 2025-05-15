import { pgTable, text, serial, numeric, timestamp, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Dummy users table (just for the interface - not actually used in this version)
export const users = pgTable("users", {
  id: serial("id").primaryKey().notNull(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
});

// Products table
export const products = pgTable("products", {
  id: text("id").primaryKey().notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull().default("kg"),
  batchId: text("batch_id").notNull(),
  supplier: text("supplier").notNull(),
  location: text("location"),
  date: timestamp("date").notNull().defaultNow(),
  status: text("status").notNull().default("Listed"),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: text("id").primaryKey().notNull(),
  productId: text("product_id").notNull().references(() => products.id),
  productName: text("product_name").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  buyerWallet: text("buyer_wallet").notNull(),
  sellerWallet: text("seller_wallet").notNull(),
  escrowAccount: text("escrow_account"),
  escrowSignature: text("escrow_signature"),
  date: timestamp("date").notNull().defaultNow(),
  status: text("status").notNull().default("In Escrow"),
  verified: boolean("verified").notNull().default(false),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey().notNull(),
  userType: text("user_type").notNull(), // "buyer" or "supplier" or "all"
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // "transaction", "verification", "system"
  relatedId: text("related_id"), // Related entity ID (transaction ID, product ID)
  isRead: boolean("is_read").notNull().default(false),
  date: timestamp("date").notNull().defaultNow(),
});

// Schemas

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  batchId: true,
  date: true,
  status: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  productName: true,
  unit: true,
  amount: true,
  sellerWallet: true,
  escrowAccount: true,
  escrowSignature: true,
  date: true,
  status: true,
  verified: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  date: true,
  isRead: true,
});

export const purchaseRequestSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  buyerWallet: z.string().optional(),
});

export const verifyQRCodeSchema = z.object({
  qrData: z.string(),
});

// User types (for authentication in future)
export interface User {
  id: number;
  username: string;
  password: string;
  name: string;
  email: string;
}

export interface InsertUser {
  username: string;
  password: string;
  name: string;
  email: string;
}

// Main types
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type PurchaseRequest = z.infer<typeof purchaseRequestSchema>;
export type VerifyQRRequest = z.infer<typeof verifyQRCodeSchema>;

export type VerificationResult = {
  productId: string;
  productName: string;
  batchId: string;
  timestamp: string;
  signatureValid: boolean;
};
