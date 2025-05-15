import { InsertUser, User, Product, Transaction, Notification, InsertNotification } from "@shared/schema";
import { db } from "./db";
import { products, transactions, users, notifications } from "@shared/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Product methods
  getProducts(): Promise<Product[]>;
  getAvailableProducts(): Promise<Product[]>;
  getProductById(id: string): Promise<Product | undefined>;
  createProduct(product: Product): Promise<Product>;
  updateProduct(id: string, product: Product): Promise<Product>;
  
  // Transaction methods
  getTransactions(): Promise<Transaction[]>;
  getSupplierTransactions(): Promise<Transaction[]>;
  getBuyerTransactions(): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  getTransactionByProductId(productId: string): Promise<Transaction | undefined>;
  createTransaction(transaction: Transaction): Promise<Transaction>;
  updateTransaction(id: string, transaction: Transaction): Promise<Transaction>;
  
  // Notification methods
  getNotifications(userType: string): Promise<Notification[]>;
  getNotificationById(id: number): Promise<Notification | undefined>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification>;
  markAllNotificationsAsRead(userType: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.id, id));
    return result;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [result] = await db.select().from(users).where(eq(users.username, username));
    return result;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(insertUser).returning();
    return result as unknown as User;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products);
  }

  async getAvailableProducts(): Promise<Product[]> {
    return await db.select().from(products).where(eq(products.status, "Listed"));
  }

  async getProductById(id: string): Promise<Product | undefined> {
    const [result] = await db.select().from(products).where(eq(products.id, id));
    return result;
  }

  async createProduct(product: Product): Promise<Product> {
    // Convert numeric values to strings if needed
    const productToInsert = {
      ...product,
      price: typeof product.price === 'number' ? product.price.toString() : product.price,
      quantity: typeof product.quantity === 'number' ? product.quantity.toString() : product.quantity
    };
    
    const [result] = await db.insert(products).values(productToInsert).returning();
    return result;
  }

  async updateProduct(id: string, product: Product): Promise<Product> {
    // Convert numeric values to strings if needed
    const productToUpdate = {
      ...product,
      price: typeof product.price === 'number' ? product.price.toString() : product.price,
      quantity: typeof product.quantity === 'number' ? product.quantity.toString() : product.quantity
    };
    
    const [result] = await db
      .update(products)
      .set(productToUpdate)
      .where(eq(products.id, id))
      .returning();
    return result;
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return await db.select().from(transactions);
  }

  async getSupplierTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.sellerWallet, "demo_seller_wallet_address"));
  }

  async getBuyerTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.buyerWallet, "demo_buyer_wallet_address"));
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    const [result] = await db.select().from(transactions).where(eq(transactions.id, id));
    return result;
  }

  async getTransactionByProductId(productId: string): Promise<Transaction | undefined> {
    const [result] = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.productId, productId),
          eq(transactions.status, "In Escrow")
        )
      );
    return result;
  }

  async createTransaction(transaction: Transaction): Promise<Transaction> {
    // Convert numeric values to strings if needed
    const transactionToInsert = {
      ...transaction,
      quantity: typeof transaction.quantity === 'number' ? transaction.quantity.toString() : transaction.quantity,
      amount: typeof transaction.amount === 'number' ? transaction.amount.toString() : transaction.amount
    };
    
    const [result] = await db.insert(transactions).values(transactionToInsert).returning();
    return result;
  }

  async updateTransaction(id: string, transaction: Transaction): Promise<Transaction> {
    // Convert numeric values to strings if needed
    const transactionToUpdate = {
      ...transaction,
      quantity: typeof transaction.quantity === 'number' ? transaction.quantity.toString() : transaction.quantity,
      amount: typeof transaction.amount === 'number' ? transaction.amount.toString() : transaction.amount
    };
    
    const [result] = await db
      .update(transactions)
      .set(transactionToUpdate)
      .where(eq(transactions.id, id))
      .returning();
    return result;
  }

  // Notification methods
  async getNotifications(userType: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.userType, userType),
          eq(notifications.isRead, false)
        )
      )
      .orderBy(desc(notifications.date))
      .limit(50);
  }

  async getNotificationById(id: number): Promise<Notification | undefined> {
    const [result] = await db
      .select()
      .from(notifications)
      .where(eq(notifications.id, id));
    return result;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [result] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return result;
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const [result] = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id))
      .returning();
    return result;
  }

  async markAllNotificationsAsRead(userType: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userType, userType));
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private products: Map<string, Product>;
  private transactions: Map<string, Transaction>;
  private notifications: Map<number, Notification>;
  currentId: number;
  notificationId: number;

  constructor() {
    this.users = new Map();
    this.products = new Map();
    this.transactions = new Map();
    this.notifications = new Map();
    this.currentId = 1;
    this.notificationId = 1;

    // Add some demo products
    this.createProduct({
      id: "PROD-001",
      name: "Organic Apples",
      description: "Fresh organic apples from local farms",
      price: 25,
      quantity: 50,
      unit: "kg",
      batchId: "BATCH-A1234",
      supplier: "Green Valley Farms",
      location: "Farm Valley, CA",
      date: new Date("2023-11-01"),
      status: "Listed",
    });

    this.createProduct({
      id: "PROD-002",
      name: "Premium Rice",
      description: "Premium quality rice, pesticide-free",
      price: 45,
      quantity: 100,
      unit: "kg",
      batchId: "BATCH-R5678",
      supplier: "Golden Fields",
      location: "Green Fields, OR",
      date: new Date("2023-10-28"),
      status: "In Escrow",
    });

    this.createProduct({
      id: "PROD-003",
      name: "Organic Tomatoes",
      description: "Vine-ripened organic tomatoes",
      price: 18,
      quantity: 75,
      unit: "kg",
      batchId: "BATCH-T9012",
      supplier: "Sunshine Organics",
      location: "Sunny Hills, WA",
      date: new Date("2023-10-25"),
      status: "Listed",
    });

    // Add a demo transaction
    this.createTransaction({
      id: "TXN-001",
      productId: "PROD-002",
      productName: "Premium Rice",
      quantity: 50,
      unit: "kg",
      amount: 2250,
      buyerWallet: "demo_buyer_wallet_address",
      sellerWallet: "demo_seller_wallet_address",
      escrowAccount: "mock_escrow_account",
      escrowSignature: "mock_escrow_signature",
      date: new Date("2023-10-29"),
      status: "In Escrow",
      verified: false,
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getAvailableProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.status === "Listed" && Number(product.quantity) > 0
    );
  }

  async getProductById(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async createProduct(product: Product): Promise<Product> {
    this.products.set(product.id, product);
    return product;
  }

  async updateProduct(id: string, product: Product): Promise<Product> {
    this.products.set(id, product);
    return product;
  }

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values());
  }

  async getSupplierTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.sellerWallet === "demo_seller_wallet_address"
    );
  }

  async getBuyerTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.buyerWallet === "demo_buyer_wallet_address"
    );
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    return this.transactions.get(id);
  }

  async getTransactionByProductId(productId: string): Promise<Transaction | undefined> {
    return Array.from(this.transactions.values()).find(
      (transaction) => transaction.productId === productId && transaction.status === "In Escrow"
    );
  }

  async createTransaction(transaction: Transaction): Promise<Transaction> {
    this.transactions.set(transaction.id, transaction);
    return transaction;
  }

  async updateTransaction(id: string, transaction: Transaction): Promise<Transaction> {
    this.transactions.set(id, transaction);
    return transaction;
  }

  // Notification methods
  async getNotifications(userType: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(
        (notification) => notification.userType === userType && !notification.isRead
      )
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 50);
  }

  async getNotificationById(id: number): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const id = this.notificationId++;
    const newNotification: Notification = {
      ...notification,
      id,
      date: new Date(),
      isRead: false,
      // Ensure relatedId is never undefined - convert undefined to null
      relatedId: notification.relatedId ?? null
    };
    this.notifications.set(id, newNotification);
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<Notification> {
    const notification = this.notifications.get(id);
    if (!notification) {
      throw new Error(`Notification with id ${id} not found`);
    }
    const updatedNotification = { ...notification, isRead: true };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async markAllNotificationsAsRead(userType: string): Promise<void> {
    Array.from(this.notifications.entries())
      .filter(([_, notification]) => notification.userType === userType && !notification.isRead)
      .forEach(([id, notification]) => {
        this.notifications.set(id, { ...notification, isRead: true });
      });
  }
}

// Initialize with database storage
export const storage = new DatabaseStorage();
