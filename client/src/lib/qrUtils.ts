import { useEffect, useState } from "react";
import { apiRequest } from "./queryClient";

// Generate QR code from data
export async function generateQRCode(data: string): Promise<string> {
  try {
    const response = await apiRequest("POST", "/api/qrcode/generate", { data });
    const result = await response.json();
    return result.qrCodeBase64;
  } catch (error) {
    console.error("Error generating QR code:", error);
    throw new Error("Failed to generate QR code");
  }
}

// Verify QR code data
export async function verifyQRCode(qrData: string): Promise<any> {
  try {
    const response = await apiRequest("POST", "/api/qrcode/verify", { qrData });
    return await response.json();
  } catch (error) {
    console.error("Error verifying QR code:", error);
    throw new Error("Failed to verify QR code");
  }
}
