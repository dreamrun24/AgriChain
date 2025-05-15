import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle, AlertCircle, InfoIcon, AlertTriangle, CreditCard, Clock, Shield } from "lucide-react";
import type { VerificationResult } from "@shared/schema";
import { useEffect, useState } from "react";

interface VerificationResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: VerificationResult | null;
}

export default function VerificationResultModal({
  isOpen,
  onClose,
  result,
}: VerificationResultModalProps) {
  const [transactionId, setTransactionId] = useState<string>("");
  const [showDetails, setShowDetails] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);

  useEffect(() => {
    if (result?.signatureValid && isOpen) {
      // Generate a mock transaction ID for escrow release
      setTransactionId(`TXN-ESCROW-${Math.random().toString(36).substring(2, 10).toUpperCase()}`);
      
      // Simulate the steps of processing with timeouts
      setProcessingStep(1);
      const timer1 = setTimeout(() => setProcessingStep(2), 1000);
      const timer2 = setTimeout(() => setProcessingStep(3), 2000);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [result, isOpen]);
  
  if (!result) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Verification Result</DialogTitle>
          <DialogDescription>
            Result of the product authenticity verification.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4 space-y-4">
          <div className="flex items-center justify-center py-4">
            {result.signatureValid ? (
              <div className="flex flex-col items-center text-secondary">
                <CheckCircle className="h-16 w-16" />
                <span className="text-xl font-medium mt-2">Verification Successful</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-destructive">
                <AlertCircle className="h-16 w-16" />
                <span className="text-xl font-medium mt-2">Verification Failed</span>
              </div>
            )}
          </div>

          {result.signatureValid && (
            <div className="bg-secondary/10 rounded-md p-3 mb-2">
              <h4 className="text-secondary font-medium mb-2 flex items-center">
                <Clock className="h-4 w-4 mr-1" /> 
                Escrow Release Status
              </h4>
              <div className="space-y-2">
                <div className={`flex items-center ${processingStep >= 1 ? 'text-secondary' : 'text-neutral-400'}`}>
                  <CheckCircle className={`h-4 w-4 mr-2 ${processingStep >= 1 ? 'opacity-100' : 'opacity-50'}`} /> 
                  Verification confirmed
                </div>
                <div className={`flex items-center ${processingStep >= 2 ? 'text-secondary' : 'text-neutral-400'}`}>
                  <Shield className={`h-4 w-4 mr-2 ${processingStep >= 2 ? 'opacity-100' : 'opacity-50'}`} /> 
                  Preparing escrow release
                </div>
                <div className={`flex items-center ${processingStep >= 3 ? 'text-secondary' : 'text-neutral-400'}`}>
                  <CreditCard className={`h-4 w-4 mr-2 ${processingStep >= 3 ? 'opacity-100' : 'opacity-50'}`} /> 
                  Funds released to supplier
                </div>
                
                {processingStep === 3 && (
                  <div className="text-sm mt-2 text-secondary-dark">
                    <p className="font-medium">Transaction ID: {transactionId}</p>
                    <p className="text-xs">Completed at: {new Date().toLocaleString()}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          <Button 
            variant="outline" 
            className="w-full text-sm" 
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </Button>

          {showDetails && (
            <>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-neutral-500">Product:</div>
                <div className="font-medium">{result.productName}</div>

                <div className="text-neutral-500">Product ID:</div>
                <div className="font-mono">{result.productId}</div>

                <div className="text-neutral-500">Batch ID:</div>
                <div className="font-mono">{result.batchId}</div>

                <div className="text-neutral-500">Timestamp:</div>
                <div>
                  {new Date(result.timestamp).toLocaleString()}
                </div>

                <div className="text-neutral-500">Signature Status:</div>
                <div>
                  {result.signatureValid ? (
                    <span className="text-secondary font-medium flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Valid
                    </span>
                  ) : (
                    <span className="text-destructive font-medium flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Invalid
                    </span>
                  )}
                </div>
              </div>

              <div
                className={`p-3 rounded-md text-sm flex items-start ${
                  result.signatureValid
                    ? "bg-secondary/20 text-secondary-dark"
                    : "bg-destructive/20 text-destructive"
                }`}
              >
                <InfoIcon className="h-5 w-5 mr-2 shrink-0" />
                <span>
                  {result.signatureValid
                    ? "Product verified successfully. Funds have been released from escrow to the supplier."
                    : "Could not verify the product. Please contact customer support."}
                </span>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
