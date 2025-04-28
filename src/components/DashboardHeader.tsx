
import React from "react";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { Hex } from "lucide-react";

const DashboardHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between mb-8 py-4 border-b">
      <div className="flex items-center">
        <Hex className="h-8 w-8 mr-2 text-blockchain-primary" />
        <div>
          <h1 className="text-2xl font-bold">ChainSight Finance</h1>
          <p className="text-sm text-muted-foreground">
            Blockchain-Powered Financial Reporting
          </p>
        </div>
      </div>
      <ConnectWalletButton />
    </div>
  );
};

export default DashboardHeader;
