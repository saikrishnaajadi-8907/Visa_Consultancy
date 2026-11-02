import React from 'react';
import { AlertCircle, Info } from 'lucide-react';

export type AlertType = 'warning' | 'info' | 'success';

interface AlertBannerProps {
  type?: AlertType;
  title?: string;
  message: React.ReactNode;
  actionText?: string;
  actionLink?: string;
  secondaryActionText?: string;
  secondaryActionLink?: string;
  className?: string;
  onActionClick?: () => void;
  onSecondaryActionClick?: () => void;
}

export const AlertBanner: React.FC<AlertBannerProps> = ({
  type = 'warning',
  title,
  message,
  actionText,
  actionLink,
  secondaryActionText,
  secondaryActionLink,
  className = '',
  onActionClick,
  onSecondaryActionClick,
}) => {
  const isWarning = type === 'warning';

  return (
    <div
      className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isWarning
          ? 'bg-amber-50/60 border-amber-200/80 text-amber-900'
          : 'bg-blue-50/50 border-blue-200/80 text-blue-900'
      } ${className}`}
    >
      <div className="flex items-start sm:items-center gap-3">
        <div
          className={`shrink-0 mt-0.5 sm:mt-0 ${
            isWarning ? 'text-amber-600' : 'text-blue-600'
          }`}
        >
          {isWarning ? <AlertCircle className="w-5 h-5" /> : <Info className="w-5 h-5" />}
        </div>
        <div className="text-xs sm:text-sm leading-relaxed">
          {title && <span className="font-semibold mr-1.5">{title}:</span>}
          <span>{message}</span>
        </div>
      </div>

      {(actionText || secondaryActionText) && (
        <div className="flex items-center gap-2 text-xs font-medium shrink-0 pl-8 sm:pl-0">
          {actionText && (
            <button
              onClick={onActionClick}
              className={`hover:underline cursor-pointer flex items-center gap-1 font-semibold ${
                isWarning ? 'text-blue-700' : 'text-blue-700'
              }`}
            >
              <span>{actionText}</span>
              {actionLink && <span>↗</span>}
            </button>
          )}

          {actionText && secondaryActionText && (
            <span className="text-slate-300">|</span>
          )}

          {secondaryActionText && (
            <button
              onClick={onSecondaryActionClick}
              className="text-slate-700 hover:text-slate-900 hover:underline cursor-pointer"
            >
              {secondaryActionText}
            </button>
          )}
        </div>
      )}
    </div>
  );
};
