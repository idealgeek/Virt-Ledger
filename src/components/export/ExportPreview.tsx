
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FinancialRecord } from "@/types/financial";
import { FileSpreadsheet, AlertCircle } from "lucide-react";

interface ExportPreviewProps {
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

const ExportPreview: React.FC<ExportPreviewProps> = ({
  records,
  exportConfig,
}) => {
  // Calculate summary statistics
  const summary = records.reduce(
    (acc, record) => {
      const amount = parseFloat(record.amount);
      const category = record.category.toLowerCase();
      
      acc.total += amount;
      acc.categories[category] = (acc.categories[category] || 0) + amount;
      
      return acc;
    },
    {
      total: 0,
      categories: {} as Record<string, number>,
    }
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getDateRangeDisplay = () => {
    if (exportConfig.type === 'financial-year') {
      return `FY ${exportConfig.financialYear}-${exportConfig.financialYear + 1}`;
    } else {
      if (exportConfig.customRange.startDate && exportConfig.customRange.endDate) {
        return `${exportConfig.customRange.startDate.toLocaleDateString()} - ${exportConfig.customRange.endDate.toLocaleDateString()}`;
      }
      return 'Custom Range (incomplete)';
    }
  };

  const isValidForExport = () => {
    if (exportConfig.type === 'financial-year') {
      return records.length > 0;
    } else {
      return exportConfig.customRange.startDate && 
             exportConfig.customRange.endDate && 
             records.length > 0;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileSpreadsheet className="mr-2 h-5 w-5" />
          Export Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Export Summary */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Date Range:</span>
            <Badge variant="outline">{getDateRangeDisplay()}</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Records:</span>
            <Badge variant={records.length > 0 ? "default" : "secondary"}>
              {records.length}
            </Badge>
          </div>
        </div>

        {/* Validation Message */}
        {!isValidForExport() && (
          <div className="flex items-start space-x-2 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-amber-800">Export not ready</p>
              <p className="text-amber-700">
                {records.length === 0 
                  ? "No records found for the selected period."
                  : "Please select both start and end dates for custom range export."
                }
              </p>
            </div>
          </div>
        )}

        {/* Category Breakdown */}
        {records.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Category Breakdown</h4>
            <div className="space-y-2">
              {Object.entries(summary.categories).map(([category, amount]) => (
                <div key={category} className="flex justify-between items-center text-sm">
                  <span className="capitalize">{category}:</span>
                  <span className="font-medium">{formatCurrency(amount)}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between items-center font-medium">
                <span>Total Amount:</span>
                <span>{formatCurrency(summary.total)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Export Contents Preview */}
        {isValidForExport() && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Export will include:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Transaction details sheet</li>
              <li>• Category summary sheet</li>
              <li>• Blockchain verification data</li>
              <li>• Export metadata</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExportPreview;
