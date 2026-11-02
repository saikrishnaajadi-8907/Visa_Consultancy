import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  History,
  Download,
  ShieldCheck,
  Clock,
  AlertCircle,
  FileText,
  Search,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  CornerDownRight,
  Eye,
  X,
  Building2,
  User,
  Wallet,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SearchInput } from '../components/forms/SearchInput';
import { SelectInput } from '../components/forms/SelectInput';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { TextInput } from '../components/forms/TextInput';
import { useAppState } from '../context/AppStateContext';
import {
  financialService,
  DEMO_ACTOR_NAME,
  DEMO_ACTOR_ROLE,
} from '../services/financialService';
import { customerService, DEMO_CUSTOMER_IDS } from '../services/customerService';
import { MOCK_CUSTOMERS } from '../constants/mockData';
import {
  FinancialTransaction,
  FinancialCorrection,
  CustomerFinancialSummary,
  FinancialAuditEntry,
  FinancialTransactionType,
  TransactionDirection,
} from '../types/financial';
import { Customer } from '../types/customer';
import { formatINR, formatDate, maskAccountNumber } from '../utils/formatters';

interface CustomerOption {
  id: string;
  name: string;
  passport: string;
  bankName: string;
  branchName: string;
  accountNumberMasked: string;
  isDemo?: boolean;
}

const BANK_FILTER_MAP: Record<string, { id: string; label: string; matchCodes: string[] }> = {
  sbi: { id: 'sbi', label: 'State Bank of India (SBI)', matchCodes: ['sbi', 'sbin', 'state bank'] },
  hdfc: { id: 'hdfc', label: 'HDFC Bank', matchCodes: ['hdfc'] },
  icici: { id: 'icici', label: 'ICICI Bank', matchCodes: ['icici', 'icic'] },
  idbi: { id: 'idbi', label: 'IDBI Bank', matchCodes: ['idbi', 'ibkl'] },
  bob: { id: 'bob', label: 'Bank of Baroda', matchCodes: ['bob', 'barb', 'baroda'] },
  boi: { id: 'boi', label: 'Bank of India', matchCodes: ['boi', 'bkid', 'bank of india'] },
  bom: { id: 'bom', label: 'Bank of Maharashtra', matchCodes: ['bom', 'mahb', 'maharashtra'] },
  canara: { id: 'canara', label: 'Canara Bank', matchCodes: ['canara', 'cnrb'] },
  pnb: { id: 'pnb', label: 'Punjab National Bank (PNB)', matchCodes: ['pnb', 'punb', 'punjab'] },
  axis: { id: 'axis', label: 'Axis Bank', matchCodes: ['axis', 'utib'] },
};

const ALL_BANK_OPTIONS = [
  { value: 'All Banks', label: 'All Partner Banks' },
  { value: 'sbi', label: 'State Bank of India (SBI)' },
  { value: 'hdfc', label: 'HDFC Bank' },
  { value: 'icici', label: 'ICICI Bank' },
  { value: 'idbi', label: 'IDBI Bank' },
  { value: 'bob', label: 'Bank of Baroda' },
  { value: 'boi', label: 'Bank of India' },
  { value: 'bom', label: 'Bank of Maharashtra' },
  { value: 'canara', label: 'Canara Bank' },
  { value: 'pnb', label: 'Punjab National Bank (PNB)' },
  { value: 'axis', label: 'Axis Bank' },
];

