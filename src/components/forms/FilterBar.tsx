import React from 'react';
import { SearchInput } from './SearchInput';

interface FilterBarProps {
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  children?: React.ReactNode;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  searchPlaceholder = 'Search...',
  searchValue,
  onSearchChange,
  children,
  className = '',
}) => {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200/90 p-3.5 flex flex-col md:flex-row items-stretch md:items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${className}`}
    >
      <div className="flex-1 min-w-[240px]">
        <SearchInput
          placeholder={searchPlaceholder}
          value={searchValue}
          onSearchChange={onSearchChange}
        />
      </div>
      {children && (
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {children}
        </div>
      )}
    </div>
  );
};
