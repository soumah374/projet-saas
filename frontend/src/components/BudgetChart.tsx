import { useMemo } from 'react';
import { Card } from "@/components/ui/card";

interface BudgetChartProps {
  budgetDetails: {
    production: string;
    personnel: string;
    marketing: string;
    other: string;
  };
}

export const BudgetChart = ({ budgetDetails }: BudgetChartProps) => {
  const total = useMemo(() => {
    return Object.values(budgetDetails).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
  }, [budgetDetails]);

  const percentages = useMemo(() => {
    if (total === 0) return null;
    
    return {
      production: ((parseFloat(budgetDetails.production) || 0) / total) * 100,
      personnel: ((parseFloat(budgetDetails.personnel) || 0) / total) * 100,
      marketing: ((parseFloat(budgetDetails.marketing) || 0) / total) * 100,
      other: ((parseFloat(budgetDetails.other) || 0) / total) * 100
    };
  }, [budgetDetails, total]);

  if (!percentages || total === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-gray-500">
        Aucune donnée budgétaire disponible
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <div className="relative w-[200px] h-[200px]">
        {/* Cercle de base */}
        <div className="absolute inset-0 rounded-full border-8 border-gray-100"></div>
        
        {/* Sections du graphique */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="100"
            cy="100"
            r="96"
            fill="none"
            stroke="#3B82F6" // Production (bleu)
            strokeWidth="16"
            strokeDasharray={`${percentages.production * 6} ${600 - percentages.production * 6}`}
            className="transition-all duration-300"
          />
          <circle
            cx="100"
            cy="100"
            r="96"
            fill="none"
            stroke="#10B981" // Personnel (vert)
            strokeWidth="16"
            strokeDasharray={`${percentages.personnel * 6} ${600 - percentages.personnel * 6}`}
            strokeDashoffset={`${-percentages.production * 6}`}
            className="transition-all duration-300"
          />
          <circle
            cx="100"
            cy="100"
            r="96"
            fill="none"
            stroke="#F59E0B" // Marketing (orange)
            strokeWidth="16"
            strokeDasharray={`${percentages.marketing * 6} ${600 - percentages.marketing * 6}`}
            strokeDashoffset={`${-(percentages.production + percentages.personnel) * 6}`}
            className="transition-all duration-300"
          />
          <circle
            cx="100"
            cy="100"
            r="96"
            fill="none"
            stroke="#6B7280" // Autres (gris)
            strokeWidth="16"
            strokeDasharray={`${percentages.other * 6} ${600 - percentages.other * 6}`}
            strokeDashoffset={`${-(percentages.production + percentages.personnel + percentages.marketing) * 6}`}
            className="transition-all duration-300"
          />
        </svg>
      </div>

      {/* Légende */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span className="text-sm">Production ({percentages.production.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span className="text-sm">Personnel ({percentages.personnel.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <span className="text-sm">Marketing ({percentages.marketing.toFixed(1)}%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-gray-500"></div>
          <span className="text-sm">Autres ({percentages.other.toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
}; 