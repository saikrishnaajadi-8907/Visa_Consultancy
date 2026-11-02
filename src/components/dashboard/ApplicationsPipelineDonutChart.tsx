import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface DashboardCustomer {
  id: string;
  name: string;
  bankName: string;
  bankId?: string;
  visaTrack: string;
  status: string;
}

interface ApplicationsPipelineDonutChartProps {
  customers: DashboardCustomer[];
}

export const ApplicationsPipelineDonutChart: React.FC<ApplicationsPipelineDonutChartProps> = ({
  customers,
}) => {
  const navigate = useNavigate();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  // Group customers by actual visa category
  const categorySegments = useMemo(() => {
    if (customers.length === 0) return [];

    const counts: Record<string, number> = {};
    for (const c of customers) {
      const track = (c.visaTrack || 'General Visa').trim();
      counts[track] = (counts[track] || 0) + 1;
    }

    // Palette inspired by screenshot 3 (Blue, Emerald, Amber, Magenta, Purple)
    const palette = ['#2563EB', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4'];

    return Object.entries(counts)
      .map(([label, count], idx) => {
        const pctNumber = Math.round((count / customers.length) * 100);
        return {
          label,
          count,
          pct: `${pctNumber}%`,
          pctNumber,
          color: palette[idx % palette.length],
        };
      })
      .sort((a, b) => b.count - a.count);
  }, [customers]);

// Helper to generate SVG arc path command
function getArcPath(
  cx: number,
  cy: number,
  r: number,
  startAngleDeg: number,
  endAngleDeg: number
): string {
  // If full circle (360 degrees)
  if (endAngleDeg - startAngleDeg >= 359.9) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx} ${cy + r} A ${r} ${r} 0 1 1 ${cx} ${cy - r}`;
  }

  // Convert angles to radians (0 deg is top / 12 o'clock)
  const startRad = ((startAngleDeg - 90) * Math.PI) / 180;
  const endRad = ((endAngleDeg - 90) * Math.PI) / 180;

  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);

  const angleDiff = endAngleDeg - startAngleDeg;
  const largeArcFlag = angleDiff > 180 ? 1 : 0;

  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
}

  // Donut geometry
  const radius = 64;
  const totalCount = customers.length > 0 ? customers.length : 1;

  // Calculate precise arc geometry for each segment so segments have zero overlap
  const slices = useMemo(() => {
    let currentAngle = 0;
    return categorySegments.map((segment) => {
      const sweepAngle = (segment.count / totalCount) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sweepAngle;
      currentAngle += sweepAngle;

      const pathD = getArcPath(80, 80, radius, startAngle, endAngle);

      return {
        ...segment,
        startAngle,
        endAngle,
        pathD,
      };
    });
  }, [categorySegments, totalCount, radius]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Applications Pipeline</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Portfolio breakdown by visa category
            </p>
          </div>
          <button
            onClick={() => navigate('/customers')}
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium cursor-pointer"
          >
            View customers
          </button>
        </div>

        {customers.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No visa applications active in the system.
          </div>
        ) : (
          <div className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Donut Graphic */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 160 160">
                {/* Background Track Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="none"
                  stroke="#F1F5F9"
                  strokeWidth="22"
                />

                {/* Slices rendered with precise non-overlapping arc paths */}
                {slices.map((segment) => {
                  const isHovered = hoveredCategory === segment.label;

                  return (
                    <path
                      key={segment.label}
                      d={segment.pathD}
                      fill="none"
                      stroke={segment.color}
                      strokeWidth={isHovered ? 26 : 22}
                      strokeLinecap="butt"
                      className="transition-all duration-150 hover:opacity-90 cursor-pointer"
                      style={{ pointerEvents: 'stroke' }}
                      onMouseEnter={() => setHoveredCategory(segment.label)}
                      onMouseLeave={() => setHoveredCategory(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/customers?visaType=${encodeURIComponent(segment.label)}`);
                      }}
                    >
                      <title>{`${segment.label}: ${segment.count} application${segment.count > 1 ? 's' : ''} (${segment.pct})`}</title>
                    </path>
                  );
                })}
              </svg>

              {/* Total Number in Center */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-900 tabular-nums">
                  {customers.length}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Applications</span>
              </div>
            </div>

            {/* Legend List */}
            <div className="grid grid-cols-1 gap-2.5 text-xs w-full sm:max-w-xs">
              {slices.map((item) => {
                const isHovered = hoveredCategory === item.label;

                return (
                  <div
                    key={item.label}
                    onClick={() =>
                      navigate(`/customers?visaType=${encodeURIComponent(item.label)}`)
                    }
                    onMouseEnter={() => setHoveredCategory(item.label)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    title={`Click to view ${item.label} applications`}
                    className={`flex items-center justify-between gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
                      isHovered ? 'bg-slate-100/90' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-xs font-medium text-slate-800">
                        {item.label}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 font-mono shrink-0 tabular-nums font-semibold">
                      {item.count} <span className="text-slate-400 font-normal">({item.pct})</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>{categorySegments.length} Active Visa Streams</span>
        <button
          onClick={() => navigate('/customers')}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          <span>Manage Portfolios</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
