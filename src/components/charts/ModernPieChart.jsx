import React, { useState } from "react";
import { PieChart, TrendingUp } from "lucide-react";

const ModernPieChart = ({
  data = [],
  title = "Répartition",
  showLegend = true,
  size = 200,
  onCategoryClick = null,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
  const colors = [
    "#3B82F6",
    "#10B981",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#EC4899",
    "#06B6D4",
    "#F97316",
    "#84CC16",
    "#6366F1",
  ];

  const calculatePath = (startAngle, endAngle, innerRadius = 0) => {
    const radius = size / 2;
    const x = radius;
    const y = radius;

    const x1 = x + radius * Math.cos((startAngle * Math.PI) / 180);
    const y1 = y + radius * Math.sin((startAngle * Math.PI) / 180);
    const x2 = x + radius * Math.cos((endAngle * Math.PI) / 180);
    const y2 = y + radius * Math.sin((endAngle * Math.PI) / 180);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    if (innerRadius === 0) {
      return `M ${x} ${y} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
    } else {
      const ix1 = x + innerRadius * Math.cos((startAngle * Math.PI) / 180);
      const iy1 = y + innerRadius * Math.sin((startAngle * Math.PI) / 180);
      const ix2 = x + innerRadius * Math.cos((endAngle * Math.PI) / 180);
      const iy2 = y + innerRadius * Math.sin((endAngle * Math.PI) / 180);

      return `M ${ix1} ${iy1} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1} Z`;
    }
  };

  return (
    <div className="bg-base-100 rounded-xl shadow-lg p-6 border border-base-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-base-content">{title}</h3>
          <div className="text-2xl font-bold text-base-content mt-1">
            {total.toLocaleString()}
          </div>
        </div>
        <div className="text-base-content/40">
          <PieChart className="w-5 h-5" />
        </div>
      </div>

      <div className="flex items-center justify-center">
        {data.length > 0 ? (
          <div className="relative">
            <svg width={size} height={size} className="transform -rotate-90">
              {(() => {
                let currentAngle = -90; // Start from top
                return data.map((item, index) => {
                  const percentage = total > 0 ? (item.value / total) * 100 : 0;
                  const angle = (percentage * 360) / 100;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;

                  currentAngle = endAngle;

                  const color = item.color || colors[index % colors.length];
                  const isHovered = hoveredIndex === index;

                  return (
                    <g key={index}>
                      <path
                        d={calculatePath(
                          startAngle,
                          endAngle,
                          isHovered ? size * 0.35 : size * 0.4,
                        )}
                        fill={color}
                        className={`transition-all duration-300 cursor-pointer ${
                          onCategoryClick ? "hover:brightness-110" : ""
                        }`}
                        style={{
                          filter: isHovered
                            ? "brightness(1.1)"
                            : "brightness(1)",
                          transform: isHovered ? "scale(1.05)" : "scale(1)",
                          transformOrigin: "center",
                        }}
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                        onClick={() =>
                          onCategoryClick && onCategoryClick(item.name)
                        }
                      />
                    </g>
                  );
                });
              })()}
            </svg>

            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-base-content">
                  {data.length}
                </div>
                <div className="text-xs text-base-content/60">Catégories</div>
              </div>
            </div>

            {/* Hover tooltip */}
            {hoveredIndex !== null && (
              <div
                className="absolute z-20 px-4 py-3 bg-base-content text-base-100 rounded-xl shadow-2xl border border-base-300 min-w-[160px]"
                style={{
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="w-4 h-4 rounded"
                    style={{
                      backgroundColor:
                        data[hoveredIndex].color ||
                        colors[hoveredIndex % colors.length],
                    }}
                  ></div>
                  <div className="font-bold">{data[hoveredIndex].name}</div>
                </div>
                <div className="text-2xl font-bold">
                  {data[hoveredIndex].value.toLocaleString()}
                </div>
                <div className="text-sm opacity-80">
                  {total > 0
                    ? ((data[hoveredIndex].value / total) * 100).toFixed(1)
                    : 0}
                  %
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 rotate-45 w-4 h-4 bg-base-content border-r border-b border-base-300"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-base-200"></div>
            <p className="text-base-content/40">Aucune donnée</p>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && data.length > 0 && (
        <div className="mt-6 space-y-2">
          {data.map((item, index) => {
            const percentage =
              total > 0 ? ((item.value / total) * 100).toFixed(1) : 0;
            const color = item.color || colors[index % colors.length];

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-2 rounded-lg hover:bg-base-200 transition-colors ${
                  onCategoryClick ? "cursor-pointer" : ""
                }`}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                onClick={() => onCategoryClick && onCategoryClick(item.name)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-4 h-4 rounded"
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className="text-sm font-medium text-base-content">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-base-content">
                    {item.value.toLocaleString()}
                  </div>
                  <div className="text-xs text-base-content/60">
                    {percentage}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ModernPieChart;