export const FinancialRecordsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isEmptyStateMode, setIsEmptyStateMode } = useAppState();
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial bank filter from query parameters if provided
  const queryBankParam = searchParams.get('bankId') || searchParams.get('bank');
  const initialBank = queryBankParam ? queryBankParam.toLowerCase().trim() : 'All Banks';

  // Primary Data State
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [allSummaries, setAllSummaries] = useState<Record<string, CustomerFinancialSummary>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('All');
  const [selectedBank, setSelectedBank] = useState<string>(initialBank);
  const [selectedType, setSelectedType] = useState<string>('All Types');
  const [selectedDirection, setSelectedDirection] = useState<string>('All Directions');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('All Dates');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedTxnForDetails, setSelectedTxnForDetails] = useState<FinancialTransaction | null>(null);
  const [selectedTxnForCorrection, setSelectedTxnForCorrection] = useState<FinancialTransaction | null>(null);
  const [historyCustomerId, setHistoryCustomerId] = useState<string | null>(null);
  const [customerHistoryData, setCustomerHistoryData] = useState<{
    transactions: FinancialTransaction[];
    corrections: FinancialCorrection[];
    auditEntries: FinancialAuditEntry[];
  } | null>(null);

  // Add Transaction Form State
  const [newTxnCustomerId, setNewTxnCustomerId] = useState<string>('');
  const [newTxnDate, setNewTxnDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [newTxnType, setNewTxnType] = useState<Exclude<FinancialTransactionType, 'Correction Adjustment'>>('Additional Deposit');
  const [newTxnAmount, setNewTxnAmount] = useState<string>('');
  const [newTxnDescription, setNewTxnDescription] = useState<string>('');
  const [newTxnNotes, setNewTxnNotes] = useState<string>('');
  const [newTxnRef, setNewTxnRef] = useState<string>('');
  const [addFormError, setAddFormError] = useState<string | null>(null);

  // Correction Form State (Option B)
  const [corrIntendedAmount, setCorrIntendedAmount] = useState<string>('');
  const [corrReason, setCorrReason] = useState<string>('');
  const [corrFormError, setCorrFormError] = useState<string | null>(null);
  const [corrChainInfo, setCorrChainInfo] = useState<{
    previouslyAcceptedAmount: number;
    precedingCorrectionId?: string;
  } | null>(null);

  // Load all data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Resolve eligible customers
      const sessionCusts: Customer[] = await customerService.getCustomers({ isSampleMode: !isEmptyStateMode });
      const options: CustomerOption[] = [];
      const seenIds = new Set<string>();

      // Session and demo customers
      for (const sc of sessionCusts) {
        options.push({
          id: sc.id,
          name: sc.personalInfo.fullName,
          passport: sc.personalInfo.passportNumber,
          bankName: sc.bankInfo.bankName,
          branchName: sc.bankInfo.branchName,
          accountNumberMasked: maskAccountNumber(sc.bankInfo.accountNumber),
          isDemo: DEMO_CUSTOMER_IDS.has(sc.id),
        });
        seenIds.add(sc.id);
      }

      // In Sample Data mode, add visual mock customers
      if (!isEmptyStateMode) {
        for (const mc of MOCK_CUSTOMERS) {
          if (!seenIds.has(mc.id)) {
            options.push({
              id: mc.id,
              name: mc.name,
              passport: mc.passportNo,
              bankName: mc.linkedBank,
              branchName: mc.bankBranch,
              accountNumberMasked: maskAccountNumber(mc.accountNumber),
              isDemo: true,
            });
            seenIds.add(mc.id);
          }
        }
      }

      setCustomerOptions(options);

      // 2. Fetch transactions (respecting empty state mode)
      const allTxns = await financialService.getAllFinancialTransactions(!isEmptyStateMode);
      
      // In Empty State mode: only show session transactions (not demo)
      let visibleTxns = allTxns;
      if (isEmptyStateMode) {
        visibleTxns = allTxns.filter((t) => !t.isDemo);
      }
      setTransactions(visibleTxns);

      // 3. Pre-fetch financial summaries for all active customer options
      const summariesMap: Record<string, CustomerFinancialSummary> = {};
      for (const opt of options) {
        try {
          const sum = await financialService.getCustomerFinancialSummary(opt.id);
          summariesMap[opt.id] = sum;
        } catch (e) {
          // Customer might not have transactions yet
        }
      }
      setAllSummaries(summariesMap);
    } catch (err: any) {
      console.error('Failed to load financial records:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isEmptyStateMode]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived Overview KPI Calculations
  const overviewMetrics = useMemo(() => {
    // If a specific customer is filtered, show their exact summary
    if (selectedCustomerId !== 'All' && allSummaries[selectedCustomerId]) {
      const s = allSummaries[selectedCustomerId];
      return {
        combinedAmount: s.combinedFinancialAmount,
        bankBalance: s.currentBankBalance,
        fdAmount: s.fdAmount,
        health: s.status,
        customerLabel: s.customerName,
        accountCount: 1,
      };
    }

    // Otherwise aggregate across available customers (filtered by bank if selected)
    let summariesList = Object.values(allSummaries);
    let customerLabel = `All Accounts (${summariesList.length})`;

    if (selectedBank !== 'All Banks') {
      const bKey = selectedBank.toLowerCase().trim();
      const mapped = BANK_FILTER_MAP[bKey];
      const matchCodes = mapped ? mapped.matchCodes : [bKey];

      summariesList = summariesList.filter((s) => {
        const bId = (s.bankId || '').toLowerCase().trim();
        const bName = (s.bankName || '').toLowerCase().trim();
        return matchCodes.some(
          (code) => bId === code || bId.includes(code) || bName.includes(code)
        );
      });
      customerLabel = `${selectedBank} (${summariesList.length} Account${summariesList.length === 1 ? '' : 's'})`;
    }

    if (summariesList.length === 0) {
      return {
        combinedAmount: 0,
        bankBalance: 0,
        fdAmount: 0,
        health: 'Healthy' as const,
        customerLabel: selectedBank !== 'All Banks' ? selectedBank : 'All Accounts',
        accountCount: 0,
      };
    }

    const totalCombined = summariesList.reduce((acc, s) => acc + s.combinedFinancialAmount, 0);
    const totalBankBalance = summariesList.reduce((acc, s) => acc + s.currentBankBalance, 0);
    const totalFd = summariesList.reduce((acc, s) => acc + s.fdAmount, 0);

    // Aggregate health status: worst health wins
    let health: 'Healthy' | 'Low Balance' | 'Critical Minimum Warning' = 'Healthy';
    if (summariesList.some((s) => s.status === 'Critical Minimum Warning')) {
      health = 'Critical Minimum Warning';
    } else if (summariesList.some((s) => s.status === 'Low Balance')) {
      health = 'Low Balance';
    }

    return {
      combinedAmount: totalCombined,
      bankBalance: totalBankBalance,
      fdAmount: totalFd,
      health,
      customerLabel,
      accountCount: summariesList.length,
    };
  }, [selectedCustomerId, selectedBank, allSummaries]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];

    // Customer filter
    if (selectedCustomerId !== 'All') {
      list = list.filter((t) => t.customerId === selectedCustomerId);
    }

    // Bank filter
    if (selectedBank !== 'All Banks') {
      const bKey = selectedBank.toLowerCase().trim();
      const mapped = BANK_FILTER_MAP[bKey];
      const matchCodes = mapped ? mapped.matchCodes : [bKey];

      list = list.filter((t) => {
        const tBankId = (t.bankId || '').toLowerCase().trim();
        const tBankName = (t.bankName || '').toLowerCase().trim();
        return matchCodes.some(
          (code) => tBankId === code || tBankId.includes(code) || tBankName.includes(code)
        );
      });
    }

    // Type filter
    if (selectedType !== 'All Types') {
      list = list.filter((t) => t.transactionType === selectedType);
    }

    // Direction filter
    if (selectedDirection !== 'All Directions') {
      const matchDir = selectedDirection.startsWith('Inflow') ? 'Inflow' : 'Outflow';
      list = list.filter((t) => t.direction === matchDir);
    }

    // Date range filter
    if (selectedDateRange !== 'All Dates') {
      const today = new Date().toISOString().slice(0, 10);
      if (selectedDateRange === 'Today') {
        list = list.filter((t) => t.transactionDate === today);
      } else if (selectedDateRange === 'October 2026') {
        list = list.filter((t) => t.transactionDate.startsWith('2026-10'));
      } else if (selectedDateRange === 'Last 7 Days') {
        const d7 = new Date();
        d7.setDate(d7.getDate() - 7);
        const d7Str = d7.toISOString().slice(0, 10);
        list = list.filter((t) => t.transactionDate >= d7Str);
      }
    }

    // Search query
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => {
        const custName = customerOptions.find((c) => c.id === t.customerId)?.name || '';
        return (
          t.id.toLowerCase().includes(q) ||
          custName.toLowerCase().includes(q) ||
          t.customerId.toLowerCase().includes(q) ||
          (t.bankName && t.bankName.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q)) ||
          (t.referenceNo && t.referenceNo.toLowerCase().includes(q))
        );
      });
    }

    // Sort
    list.sort((a, b) => {
      const diff = new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
      return sortOrder === 'desc' ? diff : -diff;
    });

    return list;
  }, [
    transactions,
    selectedCustomerId,
    selectedBank,
    selectedType,
    selectedDirection,
    selectedDateRange,
    search,
    sortOrder,
    customerOptions,
  ]);

  // Handle Bank Filter change and update URL params
  const handleBankChange = (newBank: string) => {
    setSelectedBank(newBank);
    const next = new URLSearchParams(searchParams);
    if (!newBank || newBank === 'All Banks') {
      next.delete('bankId');
      next.delete('bank');
    } else {
      next.set('bankId', newBank);
    }
    setSearchParams(next);
  };

  // Handle Opening Add Modal
  const handleOpenAddModal = (presetCustomerId?: string) => {
    setAddFormError(null);
    const targetCustId = presetCustomerId || selectedCustomerId !== 'All' ? (presetCustomerId || selectedCustomerId) : (customerOptions[0]?.id || '');
    setNewTxnCustomerId(targetCustId);
    setNewTxnDate(new Date().toISOString().slice(0, 10));
    setNewTxnType('Additional Deposit');
    setNewTxnAmount('');
    setNewTxnDescription('');
    setNewTxnNotes('');
    setNewTxnRef('');
    setIsAddModalOpen(true);
  };

  // Sync with searchParams (e.g. from Dashboard or Customer Profile deep link)
  useEffect(() => {
    const qBank = searchParams.get('bankId') || searchParams.get('bank');
    if (qBank) {
      const key = qBank.toLowerCase().trim();
      if (BANK_FILTER_MAP[key]) {
        setSelectedBank(key);
      } else {
        const found = Object.entries(BANK_FILTER_MAP).find(
          ([k, v]) => k === key || v.matchCodes.some((mc) => key.includes(mc))
        );
        setSelectedBank(found ? found[0] : qBank);
      }
    } else {
      setSelectedBank('All Banks');
    }

    const qCustId = searchParams.get('customerId');
    const qAction = searchParams.get('action');
    if (qCustId) {
      setSelectedCustomerId(qCustId);
      if (qAction === 'add') {
        handleOpenAddModal(qCustId);
      }
    }
  }, [searchParams]);
  // Live calculation for projected balance in Add Modal
  const addModalProjectedBalance = useMemo(() => {
    if (!newTxnCustomerId || !allSummaries[newTxnCustomerId]) return null;
    const currentBalance = allSummaries[newTxnCustomerId].currentBankBalance;
    const numAmount = parseFloat(newTxnAmount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { currentBalance, projectedBalance: currentBalance, isNegative: false };
    }
    const isOutflow = ['Debit', 'Withdrawal'].includes(newTxnType);
    const projected = isOutflow ? currentBalance - numAmount : currentBalance + numAmount;
    return {
      currentBalance,
      projectedBalance: projected,
      isNegative: projected < 0,
    };
  }, [newTxnCustomerId, newTxnAmount, newTxnType, allSummaries]);

  // Handle Add Transaction Submit
  const handleAddTransactionSubmit = async () => {
    setAddFormError(null);
    try {
      if (!newTxnCustomerId) {
        setAddFormError('Please select a customer.');
        return;
      }
      const numAmount = parseFloat(newTxnAmount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setAddFormError('Transaction amount must be a positive number greater than zero.');
        return;
      }
      if (!newTxnDescription.trim()) {
        setAddFormError('Transaction description is mandatory.');
        return;
      }
      if (!newTxnNotes.trim()) {
        setAddFormError('Mandatory transaction notes must be provided.');
        return;
      }

      await financialService.createTransaction({
        customerId: newTxnCustomerId,
        transactionDate: newTxnDate,
        transactionType: newTxnType,
        amount: numAmount,
        description: newTxnDescription.trim(),
        notes: newTxnNotes.trim(),
        referenceNo: newTxnRef.trim() || undefined,
      });

      setIsAddModalOpen(false);
      await loadData();
      setFeedbackNotice({
        type: 'success',
        message: `Successfully logged ${newTxnType} of ${formatINR(numAmount)} for ${
          customerOptions.find((c) => c.id === newTxnCustomerId)?.name
        }. Current balance updated.`,
      });
    } catch (err: any) {
      setAddFormError(err.message || 'Failed to record transaction.');
    }
  };

  // Handle Opening Option B Correction Modal
  const handleOpenCorrectionModal = async (txn: FinancialTransaction) => {
    setCorrFormError(null);
    setSelectedTxnForCorrection(txn);
    setCorrReason('');

    // Fetch existing corrections to determine previously accepted amount and preceding ID
    try {
      const allCorrections = await financialService.getCustomerCorrections(txn.customerId);
      const existingForTxn = allCorrections.filter((c) => c.originalTransactionId === txn.id);
      if (existingForTxn.length > 0) {
        const sorted = [...existingForTxn].sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
        const latest = sorted[sorted.length - 1];
        setCorrChainInfo({
          previouslyAcceptedAmount: latest.correctedAmount,
          precedingCorrectionId: latest.id,
        });
        setCorrIntendedAmount(String(latest.correctedAmount));
      } else {
        setCorrChainInfo({
          previouslyAcceptedAmount: txn.amount,
        });
        setCorrIntendedAmount(String(txn.amount));
      }
    } catch (e) {
      setCorrChainInfo({
        previouslyAcceptedAmount: txn.amount,
      });
      setCorrIntendedAmount(String(txn.amount));
    }
  };

  // Live calculation for Option B Correction
  const corrLiveCalculation = useMemo(() => {
    if (!selectedTxnForCorrection || !corrChainInfo) return null;
    const currentSummary = allSummaries[selectedTxnForCorrection.customerId];
    const currentBalance = currentSummary ? currentSummary.currentBankBalance : 0;
    const numIntended = parseFloat(corrIntendedAmount);

    if (isNaN(numIntended) || numIntended < 0) {
      return {
        isValidNumber: false,
        adjustmentAmount: 0,
        projectedBalance: currentBalance,
        isZeroAdjustment: false,
        isNegativeResult: false,
        currentBalance,
        prevAccepted: corrChainInfo.previouslyAcceptedAmount,
      };
    }

    const prevAccepted = corrChainInfo.previouslyAcceptedAmount;
    let adjustment = 0;
    if (selectedTxnForCorrection.direction === 'Inflow') {
      adjustment = numIntended - prevAccepted;
    } else {
      adjustment = prevAccepted - numIntended;
    }

    const projected = currentBalance + adjustment;
    const isZeroAdjustment = adjustment === 0;
    const isNegativeResult = projected < 0;

    return {
      isValidNumber: true,
      adjustmentAmount: adjustment,
      projectedBalance: projected,
      isZeroAdjustment,
      isNegativeResult,
      currentBalance,
      prevAccepted,
    };
  }, [selectedTxnForCorrection, corrChainInfo, corrIntendedAmount, allSummaries]);

  // Handle Option B Correction Submit
  const handleCorrectionSubmit = async () => {
    if (!selectedTxnForCorrection || !corrChainInfo) return;
    setCorrFormError(null);
    try {
      const numIntended = parseFloat(corrIntendedAmount);
      if (isNaN(numIntended) || numIntended < 0) {
        setCorrFormError('Corrected intended amount must be a non-negative number.');
        return;
      }
      if (!corrReason.trim()) {
        setCorrFormError('Mandatory correction reason must be provided.');
        return;
      }

      await financialService.createCorrection({
        customerId: selectedTxnForCorrection.customerId,
        originalTransactionId: selectedTxnForCorrection.id,
        correctedAmount: numIntended,
        correctionReason: corrReason.trim(),
      });

      setSelectedTxnForCorrection(null);
      await loadData();
      setFeedbackNotice({
        type: 'success',
        message: `Option B correction applied to latest balance for ${selectedTxnForCorrection.id}. Prior transactions preserved intact.`,
      });
    } catch (err: any) {
      setCorrFormError(err.message || 'Failed to submit correction.');
    }
  };

  // Handle Opening Customer History Modal
  const handleOpenHistoryModal = async (customerId: string) => {
    setHistoryCustomerId(customerId);
    try {
      const history = await financialService.getCustomerTransactionHistory(customerId);
      setCustomerHistoryData(history);
    } catch (e) {
      console.error('Failed to load customer history:', e);
    }
  };

  // Export Ledger to CSV
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    const headers = [
      'Transaction ID',
      'Customer ID',
      'Customer Name',
      'Linked Bank',
      'Branch',
      'Masked Account',
      'Transaction Date',
      'Transaction Type',
      'Direction',
      'Amount (INR)',
      'Previous Balance (INR)',
      'New Balance (INR)',
      'Description',
      'Notes',
      'Reference No',
      'Is Correction',
      'Original Txn ID',
      'Recorded By',
    ];

    const rows = filteredTransactions.map((t) => {
      const cust = customerOptions.find((c) => c.id === t.customerId);
      return [
        t.id,
        t.customerId,
        `"${cust?.name || t.customerId}"`,
        `"${t.bankName || ''}"`,
        `"${t.branchName || ''}"`,
        `"${t.accountNumberMasked || ''}"`,
        t.transactionDate,
        t.transactionType,
        t.direction,
        t.amount,
        t.previousBalance,
        t.newBalance,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${(t.notes || '').replace(/"/g, '""')}"`,
        `"${(t.referenceNo || '').replace(/"/g, '""')}"`,
        t.isCorrection ? 'YES' : 'NO',
        t.originalTransactionId || '',
        `"${t.createdBy || DEMO_ACTOR_NAME}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vcms_financial_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Financial Records & Proof-of-Funds Ledger"
        subtitle="Track client proof-of-funds balances, deposits and withdrawals."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<History className="w-4 h-4" />}
              onClick={() => {
                if (selectedCustomerId !== 'All') {
                  handleOpenHistoryModal(selectedCustomerId);
                } else if (customerOptions[0]) {
                  handleOpenHistoryModal(customerOptions[0].id);
                }
              }}
            >
              Account History
            </Button>
            <Button
              variant="secondary"
              icon={<Download className="w-4 h-4" />}
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => handleOpenAddModal()}
            >
              Log Financial Entry
            </Button>
          </div>
        }
      />

      {/* Identity Awareness Banner */}
      {!isEmptyStateMode && (
        <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-blue-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            <span className="text-slate-700">
              Displaying verified proof-of-funds records. Actions execute in-memory as{' '}
              <strong className="text-slate-900 font-semibold">{DEMO_ACTOR_NAME}</strong> ({DEMO_ACTOR_ROLE}).
            </span>
          </div>
        </div>
      )}

      {/* Action Notice Toast */}
      {feedbackNotice && (
        <div
          className={`px-4 py-3 rounded-xl border flex items-center justify-between text-xs shadow-sm ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedbackNotice.message}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Section 2: Financial Records Overview Section (4 Cards) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
          <span className="font-medium text-slate-700 flex items-center gap-1.5">
            <Wallet className="w-3.5 h-3.5 text-blue-600" />
            Portfolio Financial Position —{' '}
            <span className="text-blue-600 font-semibold">{overviewMetrics.customerLabel}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Combined Financial Amount */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Combined Amount
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {formatINR(overviewMetrics.combinedAmount)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Bank Balance + Fixed Deposits
              </div>
            </div>
          </div>

          {/* 2. Current Bank Balance */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Bank Balance
              </span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {formatINR(overviewMetrics.bankBalance)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Liquid proof-of-funds balance
              </div>
            </div>
          </div>

          {/* 3. Fixed Deposit Amount */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Fixed Deposit (FD)
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {formatINR(overviewMetrics.fdAmount)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Term deposit proof component
              </div>
            </div>
          </div>

          {/* 4. Account Health */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Account Health
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  overviewMetrics.health === 'Healthy'
                    ? 'bg-emerald-50 text-emerald-600'
                    : overviewMetrics.health === 'Low Balance'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                {overviewMetrics.health === 'Healthy' ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <AlertTriangle className="w-4 h-4" />
                )}
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-sm font-bold ${
                    overviewMetrics.health === 'Healthy'
                      ? 'text-emerald-700'
                      : overviewMetrics.health === 'Low Balance'
                      ? 'text-amber-700'
                      : 'text-rose-700'
                  }`}
                >
                  {overviewMetrics.health}
                </span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Consultancy reserve compliance
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Search and Filters Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* Search Query */}
          <div className="lg:col-span-4">
            <SearchInput
              placeholder="Search by customer, passport, bank, ref or notes..."
              value={search}
              onSearchChange={setSearch}
            />
          </div>

          {/* Customer Filter */}
          <div className="lg:col-span-2">
            <SelectInput
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              options={[
                { value: 'All', label: 'All Customers' },
                ...customerOptions.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.bankName})`,
                })),
              ]}
            />
          </div>

          {/* Bank Filter */}
          <div className="lg:col-span-2">
            <SelectInput
              value={selectedBank}
              onChange={(e) => handleBankChange(e.target.value)}
              options={ALL_BANK_OPTIONS}
            />
          </div>

          {/* Type Filter */}
          <div className="lg:col-span-2">
            <SelectInput
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              options={[
                'All Types',
                'Credit',
                'Debit',
                'Additional Deposit',
                'Withdrawal',
                'Interest Adjustment',
                'Other',
                'Correction Adjustment',
              ]}
            />
          </div>

          {/* Direction Filter */}
          <div className="lg:col-span-2">
            <SelectInput
              value={selectedDirection}
              onChange={(e) => setSelectedDirection(e.target.value)}
              options={['All Directions', 'Inflow (+)', 'Outflow (-)']}
            />
          </div>
        </div>

        {/* Secondary Filter & Sort Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date Scope:</span>
              <select
                value={selectedDateRange}
                onChange={(e) => setSelectedDateRange(e.target.value)}
                className="bg-transparent font-medium text-slate-800 border-none focus:ring-0 p-0 text-xs cursor-pointer"
              >
                <option value="All Dates">All Recorded Dates</option>
                <option value="Today">Today Only</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="October 2026">October 2026</option>
              </select>
            </div>

            <div className="h-3 w-px bg-slate-200" />

            <div className="flex items-center gap-1.5">
              <span>Sort:</span>
              <button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
              >
                {sortOrder === 'desc' ? 'Newest First' : 'Oldest First'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">
              Showing <strong className="text-slate-700 font-semibold">{filteredTransactions.length}</strong> entries
            </span>
            {(search ||
              selectedCustomerId !== 'All' ||
              selectedBank !== 'All Banks' ||
              selectedType !== 'All Types' ||
              selectedDirection !== 'All Directions' ||
              selectedDateRange !== 'All Dates') && (
              <button
                onClick={() => {
                  setSearchParams({});
                  setSearch('');
                  setSelectedCustomerId('All');
                  setSelectedBank('All Banks');
                  setSelectedType('All Types');
                  setSelectedDirection('All Directions');
                  setSelectedDateRange('All Dates');
                }}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium cursor-pointer ml-1"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: Financial Transaction Table */}
      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-500 text-xs">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
          Loading financial ledger records...
        </div>
      ) : filteredTransactions.length === 0 ? (
        <EmptyState
          title={
            selectedBank !== 'All Banks'
              ? `No Financial Records for ${BANK_FILTER_MAP[selectedBank]?.label || selectedBank}`
              : 'No Financial Records Found'
          }
          description={
            selectedBank !== 'All Banks'
              ? `Zero recorded transactions exist for ${
                  BANK_FILTER_MAP[selectedBank]?.label || selectedBank
                }. Clear the bank filter to view all financial entries or log a new transaction.`
              : isEmptyStateMode
              ? 'The financial ledger is currently in empty-state mode. Log a new financial transaction to record applicant balance snapshots.'
              : 'No transactions match the selected filters. Reset filters or log a new entry.'
          }
          actionText={selectedBank !== 'All Banks' ? 'Clear Filter' : 'Log Financial Entry'}
          onAction={
            selectedBank !== 'All Banks'
              ? () => {
                  setSearchParams({});
                  setSelectedBank('All Banks');
                }
              : () => handleOpenAddModal()
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-3.5 py-3.5 whitespace-nowrap">Txn ID</th>
                  <th className="px-3.5 py-3.5">Customer</th>
                  <th className="px-3.5 py-3.5">Linked Bank</th>
                  <th className="px-3.5 py-3.5 whitespace-nowrap">Date</th>
                  <th className="px-3.5 py-3.5">Type</th>
                  <th className="px-3.5 py-3.5 text-center">Direction</th>
                  <th className="px-3.5 py-3.5 text-right whitespace-nowrap">Amount</th>
                  <th className="px-3.5 py-3.5 text-right whitespace-nowrap">Prev Balance</th>
                  <th className="px-3.5 py-3.5 text-right whitespace-nowrap">New Balance</th>
                  <th className="px-3.5 py-3.5">Recorded By</th>
                  <th className="px-3.5 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {filteredTransactions.map((txn) => {
                  const cust = customerOptions.find((c) => c.id === txn.customerId);
                  const isCorr = txn.transactionType === 'Correction Adjustment';

                  return (
                    <tr
                      key={txn.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCorr ? 'bg-purple-50/30' : ''
                      }`}
                    >
                      {/* Transaction ID */}
                      <td className="px-3.5 py-3.5 font-mono text-[11px] font-medium text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          {isCorr && (
                            <CornerDownRight className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          )}
                          <span>{txn.id}</span>
                        </div>
                        {txn.referenceNo && (
                          <div className="text-[10px] text-slate-400 font-sans truncate max-w-[120px]">
                            Ref: {txn.referenceNo}
                          </div>
                        )}
                      </td>

                      {/* Customer */}
                      <td className="px-3.5 py-3.5">
                        <div className="font-semibold text-slate-900">
                          {cust?.name || txn.customerId}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {cust?.passport || txn.customerId}
                        </div>
                      </td>

                      {/* Bank */}
                      <td className="px-3.5 py-3.5">
                        <div className="font-medium text-slate-800">
                          {txn.bankName || cust?.bankName || 'Direct'}
                        </div>
                        <div className="font-mono text-[10px] text-slate-400">
                          {txn.accountNumberMasked || cust?.accountNumberMasked || 'XXXX 0000'}
                        </div>
                      </td>

                      {/* Date */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap text-slate-600">
                        {formatDate(txn.transactionDate)}
                      </td>

                      {/* Transaction Type */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        {isCorr ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-800 border border-purple-200">
                            Correction Adj
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {txn.transactionType}
                          </span>
                        )}
                      </td>

                      {/* Direction */}
                      <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                        {txn.direction === 'Inflow' ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-xs bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                            Inflow
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-700 font-semibold text-xs bg-rose-50 px-2 py-0.5 rounded border border-rose-200/70">
                            <ArrowUpRight className="w-3 h-3 text-rose-600" />
                            Outflow
                          </span>
                        )}
                      </td>

                      {/* Amount */}
                      <td className="px-3.5 py-3.5 text-right tabular-nums whitespace-nowrap">
                        <span
                          className={`font-semibold ${
                            txn.direction === 'Inflow' ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          {txn.direction === 'Inflow' ? '+ ' : '- '}
                          {formatINR(txn.amount)}
                        </span>
                      </td>

                      {/* Previous Balance */}
                      <td className="px-3.5 py-3.5 text-right tabular-nums text-slate-500 whitespace-nowrap">
                        {formatINR(txn.previousBalance)}
                      </td>

                      {/* New Balance */}
                      <td className="px-3.5 py-3.5 text-right tabular-nums font-bold text-slate-900 whitespace-nowrap">
                        {formatINR(txn.newBalance)}
                      </td>

                      {/* Recorded By */}
                      <td className="px-3.5 py-3.5 whitespace-nowrap">
                        <div className="text-slate-800 font-medium text-xs">
                          {txn.createdBy || DEMO_ACTOR_NAME}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {DEMO_ACTOR_ROLE}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-3.5 py-3.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedTxnForDetails(txn)}
                            title="View Full Transaction Details"
                            className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenHistoryModal(txn.customerId)}
                            title="View Customer Transaction History"
                            className="p-1 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>
                          {!isCorr && (
                            <button
                              onClick={() => handleOpenCorrectionModal(txn)}
                              title="Option B: Apply Current Balance Correction"
                              className="px-2 py-0.5 text-[11px] font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded transition-colors cursor-pointer"
                            >
                              Correct
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Section 5: Add Financial Transaction Modal */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Log Financial Transaction"
        subtitle="Record an verified proof-of-funds balance transaction for an applicant"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-slate-400">
              Updates take effect immediately on current balance
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleAddTransactionSubmit}
                disabled={addModalProjectedBalance?.isNegative}
              >
                Record Transaction
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          {addFormError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{addFormError}</span>
            </div>
          )}

          {/* Customer Selection */}
          <SelectInput
            label="Applicant Customer"
            required
            value={newTxnCustomerId}
            onChange={(e) => setNewTxnCustomerId(e.target.value)}
            options={customerOptions.map((c) => ({
              value: c.id,
              label: `${c.name} — ${c.bankName} (${c.passport})`,
            }))}
          />

          {/* Real-time Customer Position Card */}
          {newTxnCustomerId && allSummaries[newTxnCustomerId] && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-slate-600">
                <span className="font-semibold text-slate-800">
                  {allSummaries[newTxnCustomerId].customerName}
                </span>
                <span className="font-mono text-[11px] text-slate-500">
                  {allSummaries[newTxnCustomerId].bankName} ({allSummaries[newTxnCustomerId].accountNumberMasked})
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-200 text-[11px]">
                <div>
                  <span className="text-slate-400">Bank Balance:</span>
                  <div className="font-bold text-slate-900">
                    {formatINR(allSummaries[newTxnCustomerId].currentBankBalance)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Fixed Deposit:</span>
                  <div className="font-bold text-purple-700">
                    {formatINR(allSummaries[newTxnCustomerId].fdAmount)}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400">Combined Amount:</span>
                  <div className="font-bold text-blue-700">
                    {formatINR(allSummaries[newTxnCustomerId].combinedFinancialAmount)}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {/* Transaction Date */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Transaction Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={newTxnDate}
                onChange={(e) => setNewTxnDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>

            {/* Transaction Type */}
            <SelectInput
              label="Transaction Type"
              required
              value={newTxnType}
              onChange={(e) => setNewTxnType(e.target.value as any)}
              options={[
                'Additional Deposit',
                'Credit',
                'Debit',
                'Withdrawal',
                'Interest Adjustment',
                'Other',
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Amount */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Amount (INR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 25000"
                value={newTxnAmount}
                onChange={(e) => setNewTxnAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white tabular-nums"
              />
            </div>

            {/* Reference Number */}
            <TextInput
              label="Bank Reference / UTR / Cheque No"
              placeholder="e.g. NEFT/ICIC/88190"
              value={newTxnRef}
              onChange={(e) => setNewTxnRef(e.target.value)}
            />
          </div>

          {/* Description */}
          <TextInput
            label="Transaction Description"
            required
            placeholder="e.g. Additional proof-of-funds deposit for embassy verification"
            value={newTxnDescription}
            onChange={(e) => setNewTxnDescription(e.target.value)}
          />

          {/* Mandatory Notes */}
          <div>
            <label className="block text-slate-700 font-medium mb-1">
              Transaction Notes & Provenance <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="Mandatory officer notes confirming document evidence, counterfoil, or verification method"
              value={newTxnNotes}
              onChange={(e) => setNewTxnNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>

          {/* Projected Balance & Solvency Card */}
          {addModalProjectedBalance && (
            <div
              className={`p-3 rounded-lg border text-xs ${
                addModalProjectedBalance.isNegative
                  ? 'bg-rose-50 border-rose-300 text-rose-900'
                  : 'bg-blue-50/70 border-blue-200 text-blue-950'
              }`}
            >
              <div className="flex items-center justify-between font-medium">
                <span>
                  Resulting Current Balance Projection:
                </span>
                <span className="text-sm font-bold tabular-nums">
                  {formatINR(addModalProjectedBalance.projectedBalance)}
                </span>
              </div>
              {addModalProjectedBalance.isNegative && (
                <div className="mt-1.5 flex items-center gap-1.5 text-rose-700 font-semibold text-[11px]">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Transaction rejected: Resulting bank balance cannot be negative.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>

      {/* ========================================================================= */}
      {/* Section 7: Option B Correction Workflow Modal */}
      {/* ========================================================================= */}
      {selectedTxnForCorrection && corrChainInfo && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTxnForCorrection(null)}
          title={`Option B Correction: ${selectedTxnForCorrection.id}`}
          subtitle="Apply current balance adjustment without altering historical records"
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-400">
                Original ledger record remains permanently immutable
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setSelectedTxnForCorrection(null)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCorrectionSubmit}
                  disabled={
                    corrLiveCalculation?.isZeroAdjustment ||
                    corrLiveCalculation?.isNegativeResult ||
                    !corrReason.trim()
                  }
                >
                  Apply Balance Adjustment
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Prominent Policy Explanation Box */}
            <div className="p-3 bg-purple-50/80 border border-purple-200 rounded-lg text-purple-950 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold text-purple-900 block">
                  Option B Current Balance Adjustment:
                </strong>
                Corrections do not overwrite the original transaction or recalculate historical balances. A separate adjustment is applied to the customer's latest current balance.
              </div>
            </div>

            {corrFormError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{corrFormError}</span>
              </div>
            )}

            {/* Read-Only Transaction Context */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Original Transaction ID:</span>
                <span className="font-mono font-semibold text-slate-800">
                  {selectedTxnForCorrection.id}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Customer & Linked Bank:</span>
                <span className="font-semibold text-slate-800">
                  {customerOptions.find((c) => c.id === selectedTxnForCorrection.customerId)?.name} (
                  {selectedTxnForCorrection.bankName})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Original Recorded Amount:</span>
                <span className="font-bold text-slate-700">
                  {formatINR(selectedTxnForCorrection.amount)} ({selectedTxnForCorrection.direction})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Previously Accepted Amount:</span>
                <span className="font-bold text-purple-800">
                  {formatINR(corrChainInfo.previouslyAcceptedAmount)}
                </span>
                {corrChainInfo.precedingCorrectionId && (
                  <span className="text-[10px] text-purple-600 block">
                    (Via correction {corrChainInfo.precedingCorrectionId})
                  </span>
                )}
              </div>
            </div>

            {/* Corrected Intended Amount */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Corrected Intended Amount (INR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="Enter new intended amount"
                value={corrIntendedAmount}
                onChange={(e) => setCorrIntendedAmount(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white tabular-nums font-semibold"
              />
              <span className="text-[11px] text-slate-500 mt-0.5 block">
                The actual authentic amount this transaction should have reflected.
              </span>
            </div>

            {/* Calculated Adjustment Summary */}
            {corrLiveCalculation && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600 font-medium">Net Current Balance Adjustment:</span>
                  <span
                    className={`font-bold tabular-nums text-sm ${
                      corrLiveCalculation.adjustmentAmount > 0
                        ? 'text-emerald-700'
                        : corrLiveCalculation.adjustmentAmount < 0
                        ? 'text-rose-700'
                        : 'text-slate-500'
                    }`}
                  >
                    {corrLiveCalculation.adjustmentAmount > 0
                      ? `+ ${formatINR(corrLiveCalculation.adjustmentAmount)} (Credit)`
                      : corrLiveCalculation.adjustmentAmount < 0
                      ? `- ${formatINR(Math.abs(corrLiveCalculation.adjustmentAmount))} (Debit)`
                      : '₹ 0 (No change)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
                  <div>
                    <span className="text-slate-400">Latest Current Balance:</span>
                    <div className="font-bold text-slate-800">
                      {formatINR(corrLiveCalculation.currentBalance)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Projected New Balance:</span>
                    <div
                      className={`font-bold ${
                        corrLiveCalculation.isNegativeResult ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {formatINR(corrLiveCalculation.projectedBalance)}
                    </div>
                  </div>
                </div>

                {corrLiveCalculation.isZeroAdjustment && (
                  <div className="text-amber-700 font-medium text-[11px] flex items-center gap-1.5 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      The corrected amount is identical to the previously accepted amount. Zero adjustments are rejected.
                    </span>
                  </div>
                )}

                {corrLiveCalculation.isNegativeResult && (
                  <div className="text-rose-700 font-semibold text-[11px] flex items-center gap-1.5 pt-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Correction rejected: Resulting bank balance would be negative.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Mandatory Reason */}
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Mandatory Correction Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="Explain the reason for correction (e.g. bank counterfoil audit, reconciliation discrepancy, officer typo)"
                value={corrReason}
                onChange={(e) => setCorrReason(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* Section 6: Transaction Details Modal */}
      {/* ========================================================================= */}
      {selectedTxnForDetails && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedTxnForDetails(null)}
          title={`Transaction Details: ${selectedTxnForDetails.id}`}
          subtitle={`Audit snapshot for ${
            customerOptions.find((c) => c.id === selectedTxnForDetails.customerId)?.name ||
            selectedTxnForDetails.customerId
          }`}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-[11px] text-slate-400">
                Logged in immutable in-memory ledger
              </span>
              <div className="flex items-center gap-2">
                {selectedTxnForDetails.transactionType !== 'Correction Adjustment' && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const t = selectedTxnForDetails;
                      setSelectedTxnForDetails(null);
                      handleOpenCorrectionModal(t);
                    }}
                  >
                    Apply Option B Correction
                  </Button>
                )}
                <Button variant="ghost" onClick={() => setSelectedTxnForDetails(null)}>
                  Close
                </Button>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Identity & Status */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <div>
                <span className="text-slate-400 text-[11px] block">Customer:</span>
                <span className="font-semibold text-slate-800">
                  {customerOptions.find((c) => c.id === selectedTxnForDetails.customerId)?.name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Linked Bank:</span>
                <span className="font-medium text-slate-800">
                  {selectedTxnForDetails.bankName || 'Fiduciary Bank'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Account Number:</span>
                <span className="font-mono text-slate-800">
                  {selectedTxnForDetails.accountNumberMasked || 'XXXX 0000'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Transaction Date:</span>
                <span className="font-medium text-slate-800">
                  {formatDate(selectedTxnForDetails.transactionDate)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Transaction Type:</span>
                <span className="font-semibold text-blue-700">
                  {selectedTxnForDetails.transactionType}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[11px] block">Direction:</span>
                <span
                  className={`font-semibold ${
                    selectedTxnForDetails.direction === 'Inflow'
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {selectedTxnForDetails.direction}
                </span>
              </div>
            </div>

            {/* Balance Snapshot Card */}
            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-lg grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-slate-500 text-[11px] block">Previous Balance</span>
                <span className="font-semibold text-slate-700 text-sm tabular-nums">
                  {formatINR(selectedTxnForDetails.previousBalance)}
                </span>
              </div>
              <div className="border-x border-blue-200 px-2">
                <span className="text-slate-500 text-[11px] block">Transaction Amount</span>
                <span
                  className={`font-bold text-sm tabular-nums ${
                    selectedTxnForDetails.direction === 'Inflow'
                      ? 'text-emerald-700'
                      : 'text-rose-700'
                  }`}
                >
                  {selectedTxnForDetails.direction === 'Inflow' ? '+ ' : '- '}
                  {formatINR(selectedTxnForDetails.amount)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Resulting Balance</span>
                <span className="font-bold text-slate-900 text-sm tabular-nums">
                  {formatINR(selectedTxnForDetails.newBalance)}
                </span>
              </div>
            </div>

            {/* Description & Notes */}
            <div className="space-y-2">
              <div>
                <span className="text-slate-500 text-[11px] block font-medium">Description:</span>
                <p className="text-slate-800 bg-white p-2.5 rounded border border-slate-200">
                  {selectedTxnForDetails.description || '—'}
                </p>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block font-medium">Mandatory Notes / Provenance:</span>
                <p className="text-slate-800 bg-white p-2.5 rounded border border-slate-200 whitespace-pre-wrap">
                  {selectedTxnForDetails.notes || 'No supplementary notes recorded.'}
                </p>
              </div>
              {selectedTxnForDetails.referenceNo && (
                <div>
                  <span className="text-slate-500 text-[11px] block font-medium">Reference Number:</span>
                  <p className="text-slate-800 font-mono bg-white p-2 rounded border border-slate-200">
                    {selectedTxnForDetails.referenceNo}
                  </p>
                </div>
              )}
            </div>

            {/* Correction Linkage Metadata */}
            {selectedTxnForDetails.isCorrection && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-purple-950 text-xs space-y-1">
                <div className="font-semibold flex items-center gap-1.5 text-purple-900">
                  <CornerDownRight className="w-3.5 h-3.5" />
                  <span>Linked Option B Correction Record</span>
                </div>
                <div className="text-[11px]">
                  Correction ID: <span className="font-mono">{selectedTxnForDetails.correctionId}</span>
                </div>
                <div className="text-[11px]">
                  Original Transaction Ref:{' '}
                  <span className="font-mono font-semibold">
                    {selectedTxnForDetails.originalTransactionId}
                  </span>
                </div>
              </div>
            )}

            {/* Provenance Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>
                Recorded by: <strong className="text-slate-700">{selectedTxnForDetails.createdBy || DEMO_ACTOR_NAME}</strong>
              </span>
              <span>{formatDate(selectedTxnForDetails.createdAt)}</span>
            </div>
          </div>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* Section 6: Customer Financial Transaction History Modal */}
      {/* ========================================================================= */}
      {historyCustomerId && customerHistoryData && (
        <Modal
          isOpen={true}
          onClose={() => {
            setHistoryCustomerId(null);
            setCustomerHistoryData(null);
          }}
          title={`Financial History: ${
            customerOptions.find((c) => c.id === historyCustomerId)?.name || historyCustomerId
          }`}
          subtitle="Chronological transaction timeline, Option B corrections, and audit-grade entries"
          footer={
            <Button
              variant="secondary"
              onClick={() => {
                setHistoryCustomerId(null);
                setCustomerHistoryData(null);
              }}
            >
              Close History
            </Button>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Timeline */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <History className="w-4 h-4 text-blue-600" />
                <span>Chronological Transaction Ledger ({customerHistoryData.transactions.length})</span>
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {customerHistoryData.transactions.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">No transactions recorded yet.</div>
                ) : (
                  customerHistoryData.transactions.map((t) => (
                    <div key={t.id} className="p-3 hover:bg-slate-50 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-semibold text-slate-700">
                            {t.id}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatDate(t.transactionDate)}
                          </span>
                          {t.isCorrection && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-purple-100 text-purple-800">
                              Option B Adj
                            </span>
                          )}
                        </div>
                        <div className="text-slate-600 text-[11px] mt-0.5">{t.description}</div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`font-bold tabular-nums ${
                            t.direction === 'Inflow' ? 'text-emerald-700' : 'text-slate-900'
                          }`}
                        >
                          {t.direction === 'Inflow' ? '+ ' : '- '}
                          {formatINR(t.amount)}
                        </div>
                        <div className="text-[10px] text-slate-400 tabular-nums">
                          Bal: {formatINR(t.newBalance)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Corrections History (Option B) */}
            {customerHistoryData.corrections.length > 0 && (
              <div>
                <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-1.5">
                  <CornerDownRight className="w-4 h-4 text-purple-600" />
                  <span>Option B Current Balance Corrections ({customerHistoryData.corrections.length})</span>
                </h4>
                <div className="border border-purple-200 rounded-lg overflow-hidden divide-y divide-purple-100 max-h-48 overflow-y-auto bg-purple-50/20">
                  {customerHistoryData.corrections.map((c) => (
                    <div key={c.id} className="p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-purple-900 font-semibold text-[11px]">
                          {c.id} → Ref: {c.originalTransactionId}
                        </span>
                        <span
                          className={`font-bold tabular-nums text-xs ${
                            c.adjustmentAmount > 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {c.adjustmentAmount > 0 ? '+ ' : ''}
                          {formatINR(c.adjustmentAmount)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Intended Amount: {formatINR(c.correctedAmount)} (Previously: {formatINR(c.previouslyAcceptedAmount)})
                      </div>
                      <div className="text-[11px] text-purple-900 italic">
                        Reason: {c.correctionReason}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Audit Log Entries */}
            <div>
              <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Financial Ledger Audit Trail</span>
              </h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-44 overflow-y-auto">
                {customerHistoryData.auditEntries.map((a) => (
                  <div key={a.id} className="p-2.5 text-[11px] flex items-start justify-between gap-3">
                    <div>
                      <span className="font-semibold text-slate-700 block">{a.action}</span>
                      <p className="text-slate-600 mt-0.5">{a.details}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-slate-400 block">{formatDate(a.timestamp)}</span>
                      <span className="text-slate-500 font-medium">{a.actor}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
