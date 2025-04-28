
export interface FinancialRecord {
  id?: string;
  description: string;
  amount: string;
  category: string;
  date: string;
  notes?: string;
  transactionHash?: string;
  blockNumber?: number;
  timestamp?: number;
  hexData?: string;
}

export interface TransactionStatus {
  pending: boolean;
  success: boolean;
  error: string | null;
  hash: string | null;
}
