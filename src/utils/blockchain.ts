
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
  return window.ethereum !== undefined;
};

// Connect to MetaMask
export const connectWallet = async (): Promise<string | null> => {
  if (!isMetaMaskInstalled()) {
    toast.error("MetaMask is not installed");
    return null;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    
    // Check if we're on Sepolia (chainId 11155111)
    const { chainId } = await provider.getNetwork();
    
    if (chainId !== BigInt(11155111)) {
      toast.error("Please switch to Sepolia testnet");
      try {
        // Request switch to Sepolia
        await provider.send("wallet_switchEthereumChain", [
          { chainId: "0xaa36a7" } // 11155111 in hex
        ]);
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to MetaMask
        if (switchError.code === 4902) {
          await provider.send("wallet_addEthereumChain", [
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
          ]);
        }
      }
    }

    return accounts[0];
  } catch (error) {
    console.error("Failed to connect wallet:", error);
    toast.error("Failed to connect wallet");
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
