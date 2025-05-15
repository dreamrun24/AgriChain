import jwt from "jsonwebtoken";
import * as qrcode from "qrcode";
import crypto from "crypto";

// Secret key for signing (in a real app, this would be in environment variables)
const SECRET_KEY = process.env.QR_SECRET_KEY || "qr_signature_secret_key_for_demo";

// Generate a keypair for signing (in a real app, this would be a Solana keypair)
const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },
  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

/**
 * Sign product data for QR code
 */
export async function signProductData(data: {
  productId: string;
  batchId: string;
  timestamp: string;
}): Promise<any> {
  try {
    // Sign the data with JWT
    const token = jwt.sign(data, SECRET_KEY, { expiresIn: "30d" });
    
    return {
      ...data,
      signature: token,
    };
  } catch (error) {
    console.error("Error signing product data:", error);
    throw new Error("Failed to sign product data");
  }
}

/**
 * Generate QR code from data
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    // Generate QR code as data URL
    const qrCodeDataUrl = await qrcode.toDataURL(data, {
      errorCorrectionLevel: "H",
      margin: 1,
      width: 300,
    });
    
    return qrCodeDataUrl;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

/**
 * Verify QR code data
 */
export async function verifyQRCode(qrData: string): Promise<any> {
  try {
    // Parse the QR data
    const parsedData = JSON.parse(qrData);
    
    // Verify the signature
    const { signature, ...data } = parsedData;
    
    try {
      // Verify JWT token
      const decoded = jwt.verify(signature, SECRET_KEY);
      return {
        ...data,
        timestamp: data.timestamp,
        signatureValid: true,
      };
    } catch (verifyError) {
      console.error("Signature verification failed:", verifyError);
      return {
        ...data,
        timestamp: data.timestamp,
        signatureValid: false,
      };
    }
  } catch (error) {
    console.error("Error verifying QR code:", error);
    throw new Error("Failed to verify QR code");
  }
}

/**
 * Get the public key for verification
 */
export function getPublicKey(): string {
  return publicKey;
}
