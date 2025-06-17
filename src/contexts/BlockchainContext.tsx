
import React, { createContext, useState, useEffect, useContext } from "react";
import { connectWallet, isMetaMaskInstalled } from "@/utils/blockchain";
import { toast } from "sonner";
import { FinancialRecord } from "@/types/financial";

interface BlockchainContextType {
  connected: boolean;
  connecting: boolean;
  account: string | null;
  connect: () => Promise<void>;
  records: FinancialRecord[];
  addRecord: (record: FinancialRecord) => void;
}

const BlockchainContext = createContext<BlockchainContextType>({
  connected: false,
  connecting: false,
  account: null,
  connect: async () => {},
  records: [],
  addRecord: () => {},
});

export const useBlockchain = () => useContext(BlockchainContext);

interface BlockchainProviderProps {
  children: React.ReactNode;
}

export const BlockchainProvider: React.FC<BlockchainProviderProps> = ({ children }) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [account, setAccount] = useState<string | null>(null);
  const [records, setRecords] = useState<FinancialRecord[]>([]);

  // Check for existing connection on mount
  useEffect(() => {
    const checkExistingConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
          console.log("🔗 Already connected to:", accounts[0]);
          loadStoredRecords();
        }
      } catch (error) {
        console.error("Failed to check existing connection:", error);
      }
    };

    checkExistingConnection();
  }, []);

  // Load stored records
  const loadStoredRecords = () => {
    try {
      const stored = localStorage.getItem("financialRecords");
      if (stored) {
        setRecords(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Failed to load records:", error);
    }
  };

  // Main connect function
  const connect = async () => {
    console.log("🚀 Connect function called");
    console.log("📊 Current state:", { connected, connecting, account });

    // Prevent multiple simultaneous connections
    if (connecting) {
      console.log("⏳ Already connecting, ignoring...");
      return;
    }

    // Check if already connected
    if (connected && account) {
      console.log("✅ Already connected to:", account);
      return;
    }

    setConnecting(true);
    console.log("🔄 Setting connecting to true");

    try {
      const newAccount = await connectWallet();
      
      if (newAccount) {
        setAccount(newAccount);
        setConnected(true);
        console.log("🎉 Successfully connected:", newAccount);
        toast.success("Wallet connected successfully!");
        loadStoredRecords();
      } else {
        throw new Error("No account returned");
      }
    } catch (error: any) {
      console.error("❌ Connection error:", error);
      toast.error(error.message || "Failed to connect wallet");
      setConnected(false);
      setAccount(null);
    } finally {
      setConnecting(false);
      console.log("✅ Setting connecting to false");
    }
  };

  // Add financial record
  const addRecord = (record: FinancialRecord) => {
    const newRecords = [...records, { ...record, id: Date.now().toString() }];
    setRecords(newRecords);
    
    try {
      localStorage.setItem("financialRecords", JSON.stringify(newRecords));
    } catch (error) {
      console.error("Failed to store records:", error);
    }
  };

  // Handle account/network changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("🔄 Accounts changed:", accounts);
      if (accounts.length === 0) {
        setConnected(false);
        setAccount(null);
        toast.info("Wallet disconnected");
      } else if (accounts[0] !== account) {
        setAccount(accounts[0]);
        setConnected(true);
        toast.success("Account switched");
      }
    };

    const handleChainChanged = () => {
      console.log("🔗 Chain changed, reloading...");
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", handleAccountsChanged);
      window.ethereum.on("chainChanged", handleChainChanged);

      return () => {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      };
    }
  }, [account]);

  const contextValue = {
    connected,
    connecting,
    account,
    connect,
    records,
    addRecord
  };

  console.log("🔍 Context value:", contextValue);

  return (
    <BlockchainContext.Provider value={contextValue}>
      {children}
    </BlockchainContext.Provider>
  );
};
