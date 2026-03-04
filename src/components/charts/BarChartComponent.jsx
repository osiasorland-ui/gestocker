import React from "react";
import { BarChart3 } from "lucide-react";

const BarChartComponent = ({ data = [] }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Ventes mensuelles</h3>
        <BarChart3 className="w-5 h-5 text-gray-400" />
      </div>
      <div className="h-48 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-end justify-center space-x-2 mb-4">
            {data.length > 0 ? (
              data.map((value, index) => (
                <div
                  key={index}
                  className="w-8 bg-gray-900 rounded-t transition-all duration-300"
                  style={{ height: `${value}px` }}
                ></div>
              ))
            ) : (
              // État vide
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="w-8 bg-gray-100 rounded-t"
                  style={{ height: "40px" }}
                ></div>
              ))
            )}
          </div>
          <p className="text-sm text-gray-500">Jan - Jun</p>
          <p className="text-xs text-gray-400 mt-2">
            {data.length > 0 ? "Données disponibles" : "Aucune donnée disponible"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BarChartComponent;
