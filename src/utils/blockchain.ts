
import { ethers } from "ethers";
import { FinancialRecord } from "@/types/financial";
import { toast } from "sonner";

declare global {
  interface Window {
    ethereum?: any;
  }
}

// Check if MetaMask is installed
export const isMetaMaskInstalled = (): boolean => {
  const hasEthereum = typeof window !== "undefined" && typeof window.ethereum !== "undefined";
  console.log("MetaMask installed check:", hasEthereum);
  return hasEthereum;
};

// Connect to MetaMask
export const connectWallet = async (): Promise<string | null> => {
  console.log("connectWallet function called");

  if (!isMetaMaskInstalled()) {
    console.log("MetaMask not installed, opening download page");
    toast.error("MetaMask is not installed. Please install MetaMask extension.");
    window.open("https://metamask.io/download/", "_blank");
    return null;
  }

  try {
    console.log("Requesting account access...");
    
    // Request account access
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    console.log("Accounts received:", accounts);

    if (!accounts || accounts.length === 0) {
      console.log("No accounts found");
      toast.error("No accounts found. Please create an account in MetaMask.");
      return null;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Check if we're on Sepolia (chainId 11155111)
    const network = await provider.getNetwork();
    const chainId = Number(network.chainId);
    
    console.log("Current network:", { chainId, name: network.name });
    
    if (chainId !== 11155111) {
      console.log("Not on Sepolia, attempting to switch...");
      toast.info("Switching to Sepolia testnet...");
      
      try {
        // Request switch to Sepolia
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0xaa36a7" }], // 11155111 in hex
        });
        console.log("Successfully switched to Sepolia");
      } catch (switchError: any) {
        console.log("Switch error:", switchError);
        
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          console.log("Sepolia not added, attempting to add...");
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [
                {
                  chainId: "0xaa36a7", // 11155111 in hex
                  chainName: "Sepolia Testnet",
                  nativeCurrency: {
                    name: "Sepolia ETH",
                    symbol: "ETH",
                    decimals: 18,
                  },
                  rpcUrls: ["https://sepolia.infura.io/v3/"],
                  blockExplorerUrls: ["https://sepolia.etherscan.io"],
                },
              ],
            });
            console.log("Successfully added Sepolia network");
          } catch (addError) {
            console.error("Failed to add Sepolia network:", addError);
            toast.error("Failed to add Sepolia network");
            return null;
          }
        } else {
          console.error("Failed to switch network:", switchError);
          toast.error("Failed to switch to Sepolia testnet");
          return null;
        }
      }
    }

    console.log("Connection successful, returning account:", accounts[0]);
    return accounts[0];
  } catch (error: any) {
    console.error("Failed to connect wallet:", error);
    
    if (error.code === 4001) {
      console.log("User rejected connection");
      toast.error("Connection rejected by user");
    } else if (error.code === -32002) {
      console.log("Connection request already pending");
      toast.error("Connection request already pending. Please check MetaMask.");
    } else {
      console.log("Other connection error");
      toast.error("Failed to connect wallet. Please try again.");
    }
    return null;
  }
};

// Convert financial record to hex
export const convertRecordToHex = (record: FinancialRecord): string => {
  const data = JSON.stringify({
    description: record.description,
    amount: record.amount,
    category: record.category,
    date: record.date,
    notes: record.notes || "",
  });
  
  return ethers.hexlify(ethers.toUtf8Bytes(data));
};

// Send transaction with financial data as hex
export const sendTransaction = async (
  record: FinancialRecord
): Promise<string | null> => {
  if (!isMetaMaskInstalled()) {
    toast.error("MetaMask is not installed");
    return null;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    
    // Create transaction object - send a minimal amount of ETH (0.0001)
    const tx = {
      to: "0x0000000000000000000000000000000000000000", // Zero address
      value: ethers.parseEther("0.0001"), // Minimal ETH amount
      data: convertRecordToHex(record),
    };

    // Send transaction
    const txResponse = await signer.sendTransaction(tx);
    toast.success("Transaction sent!");
    
    // Wait for transaction confirmation
    const receipt = await txResponse.wait();
    console.log("Transaction confirmed:", receipt);
    
    return txResponse.hash;
  } catch (error) {
    console.error("Transaction failed:", error);
    toast.error("Transaction failed");
    return null;
  }
};

// Get transaction details
export const getTransactionDetails = async (hash: string) => {
  if (!isMetaMaskInstalled()) return null;
  
  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const tx = await provider.getTransaction(hash);
    const receipt = await provider.getTransactionReceipt(hash);
    
    if (!tx || !receipt) return null;
    
    const block = await provider.getBlock(receipt.blockNumber);
    
    return {
      hash: tx.hash,
      blockNumber: Number(receipt.blockNumber),
      timestamp: block ? Number(block.timestamp) : Date.now() / 1000,
      data: tx.data,
      from: tx.from,
      status: receipt.status === 1,
    };
  } catch (error) {
    console.error("Error fetching transaction details:", error);
    return null;
  }
};
