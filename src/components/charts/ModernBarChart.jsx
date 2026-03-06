import React, { useState } from "react";
import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

const ModernBarChart = ({ 
  data = [], 
  labels = [], 
  title = "Statistiques", 
  color = "primary",
  showStats = true,
  height = 200 
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const maxValue = Math.max(...data, 1);
  const colorClasses = {
    primary: "bg-primary",
    secondary: "bg-secondary", 
    success: "bg-success",
    warning: "bg-warning",
    error: "bg-error",
    info: "bg-info"
  };

  const getColorClass = () => colorClasses[color] || colorClasses.primary;

  const calculatePercentage = (value) => ((value / maxValue) * 100);

  const getTrend = () => {
    if (data.length < 2) return null;
    const recent = data.slice(-3);
    const older = data.slice(0, 3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    return recentAvg > olderAvg ? 'up' : 'down';
  };

  const trend = getTrend();
  const totalValue = data.reduce((sum, val) => sum + val, 0);
  const averageValue = data.length > 0 ? Math.round(totalValue / data.length) : 0;

  return (
    <div className="bg-base-100 rounded-xl shadow-lg p-6 border border-base-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-base-content">{title}</h3>
          {showStats && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <span className="text-2xl font-bold text-base-content">
                  {totalValue.toLocaleString()}
                </span>
                {trend && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    trend === 'up' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                  }`}>
                    {trend === 'up' ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {trend === 'up' ? '+' : '-'}{Math.abs(Math.round((data[data.length-1] - data[0]) / data[0] * 100))}%
                  </div>
                )}
              </div>
              <div className="text-sm text-base-content/60">
                Moyenne: {averageValue.toLocaleString()}
              </div>
            </div>
          )}
        </div>
        <div className="text-base-content/40">
          <BarChart3 className="w-5 h-5" />
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: `${height}px` }}>
        {data.length > 0 ? (
          <div className="flex items-end justify-between h-full gap-2">
            {data.map((value, index) => {
              const percentage = calculatePercentage(value);
              const isHovered = hoveredIndex === index;
              
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center justify-end relative group"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {/* Bar */}
                  <div 
                    className={`w-full ${getColorClass()} rounded-t-lg transition-all duration-300 ease-out ${
                      isHovered ? 'opacity-80 scale-105' : 'opacity-100'
                    }`}
                    style={{ 
                      height: `${percentage}%`,
                      minHeight: '4px'
                    }}
                  >
                    {/* Hover tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full mb-2 px-3 py-2 bg-base-content text-base-100 rounded-lg text-sm font-medium shadow-xl z-10 whitespace-nowrap">
                        <div className="font-bold">{value.toLocaleString()}</div>
                        {labels[index] && (
                          <div className="text-xs opacity-80">{labels[index]}</div>
                        )}
                        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-base-content"></div>
                      </div>
                    )}
                  </div>
                  
                  {/* Value label on top */}
                  {isHovered && (
                    <div className="absolute -top-6 text-xs font-bold text-base-content">
                      {value.toLocaleString()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-8 bg-base-200 rounded-t"
                    style={{ height: "30px" }}
                  />
                ))}
              </div>
              <p className="text-sm text-base-content/40">Aucune donnée</p>
            </div>
          </div>
        )}
      </div>

      {/* X-axis labels */}
      {labels.length > 0 && (
        <div className="flex justify-between mt-4 px-1">
          {labels.map((label, index) => (
            <div key={index} className="text-xs text-base-content/60 text-center flex-1">
              {label}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      {showStats && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-base-200">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 ${getColorClass()} rounded`}></div>
            <span className="text-sm text-base-content/60">Période actuelle</span>
          </div>
          <div className="text-sm text-base-content/40">
            {data.length} points de données
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernBarChart;
