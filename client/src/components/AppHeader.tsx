import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/useWallet";
import { Tractor, Menu, Wallet } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NotificationBell from "@/components/NotificationBell";

interface AppHeaderProps {
  activeTab: "supplier" | "buyer";
  setActiveTab: (tab: "supplier" | "buyer") => void;
}

export default function AppHeader({ activeTab, setActiveTab }: AppHeaderProps) {
  const [location, setLocation] = useLocation();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { publicKey, connected, connecting, connect } = useWallet();
  
  // Format wallet address for display
  const formattedWalletAddress = publicKey ? 
    `${publicKey.toString().substring(0, 4)}...${publicKey.toString().substring(publicKey.toString().length - 4)}` : 
    null;

  const handleTabChange = (tab: "supplier" | "buyer") => {
    setActiveTab(tab);
    setShowMobileMenu(false);
    setLocation(tab === "supplier" ? "/supplier" : "/buyer");
  };

  return (
    <header className="bg-primary text-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Tractor className="h-6 w-6" />
          <h1 className="text-xl font-medium">AgriChain</h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <button
            onClick={() => handleTabChange("supplier")}
            className={`py-2 px-1 font-medium ${
              activeTab === "supplier" ? "border-b-2 border-white" : ""
            }`}
          >
            Supplier Portal
          </button>
          <button
            onClick={() => handleTabChange("buyer")}
            className={`py-2 px-1 font-medium ${
              activeTab === "buyer" ? "border-b-2 border-white" : ""
            }`}
          >
            Buyer Portal
          </button>
          {connected ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    className="bg-white text-primary hover:bg-neutral-100 rounded-full font-medium"
                  >
                    <Wallet className="mr-2 h-4 w-4" />
                    {formattedWalletAddress}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Connected: {publicKey?.toString()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button
              onClick={connect}
              variant="outline"
              className="bg-white text-primary hover:bg-neutral-100 rounded-full font-medium"
              disabled={connecting}
            >
              {connecting ? "Connecting..." : "Connect Wallet"}
            </Button>
          )}
          <NotificationBell userType={activeTab} />
        </nav>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="md:hidden text-white"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="md:hidden bg-primary-light absolute w-full border-t border-primary-dark">
          <div className="container mx-auto px-4 py-2 flex flex-col space-y-3">
            <button
              onClick={() => handleTabChange("supplier")}
              className={`py-2 px-4 text-left rounded ${
                activeTab === "supplier" ? "bg-primary-dark" : ""
              }`}
            >
              Supplier Portal
            </button>
            <button
              onClick={() => handleTabChange("buyer")}
              className={`py-2 px-4 text-left rounded ${
                activeTab === "buyer" ? "bg-primary-dark" : ""
              }`}
            >
              Buyer Portal
            </button>
            {connected ? (
              <Button
                className="px-4 py-2 bg-white text-primary rounded font-medium hover:bg-neutral-100 w-full justify-start"
              >
                <Wallet className="mr-2 h-4 w-4" />
                {formattedWalletAddress}
              </Button>
            ) : (
              <Button
                onClick={connect}
                className="px-4 py-2 bg-white text-primary rounded font-medium hover:bg-neutral-100 w-full justify-start"
                disabled={connecting}
              >
                {connecting ? "Connecting..." : "Connect Wallet"}
              </Button>
            )}
            <div className="flex justify-center py-2">
              <NotificationBell userType={activeTab} />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
