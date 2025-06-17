
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
