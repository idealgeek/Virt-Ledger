
import { FinancialRecord } from "@/types/financial";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Simple MetaMask detection
export const isMetaMaskInstalled = (): boolean => {
  return typeof window !== "undefined" && typeof window.ethereum !== "undefined";
};

// Clean wallet connection function
export const connectWallet = async (): Promise<string | null> => {
  console.log("🔄 Starting wallet connection...");

  if (!isMetaMaskInstalled()) {
    console.log("❌ MetaMask not found");
    window.open("https://metamask.io/download/", "_blank");
    throw new Error("MetaMask is not installed");
  }

  try {
    console.log("📞 Requesting accounts from MetaMask...");
    
    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    console.log("✅ Accounts received:", accounts);

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }

    const account = accounts[0];
    console.log("🎯 Connected to account:", account);
    
    return account;
  } catch (error: any) {
    console.error("💥 Connection failed:", error);
    
    if (error.code === 4001) {
      throw new Error("Connection rejected by user");
    } else if (error.code === -32002) {
      throw new Error("Connection request already pending");
    } else {
      throw new Error("Failed to connect wallet");
    }
  }
};

// Convert financial record to hex data
export const convertRecordToHex = (record: FinancialRecord): string => {
  console.log("🔄 Converting record to hex:", record);
  
  // Create a simple JSON string of the record
  const jsonString = JSON.stringify({
    description: record.description,
    amount: record.amount,
    category: record.category,
    date: record.date,
    notes: record.notes || "",
    timestamp: Date.now()
  });
  
  // Convert to hex
  const hex = "0x" + Buffer.from(jsonString, 'utf8').toString('hex');
  console.log("✅ Hex data generated:", hex);
  
  return hex;
};

// Send transaction with record data
export const sendTransaction = async (record: FinancialRecord): Promise<string | null> => {
  console.log("🔄 Sending transaction with record:", record);
  
  if (!isMetaMaskInstalled()) {
    throw new Error("MetaMask is not installed");
  }

  try {
    // Get current account
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    if (!accounts || accounts.length === 0) {
      throw new Error("No connected accounts");
    }

    const fromAddress = accounts[0];
    const hexData = record.hexData || convertRecordToHex(record);
    
    console.log("📤 Preparing transaction:", {
      from: fromAddress,
      data: hexData
    });

    // Send transaction with the hex data
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{
        from: fromAddress,
        to: fromAddress, // Send to self to store data
        value: "0x0", // No ETH transfer
        data: hexData,
        gas: "0x5208" // Standard gas limit
      }]
    });

    console.log("✅ Transaction sent:", txHash);
    return txHash;
    
  } catch (error: any) {
    console.error("💥 Transaction failed:", error);
    
    if (error.code === 4001) {
      throw new Error("Transaction rejected by user");
    } else {
      throw new Error("Failed to send transaction");
    }
  }
};
