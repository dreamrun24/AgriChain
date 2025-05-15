import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useQRScanner } from "@/hooks/useQRScanner";

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (data: string) => void;
}

export default function QRScannerModal({ isOpen, onClose, onScan }: QRScannerModalProps) {
  const { startScanner, stopScanner, scannerRef, lastResult } = useQRScanner();

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, startScanner, stopScanner]);

  useEffect(() => {
    if (lastResult) {
      onScan(lastResult);
    }
  }, [lastResult, onScan]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan QR Code</DialogTitle>
          <DialogDescription>
            Scan the product QR code to verify authenticity and release payment from escrow.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center my-6">
          <div className="relative w-64 h-64 mx-auto border-2 border-primary rounded-lg overflow-hidden">
            <div className="absolute inset-0 border-2 border-primary-light rounded-lg pointer-events-none z-10"></div>
            <div className="absolute top-0 left-0 w-full animate-pulse border-t-2 border-primary-light z-10"></div>
            <video
              ref={scannerRef}
              className="w-full h-full object-cover"
            ></video>
          </div>
          <p className="mt-4 text-base">Position the QR code within the frame</p>
          <p className="mt-2 text-sm text-neutral-500">
            Make sure the QR code is clearly visible and well-lit
          </p>
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
