import React from 'react';
import { Calendar } from 'lucide-react';

interface DateInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
  optional?: boolean;
  error?: string;
}

export const DateInput: React.FC<DateInputProps> = ({
  label,
  required,
  optional,
  error,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full space-y-1.5">
      {label && (
        <div className="flex items-center justify-between">
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-700">
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
          {optional && <span className="text-[11px] text-slate-400">(Optional)</span>}
        </div>
      )}

      <div className="relative rounded-lg shadow-sm">
        <input
          id={inputId}
          type="text"
          className={`block w-full rounded-lg border bg-white px-3.5 py-2 pr-9 text-sm text-slate-800 placeholder-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
            error
              ? 'border-rose-300 text-rose-900 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-200 hover:border-slate-300'
          } ${className}`}
          {...props}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400">
          <Calendar className="w-4 h-4" />
        </div>
      </div>

      {error && <p className="text-xs text-rose-600 mt-1">{error}</p>}
    </div>
  );
};
