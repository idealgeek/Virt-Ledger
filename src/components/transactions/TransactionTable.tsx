
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Database, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { FinancialRecord } from "@/types/financial";
import TransactionDetails from "./TransactionDetails";

interface TransactionTableProps {
  records: FinancialRecord[];
}

const TransactionTable: React.FC<TransactionTableProps> = ({ records }) => {
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  // Sort records by timestamp (newest first)
  const sortedRecords = [...records].sort((a, b) => {
    return (b.timestamp || 0) - (a.timestamp || 0);
  });

  // Pagination
  const totalPages = Math.ceil(sortedRecords.length / recordsPerPage);
  const startIndex = (currentPage - 1) * recordsPerPage;
  const endIndex = startIndex + recordsPerPage;
  const paginatedRecords = sortedRecords.slice(startIndex, endIndex);

  const formatDate = (timestamp: number | undefined) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const truncateHash = (hash: string | undefined) => {
    if (!hash) return "N/A";
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "asset":
        return "bg-blue-100 text-blue-800";
      case "liability":
        return "bg-red-100 text-red-800";
      case "income":
        return "bg-green-100 text-green-800";
      case "expense":
        return "bg-amber-100 text-amber-800";
      case "equity":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Database className="mr-2 h-5 w-5" />
                Transaction History
              </CardTitle>
              <CardDescription>
                View all financial records stored on the blockchain
              </CardDescription>
            </div>
            <Badge variant="outline" className="ml-auto">
              {records.length} Records
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No transaction records found. Try adjusting your filters or add some transactions.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Transaction Hash</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {formatDate(record.timestamp)}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.description}
                        </TableCell>
                        <TableCell>${parseFloat(record.amount).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge className={getCategoryColor(record.category)}>
                            {formatCategory(record.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {record.transactionHash ? (
                            <a
                              href={`https://sepolia.etherscan.io/tx/${record.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-500 hover:underline"
                            >
                              {truncateHash(record.transactionHash)}
                            </a>
                          ) : (
                            "Not confirmed"
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedRecord(record)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Details
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, records.length)} of {records.length} records
                  </div>
                  
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                      </PaginationItem>
                      
                      {generatePageNumbers().map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      {selectedRecord && (
        <TransactionDetails
          record={selectedRecord}
          isOpen={!!selectedRecord}
          onClose={() => setSelectedRecord(null)}
        />
      )}
    </>
  );
};

export default TransactionTable;
