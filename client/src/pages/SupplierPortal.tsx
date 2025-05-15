import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/supplier/ProductCard";
import NewProductModal from "@/components/supplier/NewProductModal";
import QRCodeModal from "@/components/supplier/QRCodeModal";
import { apiRequest } from "@/lib/queryClient";
import type { Product, Transaction } from "@shared/schema";

export default function SupplierPortal() {
  const { toast } = useToast();
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { data: products = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products/supplier"],
  });

  const { data: transactions = [], isLoading: isLoadingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/supplier"],
  });

  const addProductMutation = useMutation({
    mutationFn: async (newProduct: Omit<Product, "id" | "batchId" | "date" | "status">) => {
      const res = await apiRequest("POST", "/api/products", newProduct);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Product Added",
        description: "Your product has been listed successfully.",
      });
      setShowNewProductModal(false);
      // Invalidate the products query to refetch the updated list
      queryClient.invalidateQueries({ queryKey: ["/api/products/supplier"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to Add Product",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateQR = (product: Product) => {
    setSelectedProduct(product);
    setShowQRModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-medium text-neutral-800">Supplier Portal</h2>
        <Button
          onClick={() => setShowNewProductModal(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded flex items-center space-x-1 transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Add Product</span>
        </Button>
      </div>

      {/* Product Listings */}
      <div>
        <h3 className="text-lg font-medium text-neutral-700 mb-3">Your Products</h3>
        {isLoadingProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i} className="h-52 animate-pulse">
                <CardContent className="p-4">
                  <div className="h-full bg-neutral-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onGenerateQR={() => handleGenerateQR(product)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-neutral-500">
                You haven't added any products yet. Click the "Add Product" button to get started.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Transactions */}
      <div>
        <h3 className="text-lg font-medium text-neutral-700 mb-3">Pending Transactions</h3>
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-neutral-200">
              <thead className="bg-neutral-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Transaction ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Buyer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {isLoadingTransactions ? (
                  [...Array(2)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-6 bg-neutral-200 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : transactions.length > 0 ? (
                  transactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td className="px-4 py-3 text-sm font-mono">{transaction.id}</td>
                      <td className="px-4 py-3 text-sm">{transaction.productName}</td>
                      <td className="px-4 py-3 text-sm">{transaction.amount} USDC</td>
                      <td className="px-4 py-3 text-sm font-mono">{transaction.buyerWallet}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(transaction.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            transaction.status === "In Escrow"
                              ? "bg-accent-light text-accent-dark"
                              : transaction.status === "Verified"
                              ? "bg-secondary-light text-secondary-dark"
                              : ""
                          }`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-sm text-center text-neutral-500">
                      No pending transactions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <NewProductModal
        isOpen={showNewProductModal}
        onClose={() => setShowNewProductModal(false)}
        onSubmit={(product) => addProductMutation.mutate(product)}
        isPending={addProductMutation.isPending}
      />

      <QRCodeModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        product={selectedProduct}
      />
    </div>
  );
}
