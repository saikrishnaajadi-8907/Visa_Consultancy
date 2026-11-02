/**
 * Financial Service - Phase 3 / Demonstration Architecture
 *
 * Implements in-memory financial data ledger, balance calculations,
 * Option B current balance corrections, transaction tracking, and audit trail.
 *
 * OPERATIONAL CONSTRAINTS:
 * - Operates strictly within in-memory React session state.
 * - Zero browser persistence (no localStorage/sessionStorage/IndexedDB).
 * - Fixed minimum bank balance: ₹4,000 (operational balance = current balance - 4,000).
 * - Combined Financial Amount = Current Bank Balance + FD Component.
 * - Strict separation: Demo sample data is isolated from operational session data.
 * - Actor: "Demonstration User (Unauthenticated)", Role: "Demonstration Case Officer".
 */

import {
  FinancialTransaction,
  FinancialCorrection,
  CustomerFinancialSummary,
  FinancialAuditEntry,
  CreateTransactionRequest,
  CreateCorrectionRequest,
  TransactionDirection,
  FinancialHealthStatus,
} from '../types/financial';
import { customerService } from './customerService';
import { MOCK_CUSTOMERS } from '../constants/mockData';
import { Customer } from '../types/customer';

// Fixed policy minimum balance reserve in INR
export const POLICY_MINIMUM_BANK_BALANCE = 4000;

// Standard actor identities for unauthenticated prototype demo
export const DEMO_ACTOR_NAME = 'Demo User';
export const DEMO_ACTOR_ROLE = 'Demonstration Case Officer';

/**
 * Helper to mask bank account numbers consistently
 */
export function maskAccountNumber(accNo?: string): string {
  if (!accNo) return 'XXXX 0000';
  const clean = accNo.replace(/\s+/g, '');
  if (clean.startsWith('XXXX')) return accNo;
  const last4 = clean.slice(-4);
  return `XXXX ${last4}`;
}

/**
 * Generates an opaque, traceable transaction identifier
 */
