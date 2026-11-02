import React, { createContext, useContext, useState } from 'react';

interface AppStateContextType {
  isEmptyStateMode: boolean;
  setIsEmptyStateMode: (value: boolean | ((prev: boolean) => boolean)) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to sample demo data for active demonstration
  const [isEmptyStateMode, setIsEmptyStateMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  return (
    <AppStateContext.Provider
      value={{
        isEmptyStateMode,
        setIsEmptyStateMode,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
}
