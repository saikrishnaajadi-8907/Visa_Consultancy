import React from 'react';
import { formatINR } from '../../utils/formatters';

export interface ChartDataPoint {
  label: string;
  value: number;
  formattedValue?: string;
  color?: string;
  sublabel?: string;
}

interface HorizontalBarChartProps {
  title?: string;
  subtitle?: string;
  data: ChartDataPoint[];
  emptyMessage?: string;
  isCurrency?: boolean;
}

export const HorizontalBarChart: React.FC<HorizontalBarChartProps> = ({
  title,
  subtitle,
  data,
  emptyMessage = 'No distribution data available for this selection.',
  isCurrency = false,
}) => {
  const total = data.reduce((acc, d) => acc + d.value, 0);
  const maxValue = Math.max(...data.map((d) => d.value), 0);

  // Palette matching VCMS navy/blue/slate design tokens
  const defaultColors = [
    'bg-blue-600',
    'bg-emerald-600',
    'bg-indigo-600',
    'bg-amber-600',
    'bg-purple-600',
    'bg-teal-600',
    'bg-sky-600',
    'bg-rose-600',
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
      {title && (
        <div className="border-b border-slate-100 pb-3">
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {data.length === 0 || total === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 italic">{emptyMessage}</div>
      ) : (
        <div className="space-y-3">
          {data.map((item, idx) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const barWidth = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
            const barColor = item.color || defaultColors[idx % defaultColors.length];

            return (
              <div key={item.label} className="space-y-1 text-xs">
                <div className="flex items-center justify-between text-slate-700 font-medium">
                  <span className="truncate max-w-[200px]" title={item.label}>
                    {item.label}
                  </span>
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="font-bold text-slate-900">
                      {item.formattedValue || (isCurrency ? formatINR(item.value) : item.value.toLocaleString())}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono w-10 text-right">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${Math.max(barWidth, 3)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface DonutChartProps {
  title?: string;
  subtitle?: string;
  data: ChartDataPoint[];
  emptyMessage?: string;
  centerLabel?: string;
  centerValue?: string | number;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  title,
  subtitle,
  data,
  emptyMessage = 'No distribution data available.',
  centerLabel,
  centerValue,
}) => {
  const total = data.reduce((acc, d) => acc + d.value, 0);

  const colors = [
    '#2563eb', // blue-600
    '#059669', // emerald-600
    '#7c3aed', // purple-600
    '#d97706', // amber-600
    '#0284c7', // sky-600
    '#e11d48', // rose-600
    '#475569', // slate-600
  ];

  // Calculate SVG stroke dashes for donut
  let cumulativePercent = 0;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
      {title && (
        <div className="border-b border-slate-100 pb-3">
          <h4 className="text-sm font-bold text-slate-900">{title}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      )}

      {data.length === 0 || total === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400 italic">{emptyMessage}</div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-1">
          {/* SVG Donut */}
          <div className="relative w-36 h-36 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {data.map((item, idx) => {
                const percent = (item.value / total) * 100;
                const strokeDasharray = `${percent} ${100 - percent}`;
                const strokeDashoffset = -cumulativePercent;
                cumulativePercent += percent;
                const strokeColor = item.color || colors[idx % colors.length];

                return (
                  <circle
                    key={item.label}
                    cx="50"
                    cy="50"
                    r="38"
                    fill="transparent"
                    stroke={strokeColor}
                    strokeWidth="16"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    pathLength="100"
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>

            {/* Inner Center Content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-lg font-bold text-slate-900 tabular-nums">
                {centerValue !== undefined ? centerValue : total}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">
                {centerLabel || 'Total'}
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-2 text-xs flex-1 min-w-[150px]">
            {data.map((item, idx) => {
              const percent = total > 0 ? (item.value / total) * 100 : 0;
              const color = item.color || colors[idx % colors.length];

              return (
                <div key={item.label} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-slate-700 font-medium truncate" title={item.label}>
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 tabular-nums text-slate-900 font-bold shrink-0">
                    <span>{item.formattedValue || item.value}</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      ({percent.toFixed(0)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
