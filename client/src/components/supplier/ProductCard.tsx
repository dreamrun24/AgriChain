import { Edit, QrCode, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Product } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ProductCardProps {
  product: Product;
  onGenerateQR: () => void;
}

export default function ProductCard({ product, onGenerateQR }: ProductCardProps) {
  // Determine status icon and color
  const getStatusInfo = (status: string) => {
    switch (status) {
      case "Listed":
        return {
          icon: <AlertCircle className="h-4 w-4 mr-1" />,
          color: "bg-secondary-light text-secondary-dark",
          tooltip: "Product is listed and available for purchase"
        };
      case "In Escrow":
        return {
          icon: <Clock className="h-4 w-4 mr-1" />,
          color: "bg-accent-light text-accent-dark",
          tooltip: "Payment is in escrow, awaiting QR verification"
        };
      case "Verified":
        return {
          icon: <CheckCircle className="h-4 w-4 mr-1" />,
          color: "bg-green-100 text-green-800",
          tooltip: "Product has been verified and payment released"
        };
      default:
        return {
          icon: null,
          color: "",
          tooltip: ""
        };
    }
  };

  const statusInfo = getStatusInfo(product.status);

  return (
    <Card className="bg-white rounded-lg shadow-card hover:shadow-elevated transition-shadow border border-neutral-200">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="text-lg font-medium">{product.name}</h4>
            <p className="text-sm text-neutral-600 mt-1">{product.description}</p>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className={`px-2 py-1 rounded-full flex items-center ${statusInfo.color}`}>
                  {statusInfo.icon}
                  {product.status}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{statusInfo.tooltip}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
          <div className="text-neutral-500">Price:</div>
          <div className="font-medium">
            {product.price} USDC/{product.unit}
          </div>

          <div className="text-neutral-500">Quantity:</div>
          <div>
            {product.quantity} {product.unit}
          </div>

          <div className="text-neutral-500">Batch ID:</div>
          <div className="font-mono">{product.batchId}</div>

          <div className="text-neutral-500">Location:</div>
          <div>{product.location}</div>

          <div className="text-neutral-500">Listed Date:</div>
          <div>{new Date(product.date).toLocaleDateString()}</div>
        </div>

        <div className="mt-4 flex justify-between">
          <Button
            onClick={onGenerateQR}
            className="bg-primary text-white px-3 py-1.5 rounded text-sm flex items-center space-x-1"
          >
            <QrCode className="h-4 w-4" />
            <span>Generate QR</span>
          </Button>
          <Button
            variant="outline"
            className="text-neutral-600 hover:text-neutral-800 px-3 py-1.5 rounded text-sm flex items-center space-x-1 border border-neutral-300"
          >
            <Edit className="h-4 w-4" />
            <span>Edit</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
