import React, { useState } from "react";
import { LineChart, TrendingUp, TrendingDown, Activity } from "lucide-react";

const ModernLineChart = ({ 
  data = [], 
  labels = [], 
  title = "Tendance", 
  color = "#3B82F6",
  showStats = true,
  height = 200 
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const maxValue = Math.max(...data, 1);
  const minValue = Math.min(...data, 0);
  const range = maxValue - minValue || 1;

  const getTrend = () => {
    if (data.length < 2) return null;
    const recent = data.slice(-3);
    const older = data.slice(0, 3);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    return recentAvg > olderAvg ? 'up' : 'down';
  };

  const getPercentage = (value) => ((value - minValue) / range) * 100;

  const createPath = () => {
    if (data.length === 0) return '';
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - getPercentage(value);
      return `${x},${y}`;
    }).join(' ');

    return `M ${points}`;
  };

  const createAreaPath = () => {
    if (data.length === 0) return '';
    
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - getPercentage(value);
      return `${x},${y}`;
    }).join(' ');

    return `M ${points} L 100,100 L 0,100 Z`;
  };

  const trend = getTrend();
  const firstValue = data[0] || 0;
  const lastValue = data[data.length - 1] || 0;
  const change = lastValue - firstValue;
  const changePercentage = firstValue !== 0 ? ((change / firstValue) * 100).toFixed(1) : 0;

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
                  {lastValue.toLocaleString()}
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
                    {changePercentage > 0 ? '+' : ''}{changePercentage}%
                  </div>
                )}
              </div>
              <div className="text-sm text-base-content/60">
                Min: {minValue.toLocaleString()} | Max: {maxValue.toLocaleString()}
              </div>
            </div>
          )}
        </div>
        <div className="text-base-content/40">
          <LineChart className="w-5 h-5" />
        </div>
      </div>

      {/* Chart */}
      <div className="relative" style={{ height: `${height}px` }}>
        {data.length > 0 ? (
          <div className="relative h-full">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 25, 50, 75, 100].map((percent) => (
                <div 
                  key={percent}
                  className="w-full border-t border-base-200"
                  style={{ opacity: percent === 0 || percent === 100 ? 0 : 0.3 }}
                />
              ))}
            </div>

            {/* SVG Chart */}
            <svg 
              viewBox="0 0 100 100" 
              className="absolute inset-0 w-full h-full"
              preserveAspectRatio="none"
            >
              {/* Area */}
              <defs>
                <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.05" />
                </linearGradient>
              </defs>
              
              <path
                d={createAreaPath()}
                fill="url(#areaGradient)"
                className="transition-all duration-300"
              />
              
              {/* Line */}
              <path
                d={createPath()}
                fill="none"
                stroke={color}
                strokeWidth="2"
                className="transition-all duration-300"
              />

              {/* Points */}
              {data.map((value, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = 100 - getPercentage(value);
                const isHovered = hoveredIndex === index;
                
                return (
                  <g key={index}>
                    <circle
                      cx={x}
                      cy={y}
                      r={isHovered ? 5 : 3}
                      fill={color}
                      className="transition-all duration-300 cursor-pointer"
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                    {isHovered && (
                      <circle
                        cx={x}
                        cy={y}
                        r={8}
                        fill={color}
                        fillOpacity="0.2"
                        className="transition-all duration-300"
                      />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover tooltip */}
            {hoveredIndex !== null && (
              <div 
                className="absolute z-20 px-4 py-3 bg-base-content text-base-100 rounded-xl shadow-2xl border border-base-300"
                style={{
                  bottom: `${100 - getPercentage(data[hoveredIndex])}%`,
                  left: `${(hoveredIndex / (data.length - 1)) * 100}%`,
                  transform: 'translate(-50%, -120%)',
                }}
              >
                <div className="text-xs opacity-80 mb-1">
                  {labels[hoveredIndex] || `Point ${hoveredIndex + 1}`}
                </div>
                <div className="text-xl font-bold">
                  {data[hoveredIndex].toLocaleString()}
                </div>
                <div className="text-xs opacity-80 mt-1">
                  {hoveredIndex > 0 && (
                    <span className={data[hoveredIndex] > data[hoveredIndex - 1] ? 'text-success' : 'text-error'}>
                      {data[hoveredIndex] > data[hoveredIndex - 1] ? (
                        <TrendingUp className="w-3 h-3 inline mr-1" />
                      ) : (
                        <TrendingDown className="w-3 h-3 inline mr-1" />
                      )}
                      {Math.abs(data[hoveredIndex] - data[hoveredIndex - 1]).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 rotate-45 w-4 h-4 bg-base-content border-r border-b border-base-300"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Activity className="w-12 h-12 text-base-content/20 mx-auto mb-4" />
              <p className="text-base-content/40">Aucune donnée</p>
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
            <div className="w-3 h-3 rounded" style={{ backgroundColor: color }}></div>
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

export default ModernLineChart;
