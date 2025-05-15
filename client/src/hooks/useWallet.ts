import { useState, useEffect, useCallback } from "react";
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  SignatureResult,
} from "@solana/web3.js";
import { useToast } from "./use-toast";

interface WalletAdapter {
  publicKey: PublicKey | null;
  signTransaction: (transaction: Transaction | VersionedTransaction) => Promise<Transaction | VersionedTransaction>;
  signAllTransactions: (transactions: (Transaction | VersionedTransaction)[]) => Promise<(Transaction | VersionedTransaction)[]>;
  signMessage: (message: Uint8Array) => Promise<Uint8Array>;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useWallet() {
  const [wallet, setWallet] = useState<WalletAdapter | null>(null);
  const [publicKey, setPublicKey] = useState<PublicKey | null>(null);
  const [connected, setConnected] = useState<boolean>(false);
  const [connecting, setConnecting] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if Phantom wallet is installed
    const checkForPhantom = async () => {
      try {
        // @ts-ignore - TypeScript doesn't know about the Phantom wallet
        const solana = window.solana;
        if (solana?.isPhantom) {
          setWallet(solana);
          
          // Check if the wallet is already connected
          if (solana.isConnected) {
            setPublicKey(solana.publicKey);
            setConnected(true);
          }
          
          // Add event listeners
          solana.on("connect", () => {
            setPublicKey(solana.publicKey);
            setConnected(true);
            setConnecting(false);
          });
          
          solana.on("disconnect", () => {
            setPublicKey(null);
            setConnected(false);
          });
        }
      } catch (error) {
        console.error("Error checking for Phantom wallet:", error);
      }
    };
    
    checkForPhantom();
    
    return () => {
      // Remove event listeners on cleanup
      if (wallet) {
        // @ts-ignore - TypeScript doesn't know about the Phantom wallet events
        if (typeof wallet.off === 'function') {
          // @ts-ignore
          wallet.off("connect");
          // @ts-ignore
          wallet.off("disconnect");
        }
      }
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      if (!wallet) {
        toast({
          title: "Wallet Not Found",
          description: "Please install Phantom wallet to continue.",
          variant: "destructive",
        });
        window.open("https://phantom.app/", "_blank");
        return;
      }
      
      if (!connected) {
        setConnecting(true);
        await wallet.connect();
      }
    } catch (error: any) {
      console.error("Error connecting to wallet:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Could not connect to wallet",
        variant: "destructive",
      });
      setConnecting(false);
    }
  }, [wallet, connected, toast]);

  const disconnect = useCallback(async () => {
    if (wallet && connected) {
      try {
        await wallet.disconnect();
      } catch (error) {
        console.error("Error disconnecting from wallet:", error);
      }
    }
  }, [wallet, connected]);

  const signTransaction = useCallback(
    async (transaction: Transaction | VersionedTransaction) => {
      if (!wallet || !connected) {
        throw new Error("Wallet not connected");
      }
      return await wallet.signTransaction(transaction);
    },
    [wallet, connected]
  );

  const signAndSendTransaction = useCallback(
    async (transaction: Transaction) => {
      if (!wallet || !connected || !publicKey) {
        throw new Error("Wallet not connected");
      }
      
      try {
        // Sign the transaction
        const signedTransaction = await wallet.signTransaction(transaction);
        
        // Connect to Solana network
        const connection = new Connection(
          process.env.SOLANA_ENDPOINT || "https://api.devnet.solana.com",
          "confirmed"
        );
        
        // Send the transaction
        const signature = await connection.sendRawTransaction(
          // @ts-ignore
          signedTransaction.serialize()
        );
        
        // Confirm the transaction
        const confirmation = await connection.confirmTransaction(signature, "confirmed");
        
        if (confirmation.value.err) {
          throw new Error("Transaction failed");
        }
        
        return signature;
      } catch (error) {
        console.error("Error signing and sending transaction:", error);
        throw error;
      }
    },
    [wallet, connected, publicKey]
  );

  return {
    wallet,
    publicKey,
    connected,
    connecting,
    connect,
    disconnect,
    signTransaction,
    signAndSendTransaction,
  };
}
