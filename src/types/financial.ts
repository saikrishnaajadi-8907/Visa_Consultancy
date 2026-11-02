/**
 * Financial Architecture Type Definitions - VCMS Client Demonstration
 *
 * Strictly typed frontend data model for client financial records,
 * transactions, Option B corrections, balance summaries, and audit logging.
 */

export type FinancialTransactionType =
  | 'Credit'
  | 'Debit'
  | 'Additional Deposit'
  | 'Withdrawal'
  | 'Interest Adjustment'
  | 'Other'
  | 'Correction Adjustment';

export type TransactionDirection = 'Inflow' | 'Outflow' | 'Neutral';

export type FinancialHealthStatus = 'Healthy' | 'Low Balance' | 'Critical Minimum Warning';

export interface FinancialTransaction {
  id: string; // TXN-YYYYMMDD-XXXX
  customerId: string;
  transactionDate: string; // ISO date YYYY-MM-DD
  transactionType: FinancialTransactionType;
  amount: number; // Positive number
  direction: TransactionDirection; // Inflow (adds to balance), Outflow (deducts from balance)
  description: string;
  notes?: string;
  referenceNo?: string;
  bankId?: string;
  bankName?: string;
  branchId?: string;
  branchName?: string;
  accountNumberMasked?: string;
  previousBalance: number;
  newBalance: number;
  // Option B Correction Metadata
  isCorrection?: boolean;
  correctionId?: string;
  originalTransactionId?: string;
  precedingCorrectionId?: string;
  // Provenance
  createdBy: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface FinancialCorrection {
  id: string; // CORR-YYYYMMDD-XXXX
  customerId: string;
  originalTransactionId: string;
  precedingCorrectionId?: string;
  originalAmount: number;
  previouslyAcceptedAmount: number;
  correctedAmount: number;
  adjustmentAmount: number; // Signed: positive adds to balance, negative deducts from balance
  correctionReason: string;
  resultingTransactionId: string;
  previousBalance: number;
  newBalance: number;
  createdBy: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface CustomerFinancialSummary {
  customerId: string;
  customerName: string;
  passportNumber: string;
  accountNumberMasked: string;
  bankId?: string;
  bankName: string;
  branchId?: string;
  branchName: string;
  initialAmount: number;
  initialTransactionDate: string;
  currentBankBalance: number;
  minimumBalance: number; // Fixed at ₹4,000
  operationalBankBalance: number; // Math.max(0, currentBankBalance - minimumBalance)
  fdAmount: number; // from customer.fdInfo.initialFdAmount or 0
  combinedFinancialAmount: number; // currentBankBalance + fdAmount
  totalCredits: number;
  totalDebits: number;
  totalCorrections: number;
  netAdjustmentAmount: number;
  lastTransactionDate?: string;
  transactionCount: number;
  correctionCount: number;
  status: FinancialHealthStatus;
}

export interface FinancialAuditEntry {
  id: string;
  timestamp: string;
  customerId: string;
  action: 'INITIAL_RECORD' | 'TRANSACTION_CREATED' | 'CORRECTION_APPLIED';
  recordId: string;
  details: string;
  previousBalance: number;
  adjustmentOrAmount: number;
  newBalance: number;
  actor: string;
  role: string;
  reason?: string;
}

export interface CreateTransactionRequest {
  customerId: string;
  transactionDate: string; // YYYY-MM-DD
  transactionType: Exclude<FinancialTransactionType, 'Correction Adjustment'>;
  amount: number;
  description: string;
  notes?: string;
  referenceNo?: string;
}

export interface CreateCorrectionRequest {
  customerId: string;
  originalTransactionId: string;
  correctedAmount: number;
  correctionReason: string;
}
