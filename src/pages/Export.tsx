
import React, { useState, useMemo } from "react";
import { useBlockchain } from "@/contexts/BlockchainContext";
import DashboardHeader from "@/components/DashboardHeader";
import ExportFilters from "@/components/export/ExportFilters";
import ExportPreview from "@/components/export/ExportPreview";
import ExportButton from "@/components/export/ExportButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialRecord } from "@/types/financial";
import { Download } from "lucide-react";

const Export = () => {
  const { records } = useBlockchain();
  const [exportConfig, setExportConfig] = useState<{
    type: 'financial-year' | 'custom-range';
    financialYear: number;
    customRange: {
      startDate: Date | null;
      endDate: Date | null;
    };
  }>({
    type: 'financial-year',
    financialYear: new Date().getFullYear(),
    customRange: {
      startDate: null,
      endDate: null,
    },
  });

  // Filter records based on export configuration
  const filteredRecords = useMemo(() => {
    if (exportConfig.type === 'financial-year') {
      const startYear = exportConfig.financialYear;
      const endYear = startYear + 1;
      
      return records.filter((record) => {
        const recordDate = new Date(record.date);
        const recordYear = recordDate.getFullYear();
        const recordMonth = recordDate.getMonth();
        
        // Financial year typically runs from April to March
        if (recordMonth >= 3) { // April onwards
          return recordYear === startYear;
        } else { // January to March
          return recordYear === endYear;
        }
      });
    } else {
      if (!exportConfig.customRange.startDate || !exportConfig.customRange.endDate) {
        return [];
      }
      
      return records.filter((record) => {
        const recordDate = new Date(record.date);
        return recordDate >= exportConfig.customRange.startDate! && 
               recordDate <= exportConfig.customRange.endDate!;
      });
    }
  }, [records, exportConfig]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader />
        
        <div className="space-y-6">
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Download className="mr-2 h-5 w-5" />
                Export Financial Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Export your financial records to Excel format for reporting, tax filing, or analysis.
                Choose your preferred date range and download a comprehensive report.
              </p>
            </CardContent>
          </Card>

          {/* Export Configuration */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Filters */}
            <ExportFilters
              exportConfig={exportConfig}
              setExportConfig={setExportConfig}
            />

            {/* Preview */}
            <ExportPreview
              records={filteredRecords}
              exportConfig={exportConfig}
            />
          </div>

          {/* Export Button */}
          <ExportButton
            records={filteredRecords}
            exportConfig={exportConfig}
          />
        </div>
      </div>
    </div>
  );
};

export default Export;
