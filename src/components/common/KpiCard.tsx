import React from 'react';

export type KpiColorTheme = 'blue' | 'green' | 'purple' | 'orange' | 'amber' | 'slate';

interface KpiCardProps {
  value: string | number;
  label: string;
  icon: React.ReactNode;
  theme?: KpiColorTheme;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  value,
  label,
  icon,
  theme = 'blue',
  trend,
  className = '',
  onClick,
}) => {
  const getThemeStyles = (): { iconBg: string; iconColor: string } => {
    switch (theme) {
      case 'green':
        return {
          iconBg: 'bg-emerald-50 text-emerald-600',
          iconColor: 'text-emerald-600',
        };
      case 'purple':
        return {
          iconBg: 'bg-purple-50 text-purple-600',
          iconColor: 'text-purple-600',
        };
      case 'orange':
        return {
          iconBg: 'bg-amber-50 text-amber-600',
          iconColor: 'text-amber-600',
        };
      case 'amber':
        return {
          iconBg: 'bg-amber-50 text-amber-600',
          iconColor: 'text-amber-600',
        };
      case 'slate':
        return {
          iconBg: 'bg-slate-100 text-slate-600',
          iconColor: 'text-slate-600',
        };
      case 'blue':
      default:
        return {
          iconBg: 'bg-blue-50 text-blue-600',
          iconColor: 'text-blue-600',
        };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex items-center justify-between transition-all ${
        onClick
          ? 'cursor-pointer hover:shadow-md hover:border-blue-400 hover:-translate-y-0.5 active:translate-y-0 group focus:outline-none focus:ring-2 focus:ring-blue-500/20'
          : 'hover:border-slate-300'
      } ${className}`}
    >
      <div>
        <div className={`text-2xl font-bold text-slate-900 tracking-tight tabular-nums ${onClick ? 'group-hover:text-blue-600 transition-colors' : ''}`}>
          {value}
        </div>
        <div className="text-xs font-medium text-slate-500 mt-1">{label}</div>
        {trend && (
          <div
            className={`text-xs font-medium mt-1 flex items-center gap-1 ${
              trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            <span>{trend.isPositive ? '↑' : '↓'}</span>
            <span>{trend.value}</span>
          </div>
        )}
      </div>

      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
          onClick ? 'group-hover:scale-105' : ''
        } ${themeStyles.iconBg}`}
      >
        {icon}
      </div>
    </div>
  );
};
