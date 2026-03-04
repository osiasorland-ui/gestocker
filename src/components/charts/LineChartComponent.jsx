import React from "react";
import { LineChart } from "lucide-react";

const LineChartComponent = ({ data = [] }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Tendance des revenus</h3>
        <LineChart className="w-5 h-5 text-gray-400" />
      </div>
      <div className="h-48 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-full h-32" viewBox="0 0 200 100">
            {data.length > 0 ? (
              <polyline
                fill="none"
                stroke="#374151"
                strokeWidth="2"
                points={data.map((point, index) => `${(index * 30) + 10},${100 - point}`).join(' ')}
              />
            ) : (
              // État vide - ligne horizontale simple
              <line
                x1="10"
                y1="50"
                x2="190"
                y2="50"
                stroke="#E5E7EB"
                strokeWidth="2"
              />
            )}
          </svg>
          <p className="text-sm text-gray-500">Évolution sur 6 mois</p>
          <p className="text-xs text-gray-400 mt-2">
            {data.length > 0 ? "Données disponibles" : "Aucune donnée disponible"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LineChartComponent;
