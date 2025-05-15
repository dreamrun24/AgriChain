import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { z } from "zod";
import { nanoid } from "nanoid";
import { storage } from "./storage";
import { signProductData, generateQRCode, verifyQRCode } from "./qr";
import { createEscrow, releaseEscrow } from "./solana";
import { purchaseRequestSchema, verifyQRCodeSchema, insertNotificationSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes
  // All routes are prefixed with /api

  // Products Routes
  
  // Get products for supplier
  app.get("/api/products/supplier", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get available products for buyers
  app.get("/api/products/available", async (req, res) => {
    try {
      const products = await storage.getAvailableProducts();
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new product
  app.post("/api/products", async (req, res) => {
    try {
      const productData = req.body;
      const productId = `PROD-${nanoid(6)}`;
      const batchId = `BATCH-${nanoid(5).toUpperCase()}`;
      
      const product = await storage.createProduct({
        ...productData,
        id: productId,
        batchId: batchId,
        date: new Date(),
        status: "Listed",
      });
      
      res.status(201).json(product);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Generate QR code for a product
  app.get("/api/products/:id/qrcode", async (req, res) => {
    try {
      const productId = req.params.id;
      const product = await storage.getProductById(productId);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Create product data with signature
      const productData = {
        productId: product.id,
        batchId: product.batchId,
        timestamp: new Date().toISOString(),
      };
      
      // Sign the product data
      const signedData = await signProductData(productData);
      
      // Generate QR code
      const qrCodeBase64 = await generateQRCode(JSON.stringify(signedData));
      
      res.json({ qrCodeBase64 });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Transaction Routes
  
  // Get transactions for supplier
  app.get("/api/transactions/supplier", async (req, res) => {
    try {
      const transactions = await storage.getSupplierTransactions();
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get transactions for buyer
  app.get("/api/transactions/buyer", async (req, res) => {
    try {
      const transactions = await storage.getBuyerTransactions();
      res.json(transactions);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create a new transaction (purchase)
  app.post("/api/transactions", async (req, res) => {
    try {
      const purchaseRequest = purchaseRequestSchema.parse(req.body);
      
      // Get the product
      const product = await storage.getProductById(purchaseRequest.productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Check if quantity is available
      if (purchaseRequest.quantity > Number(product.quantity)) {
        return res.status(400).json({ message: "Requested quantity exceeds available stock" });
      }
      
      // Get the buyer's wallet address from the request or use demo for testing
      const buyerWallet = req.body.buyerWallet || "demo_buyer_wallet_address";
      // The seller wallet would typically come from the product's owner in a real app
      const sellerWallet = product.supplier.startsWith("wallet:") 
        ? product.supplier.replace("wallet:", "") 
        : "demo_seller_wallet_address";
      
      // Calculate total amount
      const amount = Number(product.price) * purchaseRequest.quantity;
      const amountStr = amount.toString();
      
      // Create escrow
      const escrowResult = await createEscrow(buyerWallet, sellerWallet, amountStr);
      
      // Convert numeric quantity to string for storage
      const quantityStr = purchaseRequest.quantity.toString();
      
      // Create transaction
      const transaction = await storage.createTransaction({
        id: `TXN-${nanoid(6)}`,
        productId: product.id,
        productName: product.name,
        quantity: quantityStr,
        unit: product.unit,
        amount: amountStr,
        buyerWallet,
        sellerWallet,
        escrowAccount: escrowResult.escrowAccount,
        escrowSignature: escrowResult.signature,
        date: new Date(),
        status: "In Escrow",
        verified: false,
      });
      
      // Update product quantity and status if needed
      const remainingQuantity = Number(product.quantity) - purchaseRequest.quantity;
      const remainingQuantityStr = remainingQuantity.toString();
      await storage.updateProduct(product.id, {
        ...product,
        quantity: remainingQuantityStr,
        status: remainingQuantity <= 0 ? "Sold Out" : "Listed",
      });
      
      res.status(201).json(transaction);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Verification Routes
  
  // Verify QR code
  app.post("/api/verify", async (req, res) => {
    try {
      const { qrData } = verifyQRCodeSchema.parse(req.body);
      
      // Verify the QR code data
      const verificationResult = await verifyQRCode(qrData);
      
      if (verificationResult.signatureValid) {
        const { productId } = verificationResult;
        
        // Get product details
        const product = await storage.getProductById(productId);
        if (!product) {
          return res.status(404).json({ message: "Product not found" });
        }
        
        // Get transaction for this product
        const transaction = await storage.getTransactionByProductId(productId);
        if (transaction && transaction.escrowAccount) {
          // Release funds from escrow
          await releaseEscrow(transaction.escrowAccount, transaction.sellerWallet);
          
          // Update transaction status
          await storage.updateTransaction(transaction.id, {
            ...transaction,
            status: "Verified",
            verified: true,
          });
        }
        
        res.json({
          productId,
          productName: product.name,
          batchId: product.batchId,
          timestamp: verificationResult.timestamp,
          signatureValid: true,
        });
      } else {
        res.json({
          ...verificationResult,
          signatureValid: false,
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Solana Routes
  
  // Create USDC transfer transaction
  app.post("/api/solana/create-transaction", async (req, res) => {
    try {
      const { from, amount, reference } = req.body;
      
      // In a real app, we would create a proper Solana transaction here
      // For demo purposes, we're just returning a mock transaction
      
      res.json({
        serializedTransaction: "mock_serialized_transaction",
        message: "Transaction created successfully",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get USDC balance
  app.get("/api/solana/usdc-balance", async (req, res) => {
    try {
      const { wallet } = req.query;
      
      // In a real app, we would get the actual USDC balance from Solana
      // For demo purposes, we're just returning a mock balance
      
      res.json({
        wallet,
        balance: 1000, // Mock USDC balance
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notification Routes
  
  // Get notifications for a specific user type (buyer or supplier)
  app.get("/api/notifications/:userType", async (req, res) => {
    try {
      const userType = req.params.userType;
      if (userType !== "buyer" && userType !== "supplier") {
        return res.status(400).json({ message: "Invalid user type. Must be 'buyer' or 'supplier'." });
      }
      
      const notifications = await storage.getNotifications(userType);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Mark a notification as read
  app.patch("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      const notification = await storage.markNotificationAsRead(id);
      res.json(notification);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Mark all notifications as read for a user type
  app.patch("/api/notifications/:userType/read-all", async (req, res) => {
    try {
      const userType = req.params.userType;
      if (userType !== "buyer" && userType !== "supplier") {
        return res.status(400).json({ message: "Invalid user type. Must be 'buyer' or 'supplier'." });
      }
      
      await storage.markAllNotificationsAsRead(userType);
      res.json({ message: `All notifications for ${userType} marked as read` });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Create the HTTP server
  const httpServer = createServer(app);
  
  // Create WebSocket server for real-time notifications
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Connected clients
  const clients = new Map<string, WebSocket>();
  
  wss.on('connection', (ws) => {
    // Generate a client ID
    const clientId = nanoid();
    clients.set(clientId, ws);
    
    // Send a welcome message
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to notifications server',
      clientId
    }));
    
    // Handle client messages (like subscribing to specific notification channels)
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        // Handle subscription to user type notifications
        if (data.type === 'subscribe' && data.userType) {
          // Store the user type with this client for filtering messages
          clients.set(clientId, ws);
          ws.send(JSON.stringify({
            type: 'subscribed',
            userType: data.userType
          }));
        }
      } catch (error) {
        console.error('Error processing message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      clients.delete(clientId);
    });
  });

  // Listen for transactions to create notifications
  app.use(async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(body) {
      // Only intercept JSON responses
      const contentType = this.getHeader('content-type');
      const contentTypeStr = typeof contentType === 'string' ? contentType : 
                           Array.isArray(contentType) ? contentType.join(', ') : String(contentType || '');
      if (contentTypeStr.includes('application/json')) {
        try {
          // Create notification for transaction creation
          if (req.method === 'POST' && req.path === '/api/transactions' && res.statusCode === 201) {
            const transaction = JSON.parse(body);
            createAndBroadcastNotification({
              userType: 'supplier',
              title: 'New Purchase',
              message: `New ${transaction.productName} purchase for ${transaction.amount} USDC`,
              type: 'transaction',
              relatedId: transaction.id
            });

            createAndBroadcastNotification({
              userType: 'buyer',
              title: 'Purchase Confirmation',
              message: `Your purchase of ${transaction.productName} is in escrow`,
              type: 'transaction',
              relatedId: transaction.id
            });
          }
          
          // Create notification for verification
          if (req.method === 'POST' && req.path === '/api/verify' && res.statusCode === 200) {
            const result = JSON.parse(body);
            if (result.signatureValid) {
              createAndBroadcastNotification({
                userType: 'supplier',
                title: 'Product Verified',
                message: `${result.productName} has been verified. Funds released from escrow.`,
                type: 'verification',
                relatedId: result.productId
              });

              createAndBroadcastNotification({
                userType: 'buyer',
                title: 'Verification Successful',
                message: `Your ${result.productName} has been verified successfully.`,
                type: 'verification',
                relatedId: result.productId
              });
            }
          }
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      }
      
      return originalSend.call(this, body);
    };
    
    next();
  });

  // Helper function to create and broadcast notifications
  async function createAndBroadcastNotification(notificationData: any) {
    try {
      // Create notification in database
      const notification = await storage.createNotification(notificationData);
      
      // Broadcast to all connected clients of the specified user type
      const message = JSON.stringify({
        type: 'notification',
        data: notification
      });
      
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    } catch (error) {
      console.error('Error creating or broadcasting notification:', error);
    }
  }
  
  return httpServer;
}
