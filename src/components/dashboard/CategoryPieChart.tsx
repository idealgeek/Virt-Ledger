
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { FinancialRecord } from "@/types/financial";

interface CategoryPieChartProps {
  records: FinancialRecord[];
}

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ records }) => {
  // Calculate category totals
  const categoryTotals = records.reduce((acc, record) => {
    const category = record.category.toLowerCase();
    const amount = parseFloat(record.amount);
    
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += amount;
    
    return acc;
  }, {} as Record<string, number>);

  // Prepare chart data
  const chartData = Object.entries(categoryTotals).map(([category, amount]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: amount,
    percentage: records.length > 0 ? ((amount / Object.values(categoryTotals).reduce((a, b) => a + b, 0)) * 100).toFixed(1) : 0,
  }));

  // Colors for each category
  const COLORS = {
    Asset: '#3B82F6',      // Blue
    Liability: '#EF4444',   // Red
    Income: '#10B981',      // Green
    Expense: '#F59E0B',     // Amber
    Equity: '#8B5CF6',      // Purple
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm">
            Value: ${data.value.toFixed(2)}
          </p>
          <p className="text-sm">
            Percentage: {data.payload.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  if (records.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Category Allocation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            No data available for the selected period
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.name as keyof typeof COLORS] || '#8884d8'} 
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary below chart */}
        <div className="mt-4 space-y-2">
          <h4 className="font-medium text-sm">Category Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {chartData.map((item) => (
              <div key={item.name} className="flex justify-between">
                <span>{item.name}:</span>
                <span className="font-medium">${item.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CategoryPieChart;
