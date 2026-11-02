import React from 'react';

export type BadgeVariant =
  | 'active'
  | 'completed'
  | 'pending'
  | 'in-process'
  | 'approved'
  | 'rejected'
  | 'on-hold'
  | 'superseded'
  | 'verified'
  | 'employee-reviewed'
  | 'info-source-purple'
  | 'info-source-cyan'
  | 'info-source-blue'
  | 'neutral';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  subtext?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className = '',
  subtext,
}) => {
  const getStyles = (): string => {
    switch (variant) {
      case 'active':
      case 'approved':
      case 'completed':
      case 'verified':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200/80';
      case 'pending':
      case 'rejected': // or on-hold
        if (variant === 'rejected') {
          return 'bg-rose-50 text-rose-700 border border-rose-200/80';
        }
        return 'bg-amber-50 text-amber-700 border border-amber-200/80';
      case 'on-hold':
        return 'bg-rose-50 text-rose-700 border border-rose-200/80';
      case 'in-process':
        return 'bg-blue-50 text-blue-700 border border-blue-200/80';
      case 'superseded':
        return 'bg-slate-100 text-slate-600 border border-slate-200';
      case 'employee-reviewed':
        return 'bg-blue-50 text-blue-700 border border-blue-200/80';
      case 'info-source-purple':
        return 'bg-purple-50 text-purple-700 border border-purple-200/80';
      case 'info-source-cyan':
        return 'bg-cyan-50 text-cyan-800 border border-cyan-200/80';
      case 'info-source-blue':
        return 'bg-blue-50 text-blue-700 border border-blue-200/80';
      case 'neutral':
      default:
        return 'bg-slate-100 text-slate-700 border border-slate-200';
    }
  };

  return (
    <div className="inline-flex flex-col items-start gap-0.5">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium tracking-tight ${getStyles()} ${className}`}
      >
        {children}
      </span>
      {subtext && (
        <span className="text-[10px] font-medium text-amber-700 pl-0.5">
          {subtext}
        </span>
      )}
    </div>
  );
};
