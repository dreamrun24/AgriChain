import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ShieldCheck, Leaf } from "lucide-react";
import type { Product } from "@shared/schema";

interface ProductCardProps {
  product: Product;
  onSelect: () => void;
}

export default function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <Card className="bg-white rounded-lg shadow-card hover:shadow-elevated transition-shadow border border-neutral-200">
      <CardContent className="p-4">
        <div>
          <div className="flex justify-between items-start">
            <div className="flex flex-col">
              <h4 className="text-lg font-medium">{product.name}</h4>
              <div className="flex mt-1 space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="px-2 py-0.5 text-xs rounded-full bg-green-50 text-green-700 border border-green-200 flex items-center">
                        <Leaf className="h-3 w-3 mr-1" />
                        Verified Source
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This product comes from a verified supplier</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="px-2 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        QR Protected
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>This product includes QR verification for authenticity</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <span className="text-lg font-medium text-primary">{product.price} USDC</span>
          </div>
          <p className="text-sm text-neutral-600 mt-2">{product.description}</p>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1 text-sm">
          <div className="text-neutral-500">Supplier:</div>
          <div>{product.supplier}</div>

          <div className="text-neutral-500">Available:</div>
          <div>
            {product.quantity} {product.unit}
          </div>

          <div className="text-neutral-500">Location:</div>
          <div>{product.location}</div>

          <div className="text-neutral-500">Listed Date:</div>
          <div>{new Date(product.date).toLocaleDateString()}</div>
        </div>

        <Button
          onClick={onSelect}
          className="mt-4 w-full bg-primary hover:bg-primary-dark text-white"
        >
          Purchase
        </Button>
      </CardContent>
    </Card>
  );
}
