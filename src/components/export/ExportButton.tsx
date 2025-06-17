
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FinancialRecord } from "@/types/financial";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from 'xlsx';

interface ExportButtonProps {
  records: FinancialRecord[];
  exportConfig: {
    type: 'financial-year' | 'custom-range';
    financialYear: number;
    customRange: {
      startDate: Date | null;
      endDate: Date | null;
    };
  };
}

const ExportButton: React.FC<ExportButtonProps> = ({
  records,
  exportConfig,
}) => {
  const isExportDisabled = () => {
    if (records.length === 0) return true;
    
    if (exportConfig.type === 'custom-range') {
      return !exportConfig.customRange.startDate || !exportConfig.customRange.endDate;
    }
    
    return false;
  };

  const generateFileName = () => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (exportConfig.type === 'financial-year') {
      return `VIRTUSA_LEDGER_FY${exportConfig.financialYear}-${exportConfig.financialYear + 1}_${timestamp}.xlsx`;
    } else {
      const start = exportConfig.customRange.startDate?.toISOString().split('T')[0] || 'start';
      const end = exportConfig.customRange.endDate?.toISOString().split('T')[0] || 'end';
      return `VIRTUSA_LEDGER_${start}_to_${end}_${timestamp}.xlsx`;
    }
  };

  const handleExport = () => {
    try {
      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Sheet 1: Transaction Details
      const transactionData = records.map((record, index) => ({
        'Serial No.': index + 1,
        'Date': record.date,
        'Description': record.description,
        'Amount (USD)': parseFloat(record.amount),
        'Category': record.category,
        'Notes': record.notes || '',
        'Transaction Hash': record.transactionHash || 'Pending',
        'Block Number': record.blockNumber || 'N/A',
        'Timestamp': record.timestamp ? new Date(record.timestamp).toLocaleString() : 'N/A',
        'Hex Data': record.hexData || 'N/A',
      }));

      const transactionSheet = XLSX.utils.json_to_sheet(transactionData);
      XLSX.utils.book_append_sheet(workbook, transactionSheet, 'Transactions');

      // Sheet 2: Category Summary
      const categoryTotals = records.reduce((acc, record) => {
        const category = record.category;
        const amount = parseFloat(record.amount);
        acc[category] = (acc[category] || 0) + amount;
        return acc;
      }, {} as Record<string, number>);

      const summaryData = Object.entries(categoryTotals).map(([category, total]) => ({
        'Category': category,
        'Total Amount (USD)': total,
        'Transaction Count': records.filter(r => r.category === category).length,
        'Percentage': ((total / records.reduce((sum, r) => sum + parseFloat(r.amount), 0)) * 100).toFixed(2) + '%',
      }));

      // Add totals row
      summaryData.push({
        'Category': 'TOTAL',
        'Total Amount (USD)': records.reduce((sum, r) => sum + parseFloat(r.amount), 0),
        'Transaction Count': records.length,
        'Percentage': '100.00%',
      });

      const summarySheet = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Category Summary');

      // Sheet 3: Metadata
      const metadataData = [
        { 'Property': 'Export Date', 'Value': new Date().toLocaleString() },
        { 'Property': 'Export Type', 'Value': exportConfig.type === 'financial-year' ? 'Financial Year' : 'Custom Range' },
        { 'Property': 'Period', 'Value': exportConfig.type === 'financial-year' 
          ? `FY ${exportConfig.financialYear}-${exportConfig.financialYear + 1}` 
          : `${exportConfig.customRange.startDate?.toLocaleDateString()} - ${exportConfig.customRange.endDate?.toLocaleDateString()}` },
        { 'Property': 'Total Records', 'Value': records.length },
        { 'Property': 'Total Amount (USD)', 'Value': records.reduce((sum, r) => sum + parseFloat(r.amount), 0).toFixed(2) },
        { 'Property': 'Blockchain Network', 'Value': 'Ethereum Sepolia Testnet' },
        { 'Property': 'Application', 'Value': 'VIRTUSA LEDGER' },
        { 'Property': 'Version', 'Value': '1.0.0' },
      ];

      const metadataSheet = XLSX.utils.json_to_sheet(metadataData);
      XLSX.utils.book_append_sheet(workbook, metadataSheet, 'Metadata');

      // Generate and download file
      const fileName = generateFileName();
      XLSX.writeFile(workbook, fileName);

      toast.success(`Export completed! Downloaded as ${fileName}`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed. Please try again.');
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">Ready to Export</h3>
            <p className="text-sm text-muted-foreground">
              Download your financial data as an Excel file
            </p>
          </div>
          
          <Button
            onClick={handleExport}
            disabled={isExportDisabled()}
            size="lg"
            className="min-w-[200px]"
          >
            <Download className="mr-2 h-5 w-5" />
            Export to Excel
          </Button>
          
          {isExportDisabled() && (
            <p className="text-sm text-muted-foreground text-center">
              {records.length === 0 
                ? "No data available for export"
                : "Please select both start and end dates"
              }
            </p>
          )}
          
          {!isExportDisabled() && (
            <div className="text-center text-sm text-muted-foreground">
              <FileSpreadsheet className="inline h-4 w-4 mr-1" />
              File: {generateFileName()}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExportButton;
