import { useState } from "react";
import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import SupplierPortal from "@/pages/SupplierPortal";
import BuyerPortal from "@/pages/BuyerPortal";

function Router() {
  return (
    <Switch>
      <Route path="/" component={SupplierPortal} />
      <Route path="/supplier" component={SupplierPortal} />
      <Route path="/buyer" component={BuyerPortal} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<"supplier" | "buyer">("supplier");

  return (
    <TooltipProvider>
      <div className="min-h-screen flex flex-col">
        <AppHeader activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-grow container mx-auto px-4 py-6">
          {activeTab === "supplier" && <SupplierPortal />}
          {activeTab === "buyer" && <BuyerPortal />}
        </main>
        <AppFooter />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

export default App;
