// Database migration script to add notifications table
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';

// Required for Neon serverless
neonConfig.webSocketConstructor = ws;

// Define SQL to create notifications table
const sql = `
  CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    related_id TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    date TIMESTAMP NOT NULL DEFAULT NOW()
  );
`;

// Execute the migration
async function runMigration() {
  // Use DATABASE_URL from environment
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Error: DATABASE_URL environment variable is required');
    process.exit(1);
  }

  // Create a Postgres client
  const pool = new Pool({ connectionString });
  const db = drizzle(pool);
  
  try {
    console.log('Creating notifications table...');
    await pool.query(sql);
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

runMigration();