
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

  // Check if already connected
  useEffect(() => {
    const checkConnection = async () => {
      if (!isMetaMaskInstalled()) return;

      try {
        const ethereum = window.ethereum;
        const accounts = await ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          setConnected(true);
          
          // Load stored records
          loadStoredRecords();
        }
      } catch (error) {
        console.error("Connection check failed:", error);
      }
    };

    checkConnection();
  }, []);

  // Load stored records from localStorage
  const loadStoredRecords = () => {
    try {
      const storedRecords = localStorage.getItem("financialRecords");
      if (storedRecords) {
        setRecords(JSON.parse(storedRecords));
      }
    } catch (error) {
      console.error("Failed to load stored records:", error);
      toast.error("Failed to load transaction history");
    }
  };

  // Handle account changes
  useEffect(() => {
    if (!isMetaMaskInstalled()) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        setConnected(false);
        setAccount(null);
      } else if (accounts[0] !== account) {
        // Account changed
        setAccount(accounts[0]);
        setConnected(true);
      }
    };

    const ethereum = window.ethereum;
    ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, [account]);

  // Connect wallet function
  const connect = async () => {
    setConnecting(true);
    try {
      const newAccount = await connectWallet();
      if (newAccount) {
        setAccount(newAccount);
        setConnected(true);
        // Load stored records on successful connection
        loadStoredRecords();
      }
    } catch (error) {
      console.error("Connection failed:", error);
      toast.error("Failed to connect wallet");
    } finally {
      setConnecting(false);
    }
  };

  // Add financial record
  const addRecord = (record: FinancialRecord) => {
    const newRecords = [...records, { ...record, id: Date.now().toString() }];
    setRecords(newRecords);
    
    // Store in localStorage
    try {
      localStorage.setItem("financialRecords", JSON.stringify(newRecords));
    } catch (error) {
      console.error("Failed to store records:", error);
    }
  };

  return (
    <BlockchainContext.Provider
      value={{
        connected,
        connecting,
        account,
        connect,
        records,
        addRecord
      }}
    >
      {children}
    </BlockchainContext.Provider>
  );
};
