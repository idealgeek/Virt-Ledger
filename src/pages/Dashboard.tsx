
import React, { useState, useMemo } from "react";
import { useBlockchain } from "@/contexts/BlockchainContext";
import DashboardHeader from "@/components/DashboardHeader";
import KPICards from "@/components/dashboard/KPICards";
import CategoryPieChart from "@/components/dashboard/CategoryPieChart";
import DateRangeFilter from "@/components/dashboard/DateRangeFilter";
import ComparisonCards from "@/components/dashboard/ComparisonCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FinancialRecord } from "@/types/financial";

const Dashboard = () => {
  const { records } = useBlockchain();
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });

  const [comparisonMode, setComparisonMode] = useState(false);
  const [comparisonPeriods, setComparisonPeriods] = useState<{
    period1: { start: Date | null; end: Date | null; label: string };
    period2: { start: Date | null; end: Date | null; label: string };
  }>({
    period1: { start: null, end: null, label: "This Month" },
    period2: { start: null, end: null, label: "Last Month" },
  });

  // Filter records based on date range
  const filteredRecords = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate) return records;
    
    return records.filter((record) => {
      const recordDate = new Date(record.date);
      return recordDate >= dateRange.startDate! && recordDate <= dateRange.endDate!;
    });
  }, [records, dateRange]);

  // Calculate comparison data
  const comparisonData = useMemo(() => {
    if (!comparisonMode) return null;

    const period1Records = records.filter((record) => {
      const recordDate = new Date(record.date);
      return comparisonPeriods.period1.start && comparisonPeriods.period1.end &&
             recordDate >= comparisonPeriods.period1.start && recordDate <= comparisonPeriods.period1.end;
    });

    const period2Records = records.filter((record) => {
      const recordDate = new Date(record.date);
      return comparisonPeriods.period2.start && comparisonPeriods.period2.end &&
             recordDate >= comparisonPeriods.period2.start && recordDate <= comparisonPeriods.period2.end;
    });

    return {
      period1: period1Records,
      period2: period2Records,
    };
  }, [records, comparisonMode, comparisonPeriods]);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-6">
        <DashboardHeader />
        
        <div className="space-y-6">
          {/* KPI Cards */}
          <KPICards 
            records={filteredRecords} 
            comparisonData={comparisonData}
            comparisonPeriods={comparisonPeriods}
          />

          {/* Date Range Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Filters & Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <DateRangeFilter
                dateRange={dateRange}
                setDateRange={setDateRange}
                comparisonMode={comparisonMode}
                setComparisonMode={setComparisonMode}
                comparisonPeriods={comparisonPeriods}
                setComparisonPeriods={setComparisonPeriods}
              />
            </CardContent>
          </Card>

          {/* Charts and Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Pie Chart */}
            <CategoryPieChart records={filteredRecords} />
            
            {/* Comparison Cards */}
            {comparisonMode && comparisonData && (
              <ComparisonCards
                period1Data={comparisonData.period1}
                period2Data={comparisonData.period2}
                period1Label={comparisonPeriods.period1.label}
                period2Label={comparisonPeriods.period2.label}
              />
            )}
          </div>

          {/* Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Data Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-blue-600">
                    {filteredRecords.filter(r => r.category.toLowerCase() === 'asset').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Assets</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {filteredRecords.filter(r => r.category.toLowerCase() === 'liability').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Liabilities</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredRecords.filter(r => r.category.toLowerCase() === 'income').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Income</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-amber-600">
                    {filteredRecords.filter(r => r.category.toLowerCase() === 'expense').length}
                  </p>
                  <p className="text-sm text-muted-foreground">Expenses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
