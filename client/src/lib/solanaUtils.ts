import { Connection, PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { apiRequest } from "./queryClient";

// Default Solana endpoints
const SOLANA_ENDPOINT = process.env.SOLANA_ENDPOINT || "https://api.devnet.solana.com";

// Initialize Solana connection
const connection = new Connection(SOLANA_ENDPOINT);

// Create a USDC transfer transaction
export async function createUSDCTransferTransaction(
  fromPublicKey: PublicKey,
  amount: number,
  reference: string
): Promise<Transaction> {
  try {
    // Request a transaction from the server
    const response = await apiRequest("POST", "/api/solana/create-transaction", {
      from: fromPublicKey.toString(),
      amount,
      reference,
    });
    
    const data = await response.json();
    
    // Deserialize the transaction
    const transaction = Transaction.from(Buffer.from(data.serializedTransaction, "base64"));
    
    return transaction;
  } catch (error) {
    console.error("Error creating USDC transfer transaction:", error);
    throw new Error("Failed to create transaction");
  }
}

// Confirm transaction
export async function confirmTransaction(signature: string): Promise<boolean> {
  try {
    const confirmation = await connection.confirmTransaction(signature, "confirmed");
    return !confirmation.value.err;
  } catch (error) {
    console.error("Error confirming transaction:", error);
    return false;
  }
}

// Get wallet balance
export async function getBalance(publicKey: PublicKey): Promise<number> {
  try {
    const balance = await connection.getBalance(publicKey);
    return balance / 1e9; // Convert lamports to SOL
  } catch (error) {
    console.error("Error getting balance:", error);
    return 0;
  }
}

// Get USDC token balance
export async function getUSDCBalance(publicKey: PublicKey): Promise<number> {
  try {
    const response = await apiRequest("GET", `/api/solana/usdc-balance?wallet=${publicKey.toString()}`);
    const data = await response.json();
    return data.balance;
  } catch (error) {
    console.error("Error getting USDC balance:", error);
    return 0;
  }
}
