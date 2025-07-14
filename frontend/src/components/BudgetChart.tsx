import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export interface BudgetChartProps {
  budgetDetails: {
    production: string;
    personnel: string;
    marketing: string;
    other: string;
  };
}

export function BudgetChart({ budgetDetails }: BudgetChartProps) {
  const data = [
    { name: 'Production', value: parseFloat(budgetDetails.production) || 0 },
    { name: 'Personnel', value: parseFloat(budgetDetails.personnel) || 0 },
    { name: 'Marketing', value: parseFloat(budgetDetails.marketing) || 0 },
    { name: 'Autres', value: parseFloat(budgetDetails.other) || 0 },
  ].filter(item => item.value > 0);

  const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#64748b'];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GNF',
      maximumFractionDigits: 0
    }).format(value);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        Aucune donnée budgétaire disponible
      </div>
    );
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
} 