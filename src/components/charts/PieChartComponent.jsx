import React from "react";
import { PieChart } from "lucide-react";

const PieChartComponent = ({ data = [] }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Répartition des stocks</h3>
        <PieChart className="w-5 h-5 text-gray-400" />
      </div>
      <div className="h-48 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            {data.length > 0 ? (
              data.map((segment, index) => (
                <div
                  key={index}
                  className="absolute inset-0 rounded-full border-8 border-transparent"
                  style={{
                    borderTopColor: segment.color,
                    borderRightColor: segment.color,
                    transform: `rotate(${segment.rotation}deg)`,
                  }}
                ></div>
              ))
            ) : (
              // État vide
              <div className="absolute inset-0 rounded-full border-8 border-gray-100"></div>
            )}
          </div>
          <p className="text-sm text-gray-500">Catégories de produits</p>
          <p className="text-xs text-gray-400 mt-2">
            {data.length > 0 ? "Données disponibles" : "Aucune donnée disponible"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PieChartComponent;
