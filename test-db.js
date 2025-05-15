import { db } from './server/db';
import { products, transactions } from './shared/schema';

async function seedDatabase() {
  console.log('Seeding database with test data...');
  
  try {
    // Insert test products
    const product1 = await db.insert(products).values({
      id: "PROD-001",
      name: "Organic Apples",
      description: "Fresh organic apples from local farms",
      price: "25",
      quantity: "50",
      unit: "kg",
      batchId: "BATCH-A1234",
      supplier: "Green Valley Farms",
      location: "Farm Valley, CA",
      status: "Listed",
    }).returning();
    
    const product2 = await db.insert(products).values({
      id: "PROD-002",
      name: "Premium Rice",
      description: "Premium quality rice, pesticide-free",
      price: "45",
      quantity: "100",
      unit: "kg",
      batchId: "BATCH-R5678",
      supplier: "Golden Fields",
      location: "Green Fields, OR",
      status: "In Escrow",
    }).returning();
    
    const product3 = await db.insert(products).values({
      id: "PROD-003",
      name: "Organic Tomatoes",
      description: "Vine-ripened organic tomatoes",
      price: "18",
      quantity: "75",
      unit: "kg",
      batchId: "BATCH-T9012",
      supplier: "Sunshine Organics",
      location: "Sunny Hills, WA",
      status: "Listed",
    }).returning();
    
    console.log('Products inserted successfully');
    
    // Insert a demo transaction
    const transaction = await db.insert(transactions).values({
      id: "TXN-001",
      productId: "PROD-002",
      productName: "Premium Rice",
      quantity: "50",
      unit: "kg",
      amount: "2250",
      buyerWallet: "demo_buyer_wallet_address",
      sellerWallet: "demo_seller_wallet_address",
      escrowAccount: "mock_escrow_account",
      escrowSignature: "mock_escrow_signature",
      status: "In Escrow",
      verified: false,
    }).returning();
    
    console.log('Transaction inserted successfully');
    
    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    process.exit(0);
  }
}

seedDatabase();