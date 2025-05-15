import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InfoIcon } from "lucide-react";
import type { Product } from "@shared/schema";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  quantity: number;
  setQuantity: (quantity: number) => void;
  onPurchase: () => void;
  isPending: boolean;
}

export default function PurchaseModal({
  isOpen,
  onClose,
  product,
  quantity,
  setQuantity,
  onPurchase,
  isPending,
}: PurchaseModalProps) {
  if (!product) return null;

  const calculateTotal = () => {
    return (product.price * quantity).toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase Product</DialogTitle>
          <DialogDescription>Complete your purchase with USDC on Solana.</DialogDescription>
        </DialogHeader>
        <div className="my-4 space-y-4">
          <div>
            <h4 className="font-medium">{product.name}</h4>
            <p className="text-sm text-neutral-600 mt-1">{product.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
            <div className="text-neutral-500">Price per unit:</div>
            <div>
              {product.price} USDC/{product.unit}
            </div>

            <div className="text-neutral-500">Available quantity:</div>
            <div>
              {product.quantity} {product.unit}
            </div>

            <div className="text-neutral-500">Supplier:</div>
            <div>{product.supplier}</div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="quantity">Quantity to purchase:</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={product.quantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
            />
            <div className="mt-1 text-sm text-neutral-500">
              Total:{" "}
              <span className="font-medium text-primary">{calculateTotal()} USDC</span>
            </div>
          </div>

          <div className="bg-neutral-100 p-3 rounded-md text-sm text-neutral-700 flex items-start">
            <InfoIcon className="text-accent mr-2 text-lg shrink-0" />
            <span>
              Payment will be held in escrow until you verify the product authenticity by
              scanning the QR code upon delivery.
            </span>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onPurchase} disabled={isPending || quantity <= 0 || quantity > product.quantity}>
            {isPending ? "Processing..." : "Confirm Purchase"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
