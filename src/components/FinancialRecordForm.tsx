
import React, { useState } from "react";
import { FinancialRecord, TransactionStatus } from "@/types/financial";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { convertRecordToHex, sendTransaction } from "@/utils/blockchain";
import { useBlockchain } from "@/contexts/BlockchainContext";
import { toast } from "sonner";
import { AlertCircle, ArrowRight, Check, Loader2 } from "lucide-react";

const formSchema = z.object({
  description: z.string().min(2, {
    message: "Description must be at least 2 characters.",
  }),
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a valid positive number",
  }),
  category: z.string().min(1, {
    message: "Please select a category",
  }),
  date: z.string().min(1, {
    message: "Please select a date",
  }),
  notes: z.string().optional(),
});

const FinancialRecordForm: React.FC = () => {
  const { connected, addRecord } = useBlockchain();
  const [txStatus, setTxStatus] = useState<TransactionStatus>({
    pending: false,
    success: false,
    error: null,
    hash: null,
  });
  const [hexData, setHexData] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
      amount: "",
      category: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!connected) {
      toast.error("Please connect your wallet first");
      return;
    }

    const record: FinancialRecord = {
      description: values.description,
      amount: values.amount,
      category: values.category,
      date: values.date,
      notes: values.notes,
    };

    // Convert to hex
    const hex = convertRecordToHex(record);
    setHexData(hex);

    // Update record with hex data
    record.hexData = hex;

    // Set transaction as pending
    setTxStatus({ pending: true, success: false, error: null, hash: null });

    try {
      const txHash = await sendTransaction(record);
      
      if (txHash) {
        // Transaction successful
        setTxStatus({
          pending: false,
          success: true,
          error: null,
          hash: txHash,
        });
        
        // Add record to context with transaction hash
        record.transactionHash = txHash;
        record.timestamp = Date.now();
        addRecord(record);
        
        // Reset form
        form.reset();
        
        toast.success("Transaction confirmed!");
      } else {
        setTxStatus({
          pending: false,
          success: false,
          error: "Transaction failed",
          hash: null,
        });
      }
    } catch (error: any) {
      console.error("Transaction error:", error);
      setTxStatus({
        pending: false,
        success: false,
        error: error.message || "Transaction failed",
        hash: null,
      });
      toast.error("Transaction failed");
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Record Financial Data</CardTitle>
        <CardDescription>
          Enter financial record details to store on the blockchain
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6"
            id="financial-form"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <Input placeholder="0.00" type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="asset">Asset</SelectItem>
                        <SelectItem value="liability">Liability</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="equity">Equity</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Additional information" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        {hexData && (
          <div className="mt-6 p-4 bg-slate-100 rounded-md">
            <h4 className="text-sm font-medium mb-2">Generated Hex Data:</h4>
            <div className="bg-gray-800 text-white p-3 rounded-md text-xs overflow-x-auto">
              {hexData}
            </div>
          </div>
        )}

        {txStatus.pending && (
          <div className="mt-6 flex items-center p-4 bg-blue-50 border border-blue-200 rounded-md">
            <Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
            <span>Transaction pending... Please approve in MetaMask</span>
          </div>
        )}

        {txStatus.success && (
          <div className="mt-6 flex items-center p-4 bg-green-50 border border-green-200 rounded-md">
            <Check className="h-5 w-5 text-green-500 mr-2" />
            <div>
              <p>Transaction successful!</p>
              {txStatus.hash && (
                <a
                  href={`https://sepolia.etherscan.io/tx/${txStatus.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 text-sm underline"
                >
                  View on Etherscan
                </a>
              )}
            </div>
          </div>
        )}

        {txStatus.error && (
          <div className="mt-6 flex items-center p-4 bg-red-50 border border-red-200 rounded-md">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span>{txStatus.error}</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          type="submit"
          form="financial-form"
          disabled={txStatus.pending || !connected}
          className="ml-auto"
        >
          {txStatus.pending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <ArrowRight className="mr-2 h-4 w-4" />
          )}
          Submit to Blockchain
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FinancialRecordForm;
