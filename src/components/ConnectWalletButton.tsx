
import React from "react";
import { Button } from "@/components/ui/button";
import { useBlockchain } from "@/contexts/BlockchainContext";
import { Wallet } from "lucide-react";

const ConnectWalletButton: React.FC = () => {
  const { connected, connecting, connect, account } = useBlockchain();

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Button
      onClick={connect}
      disabled={connecting || connected}
      variant={connected ? "outline" : "default"}
      className={`flex items-center justify-center gap-2 ${
        connected ? "text-green-600 border-green-600" : ""
      }`}
    >
      <Wallet size={18} />
      {connecting
        ? "Connecting..."
        : connected && account
        ? formatAddress(account)
        : "Connect Wallet"}
    </Button>
  );
};

export default ConnectWalletButton;
