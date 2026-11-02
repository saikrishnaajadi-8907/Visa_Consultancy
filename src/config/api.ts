/**
 * Placeholder API Service Configuration for VCMS
 *
 * NOTE (Phase 1 Boundaries):
 * This service defines placeholder configuration and typed endpoints for future
 * backend API integration (Phase 2). No live API requests or database connections
 * are performed in Phase 1.
 */

export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
  headers: Record<string, string>;
}

export const API_CONFIG: ApiConfig = {
  baseUrl: (typeof process !== 'undefined' && process.env?.API_URL) || '/api/v1',
  timeoutMs: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    session: '/auth/session',
  },
  customers: {
    list: '/customers',
    create: '/customers',
    get: (id: string) => `/customers/${id}`,
    update: (id: string) => `/customers/${id}`,
    delete: (id: string) => `/customers/${id}`,
  },
  banks: {
    list: '/banks',
    get: (id: string) => `/banks/${id}`,
    summary: '/banks/summary',
  },
  financialRecords: {
    list: '/financial-records',
    create: '/financial-records',
    get: (id: string) => `/financial-records/${id}`,
    history: '/financial-records/history',
  },
  reports: {
    bankSummary: '/reports/bank-summary',
    customerSummary: '/reports/customer-summary',
    exportCsv: '/reports/export-csv',
  },
} as const;

/**
 * Placeholder API Client interface for future integration
 */
export const apiClient = {
  get: async <T>(_endpoint: string): Promise<T> => {
    throw new Error('Phase 1 Notice: Live backend API requests are disabled in Phase 1.');
  },
  post: async <T>(_endpoint: string, _data?: unknown): Promise<T> => {
    throw new Error('Phase 1 Notice: Live backend API requests are disabled in Phase 1.');
  },
};
