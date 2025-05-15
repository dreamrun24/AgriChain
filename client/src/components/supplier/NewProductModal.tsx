import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Product } from "@shared/schema";

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: Omit<Product, "id" | "batchId" | "date" | "status">) => void;
  isPending: boolean;
}

export default function NewProductModal({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}: NewProductModalProps) {
  const [newProduct, setNewProduct] = useState<
    Omit<Product, "id" | "batchId" | "date" | "status">
  >({
    name: "",
    description: "",
    price: 0,
    quantity: 0,
    unit: "kg",
    location: "",
    // Get wallet address if connected
    // @ts-ignore
    supplier: window.solana?.isConnected ? `wallet:${window.solana.publicKey.toString()}` : "",
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewProduct((prev) => ({
      ...prev,
      [name]: name === "price" || name === "quantity" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setNewProduct((prev) => ({
      ...prev,
      unit: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || newProduct.price <= 0 || newProduct.quantity <= 0) {
      alert("Please fill in all required fields");
      return;
    }
    onSubmit(newProduct);
  };

  const resetForm = () => {
    setNewProduct({
      name: "",
      description: "",
      price: 0,
      quantity: 0,
      unit: "kg",
      location: "",
      // Get wallet address if connected
      // @ts-ignore
      supplier: window.solana?.isConnected ? `wallet:${window.solana.publicKey.toString()}` : "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        resetForm();
      }
    }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Fill in the details of your agricultural product.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Product Name*</Label>
              <Input
                id="name"
                name="name"
                value={newProduct.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={newProduct.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Price (USDC)*</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newProduct.price || ""}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="quantity">Quantity*</Label>
                <div className="flex">
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="1"
                    value={newProduct.quantity || ""}
                    onChange={handleInputChange}
                    placeholder="0"
                    className="rounded-r-none"
                    required
                  />
                  <Select value={newProduct.unit} onValueChange={handleSelectChange}>
                    <SelectTrigger className="w-24 rounded-l-none">
                      <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="units">units</SelectItem>
                      <SelectItem value="boxes">boxes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="location">Cultivation Location</Label>
              <Input
                id="location"
                name="location"
                value={newProduct.location}
                onChange={handleInputChange}
                placeholder="Enter farm location"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="supplier">Supplier Name*</Label>
              <Input
                id="supplier"
                name="supplier"
                value={newProduct.supplier}
                onChange={handleInputChange}
                placeholder="Enter supplier name"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
