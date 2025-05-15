import { useEffect, useState } from "react";
import { X, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { generateQRCode } from "@/lib/qrUtils";
import type { Product } from "@shared/schema";

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export default function QRCodeModal({ isOpen, onClose, product }: QRCodeModalProps) {
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && product) {
      setIsLoading(true);
      // Generate QR code when modal opens
      fetch(`/api/products/${product.id}/qrcode`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to generate QR code");
          return res.json();
        })
        .then((data) => {
          setQrCodeUrl(data.qrCodeBase64);
        })
        .catch((error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setQrCodeUrl(null);
    }
  }, [isOpen, product, toast]);

  if (!product) return null;

  const handleDownload = () => {
    if (!qrCodeUrl) return;
    
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${product.id}_${product.batchId}_qrcode.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    if (!qrCodeUrl) return;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print QR Code: ${product.name}</title>
            <style>
              body { display: flex; justify-content: center; align-items: center; height: 100vh; }
              .container { text-align: center; }
              img { max-width: 300px; }
              .details { margin-top: 20px; font-family: Arial, sans-serif; }
            </style>
          </head>
          <body>
            <div class="container">
              <img src="${qrCodeUrl}" alt="Product QR Code" />
              <div class="details">
                <p><strong>Product:</strong> ${product.name}</p>
                <p><strong>ID:</strong> ${product.id}</p>
                <p><strong>Batch:</strong> ${product.batchId}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
            </div>
            <script>
              setTimeout(() => { window.print(); window.close(); }, 500);
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{product.name} - QR Code</DialogTitle>
          <DialogDescription>
            This QR code contains product information and server signature for verification.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-3 my-4">
          {isLoading ? (
            <div className="w-48 h-48 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : qrCodeUrl ? (
            <Card className="p-4 border-2 border-neutral-200">
              <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
            </Card>
          ) : (
            <div className="w-48 h-48 border-2 border-neutral-200 flex items-center justify-center">
              <p className="text-neutral-500">QR Code not available</p>
            </div>
          )}

          <p className="text-sm text-neutral-600 text-center">
            QR code contains product information and server signature for verification.
          </p>

          <div className="w-full grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
            <div className="text-neutral-500">Product ID:</div>
            <div className="font-mono">{product.id}</div>

            <div className="text-neutral-500">Batch ID:</div>
            <div className="font-mono">{product.batchId}</div>

            <div className="text-neutral-500">Timestamp:</div>
            <div>{new Date().toLocaleString()}</div>
          </div>
        </div>
        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="outline" type="button" onClick={handlePrint} className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            <span>Print</span>
          </Button>
          <Button type="button" onClick={handleDownload} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Download</span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
