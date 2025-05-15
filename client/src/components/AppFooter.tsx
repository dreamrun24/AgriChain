import { Tractor } from "lucide-react";

export default function AppFooter() {
  return (
    <footer className="bg-neutral-800 text-white py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Tractor className="h-6 w-6" />
            <h2 className="text-xl font-medium">AgriChain</h2>
          </div>

          <div className="flex flex-col items-center md:items-end">
            <p className="text-sm text-neutral-400">Powered by Solana Blockchain</p>
            <p className="text-xs text-neutral-500 mt-1">
              © {new Date().getFullYear()} AgriChain. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