function generateTransactionId(prefix: string = 'TXN'): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}-${dateStr}-${rand}`;
}

/**
 * Generates an opaque, traceable correction identifier
 */
function generateCorrectionId(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `CORR-${dateStr}-${rand}`;
}

/**
 * Pre-seeded Demonstration Financial Transactions (for Sample Data mode)
 * Explicitly tagged with isDemo: true to ensure zero leakage into operational session records.
 */
export const DEMO_FINANCIAL_TRANSACTIONS: FinancialTransaction[] = [
  // --- Customer cust-hdfc-1: Arvind Swaminathan (HDFC Bank Somajiguda) ---
  {
    id: 'TXN-DEMO-015',
    customerId: 'cust-hdfc-1',
    transactionDate: '2026-09-03',
    transactionType: 'Credit',
    amount: 100000,
    direction: 'Inflow',
    description: 'Initial Financial Record at Customer Registration',
    notes: 'Opening deposit verified via HDFC Somajiguda statement',
    bankId: 'hdfc',
    bankName: 'HDFC Bank',
    branchId: 'br_hdfc_01',
    branchName: 'Somajiguda Branch (Demo)',
    accountNumberMasked: 'XXXX 5012',
    previousBalance: 0,
    newBalance: 100000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-09-03T10:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-016',
    customerId: 'cust-hdfc-1',
    transactionDate: '2026-09-16',
    transactionType: 'Additional Deposit',
    amount: 30000,
    direction: 'Inflow',
    description: 'Additional Proof of Funds - Bank Transfer',
    notes: 'Semester maintenance funds transfer from parent account',
    referenceNo: 'HDFC-NEFT-90812',
    bankId: 'hdfc',
    bankName: 'HDFC Bank',
    branchId: 'br_hdfc_01',
    branchName: 'Somajiguda Branch (Demo)',
    accountNumberMasked: 'XXXX 5012',
    previousBalance: 100000,
    newBalance: 130000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-09-16T11:30:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-017',
    customerId: 'cust-hdfc-1',
    transactionDate: '2026-09-30',
    transactionType: 'Interest Adjustment',
    amount: 2500,
    direction: 'Inflow',
    description: 'Quarterly Savings Interest Credit',
    notes: 'Q2 savings interest posted by HDFC Bank',
    referenceNo: 'HDFC-INT-2026Q2',
    bankId: 'hdfc',
    bankName: 'HDFC Bank',
    branchId: 'br_hdfc_01',
    branchName: 'Somajiguda Branch (Demo)',
    accountNumberMasked: 'XXXX 5012',
    previousBalance: 130000,
    newBalance: 132500,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-09-30T18:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-018',
    customerId: 'cust-hdfc-1',
    transactionDate: '2026-10-26',
    transactionType: 'Debit',
    amount: 15000,
    direction: 'Outflow',
    description: 'University Tuition Advance Fee',
    notes: 'International wire transfer for CAS deposit',
    referenceNo: 'HDFC-WIRE-44812',
    bankId: 'hdfc',
    bankName: 'HDFC Bank',
    branchId: 'br_hdfc_01',
    branchName: 'Somajiguda Branch (Demo)',
    accountNumberMasked: 'XXXX 5012',
    previousBalance: 132500,
    newBalance: 117500,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-26T14:00:00.000Z',
    isDemo: true,
  },

  // --- Customer cust-boi-1: Rajesh Nair (Bank of India Abids) ---
  {
    id: 'TXN-DEMO-019',
    customerId: 'cust-boi-1',
    transactionDate: '2026-09-06',
    transactionType: 'Credit',
    amount: 75000,
    direction: 'Inflow',
    description: 'Initial Financial Record at Customer Registration',
    notes: 'Initial registration proof of funds verified via BOI Abids',
    bankId: 'boi',
    bankName: 'Bank of India',
    branchId: 'br_boi_01',
    branchName: 'Abids Branch (Demo)',
    accountNumberMasked: 'XXXX 3389',
    previousBalance: 0,
    newBalance: 75000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-09-06T09:30:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-020',
    customerId: 'cust-boi-1',
    transactionDate: '2026-09-19',
    transactionType: 'Additional Deposit',
    amount: 25000,
    direction: 'Inflow',
    description: 'Work Visa Capital Proof Deposit',
    notes: 'Salary bonus transfer deposited for liquidity requirements',
    referenceNo: 'BKID-NEFT-67123',
    bankId: 'boi',
    bankName: 'Bank of India',
    branchId: 'br_boi_01',
    branchName: 'Abids Branch (Demo)',
    accountNumberMasked: 'XXXX 3389',
    previousBalance: 75000,
    newBalance: 100000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-09-19T14:15:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-021',
    customerId: 'cust-boi-1',
    transactionDate: '2026-10-07',
    transactionType: 'Debit',
    amount: 8000,
    direction: 'Outflow',
    description: 'German Blocked Account Setup & Authentication Fee',
    notes: 'Service fee payment to Coracle / Fintiba verified',
    referenceNo: 'BKID-DEB-11902',
    bankId: 'boi',
    bankName: 'Bank of India',
    branchId: 'br_boi_01',
    branchName: 'Abids Branch (Demo)',
    accountNumberMasked: 'XXXX 3389',
    previousBalance: 100000,
    newBalance: 92000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-07T16:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-022',
    customerId: 'cust-boi-1',
    transactionDate: '2026-11-01',
    transactionType: 'Interest Adjustment',
    amount: 1800,
    direction: 'Inflow',
    description: 'Savings Account Interest Credited',
    notes: 'Quarterly savings interest posted by Bank of India',
    referenceNo: 'BKID-INT-09871',
    bankId: 'boi',
    bankName: 'Bank of India',
    branchId: 'br_boi_01',
    branchName: 'Abids Branch (Demo)',
    accountNumberMasked: 'XXXX 3389',
    previousBalance: 92000,
    newBalance: 93800,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-11-01T11:00:00.000Z',
    isDemo: true,
  },

  // --- Customer cust-bom-1: Sneha Kulkarni (Bank of Maharashtra Sultan Bazar) ---
  {
    id: 'TXN-DEMO-023',
    customerId: 'cust-bom-1',
    transactionDate: '2026-09-08',
    transactionType: 'Credit',
    amount: 85000,
    direction: 'Inflow',
    description: 'Initial Financial Record at Customer Registration',
    notes: 'Savings deposit verified by Bank of Maharashtra passbook',
    bankId: 'bom',
    bankName: 'Bank of Maharashtra',
    branchId: 'br_bom_01',
    branchName: 'Sultan Bazar Branch (Demo)',
    accountNumberMasked: 'XXXX 7721',
    previousBalance: 0,
    newBalance: 85000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-09-08T10:15:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-024',
    customerId: 'cust-bom-1',
    transactionDate: '2026-09-21',
    transactionType: 'Debit',
    amount: 10000,
    direction: 'Outflow',
    description: 'Canadian College Application & WES Evaluation Fee',
    notes: 'Official credential assessment debit',
    referenceNo: 'MAHB-DEB-55109',
    bankId: 'bom',
    bankName: 'Bank of Maharashtra',
    branchId: 'br_bom_01',
    branchName: 'Sultan Bazar Branch (Demo)',
    accountNumberMasked: 'XXXX 7721',
    previousBalance: 85000,
    newBalance: 75000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-09-21T15:30:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-025',
    customerId: 'cust-bom-1',
    transactionDate: '2026-10-17',
    transactionType: 'Additional Deposit',
    amount: 25000,
    direction: 'Inflow',
    description: 'Scholarship Grant Transfer',
    notes: 'State merit scholarship deposit for higher education',
    referenceNo: 'MAHB-SCHOL-8812',
    bankId: 'bom',
    bankName: 'Bank of Maharashtra',
    branchId: 'br_bom_01',
    branchName: 'Sultan Bazar Branch (Demo)',
    accountNumberMasked: 'XXXX 7721',
    previousBalance: 75000,
    newBalance: 100000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-17T15:00:00.000Z',
    isDemo: true,
  },

  // --- Customer cust-canara-1: Vikram Rao (Canara Bank Secunderabad) ---
  {
    id: 'TXN-DEMO-026',
    customerId: 'cust-canara-1',
    transactionDate: '2026-09-10',
    transactionType: 'Credit',
    amount: 120000,
    direction: 'Inflow',
    description: 'Initial Financial Record at Customer Registration',
    notes: 'Verified via Canara Bank certificate of deposit',
    bankId: 'canara',
    bankName: 'Canara Bank',
    branchId: 'br_canara_02',
    branchName: 'Secunderabad Branch (Demo)',
    accountNumberMasked: 'XXXX 4410',
    previousBalance: 0,
    newBalance: 120000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-09-10T11:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-027',
    customerId: 'cust-canara-1',
    transactionDate: '2026-09-23',
    transactionType: 'Additional Deposit',
    amount: 40000,
    direction: 'Inflow',
    description: 'Australian General Skilled Migration Liquid Assets Deposit',
    notes: 'Fixed asset liquidation transfer to Canara savings',
    referenceNo: 'CNRB-RTGS-78901',
    bankId: 'canara',
    bankName: 'Canara Bank',
    branchId: 'br_canara_02',
    branchName: 'Secunderabad Branch (Demo)',
    accountNumberMasked: 'XXXX 4410',
    previousBalance: 120000,
    newBalance: 160000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-09-23T12:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-028',
    customerId: 'cust-canara-1',
    transactionDate: '2026-10-10',
    transactionType: 'Other',
    amount: 5000,
    direction: 'Inflow',
    description: 'Foreign Currency Inward Remittance Exchange Gain',
    notes: 'Inward wire settlement adjustment credit',
    referenceNo: 'CNRB-FX-00918',
    bankId: 'canara',
    bankName: 'Canara Bank',
    branchId: 'br_canara_02',
    branchName: 'Secunderabad Branch (Demo)',
    accountNumberMasked: 'XXXX 4410',
    previousBalance: 160000,
    newBalance: 165000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-10T16:00:00.000Z',
    isDemo: true,
  },

  // --- Customer cust-pnb-1: Harpreet Singh (Punjab National Bank Raj Bhavan Road) ---
  {
    id: 'TXN-DEMO-029',
    customerId: 'cust-pnb-1',
    transactionDate: '2026-09-12',
    transactionType: 'Credit',
    amount: 110000,
    direction: 'Inflow',
    description: 'Initial Financial Record at Customer Registration',
    notes: 'PNB business account verified proof of capital',
    bankId: 'pnb',
    bankName: 'Punjab National Bank (PNB)',
    branchId: 'br_pnb_01',
    branchName: 'Raj Bhavan Road Branch (Demo)',
    accountNumberMasked: 'XXXX 6632',
    previousBalance: 0,
    newBalance: 110000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-09-12T09:45:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-030',
    customerId: 'cust-pnb-1',
    transactionDate: '2026-09-25',
    transactionType: 'Withdrawal',
    amount: 15000,
    direction: 'Outflow',
    description: 'Business Visa Consultancy Stage 1 Filing Fee',
    notes: 'Fee transfer to consultancy escrow',
    referenceNo: 'PUNB-CHQ-33120',
    bankId: 'pnb',
    bankName: 'Punjab National Bank (PNB)',
    branchId: 'br_pnb_01',
    branchName: 'Raj Bhavan Road Branch (Demo)',
    accountNumberMasked: 'XXXX 6632',
    previousBalance: 110000,
    newBalance: 95000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-09-25T11:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-031',
    customerId: 'cust-pnb-1',
    transactionDate: '2026-10-20',
    transactionType: 'Additional Deposit',
    amount: 35000,
    direction: 'Inflow',
    description: 'Commercial Business Profit Transfer to Account',
    notes: 'Quarterly trade earnings credited for proof of funds',
    referenceNo: 'PUNB-RTGS-55410',
    bankId: 'pnb',
    bankName: 'Punjab National Bank (PNB)',
    branchId: 'br_pnb_01',
    branchName: 'Raj Bhavan Road Branch (Demo)',
    accountNumberMasked: 'XXXX 6632',
    previousBalance: 95000,
    newBalance: 130000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-20T12:00:00.000Z',
    isDemo: true,
  },

  // --- Customer cust-axis-1: Priya Sharma (Axis Bank Jubilee Hills) ---
  {
    id: 'TXN-DEMO-032',
    customerId: 'cust-axis-1',
    transactionDate: '2026-09-14',
    transactionType: 'Credit',
    amount: 95000,
    direction: 'Inflow',
    description: 'Initial Financial Record at Customer Registration',
    notes: 'Verified via Axis Priority Banking statement',
    bankId: 'axis',
    bankName: 'Axis Bank',
    branchId: 'br_axis_01',
    branchName: 'Jubilee Hills Branch (Demo)',
    accountNumberMasked: 'XXXX 8190',
    previousBalance: 0,
    newBalance: 95000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-09-14T10:30:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-033',
    customerId: 'cust-axis-1',
    transactionDate: '2026-09-27',
    transactionType: 'Additional Deposit',
    amount: 20000,
    direction: 'Inflow',
    description: 'Parental Sponsorship Living Expenses Deposit',
    notes: 'Transferred via UPI from sponsor account',
    referenceNo: 'UTIB-UPI-20260927-11',
    bankId: 'axis',
    bankName: 'Axis Bank',
    branchId: 'br_axis_01',
    branchName: 'Jubilee Hills Branch (Demo)',
    accountNumberMasked: 'XXXX 8190',
    previousBalance: 95000,
    newBalance: 115000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-09-27T14:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-034',
    customerId: 'cust-axis-1',
    transactionDate: '2026-10-23',
    transactionType: 'Debit',
    amount: 12000,
    direction: 'Outflow',
    description: 'UKVI IELTS & TB Medical Screening Fee',
    notes: 'British Council test registration and designated clinic charge',
    referenceNo: 'UTIB-POS-99014',
    bankId: 'axis',
    bankName: 'Axis Bank',
    branchId: 'br_axis_01',
    branchName: 'Jubilee Hills Branch (Demo)',
    accountNumberMasked: 'XXXX 8190',
    previousBalance: 115000,
    newBalance: 103000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-23T11:15:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-035',
    customerId: 'cust-axis-1',
    transactionDate: '2026-11-03',
    transactionType: 'Additional Deposit',
    amount: 15000,
    direction: 'Inflow',
    description: 'Term End Liquid Savings Consolidation',
    notes: 'Savings deposit before visa submission appointment',
    referenceNo: 'UTIB-NEFT-88192',
    bankId: 'axis',
    bankName: 'Axis Bank',
    branchId: 'br_axis_01',
    branchName: 'Jubilee Hills Branch (Demo)',
    accountNumberMasked: 'XXXX 8190',
    previousBalance: 103000,
    newBalance: 118000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-11-03T16:00:00.000Z',
    isDemo: true,
  },

  // --- Customer cust-91: Alok Mishra (IDBI Bank Begumpet) ---
  {
    id: 'TXN-DEMO-005',
    customerId: 'cust-91',
    transactionDate: '2026-09-28',
    transactionType: 'Credit',
    amount: 160000,
    direction: 'Inflow',
    description: 'Initial Financial Record at Customer Registration',
    notes: 'Verified IDBI salary and savings balance',
    bankId: 'idbi',
    bankName: 'IDBI Bank',
    branchId: 'br_idbi_01',
    branchName: 'Begumpet Branch (Demo)',
    accountNumberMasked: 'XXXX 1144',
    previousBalance: 0,
    newBalance: 160000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-09-28T09:30:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-006',
    customerId: 'cust-91',
    transactionDate: '2026-10-05',
    transactionType: 'Additional Deposit',
    amount: 40000,
    direction: 'Inflow',
    description: 'Additional Funds Proof Deposit - Liquid Assets Liquidation',
    notes: 'Mutual fund redemption receipt verified',
    referenceNo: 'RTGS/IBKL/20261005/00145',
    bankId: 'idbi',
    bankName: 'IDBI Bank',
    branchId: 'br_idbi_01',
    branchName: 'Begumpet Branch (Demo)',
    accountNumberMasked: 'XXXX 1144',
    previousBalance: 160000,
    newBalance: 200000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-05T12:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-007',
    customerId: 'cust-91',
    transactionDate: '2026-10-12',
    transactionType: 'Withdrawal',
    amount: 10000,
    direction: 'Outflow',
    description: 'Consultancy Service Milestone Fee',
    notes: 'Stage 1 application filing fee',
    referenceNo: 'CHQ-IBKL-12009',
    bankId: 'idbi',
    bankName: 'IDBI Bank',
    branchId: 'br_idbi_01',
    branchName: 'Begumpet Branch (Demo)',
    accountNumberMasked: 'XXXX 1144',
    previousBalance: 200000,
    newBalance: 190000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-12T16:00:00.000Z',
    isDemo: true,
  },

  // --- Customer cust-3: Ahmed Khan (ICICI Bank Ameerpet) ---
  {
    id: 'TXN-DEMO-001',
    customerId: 'cust-3',
    transactionDate: '2026-10-01',
    transactionType: 'Credit',
    amount: 75000,
    direction: 'Inflow',
    description: 'Initial Financial Record at Customer Registration',
    notes: 'Verified via ICICI Ameerpet Branch Statement (Self-funding savings deposit)',
    bankId: 'icici',
    bankName: 'ICICI Bank',
    branchId: 'br_icici_01',
    branchName: 'Ameerpet Branch (Demo)',
    accountNumberMasked: 'XXXX 9012',
    previousBalance: 0,
    newBalance: 75000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-01T10:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-002',
    customerId: 'cust-3',
    transactionDate: '2026-10-08',
    transactionType: 'Additional Deposit',
    amount: 20000,
    direction: 'Inflow',
    description: 'Additional Funds Proof Deposit - Bank Transfer',
    notes: 'Family financial support transfer from father account',
    referenceNo: 'NEFT/ICIC/20261008/88912',
    bankId: 'icici',
    bankName: 'ICICI Bank',
    branchId: 'br_icici_01',
    branchName: 'Ameerpet Branch (Demo)',
    accountNumberMasked: 'XXXX 9012',
    previousBalance: 75000,
    newBalance: 95000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-08T11:30:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-003',
    customerId: 'cust-3',
    transactionDate: '2026-10-14',
    transactionType: 'Debit',
    amount: 10000,
    direction: 'Outflow',
    description: 'Embassy Visa Processing Fee & Demand Draft',
    notes: 'VFS Global appointment and processing charges',
    referenceNo: 'DD-ICIC-99810',
    bankId: 'icici',
    bankName: 'ICICI Bank',
    branchId: 'br_icici_01',
    branchName: 'Ameerpet Branch (Demo)',
    accountNumberMasked: 'XXXX 9012',
    previousBalance: 95000,
    newBalance: 85000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-14T14:15:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-004',
    customerId: 'cust-3',
    transactionDate: '2026-10-15',
    transactionType: 'Correction Adjustment',
    amount: 5000,
    direction: 'Inflow',
    description: 'Current Balance Adjustment for TXN-DEMO-002 (Correction)',
    notes: 'Correction for TXN-DEMO-002: Actual NEFT counterfoil receipt showed ₹25,000 instead of ₹20,000 [Prev: ₹20,000 -> Corrected: ₹25,000]',
    isCorrection: true,
    correctionId: 'CORR-DEMO-001',
    originalTransactionId: 'TXN-DEMO-002',
    bankId: 'icici',
    bankName: 'ICICI Bank',
    branchId: 'br_icici_01',
    branchName: 'Ameerpet Branch (Demo)',
    accountNumberMasked: 'XXXX 9012',
    previousBalance: 85000,
    newBalance: 90000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-15T09:00:00.000Z',
    isDemo: true,
  },

  // --- Customer cust-8: Anjali Verma (Bank of Baroda Dilsukhnagar) ---
  {
    id: 'TXN-DEMO-010',
    customerId: 'cust-8',
    transactionDate: '2026-10-01',
    transactionType: 'Credit',
    amount: 90000,
    direction: 'Inflow',
    description: 'Initial Financial Record at Customer Registration',
    notes: 'Verified via Bank of Baroda e-statement',
    bankId: 'bob',
    bankName: 'Bank of Baroda',
    branchId: 'br_bob_01',
    branchName: 'Dilsukhnagar Branch (Demo)',
    accountNumberMasked: 'XXXX 9901',
    previousBalance: 0,
    newBalance: 90000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-01T11:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-011',
    customerId: 'cust-8',
    transactionDate: '2026-10-03',
    transactionType: 'Additional Deposit',
    amount: 30000,
    direction: 'Inflow',
    description: 'Student Sponsorship Transfer',
    notes: 'Educational loan partial disbursement',
    referenceNo: 'BOB-EDULOAN-5512',
    bankId: 'bob',
    bankName: 'Bank of Baroda',
    branchId: 'br_bob_01',
    branchName: 'Dilsukhnagar Branch (Demo)',
    accountNumberMasked: 'XXXX 9901',
    previousBalance: 90000,
    newBalance: 120000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-03T14:30:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-012',
    customerId: 'cust-8',
    transactionDate: '2026-10-04',
    transactionType: 'Debit',
    amount: 10000,
    direction: 'Outflow',
    description: 'University Application & Transcript Fees',
    notes: 'Direct debit to university international admissions portal',
    referenceNo: 'DEBIT-BOB-90812',
    bankId: 'bob',
    bankName: 'Bank of Baroda',
    branchId: 'br_bob_01',
    branchName: 'Dilsukhnagar Branch (Demo)',
    accountNumberMasked: 'XXXX 9901',
    previousBalance: 120000,
    newBalance: 110000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-04T16:00:00.000Z',
    isDemo: true,
  },

  // --- Customer cust-81: Chetan Shah (Bank of Baroda Dilsukhnagar) ---
  {
    id: 'TXN-DEMO-013',
    customerId: 'cust-81',
    transactionDate: '2026-10-01',
    transactionType: 'Credit',
    amount: 150000,
    direction: 'Inflow',
    description: 'Initial Financial Record at Customer Registration',
    notes: 'Demonstration initial verified deposit balance',
    bankId: 'bob',
    bankName: 'Bank of Baroda',
    branchId: 'br_bob_01',
    branchName: 'Dilsukhnagar Branch (Demo)',
    accountNumberMasked: 'XXXX 8712',
    previousBalance: 0,
    newBalance: 150000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-01T12:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-014',
    customerId: 'cust-81',
    transactionDate: '2026-10-05',
    transactionType: 'Additional Deposit',
    amount: 25000,
    direction: 'Inflow',
    description: 'Additional Funds Deposit',
    notes: 'Demonstration account deposit verified via bank transfer',
    referenceNo: 'BOB-TXN-44910',
    bankId: 'bob',
    bankName: 'Bank of Baroda',
    branchId: 'br_bob_01',
    branchName: 'Dilsukhnagar Branch (Demo)',
    accountNumberMasked: 'XXXX 8712',
    previousBalance: 150000,
    newBalance: 175000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-05T15:30:00.000Z',
    isDemo: true,
  },

  // --- Customer cust-11: Amit Deshmukh (SBI Hyderabad Main Branch) ---
  {
    id: 'TXN-DEMO-008',
    customerId: 'cust-11',
    transactionDate: '2026-10-02',
    transactionType: 'Credit',
    amount: 60000,
    direction: 'Inflow',
    description: 'Initial Financial Record at Customer Registration',
    notes: 'SBI Passbook physical copy verified by case officer',
    bankId: 'sbi',
    bankName: 'State Bank of India (SBI)',
    branchId: 'br_sbi_01',
    branchName: 'Hyderabad Main Branch (Demo)',
    accountNumberMasked: 'XXXX 4321',
    previousBalance: 0,
    newBalance: 60000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-02T10:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-009',
    customerId: 'cust-11',
    transactionDate: '2026-10-08',
    transactionType: 'Additional Deposit',
    amount: 20000,
    direction: 'Inflow',
    description: 'Additional Proof of Funds - Cash Deposit',
    notes: 'SBI counter voucher verified',
    referenceNo: 'SBI-CASH-77123',
    bankId: 'sbi',
    bankName: 'State Bank of India (SBI)',
    branchId: 'br_sbi_01',
    branchName: 'Hyderabad Main Branch (Demo)',
    accountNumberMasked: 'XXXX 4321',
    previousBalance: 60000,
    newBalance: 80000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-08T15:00:00.000Z',
    isDemo: true,
  },
  {
    id: 'TXN-DEMO-036',
    customerId: 'cust-11',
    transactionDate: '2026-10-29',
    transactionType: 'Additional Deposit',
    amount: 15000,
    direction: 'Inflow',
    description: 'Employer Performance Bonus Credit',
    notes: 'Verified via SBI direct salary deposit notification',
    referenceNo: 'SBIN-NEFT-99120',
    bankId: 'sbi',
    bankName: 'State Bank of India (SBI)',
    branchId: 'br_sbi_01',
    branchName: 'Hyderabad Main Branch (Demo)',
    accountNumberMasked: 'XXXX 4321',
    previousBalance: 80000,
    newBalance: 95000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-29T10:00:00.000Z',
    isDemo: true,
  },
];

/**
 * Pre-seeded Demonstration Financial Corrections
 */
export const DEMO_FINANCIAL_CORRECTIONS: FinancialCorrection[] = [
  {
    id: 'CORR-DEMO-001',
    customerId: 'cust-3',
    originalTransactionId: 'TXN-DEMO-002',
    originalAmount: 20000,
    previouslyAcceptedAmount: 20000,
    correctedAmount: 25000,
    adjustmentAmount: 5000,
    correctionReason: 'Actual NEFT counterfoil receipt showed ₹25,000 instead of ₹20,000',
    resultingTransactionId: 'TXN-DEMO-004',
    previousBalance: 85000,
    newBalance: 90000,
    createdBy: DEMO_ACTOR_NAME,
    createdAt: '2026-10-15T09:00:00.000Z',
    isDemo: true,
  },
];

/**
 * Pre-seeded Demonstration Financial Audit Entries
 */
export const DEMO_FINANCIAL_AUDIT: FinancialAuditEntry[] = [
  {
    id: 'AUD-DEMO-001',
    timestamp: '2026-10-01T10:00:00.000Z',
    customerId: 'cust-3',
    action: 'INITIAL_RECORD',
    recordId: 'TXN-DEMO-001',
    details: 'Initial financial record registered: ₹75,000',
    previousBalance: 0,
    adjustmentOrAmount: 75000,
    newBalance: 75000,
    actor: DEMO_ACTOR_NAME,
    role: DEMO_ACTOR_ROLE,
  },
  {
    id: 'AUD-DEMO-002',
    timestamp: '2026-10-08T11:30:00.000Z',
    customerId: 'cust-3',
    action: 'TRANSACTION_CREATED',
    recordId: 'TXN-DEMO-002',
    details: 'Additional Deposit recorded: ₹20,000',
    previousBalance: 75000,
    adjustmentOrAmount: 20000,
    newBalance: 95000,
    actor: DEMO_ACTOR_NAME,
    role: DEMO_ACTOR_ROLE,
  },
  {
    id: 'AUD-DEMO-003',
    timestamp: '2026-10-14T14:15:00.000Z',
    customerId: 'cust-3',
    action: 'TRANSACTION_CREATED',
    recordId: 'TXN-DEMO-003',
    details: 'Debit recorded: ₹10,000',
    previousBalance: 95000,
    adjustmentOrAmount: -10000,
    newBalance: 85000,
    actor: DEMO_ACTOR_NAME,
    role: DEMO_ACTOR_ROLE,
  },
  {
    id: 'AUD-DEMO-004',
    timestamp: '2026-10-15T09:00:00.000Z',
    customerId: 'cust-3',
    action: 'CORRECTION_APPLIED',
    recordId: 'CORR-DEMO-001',
    details: 'Option B Adjustment of ₹5,000 (+) applied to latest balance for transaction TXN-DEMO-002. Intended corrected amount: ₹25,000.',
    previousBalance: 85000,
    adjustmentOrAmount: 5000,
    newBalance: 90000,
    actor: DEMO_ACTOR_NAME,
    role: DEMO_ACTOR_ROLE,
    reason: 'Actual NEFT counterfoil receipt showed ₹25,000 instead of ₹20,000',
  },
];

/**
 * Operational In-Memory State for Active Session
 * Isolated from demo constants and never written to browser storage.
 */
let sessionFinancialTransactions: FinancialTransaction[] = [];
let sessionFinancialCorrections: FinancialCorrection[] = [];
let sessionFinancialAudit: FinancialAuditEntry[] = [];

/**
 * Internal customer metadata resolver
 */
interface ResolvedCustomerDetails {
  id: string;
  name: string;
  passportNumber: string;
  bankName: string;
  branchName: string;
  bankId: string;
  branchId: string;
  accountNumberMasked: string;
  initialAmount: number;
  initialTransactionDate: string;
  initialNotes: string;
  fdAmount: number;
}

async function resolveCustomerDetails(customerId: string): Promise<ResolvedCustomerDetails | null> {
  // Check Phase 2 session customers first
  const sessionCust = await customerService.getCustomerById(customerId);
  if (sessionCust) {
    return {
      id: sessionCust.id,
      name: sessionCust.personalInfo.fullName,
      passportNumber: sessionCust.personalInfo.passportNumber,
      bankName: sessionCust.bankInfo.bankName,
      branchName: sessionCust.bankInfo.branchName,
      bankId: sessionCust.bankInfo.bankId,
      branchId: sessionCust.bankInfo.branchId,
      accountNumberMasked: maskAccountNumber(sessionCust.bankInfo.accountNumber),
      initialAmount: sessionCust.initialFinancialRecord?.initialAmount || 0,
      initialTransactionDate: sessionCust.initialFinancialRecord?.transactionDate || sessionCust.createdAt.slice(0, 10),
      initialNotes: sessionCust.initialFinancialRecord?.notes || 'Initial record from customer registration',
      fdAmount: sessionCust.fdInfo?.initialFdAmount || 0,
    };
  }

  // Fallback to Visual Mock Customers (Sample Data mode)
  const mockCust = MOCK_CUSTOMERS.find((c) => c.id === customerId);
  if (mockCust) {
    // Check if an initial demo transaction exists for this customer
    const initDemoTxn = DEMO_FINANCIAL_TRANSACTIONS.find(
      (t) => t.customerId === customerId && t.transactionType === 'Credit' && t.previousBalance === 0
    );

    const resolveBankId = (name: string): string => {
      const norm = (name || '').toLowerCase();
      if (norm.includes('state bank') || norm.includes('(sbi)')) return 'sbi';
      if (norm.includes('bank of india') && !norm.includes('state bank')) return 'boi';
      if (norm.includes('baroda') || norm.includes('bob')) return 'bob';
      if (norm.includes('icici')) return 'icici';
      if (norm.includes('idbi')) return 'idbi';
      if (norm.includes('hdfc')) return 'hdfc';
      if (norm.includes('axis')) return 'axis';
      if (norm.includes('punjab') || norm.includes('pnb')) return 'pnb';
      if (norm.includes('canara')) return 'canara';
      if (norm.includes('maharashtra') || norm.includes('bom')) return 'bom';
      return norm.replace(/\s+/g, '-');
    };

    return {
      id: mockCust.id,
      name: mockCust.name,
      passportNumber: mockCust.passportNo,
      bankName: mockCust.linkedBank,
      branchName: mockCust.bankBranch,
      bankId: resolveBankId(mockCust.linkedBank),
      branchId: `${resolveBankId(mockCust.linkedBank)}-branch`,
      accountNumberMasked: maskAccountNumber(mockCust.accountNumber),
      initialAmount: initDemoTxn ? initDemoTxn.amount : (mockCust.previousAmount ?? 0),
      initialTransactionDate: initDemoTxn ? initDemoTxn.transactionDate : (mockCust.createdAt || ''),
      initialNotes: initDemoTxn?.notes || '',
      fdAmount: 0,
    };
  }

  return null;
}

export const financialService = {
  /**
   * Resets all in-memory operational financial session records.
   * Useful for test isolation and session resets.
   */
  resetSessionFinancialData(): void {
    sessionFinancialTransactions = [];
    sessionFinancialCorrections = [];
    sessionFinancialAudit = [];
  },

  /**
   * Seeds an initial financial transaction when a new customer is registered in Phase 2.
   */
  seedInitialCustomerFinancialRecord(customer: Customer): FinancialTransaction {
    const existing = sessionFinancialTransactions.find(
      (t) => t.customerId === customer.id && t.description.includes('Initial Financial Record')
    );
    if (existing) return existing;

    const initialAmount = customer.initialFinancialRecord?.initialAmount || 0;
    const initialDate = customer.initialFinancialRecord?.transactionDate || customer.createdAt.slice(0, 10);
    const initialNotes = customer.initialFinancialRecord?.notes || 'Initial customer registration deposit';

    const txnId = generateTransactionId('TXN-INIT');
    const newTxn: FinancialTransaction = {
      id: txnId,
      customerId: customer.id,
      transactionDate: initialDate,
      transactionType: 'Credit',
      amount: initialAmount,
      direction: 'Inflow',
      description: 'Initial Financial Record at Customer Registration',
      notes: initialNotes,
      bankId: customer.bankInfo.bankId,
      bankName: customer.bankInfo.bankName,
      branchId: customer.bankInfo.branchId,
      branchName: customer.bankInfo.branchName,
      accountNumberMasked: maskAccountNumber(customer.bankInfo.accountNumber),
      previousBalance: 0,
      newBalance: initialAmount,
      createdBy: DEMO_ACTOR_NAME,
      createdAt: customer.createdAt || new Date().toISOString(),
      isDemo: false,
    };

    sessionFinancialTransactions.push(newTxn);

    // Initial audit log entry
    sessionFinancialAudit.push({
      id: `AUD-${Date.now()}-INIT`,
      timestamp: customer.createdAt || new Date().toISOString(),
      customerId: customer.id,
      action: 'INITIAL_RECORD',
      recordId: txnId,
      details: `Initial financial record registered: ₹${initialAmount.toLocaleString('en-IN')}`,
      previousBalance: 0,
      adjustmentOrAmount: initialAmount,
      newBalance: initialAmount,
      actor: DEMO_ACTOR_NAME,
      role: DEMO_ACTOR_ROLE,
      reason: initialNotes,
    });

    return newTxn;
  },

  /**
   */
  async getCustomerTransactions(customerId: string): Promise<FinancialTransaction[]> {
    const list: FinancialTransaction[] = [];
    const seenIds = new Set<string>();

    // 1. Include baseline demo transactions for demo customers
    const demoTxns = DEMO_FINANCIAL_TRANSACTIONS.filter((t) => t.customerId === customerId);
    for (const dt of demoTxns) {
      list.push(dt);
      seenIds.add(dt.id);
    }

    // 2. Include any session transactions for this customer
    const sessionTxns = sessionFinancialTransactions.filter((t) => t.customerId === customerId);
    for (const st of sessionTxns) {
      if (!seenIds.has(st.id)) {
        list.push(st);
        seenIds.add(st.id);
      }
    }

    // 3. If customer exists in session customers and has 0 transactions so far, seed initial record
    if (list.length === 0) {
      const sessionCust = await customerService.getCustomerById(customerId);
      if (sessionCust) {
        const seeded = this.seedInitialCustomerFinancialRecord(sessionCust);
        list.push(seeded);
      }
    }

    return list.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },

  /**
   * Retrieves all transactions across the system (session + demo when in sample mode).
   */
  async getAllFinancialTransactions(includeDemo: boolean = true): Promise<FinancialTransaction[]> {
    const list: FinancialTransaction[] = [...sessionFinancialTransactions];
    if (includeDemo) {
      // Avoid duplicate IDs if any overlap
      const sessionIds = new Set(sessionFinancialTransactions.map((t) => t.id));
      for (const d of DEMO_FINANCIAL_TRANSACTIONS) {
        if (!sessionIds.has(d.id)) {
          list.push(d);
        }
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  /**
   * Retrieves a single transaction by ID.
   */
  async getTransactionById(transactionId: string): Promise<FinancialTransaction | null> {
    const sessionFound = sessionFinancialTransactions.find((t) => t.id === transactionId);
    if (sessionFound) return sessionFound;

    const demoFound = DEMO_FINANCIAL_TRANSACTIONS.find((t) => t.id === transactionId);
    return demoFound || null;
  },

  /**
   * Computes the current financial summary for a customer.
   * Enforces:
   * - Current Bank Balance = Initial Record + Credits + Deposits - Debits - Withdrawals + Adjustments
   * - Minimum Balance = ₹4,000 fixed
   * - Operational Balance = Math.max(0, Current Balance - 4,000)
   * - Combined Amount = Current Bank Balance + FD Component
   */
  async getCustomerFinancialSummary(customerId: string): Promise<CustomerFinancialSummary> {
    const customer = await resolveCustomerDetails(customerId);
    if (!customer) {
      throw new Error(`Customer with ID "${customerId}" was not found in the system.`);
    }

    const txns = await this.getCustomerTransactions(customerId);
    const corrections = await this.getCustomerCorrections(customerId);

    let totalCredits = 0;
    let totalDebits = 0;
    let totalCorrections = 0;
    let netAdjustmentAmount = 0;

    let runningBalance = 0;
    let lastDate: string | undefined;

    for (const txn of txns) {
      lastDate = txn.transactionDate;
      if (txn.transactionType === 'Correction Adjustment') {
        totalCorrections += 1;
        if (txn.direction === 'Inflow') {
          netAdjustmentAmount += txn.amount;
          runningBalance += txn.amount;
        } else {
          netAdjustmentAmount -= txn.amount;
          runningBalance -= txn.amount;
        }
      } else if (txn.direction === 'Inflow') {
        totalCredits += txn.amount;
        runningBalance += txn.amount;
      } else if (txn.direction === 'Outflow') {
        totalDebits += txn.amount;
        runningBalance -= txn.amount;
      }
    }

    const currentBankBalance = runningBalance;
    const minimumBalance = POLICY_MINIMUM_BANK_BALANCE;
    const operationalBankBalance = Math.max(0, currentBankBalance - minimumBalance);
    const fdAmount = customer.fdAmount;
    const combinedFinancialAmount = currentBankBalance + fdAmount;

    let status: FinancialHealthStatus = 'Healthy';
    if (currentBankBalance < minimumBalance) {
      status = 'Critical Minimum Warning';
    } else if (currentBankBalance < 10000) {
      status = 'Low Balance';
    }

    return {
      customerId: customer.id,
      customerName: customer.name,
      passportNumber: customer.passportNumber,
      accountNumberMasked: customer.accountNumberMasked,
      bankId: customer.bankId,
      bankName: customer.bankName,
      branchId: customer.branchId,
      branchName: customer.branchName,
      initialAmount: customer.initialAmount,
      initialTransactionDate: customer.initialTransactionDate,
      currentBankBalance,
      minimumBalance,
      operationalBankBalance,
      fdAmount,
      combinedFinancialAmount,
      totalCredits,
      totalDebits,
      totalCorrections,
      netAdjustmentAmount,
      lastTransactionDate: lastDate || customer.initialTransactionDate,
      transactionCount: txns.length,
      correctionCount: corrections.length,
      status,
    };
  },

  /**
   * Retrieves all corrections for a customer.
   */
  async getCustomerCorrections(customerId: string): Promise<FinancialCorrection[]> {
    const list: FinancialCorrection[] = [];
    const seenIds = new Set<string>();

    const demoCorrs = DEMO_FINANCIAL_CORRECTIONS.filter((c) => c.customerId === customerId);
    for (const dc of demoCorrs) {
      list.push(dc);
      seenIds.add(dc.id);
    }

    const sessionCorrs = sessionFinancialCorrections.filter((c) => c.customerId === customerId);
    for (const sc of sessionCorrs) {
      if (!seenIds.has(sc.id)) {
        list.push(sc);
        seenIds.add(sc.id);
      }
    }

    return list.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  },

  /**
   * Creates a new financial transaction for a customer with strict balance checks.
   */
  async createTransaction(
    req: CreateTransactionRequest
  ): Promise<{ transaction: FinancialTransaction; summary: CustomerFinancialSummary }> {
    // 1. Validate inputs
    if (!req.customerId) {
      throw new Error('Customer ID is required.');
    }
    if (typeof req.amount !== 'number' || isNaN(req.amount) || req.amount <= 0) {
      throw new Error('Transaction amount must be a positive number greater than zero.');
    }
    if (!req.description || !req.description.trim()) {
      throw new Error('Transaction description is mandatory.');
    }
    if (!req.transactionDate) {
      throw new Error('Transaction date is mandatory.');
    }

    const customer = await resolveCustomerDetails(req.customerId);
    if (!customer) {
      throw new Error(`Customer "${req.customerId}" not found.`);
    }

    // Ensure session transactions are initialized for this customer
    await this.getCustomerTransactions(req.customerId);

    // 2. Determine direction
    const outflowTypes = ['Debit', 'Withdrawal'];
    const direction: TransactionDirection = outflowTypes.includes(req.transactionType)
      ? 'Outflow'
      : 'Inflow';

    // 3. Compute current balance and check solvency
    const summaryBefore = await this.getCustomerFinancialSummary(req.customerId);
    const previousBalance = summaryBefore.currentBankBalance;
    const newBalance =
      direction === 'Inflow' ? previousBalance + req.amount : previousBalance - req.amount;

    if (newBalance < 0) {
      throw new Error(
        `Transaction rejected: Resulting bank balance (₹${newBalance.toLocaleString('en-IN')}) cannot be negative. Current balance is ₹${previousBalance.toLocaleString('en-IN')}.`
      );
    }

    const now = new Date().toISOString();
    const txnId = generateTransactionId('TXN');

    const newTxn: FinancialTransaction = {
      id: txnId,
      customerId: req.customerId,
      transactionDate: req.transactionDate,
      transactionType: req.transactionType,
      amount: req.amount,
      direction,
      description: req.description.trim(),
      notes: req.notes?.trim(),
      referenceNo: req.referenceNo?.trim(),
      bankId: customer.bankId,
      bankName: customer.bankName,
      branchId: customer.branchId,
      branchName: customer.branchName,
      accountNumberMasked: customer.accountNumberMasked,
      previousBalance,
      newBalance,
      createdBy: DEMO_ACTOR_NAME,
      createdAt: now,
      isDemo: false,
    };

    // Commit to session
    sessionFinancialTransactions.push(newTxn);

    // Audit log
    sessionFinancialAudit.push({
      id: `AUD-${Date.now()}-TXN`,
      timestamp: now,
      customerId: req.customerId,
      action: 'TRANSACTION_CREATED',
      recordId: txnId,
      details: `${req.transactionType} of ₹${req.amount.toLocaleString('en-IN')} recorded: ${req.description}`,
      previousBalance,
      adjustmentOrAmount: direction === 'Inflow' ? req.amount : -req.amount,
      newBalance,
      actor: DEMO_ACTOR_NAME,
      role: DEMO_ACTOR_ROLE,
      reason: req.notes,
    });

    const summaryAfter = await this.getCustomerFinancialSummary(req.customerId);

    return {
      transaction: newTxn,
      summary: summaryAfter,
    };
  },

  /**
   * Implements OPTION B: Current Balance Adjustment
   *
   * Business Rules:
   * 1. Original transaction record is NEVER modified or deleted.
   * 2. Correction references the original transaction ID.
   * 3. Calculates adjustment against the previously accepted amount:
   *    - Inflow: Adjustment = Corrected Amount - Previously Accepted Amount
   *    - Outflow: Adjustment = Previously Accepted Amount - Corrected Amount
   * 4. Zero adjustment is rejected.
   * 5. Negative resulting current balance is rejected.
   * 6. Mandatory correction reason must be provided.
   * 7. Adjustment is applied strictly to the latest current balance.
   * 8. Prior transactions and balances remain untouched.
   */
  async createCorrection(
    req: CreateCorrectionRequest
  ): Promise<{
    correction: FinancialCorrection;
    transaction: FinancialTransaction;
    summary: CustomerFinancialSummary;
  }> {
    // 1. Input validations
    if (!req.customerId) {
      throw new Error('Customer ID is required.');
    }
    if (!req.originalTransactionId) {
      throw new Error('Original transaction ID is required.');
    }
    if (typeof req.correctedAmount !== 'number' || isNaN(req.correctedAmount) || req.correctedAmount < 0) {
      throw new Error('Corrected intended amount must be a non-negative number.');
    }
    if (!req.correctionReason || !req.correctionReason.trim()) {
      throw new Error('Mandatory correction reason must be provided.');
    }

    // 2. Fetch original transaction
    const originalTxn = await this.getTransactionById(req.originalTransactionId);
    if (!originalTxn) {
      throw new Error(`Original transaction "${req.originalTransactionId}" does not exist.`);
    }

    if (originalTxn.customerId !== req.customerId) {
      throw new Error('Transaction does not belong to the specified customer.');
    }

    if (originalTxn.transactionType === 'Correction Adjustment') {
      throw new Error(
        'Cannot directly correct a Correction Adjustment transaction. Submit a correction referencing the original transaction instead.'
      );
    }

    // Ensure session transactions are loaded/initialized
    await this.getCustomerTransactions(req.customerId);

    // 3. Find any existing corrections on this original transaction to determine the chain
    const allCustomerCorrections = await this.getCustomerCorrections(req.customerId);
    const existingCorrectionsForTxn = allCustomerCorrections.filter(
      (c) => c.originalTransactionId === req.originalTransactionId
    );

    let previouslyAcceptedAmount = originalTxn.amount;
    let precedingCorrectionId: string | undefined;

    if (existingCorrectionsForTxn.length > 0) {
      // Sort by creation time to get the latest correction
      const sorted = [...existingCorrectionsForTxn].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      const latestCorrection = sorted[sorted.length - 1];
      previouslyAcceptedAmount = latestCorrection.correctedAmount;
      precedingCorrectionId = latestCorrection.id;
    }

    // 4. Calculate Net Balance Adjustment based on original direction
    // Inflow: Positive difference adds to balance, negative deducts.
    // Outflow: If corrected debit is smaller, balance increases (+); if larger, balance decreases (-).
    let adjustmentAmount = 0;
    if (originalTxn.direction === 'Inflow') {
      adjustmentAmount = req.correctedAmount - previouslyAcceptedAmount;
    } else {
      adjustmentAmount = previouslyAcceptedAmount - req.correctedAmount;
    }

    // 5. Zero-adjustment rejection
    if (adjustmentAmount === 0) {
      throw new Error(
        `Correction rejected: The corrected amount (₹${req.correctedAmount.toLocaleString(
          'en-IN'
        )}) is identical to the previously accepted amount. No balance adjustment would occur.`
      );
    }

    // 6. Solvency check on latest current balance
    const summaryBefore = await this.getCustomerFinancialSummary(req.customerId);
    const currentBalance = summaryBefore.currentBankBalance;
    const newBalance = currentBalance + adjustmentAmount;

    if (newBalance < 0) {
      throw new Error(
        `Correction rejected: Resulting bank balance (₹${newBalance.toLocaleString(
          'en-IN'
        )}) would be negative. Current balance is ₹${currentBalance.toLocaleString('en-IN')}.`
      );
    }

    const now = new Date().toISOString();
    const corrId = generateCorrectionId();
    const txnId = generateTransactionId('TXN-CORR');

    // 7. Create FinancialCorrection record
    const correction: FinancialCorrection = {
      id: corrId,
      customerId: req.customerId,
      originalTransactionId: req.originalTransactionId,
      precedingCorrectionId,
      originalAmount: originalTxn.amount,
      previouslyAcceptedAmount,
      correctedAmount: req.correctedAmount,
      adjustmentAmount,
      correctionReason: req.correctionReason.trim(),
      resultingTransactionId: txnId,
      previousBalance: currentBalance,
      newBalance,
      createdBy: DEMO_ACTOR_NAME,
      createdAt: now,
      isDemo: false,
    };

    // 8. Create FinancialTransaction of type 'Correction Adjustment'
    const adjTxn: FinancialTransaction = {
      id: txnId,
      customerId: req.customerId,
      transactionDate: now.slice(0, 10),
      transactionType: 'Correction Adjustment',
      amount: Math.abs(adjustmentAmount),
      direction: adjustmentAmount > 0 ? 'Inflow' : 'Outflow',
      description: `Current Balance Adjustment for ${originalTxn.id} (Correction)`,
      notes: `Correction for ${originalTxn.id}: ${req.correctionReason.trim()} [Prev: ₹${previouslyAcceptedAmount.toLocaleString(
        'en-IN'
      )} -> Corrected: ₹${req.correctedAmount.toLocaleString('en-IN')}]`,
      bankId: originalTxn.bankId,
      bankName: originalTxn.bankName,
      branchId: originalTxn.branchId,
      branchName: originalTxn.branchName,
      accountNumberMasked: originalTxn.accountNumberMasked,
      previousBalance: currentBalance,
      newBalance,
      isCorrection: true,
      correctionId: corrId,
      originalTransactionId: originalTxn.id,
      precedingCorrectionId,
      createdBy: DEMO_ACTOR_NAME,
      createdAt: now,
      isDemo: false,
    };

    // Commit to session
    sessionFinancialCorrections.push(correction);
    sessionFinancialTransactions.push(adjTxn);

    // 9. Audit trail entry
    sessionFinancialAudit.push({
      id: `AUD-${Date.now()}-CORR`,
      timestamp: now,
      customerId: req.customerId,
      action: 'CORRECTION_APPLIED',
      recordId: corrId,
      details: `Option B Adjustment of ₹${Math.abs(adjustmentAmount).toLocaleString('en-IN')} (${
        adjustmentAmount >= 0 ? '+' : '-'
      }) applied to latest balance for transaction ${originalTxn.id}. Intended corrected amount: ₹${req.correctedAmount.toLocaleString(
        'en-IN'
      )}.`,
      previousBalance: currentBalance,
      adjustmentOrAmount: adjustmentAmount,
      newBalance,
      actor: DEMO_ACTOR_NAME,
      role: DEMO_ACTOR_ROLE,
      reason: req.correctionReason.trim(),
    });

    const summaryAfter = await this.getCustomerFinancialSummary(req.customerId);

    return {
      correction,
      transaction: adjTxn,
      summary: summaryAfter,
    };
  },

  /**
   * Retrieves complete transaction history and audit trail for a customer.
   */
  async getCustomerTransactionHistory(
    customerId: string
  ): Promise<{
    transactions: FinancialTransaction[];
    corrections: FinancialCorrection[];
    auditEntries: FinancialAuditEntry[];
  }> {
    const transactions = await this.getCustomerTransactions(customerId);
    const corrections = await this.getCustomerCorrections(customerId);
    const auditEntries = await this.getFinancialAuditEntries(customerId);

    return {
      transactions,
      corrections,
      auditEntries,
    };
  },

  /**
   * Retrieves audit log entries (optionally filtered by customer).
   */
  async getFinancialAuditEntries(customerId?: string): Promise<FinancialAuditEntry[]> {
    const list: FinancialAuditEntry[] = [...sessionFinancialAudit];

    // Combine with demo audit if not in session
    const sessionIds = new Set(sessionFinancialAudit.map((a) => a.id));
    for (const d of DEMO_FINANCIAL_AUDIT) {
      if (!sessionIds.has(d.id)) {
        list.push(d);
      }
    }

    let filtered = list;
    if (customerId) {
      filtered = filtered.filter((a) => a.customerId === customerId);
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
};
