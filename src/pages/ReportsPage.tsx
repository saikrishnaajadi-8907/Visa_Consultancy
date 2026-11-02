import React, { useState, useEffect, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Building2,
  Users,
  Wallet,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CornerDownRight,
  Search,
  Filter,
  RefreshCw,
  Globe,
  Landmark,
  Eye,
  Info,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { Tabs, TabItem } from '../components/common/Tabs';
import { SearchInput } from '../components/forms/SearchInput';
import { SelectInput } from '../components/forms/SelectInput';
import { EmptyState } from '../components/common/EmptyState';
import { useAppState } from '../context/AppStateContext';
import { customerService } from '../services/customerService';
import { bankService } from '../services/bankService';
import { financialService } from '../services/financialService';
import { MOCK_CUSTOMERS } from '../constants/mockData';
import { Customer } from '../types/customer';
import { BankMaster } from '../types/bank';
import {
  FinancialTransaction,
  FinancialCorrection,
  CustomerFinancialSummary,
} from '../types/financial';
import { formatINR, formatDate, maskAccountNumber } from '../utils/formatters';
import { exportReportToCSV } from '../utils/reportExport';
import { DonutChart, HorizontalBarChart, ChartDataPoint } from '../components/reports/ReportCharts';

export const ReportsPage: React.FC = () => {
  const { isEmptyStateMode } = useAppState();

  // Active Category Tab
  const [activeTab, setActiveTab] = useState<string>('customers');

  // Loaded Data State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [banks, setBanks] = useState<BankMaster[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [corrections, setCorrections] = useState<FinancialCorrection[]>([]);
  const [summaries, setSummaries] = useState<Record<string, CustomerFinancialSummary>>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Common Filters
  const [search, setSearch] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('All Banks');
  const [selectedCustomerStatus, setSelectedCustomerStatus] = useState<string>('All');
  const [selectedVisaStatus, setSelectedVisaStatus] = useState<string>('All');
  const [selectedVisaType, setSelectedVisaType] = useState<string>('All');
  const [selectedCountry, setSelectedCountry] = useState<string>('All');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('All Dates');
  const [financialSubView, setFinancialSubView] = useState<'customers' | 'transactions' | 'corrections'>('customers');

  // Load All Primary Data Sources
  useEffect(() => {
    async function loadAllData() {
      setIsLoading(true);
      try {
        // 1. Resolve Customers
        const sessionCusts: Customer[] = await customerService.getCustomers();
        let allCusts = [...sessionCusts];

        if (!isEmptyStateMode) {
          const sessionIds = new Set(sessionCusts.map((c) => c.id));
          for (const mc of MOCK_CUSTOMERS) {
            if (!sessionIds.has(mc.id)) {
              allCusts.push({
                id: mc.id,
                personalInfo: {
                  fullName: mc.name,
                  dateOfBirth: mc.dateOfBirth,
                  gender: mc.gender as any,
                  nationality: mc.nationality,
                  aadhaarNumber: '543298761234',
                  panNumber: 'ABCDE1234F',
                  passportNumber: mc.passportNo,
                  fatherName: '',
                  motherName: '',
                },
                contactInfo: {
                  personalMobile: mc.mobile,
                  personalEmail: mc.email,
                  bankMobile: '',
                  bankEmail: '',
                  residentialAddress: mc.address,
                },
                visaInfo: {
                  visaType: mc.visaTrack,
                  consultancyName: 'Visa Consultancy Management',
                  counsellorName: 'Anita Rao',
                  destinationCountry:
                    mc.visaTrack === 'Student Visa'
                      ? 'United Kingdom'
                      : mc.visaTrack === 'PR Visa'
                      ? 'Canada'
                      : mc.visaTrack === 'Business Visa'
                      ? 'USA'
                      : 'Australia',
                  university:
                    mc.visaTrack === 'Student Visa' ? 'University of Manchester' : 'N/A',
                  visaStatus: 'Active',
                },
                bankInfo: {
                  bankId: mc.linkedBank.toLowerCase().includes('sbi')
                    ? 'sbi'
                    : mc.linkedBank.toLowerCase().includes('icici')
                    ? 'icici'
                    : mc.linkedBank.toLowerCase().includes('hdfc')
                    ? 'hdfc'
                    : mc.linkedBank.toLowerCase().includes('idbi')
                    ? 'idbi'
                    : mc.linkedBank.toLowerCase().includes('baroda')
                    ? 'bob'
                    : 'axis',
                  bankName: mc.linkedBank,
                  branchId: `${mc.id}-branch`,
                  branchName: mc.bankBranch,
                  branchLocation: 'Hyderabad',
                  ifscCode: 'SBIN0000847',
                  accountNumber: mc.accountNumber || 'XXXX 9012',
                  chequeBook: 'Yes',
                },
                fdInfo: {
                  initialFdAmount: 0,
                  fdStartDate: '',
                  fdEndDate: '',
                  interestAmount: 0,
                },
                paymentInfo: {
                  paidTo: 'Apex Visas',
                  nextPaymentDate: '2026-11-15',
                },
                additionalInfo: {
                  notes: 'Sample profile for client demo',
                  additionalRemarks: 'Verified proof-of-funds',
                },
                initialFinancialRecord: {
                  transactionDate: mc.createdAt,
                  initialAmount: mc.currentAmount,
                  notes: 'Initial registration deposit',
                },
                status: mc.status as any,
                createdAt: mc.createdAt,
                createdBy: 'Demo User',
                updatedAt: mc.createdAt,
                updatedBy: 'Demo User',
              });
            }
          }
        }

        setCustomers(allCusts);

        // 2. Resolve Banks from Master
        const masterBanks = await bankService.getBanks();
        setBanks(masterBanks);

        // 3. Resolve Financial Transactions & Summaries
        const allTxns = await financialService.getAllFinancialTransactions(!isEmptyStateMode);
        setTransactions(allTxns);

        const summariesMap: Record<string, CustomerFinancialSummary> = {};
        for (const c of allCusts) {
          try {
            const sum = await financialService.getCustomerFinancialSummary(c.id);
            summariesMap[c.id] = sum;
          } catch (e) {
            // Uninitialized customer
          }
        }
        setSummaries(summariesMap);

        // 4. Resolve Corrections
        const allCorrs: FinancialCorrection[] = [];
        for (const c of allCusts) {
          const custCorrs = await financialService.getCustomerCorrections(c.id);
          allCorrs.push(...custCorrs);
        }
        setCorrections(allCorrs);
      } catch (err) {
        console.error('Failed to load reports data:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadAllData();
  }, [isEmptyStateMode]);

  // Section 2: Global Overview Metrics (Across Entire System)
  const overviewMetrics = useMemo(() => {
    if (isEmptyStateMode && customers.length === 0) {
      return {
        totalCustomers: 0,
        activeCustomers: 0,
        inactiveCustomers: 0,
        totalBankBalance: 0,
        totalFdAmount: 0,
        combinedAmount: 0,
      };
    }

    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.status === 'Active').length;
    const inactiveCustomers = customers.filter((c) => c.status !== 'Active').length;

    const summaryList = Object.values(summaries);
    const totalBankBalance = summaryList.reduce((acc, s) => acc + s.currentBankBalance, 0);
    const totalFdAmount = summaryList.reduce((acc, s) => acc + s.fdAmount, 0);
    const combinedAmount = totalBankBalance + totalFdAmount;

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers,
      totalBankBalance,
      totalFdAmount,
      combinedAmount,
    };
  }, [customers, summaries, isEmptyStateMode]);

  // Tabs Definition
  const tabs: TabItem[] = [
    { id: 'customers', label: 'Customer Reports', count: customers.length },
    { id: 'banks', label: 'Bank-wise Reports', count: banks.length },
    { id: 'financial', label: 'Financial Reports' },
    { id: 'visa', label: 'Visa Reports' },
    { id: 'fd', label: 'FD Reports' },
  ];

  // Reset Filters Handler
  const handleResetFilters = () => {
    setSearch('');
    setSelectedBank('All Banks');
    setSelectedCustomerStatus('All');
    setSelectedVisaStatus('All');
    setSelectedVisaType('All');
    setSelectedCountry('All');
    setSelectedDateRange('All Dates');
  };

  // ---------------------------------------------------------------------------
  // FILTERED DATASETS
  // ---------------------------------------------------------------------------

  // Filtered Customers Dataset
  const filteredCustomers = useMemo(() => {
    let list = [...customers];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.personalInfo.fullName.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          c.bankInfo.bankName.toLowerCase().includes(q) ||
          c.visaInfo.destinationCountry.toLowerCase().includes(q) ||
          c.visaInfo.visaType.toLowerCase().includes(q)
      );
    }

    if (selectedCustomerStatus !== 'All') {
      list = list.filter((c) => c.status === selectedCustomerStatus);
    }

    if (selectedVisaStatus !== 'All') {
      list = list.filter((c) => c.visaInfo.visaStatus === selectedVisaStatus);
    }

    if (selectedVisaType !== 'All') {
      list = list.filter((c) => c.visaInfo.visaType === selectedVisaType);
    }

    if (selectedCountry !== 'All') {
      list = list.filter((c) => c.visaInfo.destinationCountry === selectedCountry);
    }

    if (selectedBank !== 'All Banks') {
      list = list.filter((c) => c.bankInfo.bankName.includes(selectedBank));
    }

    return list;
  }, [
    customers,
    search,
    selectedCustomerStatus,
    selectedVisaStatus,
    selectedVisaType,
    selectedCountry,
    selectedBank,
  ]);

  // Bank-wise Aggregation Dataset
  const bankReportData = useMemo(() => {
    return banks.map((b) => {
      // Find all customers allocated to this bank
      const linkedCusts = customers.filter(
        (c) =>
          c.bankInfo.bankId.toLowerCase() === b.id.toLowerCase() ||
          c.bankInfo.bankName.toLowerCase().includes(b.name.toLowerCase()) ||
          b.name.toLowerCase().includes(c.bankInfo.bankName.toLowerCase())
      );

      let totalBankBalance = 0;
      let totalFdAmount = 0;

      for (const cust of linkedCusts) {
        const sum = summaries[cust.id];
        if (sum) {
          totalBankBalance += sum.currentBankBalance;
          totalFdAmount += sum.fdAmount;
        } else {
          totalBankBalance += cust.initialFinancialRecord?.initialAmount || 0;
          totalFdAmount += cust.fdInfo?.initialFdAmount || 0;
        }
      }

      return {
        id: b.id,
        name: b.name,
        code: b.code,
        status: b.status,
        customerCount: linkedCusts.length,
        totalBankBalance,
        totalFdAmount,
        combinedAmount: totalBankBalance + totalFdAmount,
      };
    });
  }, [banks, customers, summaries]);

  // Filtered Bank Report
  const filteredBankReport = useMemo(() => {
    let list = [...bankReportData];
    if (selectedBank !== 'All Banks') {
      list = list.filter((b) => b.name.includes(selectedBank));
    }
    return list;
  }, [bankReportData, selectedBank]);

  // Financial Report Data
  const financialCustomerData = useMemo(() => {
    return filteredCustomers.map((c) => {
      const sum = summaries[c.id];
      const bankBal = sum?.currentBankBalance || c.initialFinancialRecord?.initialAmount || 0;
      const fd = sum?.fdAmount || c.fdInfo?.initialFdAmount || 0;
      return {
        customerId: c.id,
        customerName: c.personalInfo.fullName,
        bankName: c.bankInfo.bankName,
        branchName: c.bankInfo.branchName,
        accountMasked: maskAccountNumber(c.bankInfo.accountNumber),
        currentBankBalance: bankBal,
        fdAmount: fd,
        combinedAmount: sum?.combinedFinancialAmount || (bankBal + fd),
        healthStatus: sum?.status || 'Healthy',
        transactionCount: sum?.transactionCount || 1,
      };
    });
  }, [filteredCustomers, summaries]);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    let list = [...transactions];
    if (selectedBank !== 'All Banks') {
      list = list.filter((t) => t.bankName && t.bankName.includes(selectedBank));
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.id.toLowerCase().includes(q) ||
          t.customerId.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return list;
  }, [transactions, selectedBank, search]);

  // ---------------------------------------------------------------------------
  // CSV EXPORT HANDLERS
  // ---------------------------------------------------------------------------

  const handleExportCSV = () => {
    const isDemo = !isEmptyStateMode;

    if (activeTab === 'customers') {
      const headers = [
        'Customer ID',
        'Full Name',
        'Linked Bank',
        'Branch',
        'Visa Type',
        'Destination Country',
        'Visa Status',
        'Assigned Counsellor',
        'Operational Status',
        'Registration Date',
      ];
      const rows = filteredCustomers.map((c) => [
        c.id,
        c.personalInfo.fullName,
        c.bankInfo.bankName,
        c.bankInfo.branchName,
        c.visaInfo.visaType,
        c.visaInfo.destinationCountry,
        c.visaInfo.visaStatus,
        c.visaInfo.counsellorName,
        c.status,
        formatDate(c.createdAt),
      ]);
      exportReportToCSV({
        title: 'Customer Master & Registration Report',
        category: 'customers',
        filterSummary: `Status: ${selectedCustomerStatus}, Visa: ${selectedVisaStatus}, Bank: ${selectedBank}`,
        isDemo,
        headers,
        rows,
      });
    } else if (activeTab === 'banks') {
      const headers = [
        'Bank Code',
        'Bank Name',
        'Status',
        'Linked Customers',
        'Total Bank Balance (INR)',
        'Total FD Amount (INR)',
        'Combined Amount (INR)',
      ];
      const rows = filteredBankReport.map((b) => [
        b.code,
        b.name,
        b.status,
        b.customerCount,
        b.totalBankBalance,
        b.totalFdAmount,
        b.combinedAmount,
      ]);
      exportReportToCSV({
        title: 'Approved Bank Proof-of-Funds Distribution Report',
        category: 'bank_distribution',
        filterSummary: `Bank Filter: ${selectedBank}`,
        isDemo,
        headers,
        rows,
      });
    } else if (activeTab === 'financial') {
      if (financialSubView === 'customers') {
        const headers = [
          'Customer ID',
          'Customer Name',
          'Linked Bank',
          'Masked Account',
          'Bank Balance (INR)',
          'FD Amount (INR)',
          'Combined Amount (INR)',
          'Health Status',
        ];
        const rows = financialCustomerData.map((f) => [
          f.customerId,
          f.customerName,
          f.bankName,
          f.accountMasked,
          f.currentBankBalance,
          f.fdAmount,
          f.combinedAmount,
          f.healthStatus,
        ]);
        exportReportToCSV({
          title: 'Customer Financial Ledger & Solvency Report',
          category: 'financial_solvency',
          filterSummary: `Bank: ${selectedBank}, Scope: Active Customers`,
          isDemo,
          headers,
          rows,
        });
      } else if (financialSubView === 'transactions') {
        const headers = [
          'Transaction ID',
          'Date',
          'Customer ID',
          'Bank Name',
          'Type',
          'Direction',
          'Amount (INR)',
          'Previous Balance (INR)',
          'New Balance (INR)',
          'Is Option B Correction',
          'Recorded By',
        ];
        const rows = filteredTransactions.map((t) => [
          t.id,
          t.transactionDate,
          t.customerId,
          t.bankName || 'Direct',
          t.transactionType,
          t.direction,
          t.amount,
          t.previousBalance,
          t.newBalance,
          t.isCorrection ? 'YES' : 'NO',
          t.createdBy || 'Demonstration User',
        ]);
        exportReportToCSV({
          title: 'Financial Transactions Audit Schedule',
          category: 'transactions_ledger',
          filterSummary: `Bank: ${selectedBank}, Records: ${filteredTransactions.length}`,
          isDemo,
          headers,
          rows,
        });
      } else {
        const headers = [
          'Correction ID',
          'Target Txn ID',
          'Customer ID',
          'Original Amount (INR)',
          'Previously Accepted (INR)',
          'Corrected Intended Amount (INR)',
          'Net Balance Adjustment (INR)',
          'Correction Reason',
          'Recorded By',
          'Timestamp',
        ];
        const rows = corrections.map((c) => [
          c.id,
          c.originalTransactionId,
          c.customerId,
          c.originalAmount,
          c.previouslyAcceptedAmount,
          c.correctedAmount,
          c.adjustmentAmount,
          c.correctionReason,
          c.createdBy,
          c.createdAt,
        ]);
        exportReportToCSV({
          title: 'Option B Balance Corrections Audit Register',
          category: 'option_b_corrections',
          filterSummary: `Total Corrections Logged: ${corrections.length}`,
          isDemo,
          headers,
          rows,
        });
      }
    } else if (activeTab === 'visa') {
      const headers = [
        'Customer ID',
        'Customer Name',
        'Visa Type',
        'Destination Country',
        'University / Institution',
        'Visa Status',
        'Assigned Counsellor',
        'Linked Bank',
      ];
      const rows = filteredCustomers.map((c) => [
        c.id,
        c.personalInfo.fullName,
        c.visaInfo.visaType,
        c.visaInfo.destinationCountry,
        c.visaInfo.university || 'N/A',
        c.visaInfo.visaStatus,
        c.visaInfo.counsellorName,
        c.bankInfo.bankName,
      ]);
      exportReportToCSV({
        title: 'Visa Application Track & Destination Report',
        category: 'visa_portfolio',
        filterSummary: `Visa Type: ${selectedVisaType}, Country: ${selectedCountry}`,
        isDemo,
        headers,
        rows,
      });
    } else if (activeTab === 'fd') {
      const headers = [
        'Customer ID',
        'Customer Name',
        'Linked Bank',
        'Branch',
        'Initial FD Amount (INR)',
        'FD Start Date',
        'FD Maturity Date',
        'Compliance Note',
      ];
      const rows = filteredCustomers.map((c) => [
        c.id,
        c.personalInfo.fullName,
        c.bankInfo.bankName,
        c.bankInfo.branchName,
        c.fdInfo?.initialFdAmount || 0,
        c.fdInfo?.fdStartDate || '—',
        c.fdInfo?.fdEndDate || '—',
        'Internal proof-of-funds holding schedule without speculative interest computation',
      ]);
      exportReportToCSV({
        title: 'Fixed Deposit (FD) Proof Register',
        category: 'fd_portfolio',
        filterSummary: `Bank: ${selectedBank}`,
        isDemo,
        headers,
        rows,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // CHART DATA COMPILATIONS
  // ---------------------------------------------------------------------------

  // Customer Operational Status Chart Data
  const customerStatusChartData: ChartDataPoint[] = useMemo(() => {
    const activeCount = filteredCustomers.filter((c) => c.status === 'Active').length;
    const inactiveCount = filteredCustomers.filter((c) => c.status === 'Inactive').length;
    const archivedCount = filteredCustomers.filter((c) => c.status === 'Archived').length;
    return [
      { label: 'Active', value: activeCount, color: '#059669' },
      { label: 'Inactive', value: inactiveCount, color: '#d97706' },
      { label: 'Archived', value: archivedCount, color: '#64748b' },
    ].filter((d) => d.value > 0);
  }, [filteredCustomers]);

  // Visa Status Chart Data
  const visaStatusChartData: ChartDataPoint[] = useMemo(() => {
    const activeCount = filteredCustomers.filter((c) => c.visaInfo.visaStatus === 'Active').length;
    const pendingCount = filteredCustomers.filter((c) => c.visaInfo.visaStatus === 'Pending').length;
    const inactiveCount = filteredCustomers.filter((c) => c.visaInfo.visaStatus === 'Inactive').length;
    return [
      { label: 'Visa Active', value: activeCount, color: '#2563eb' },
      { label: 'Visa Pending', value: pendingCount, color: '#d97706' },
      { label: 'Visa Inactive', value: inactiveCount, color: '#94a3b8' },
    ].filter((d) => d.value > 0);
  }, [filteredCustomers]);

  // Destination Country Chart Data
  const countryChartData: ChartDataPoint[] = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of filteredCustomers) {
      const country = c.visaInfo.destinationCountry || 'Other';
      counts[country] = (counts[country] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredCustomers]);

  // Bank Customer Distribution Chart Data
  const bankCustomerChartData: ChartDataPoint[] = useMemo(() => {
    return bankReportData
      .filter((b) => b.customerCount > 0)
      .map((b) => ({
        label: b.name,
        value: b.customerCount,
        formattedValue: `${b.customerCount} applicants`,
      }))
      .sort((a, b) => b.value - a.value);
  }, [bankReportData]);

  // Bank Financial Distribution Chart Data
  const bankFinancialChartData: ChartDataPoint[] = useMemo(() => {
    return bankReportData
      .filter((b) => b.totalBankBalance > 0)
      .map((b) => ({
        label: b.name,
        value: b.totalBankBalance,
        formattedValue: formatINR(b.totalBankBalance),
      }))
      .sort((a, b) => b.value - a.value);
  }, [bankReportData]);

  // Visa Type Distribution Chart Data
  const visaTypeChartData: ChartDataPoint[] = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of filteredCustomers) {
      const type = c.visaInfo.visaType || 'Other';
      counts[type] = (counts[type] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredCustomers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Reports & Analytics Dashboard"
        subtitle="Comprehensive fiduciary audits, proof-of-funds balance distribution, visa tracks, and bank-wise reporting"
        actions={
          <Button
            variant="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportCSV}
          >
            Export Current Report (.csv)
          </Button>
        }
      />

      {/* Demo Identity Awareness Banner */}
      {!isEmptyStateMode && (
        <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-blue-900 shadow-sm">
          <div className="flex items-center gap-2.5">
            <span className="font-semibold tracking-wide uppercase text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
              DEMO DATA
            </span>
            <span className="text-slate-700">
              Displaying reports derived from approved prototype demonstration datasets. CSV exports are automatically labeled for audit compliance.
            </span>
          </div>
          <div className="text-[11px] text-blue-700 font-medium">
            10 Approved Fiduciary Banks
          </div>
        </div>
      )}

      {/* Section 2: Global Overview Metrics (6 KPI Cards) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 px-0.5">
          <span className="font-medium text-slate-700 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            Consolidated Consultancy Portfolio Metrics
          </span>
          <span className="text-[11px] text-slate-400">
            Computed in real-time from active ledger & master data
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* 1. Total Customers */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Clients
            </span>
            <div className="text-xl font-bold text-slate-900 tabular-nums mt-1.5">
              {overviewMetrics.totalCustomers}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Registered records</span>
          </div>

          {/* 2. Active Customers */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Active Clients
            </span>
            <div className="text-xl font-bold text-emerald-700 tabular-nums mt-1.5">
              {overviewMetrics.activeCustomers}
            </div>
            <span className="text-[10px] text-emerald-600 mt-0.5 block">Operational status</span>
          </div>

          {/* 3. Inactive Customers */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Inactive / Arch.
            </span>
            <div className="text-xl font-bold text-slate-600 tabular-nums mt-1.5">
              {overviewMetrics.inactiveCustomers}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Pending or closed</span>
          </div>

          {/* 4. Total Bank Balance */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Bank Balance
            </span>
            <div className="text-xl font-bold text-slate-900 tabular-nums mt-1.5">
              {formatINR(overviewMetrics.totalBankBalance)}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Liquid holdings</span>
          </div>

          {/* 5. Total FD Amount */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total FDs
            </span>
            <div className="text-xl font-bold text-purple-700 tabular-nums mt-1.5">
              {formatINR(overviewMetrics.totalFdAmount)}
            </div>
            <span className="text-[10px] text-purple-600 mt-0.5 block">Term proof holding</span>
          </div>

          {/* 6. Combined Financial Amount */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Combined Total
            </span>
            <div className="text-xl font-bold text-blue-700 tabular-nums mt-1.5">
              {formatINR(overviewMetrics.combinedAmount)}
            </div>
            <span className="text-[10px] text-blue-600 mt-0.5 block">Total proof-of-funds</span>
          </div>
        </div>
      </div>

      {/* Main Report Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Tabs Bar */}
        <div className="px-6 pt-2 border-b border-slate-100">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="p-6 space-y-6">
          {/* ========================================================================= */}
          {/* TAB 1: CUSTOMER REPORTS */}
          {/* ========================================================================= */}
          {activeTab === 'customers' && (
            <div className="space-y-6">
              {/* Category Filters */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <SearchInput
                  placeholder="Search customer, passport, bank..."
                  value={search}
                  onSearchChange={setSearch}
                />
                <SelectInput
                  label="Customer Status"
                  value={selectedCustomerStatus}
                  onChange={(e) => setSelectedCustomerStatus(e.target.value)}
                  options={['All', 'Active', 'Inactive', 'Archived']}
                />
                <SelectInput
                  label="Visa Status"
                  value={selectedVisaStatus}
                  onChange={(e) => setSelectedVisaStatus(e.target.value)}
                  options={['All', 'Active', 'Pending', 'Inactive']}
                />
                <SelectInput
                  label="Destination Country"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  options={['All', 'United Kingdom', 'Canada', 'USA', 'Australia', 'Germany']}
                />
                <SelectInput
                  label="Allocated Bank"
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  options={[
                    'All Banks',
                    'State Bank of India',
                    'HDFC Bank',
                    'ICICI Bank',
                    'IDBI Bank',
                    'Bank of Baroda',
                    'Axis Bank',
                  ]}
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <DonutChart
                  title="Operational Status"
                  subtitle="Client account lifecycle status"
                  data={customerStatusChartData}
                  centerLabel="Clients"
                  centerValue={filteredCustomers.length}
                />
                <DonutChart
                  title="Visa Status Distribution"
                  subtitle="Embassy application status"
                  data={visaStatusChartData}
                  centerLabel="Visas"
                  centerValue={filteredCustomers.length}
                />
                <HorizontalBarChart
                  title="Destination Countries"
                  subtitle="Top migration & study tracks"
                  data={countryChartData}
                />
              </div>

              {/* Table */}
              <div className="border border-slate-200/90 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Customer Records ({filteredCustomers.length} matching)
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={handleExportCSV}
                  >
                    Download CSV
                  </Button>
                </div>

                {filteredCustomers.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No customers match the current filter selection.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-white text-[11px] font-semibold text-slate-500 uppercase">
                          <th className="px-4 py-3">ID</th>
                          <th className="px-4 py-3">Customer Name</th>
                          <th className="px-4 py-3">Linked Bank</th>
                          <th className="px-4 py-3">Visa Track</th>
                          <th className="px-4 py-3">Destination</th>
                          <th className="px-4 py-3">Visa Status</th>
                          <th className="px-4 py-3">Client Status</th>
                          <th className="px-4 py-3">Registered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredCustomers.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-mono font-medium text-slate-600">
                              {c.id}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {c.personalInfo.fullName}
                            </td>
                            <td className="px-4 py-3 font-medium text-blue-700">
                              {c.bankInfo.bankName}
                            </td>
                            <td className="px-4 py-3">{c.visaInfo.visaType}</td>
                            <td className="px-4 py-3">{c.visaInfo.destinationCountry}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                  c.visaInfo.visaStatus === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {c.visaInfo.visaStatus}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                  c.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {c.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {formatDate(c.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: BANK-WISE REPORTS */}
          {/* ========================================================================= */}
          {activeTab === 'banks' && (
            <div className="space-y-6">
              {/* Filter */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-4">
                <div className="w-72">
                  <SelectInput
                    label="Filter Approved Bank"
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    options={[
                      'All Banks',
                      'State Bank of India',
                      'HDFC Bank',
                      'ICICI Bank',
                      'IDBI Bank',
                      'Bank of Baroda',
                      'Axis Bank',
                    ]}
                  />
                </div>
                <div className="text-xs text-slate-500">
                  Total Approved Master Banks:{' '}
                  <strong className="text-slate-800">{banks.length}</strong>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <HorizontalBarChart
                  title="Client Distribution by Bank"
                  subtitle="Number of applicants banking with each approved institution"
                  data={bankCustomerChartData}
                />
                <HorizontalBarChart
                  title="Proof-of-Funds Volume by Bank"
                  subtitle="Aggregated liquid bank balances across accounts"
                  data={bankFinancialChartData}
                  isCurrency={true}
                />
              </div>

              {/* Table */}
              <div className="border border-slate-200/90 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Approved Bank Allocation & Balances Schedule
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={handleExportCSV}
                  >
                    Download CSV
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-white text-[11px] font-semibold text-slate-500 uppercase">
                        <th className="px-4 py-3">Bank Code</th>
                        <th className="px-4 py-3">Bank Name</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-center">Linked Clients</th>
                        <th className="px-4 py-3 text-right">Current Bank Balance</th>
                        <th className="px-4 py-3 text-right">Fixed Deposit (FD)</th>
                        <th className="px-4 py-3 text-right">Combined Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredBankReport.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono font-bold text-slate-700">{b.code}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{b.name}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-blue-600 font-mono">
                            {b.customerCount}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-slate-800 font-medium">
                            {formatINR(b.totalBankBalance)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums text-purple-700 font-medium">
                            {formatINR(b.totalFdAmount)}
                          </td>
                          <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                            {formatINR(b.combinedAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: FINANCIAL REPORTS */}
          {/* ========================================================================= */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {/* Sub-view switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setFinancialSubView('customers')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      financialSubView === 'customers'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Client Solvency Positions
                  </button>
                  <button
                    onClick={() => setFinancialSubView('transactions')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      financialSubView === 'transactions'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    All Transactions ({transactions.length})
                  </button>
                  <button
                    onClick={() => setFinancialSubView('corrections')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      financialSubView === 'corrections'
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    Option B Corrections ({corrections.length})
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <SelectInput
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    options={[
                      'All Banks',
                      'State Bank of India',
                      'HDFC Bank',
                      'ICICI Bank',
                      'IDBI Bank',
                      'Bank of Baroda',
                      'Axis Bank',
                    ]}
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={handleExportCSV}
                  >
                    Export CSV
                  </Button>
                </div>
              </div>

              {/* Sub-view: Client Financial Positions */}
              {financialSubView === 'customers' && (
                <div className="border border-slate-200/90 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Customer-wise Proof-of-Funds Solvency Register
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Customer proof-of-funds balance register across partner banks
                      </span>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-white text-[11px] font-semibold text-slate-500 uppercase">
                          <th className="px-4 py-3">Client</th>
                          <th className="px-4 py-3">Linked Bank</th>
                          <th className="px-4 py-3">Masked Account</th>
                          <th className="px-4 py-3 text-right">Bank Balance</th>
                          <th className="px-4 py-3 text-right">FD Amount</th>
                          <th className="px-4 py-3 text-right">Combined Amount</th>
                          <th className="px-4 py-3 text-center">Health Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {financialCustomerData.map((f) => (
                          <tr key={f.customerId} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {f.customerName}
                              <div className="font-mono text-[10px] text-slate-400 font-normal">
                                {f.customerId}
                              </div>
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800">{f.bankName}</td>
                            <td className="px-4 py-3 font-mono text-slate-500">{f.accountMasked}</td>
                            <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                              {formatINR(f.currentBankBalance)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums text-purple-700 font-medium">
                              {formatINR(f.fdAmount)}
                            </td>
                            <td className="px-4 py-3 text-right tabular-nums font-bold text-blue-700">
                              {formatINR(f.combinedAmount)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  f.healthStatus === 'Healthy'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : f.healthStatus === 'Low Balance'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {f.healthStatus}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-view: Transactions */}
              {financialSubView === 'transactions' && (
                <div className="border border-slate-200/90 rounded-xl overflow-hidden">
                  <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80">
                    <span className="text-xs font-bold text-slate-800">
                      Chronological Transactions Register ({filteredTransactions.length} records)
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-white text-[11px] font-semibold text-slate-500 uppercase">
                          <th className="px-4 py-3">Txn ID</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Customer ID</th>
                          <th className="px-4 py-3">Bank</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3 text-center">Direction</th>
                          <th className="px-4 py-3 text-right">Amount</th>
                          <th className="px-4 py-3 text-right">New Balance</th>
                          <th className="px-4 py-3">Recorded By</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-700">
                        {filteredTransactions.map((t) => (
                          <tr
                            key={t.id}
                            className={`hover:bg-slate-50/70 ${
                              t.isCorrection ? 'bg-purple-50/30' : ''
                            }`}
                          >
                            <td className="px-4 py-3 font-mono font-medium text-slate-800 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                {t.isCorrection && (
                                  <CornerDownRight className="w-3.5 h-3.5 text-purple-600" />
                                )}
                                <span>{t.id}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                              {formatDate(t.transactionDate)}
                            </td>
                            <td className="px-4 py-3 font-mono text-slate-600">{t.customerId}</td>
                            <td className="px-4 py-3 font-medium text-slate-800">
                              {t.bankName || 'Direct'}
                            </td>
                            <td className="px-4 py-3">
                              {t.isCorrection ? (
                                <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-purple-100 text-purple-800">
                                  Option B Correction
                                </span>
                              ) : (
                                <span>{t.transactionType}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                  t.direction === 'Inflow'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : 'bg-rose-50 text-rose-700'
                                }`}
                              >
                                {t.direction}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold tabular-nums">
                              {t.direction === 'Inflow' ? '+ ' : '- '}
                              {formatINR(t.amount)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900 tabular-nums">
                              {formatINR(t.newBalance)}
                            </td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {t.createdBy || 'Demonstration User'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-view: Option B Corrections */}
              {financialSubView === 'corrections' && (
                <div className="border border-purple-200 rounded-xl overflow-hidden bg-purple-50/20">
                  <div className="px-5 py-3.5 bg-purple-50/80 border-b border-purple-200">
                    <span className="text-xs font-bold text-purple-900 block">
                      Option B Current Balance Corrections Audit Schedule
                    </span>
                    <span className="text-[11px] text-purple-700">
                      Non-destructive adjustment register preserving historical ledger immutability
                    </span>
                  </div>

                  {corrections.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No Option B corrections logged in current session.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-purple-200 bg-white text-[11px] font-semibold text-purple-900 uppercase">
                            <th className="px-4 py-3">Correction ID</th>
                            <th className="px-4 py-3">Target Txn ID</th>
                            <th className="px-4 py-3">Customer ID</th>
                            <th className="px-4 py-3 text-right">Original Recorded</th>
                            <th className="px-4 py-3 text-right">Previously Accepted</th>
                            <th className="px-4 py-3 text-right">Corrected Intended</th>
                            <th className="px-4 py-3 text-right">Balance Adjustment</th>
                            <th className="px-4 py-3">Mandatory Reason</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-purple-100 text-slate-700">
                          {corrections.map((c) => (
                            <tr key={c.id} className="hover:bg-purple-50/40">
                              <td className="px-4 py-3 font-mono font-bold text-purple-900">
                                {c.id}
                              </td>
                              <td className="px-4 py-3 font-mono font-medium text-slate-700">
                                {c.originalTransactionId}
                              </td>
                              <td className="px-4 py-3 font-mono text-slate-600">{c.customerId}</td>
                              <td className="px-4 py-3 text-right tabular-nums text-slate-600">
                                {formatINR(c.originalAmount)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums text-purple-800">
                                {formatINR(c.previouslyAcceptedAmount)}
                              </td>
                              <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-900">
                                {formatINR(c.correctedAmount)}
                              </td>
                              <td
                                className={`px-4 py-3 text-right tabular-nums font-bold ${
                                  c.adjustmentAmount > 0 ? 'text-emerald-700' : 'text-rose-700'
                                }`}
                              >
                                {c.adjustmentAmount > 0 ? '+ ' : ''}
                                {formatINR(c.adjustmentAmount)}
                              </td>
                              <td className="px-4 py-3 text-purple-950 italic">{c.correctionReason}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 4: VISA REPORTS */}
          {/* ========================================================================= */}
          {activeTab === 'visa' && (
            <div className="space-y-6">
              {/* Category Filters */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SelectInput
                  label="Visa Category / Track"
                  value={selectedVisaType}
                  onChange={(e) => setSelectedVisaType(e.target.value)}
                  options={['All', 'Work Visa', 'Student Visa', 'Business Visa', 'PR Visa', 'Tourist Visa']}
                />
                <SelectInput
                  label="Destination Country"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  options={['All', 'United Kingdom', 'Canada', 'USA', 'Australia', 'Germany']}
                />
                <SelectInput
                  label="Visa Status"
                  value={selectedVisaStatus}
                  onChange={(e) => setSelectedVisaStatus(e.target.value)}
                  options={['All', 'Active', 'Pending', 'Inactive']}
                />
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <HorizontalBarChart
                  title="Visa Category Distribution"
                  subtitle="Volume of applications by visa track"
                  data={visaTypeChartData}
                />
                <HorizontalBarChart
                  title="Destination Country Distribution"
                  subtitle="Applicant target countries"
                  data={countryChartData}
                />
              </div>

              {/* Table */}
              <div className="border border-slate-200/90 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Visa Application Portfolios ({filteredCustomers.length} records)
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={handleExportCSV}
                  >
                    Download CSV
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-white text-[11px] font-semibold text-slate-500 uppercase">
                        <th className="px-4 py-3">Applicant Name</th>
                        <th className="px-4 py-3">Visa Track</th>
                        <th className="px-4 py-3">Destination</th>
                        <th className="px-4 py-3">University / College</th>
                        <th className="px-4 py-3">Counsellor</th>
                        <th className="px-4 py-3">Visa Status</th>
                        <th className="px-4 py-3">Linked Bank</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {c.personalInfo.fullName}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-800">
                            {c.visaInfo.visaType}
                          </td>
                          <td className="px-4 py-3">{c.visaInfo.destinationCountry}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {c.visaInfo.university || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {c.visaInfo.counsellorName}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                c.visaInfo.visaStatus === 'Active'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {c.visaInfo.visaStatus}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-blue-700 font-medium">
                            {c.bankInfo.bankName}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 5: FD REPORTS */}
          {/* ========================================================================= */}
          {activeTab === 'fd' && (
            <div className="space-y-6">
              {/* Notice regarding FD rules */}
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold block">Fixed Deposit Reporting Policy:</strong>
                  Displays recorded term deposit holdings for visa solvency proof. Interest schedules and maturity dates reflect authentic client records without automated renewal or premature withdrawal projections.
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200/90 rounded-xl overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/80 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">
                    Client Fixed Deposit (FD) Register ({filteredCustomers.length} accounts)
                  </span>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={handleExportCSV}
                  >
                    Download CSV
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-white text-[11px] font-semibold text-slate-500 uppercase">
                        <th className="px-4 py-3">Client</th>
                        <th className="px-4 py-3">Fiduciary Partner Bank</th>
                        <th className="px-4 py-3">Branch Location</th>
                        <th className="px-4 py-3 text-right">Initial FD Amount</th>
                        <th className="px-4 py-3">FD Start Date</th>
                        <th className="px-4 py-3">Maturity Date</th>
                        <th className="px-4 py-3">Audit Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredCustomers.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-semibold text-slate-900">
                            {c.personalInfo.fullName}
                            <div className="font-mono text-[10px] text-slate-400 font-normal">
                              {c.id}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-blue-700">
                            {c.bankInfo.bankName}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{c.bankInfo.branchName}</td>
                          <td className="px-4 py-3 text-right font-bold text-purple-700 tabular-nums">
                            {formatINR(c.fdInfo?.initialFdAmount || 0)}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {c.fdInfo?.fdStartDate || '—'}
                          </td>
                          <td className="px-4 py-3 text-slate-600">{c.fdInfo?.fdEndDate || '—'}</td>
                          <td className="px-4 py-3 text-slate-500 italic">
                            Proof-of-funds holding
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
