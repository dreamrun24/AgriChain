import { useState, useRef, useCallback, useEffect } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";

export function useQRScanner() {
  const scannerRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const codeReaderRef = useRef<BrowserQRCodeReader | null>(null);

  // Initialize QR code reader
  useEffect(() => {
    codeReaderRef.current = new BrowserQRCodeReader();
    
    return () => {
      if (isScanning) {
        stopScanner();
      }
    };
  }, []);

  const startScanner = useCallback(async () => {
    if (!scannerRef.current || !codeReaderRef.current || isScanning) {
      return;
    }

    try {
      setIsScanning(true);
      setLastResult(null);

      // Check for camera permissions
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      
      const controls = await codeReaderRef.current.decodeFromStream(
        stream,
        scannerRef.current,
        (result, error) => {
          if (result) {
            setLastResult(result.getText());
            // Stop scanning after successful scan
            controls.stop();
            setIsScanning(false);
          }
          
          if (error && !(error instanceof TypeError)) {
            // TypeError is thrown when there's no QR code in view, which is normal
            console.error("Error scanning QR code:", error);
          }
        }
      );
    } catch (error) {
      console.error("Error starting QR scanner:", error);
      setIsScanning(false);
    }
  }, [isScanning]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current && scannerRef.current.srcObject) {
      const tracks = (scannerRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      scannerRef.current.srcObject = null;
    }
    
    setIsScanning(false);
  }, []);

  return {
    scannerRef,
    isScanning,
    lastResult,
    startScanner,
    stopScanner,
  };
}
