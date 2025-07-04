
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FinancialRecord } from "@/types/financial";
import { TrendingUp, TrendingDown, DollarSign, Activity } from "lucide-react";

interface KPICardsProps {
  records: FinancialRecord[];
  comparisonData?: {
    period1: FinancialRecord[];
    period2: FinancialRecord[];
  } | null;
  comparisonPeriods?: {
    period1: { label: string };
    period2: { label: string };
  };
}

const KPICards: React.FC<KPICardsProps> = ({ records, comparisonData, comparisonPeriods }) => {
  // Calculate totals
  const calculateTotals = (data: FinancialRecord[]) => {
    const totals = {
      assets: 0,
      liabilities: 0,
      income: 0,
      expenses: 0,
    };

    data.forEach((record) => {
      const amount = parseFloat(record.amount);
      switch (record.category.toLowerCase()) {
        case 'asset':
          totals.assets += amount;
          break;
        case 'liability':
          totals.liabilities += amount;
          break;
        case 'income':
          totals.income += amount;
          break;
        case 'expense':
          totals.expenses += amount;
          break;
      }
    });

    return {
      ...totals,
      balance: totals.assets + totals.income - totals.liabilities - totals.expenses,
    };
  };

  const currentTotals = calculateTotals(records);
  
  // Calculate percentage change if comparison data exists
  const getPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  let comparisonTotals = null;
  if (comparisonData) {
    const period1Totals = calculateTotals(comparisonData.period1);
    const period2Totals = calculateTotals(comparisonData.period2);
    
    comparisonTotals = {
      balance: getPercentageChange(period1Totals.balance, period2Totals.balance),
      income: getPercentageChange(period1Totals.income, period2Totals.income),
      expenses: getPercentageChange(period1Totals.expenses, period2Totals.expenses),
      activity: getPercentageChange(comparisonData.period1.length, comparisonData.period2.length),
    };
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    const isPositive = percentage >= 0;
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
        <span>{Math.abs(percentage).toFixed(1)}%</span>
      </div>
    );
  };

  const kpiData = [
    {
      title: "Total Balance",
      value: formatCurrency(currentTotals.balance),
      icon: DollarSign,
      change: comparisonTotals?.balance,
      color: "text-blue-600",
    },
    {
      title: "Total Income",
      value: formatCurrency(currentTotals.income),
      icon: TrendingUp,
      change: comparisonTotals?.income,
      color: "text-green-600",
    },
    {
      title: "Total Expenses",
      value: formatCurrency(currentTotals.expenses),
      icon: TrendingDown,
      change: comparisonTotals?.expenses,
      color: "text-red-600",
    },
    {
      title: "Total Activity",
      value: records.length.toString(),
      icon: Activity,
      change: comparisonTotals?.activity,
      color: "text-purple-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpiData.map((kpi, index) => {
        const Icon = kpi.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <Icon className={`h-4 w-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              {kpi.change !== undefined && (
                <div className="flex items-center justify-between mt-2">
                  {formatPercentage(kpi.change)}
                  {comparisonPeriods && (
                    <Badge variant="outline" className="text-xs">
                      vs {comparisonPeriods.period2.label}
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default KPICards;
