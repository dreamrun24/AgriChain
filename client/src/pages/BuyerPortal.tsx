import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/buyer/ProductCard";
import PurchaseModal from "@/components/buyer/PurchaseModal";
import QRScannerModal from "@/components/buyer/QRScannerModal";
import VerificationResultModal from "@/components/buyer/VerificationResultModal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Product, Transaction, VerificationResult } from "@shared/schema";

export default function BuyerPortal() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState(1);

  // Fetch available products
  const { data: availableProducts = [], isLoading: isLoadingProducts } = useQuery<Product[]>({
    queryKey: ["/api/products/available"],
  });

  // Fetch buyer's purchases
  const { data: myPurchases = [], isLoading: isLoadingPurchases } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/buyer"],
  });

  // Purchase product mutation
  const purchaseMutation = useMutation({
    mutationFn: async ({
      productId,
      quantity,
    }: {
      productId: string;
      quantity: number;
    }) => {
      const res = await apiRequest("POST", "/api/transactions", { productId, quantity });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Purchase Successful",
        description: "Your funds are now in escrow until you verify the product.",
      });
      setShowPurchaseModal(false);
      // Refetch transactions and available products
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/buyer"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/available"] });
    },
    onError: (error) => {
      toast({
        title: "Purchase Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Verify product mutation
  const verifyMutation = useMutation({
    mutationFn: async (qrData: string) => {
      const res = await apiRequest("POST", "/api/verify", { qrData });
      return res.json() as Promise<VerificationResult>;
    },
    onSuccess: (data) => {
      setVerificationResult(data);
      setShowScannerModal(false);
      setShowVerificationModal(true);

      if (data.signatureValid && selectedTransaction) {
        // Update transaction status after verification
        queryClient.invalidateQueries({ queryKey: ["/api/transactions/buyer"] });
      }
    },
    onError: (error) => {
      setShowScannerModal(false);
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify the QR code. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = availableProducts.filter(
    (product) =>
      !searchQuery.trim() ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      product.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.location && product.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setPurchaseQuantity(1);
    setShowPurchaseModal(true);
  };

  const handlePurchase = () => {
    if (!selectedProduct) return;
    
    // Get the wallet address if wallet is connected
    // @ts-ignore - TypeScript doesn't know about the Phantom wallet in window.solana
    const walletAddress = window.solana?.isConnected 
      // @ts-ignore - TypeScript doesn't know about the Phantom wallet in window.solana
      ? window.solana.publicKey.toString() 
      : undefined;
    
    purchaseMutation.mutate({
      productId: selectedProduct.id,
      quantity: purchaseQuantity,
      buyerWallet: walletAddress,
    } as any); // Type assertion to avoid TypeScript error
  };

  const handleVerifyPurchase = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowScannerModal(true);
  };

  const handleQRScanned = (qrData: string) => {
    verifyMutation.mutate(qrData);
  };

  const handleCloseVerification = () => {
    setShowVerificationModal(false);
    setVerificationResult(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-medium text-neutral-800">Buyer Portal</h2>
        <p className="text-neutral-600 mt-1">
          Browse agricultural products and verify your purchases.
        </p>
      </div>

      {/* Search and Filter */}
      <Card className="bg-white p-4 rounded-lg shadow-card">
        <div className="relative">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2"
            placeholder="Search products, suppliers, or locations"
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-neutral-400" />
        </div>
      </Card>

      {/* Available Products */}
      <div>
        <h3 className="text-lg font-medium text-neutral-700 mb-3">Available Products</h3>
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
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelect={() => handleProductSelect(product)}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-neutral-500">
                {searchQuery
                  ? "No products found matching your search."
                  : "No products are currently available."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* My Purchases */}
      <div>
        <h3 className="text-lg font-medium text-neutral-700 mb-3">My Purchases</h3>
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
                    Quantity
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {isLoadingPurchases ? (
                  [...Array(2)].map((_, i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-4 py-3">
                        <div className="h-6 bg-neutral-200 rounded animate-pulse"></div>
                      </td>
                    </tr>
                  ))
                ) : myPurchases.length > 0 ? (
                  myPurchases.map((purchase) => (
                    <tr key={purchase.id}>
                      <td className="px-4 py-3 text-sm font-mono">{purchase.id}</td>
                      <td className="px-4 py-3 text-sm">{purchase.productName}</td>
                      <td className="px-4 py-3 text-sm">
                        {purchase.quantity} {purchase.unit}
                      </td>
                      <td className="px-4 py-3 text-sm">{purchase.amount} USDC</td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            purchase.status === "In Escrow"
                              ? "bg-accent-light text-accent-dark"
                              : purchase.status === "Verified"
                              ? "bg-secondary-light text-secondary-dark"
                              : ""
                          }`}
                        >
                          {purchase.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() => handleVerifyPurchase(purchase)}
                          disabled={purchase.status === "Verified"}
                          className={`bg-primary text-white px-2 py-1 rounded-md text-xs flex items-center space-x-1 ${
                            purchase.status === "Verified" ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <span className="text-xs">
                            {purchase.status === "Verified" ? "Verified" : "Verify"}
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-sm text-center text-neutral-500">
                      No purchases yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Modals */}
      <PurchaseModal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        product={selectedProduct}
        quantity={purchaseQuantity}
        setQuantity={setPurchaseQuantity}
        onPurchase={handlePurchase}
        isPending={purchaseMutation.isPending}
      />

      <QRScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onScan={handleQRScanned}
      />

      <VerificationResultModal
        isOpen={showVerificationModal}
        onClose={handleCloseVerification}
        result={verificationResult}
      />
    </div>
  );
}
