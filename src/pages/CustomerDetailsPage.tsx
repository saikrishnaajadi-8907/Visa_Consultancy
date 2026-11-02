import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Phone,
  Mail,
  Building2,
  FileText,
  Calendar,
  ExternalLink,
  Edit,
  ShieldCheck,
  CreditCard,
  Landmark,
  Clock,
  History,
  Archive,
  CheckCircle,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Wallet,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  CornerDownRight,
  AlertTriangle,
  CheckCircle2,
  Eye,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Tabs, TabItem } from '../components/common/Tabs';
import { Card } from '../components/common/Card';
import { EmptyState } from '../components/common/EmptyState';
import { useAppState } from '../context/AppStateContext';
import { customerService } from '../services/customerService';
import { Customer, CustomerChangeHistory } from '../types/customer';
import { MOCK_CUSTOMERS } from '../constants/mockData';
import {
  financialService,
  DEMO_ACTOR_NAME,
  DEMO_ACTOR_ROLE,
} from '../services/financialService';
import { CustomerFinancialSummary, FinancialTransaction } from '../types/financial';
import { documentService } from '../services/documentService';
import { DocumentRecord, HandoverRecord } from '../types/document';
import {
  formatINR,
  formatDate,
  maskAadhaar,
  maskPAN,
  maskPassport,
  maskAccountNumber,
} from '../utils/formatters';

export const CustomerDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isEmptyStateMode } = useAppState();

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [changeHistory, setChangeHistory] = useState<CustomerChangeHistory[]>([]);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Financial Integration State (Step 3)
  const [financialSummary, setFinancialSummary] = useState<CustomerFinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<FinancialTransaction[]>([]);
  const [isLoadingFinancial, setIsLoadingFinancial] = useState<boolean>(true);

  // Documents & Custody Integration State (Step 6)
  const [customerDocs, setCustomerDocs] = useState<DocumentRecord[]>([]);
  const [customerHandovers, setCustomerHandovers] = useState<HandoverRecord[]>([]);

  // Load Financial Summary & Recent Transactions
  const loadFinancialData = useCallback(async (customerId: string) => {
    setIsLoadingFinancial(true);
    try {
      const summary = await financialService.getCustomerFinancialSummary(customerId);
      setFinancialSummary(summary);

      const allTxns = await financialService.getCustomerTransactions(customerId);
      // Sort newest first
      const sorted = [...allTxns].sort(
        (a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
      );
      setRecentTransactions(sorted.slice(0, 5));
    } catch (err) {
      console.error('Failed to load financial data for customer:', err);
    } finally {
      setIsLoadingFinancial(false);
    }
  }, []);

  const loadDocumentsAndHandovers = useCallback((customerId: string) => {
    const docs = documentService.getDocumentsForCustomer(customerId, isEmptyStateMode);
    const hos = documentService.getHandoversForCustomer(customerId, isEmptyStateMode);
    setCustomerDocs(docs);
    setCustomerHandovers(hos);
  }, [isEmptyStateMode]);

  useEffect(() => {
    async function loadCustomer() {
      if (!id) return;

      // 1. Try session customers first
      const found = await customerService.getCustomerById(id);
      if (found) {
        setCustomer(found);
        const history = await customerService.getCustomerChangeHistory(id);
        setChangeHistory(history);
        await loadFinancialData(found.id);
        loadDocumentsAndHandovers(found.id);
        return;
      }

      // 2. If in Sample Data mode, fall back to mock data only if ID matches
      if (!isEmptyStateMode && id) {
        const mock = MOCK_CUSTOMERS.find((c) => c.id === id);
        if (mock) {
          const synthesized: Customer = {
            id: mock.id,
            personalInfo: {
              fullName: mock.name,
              dateOfBirth: mock.dateOfBirth,
              gender: mock.gender as any,
              nationality: mock.nationality,
              aadhaarNumber: '543298761234',
              panNumber: 'ABCDE1234F',
              passportNumber: mock.passportNo,
              fatherName: 'Kailash Chandra',
              motherName: 'Shanti Devi',
            },
            contactInfo: {
              personalMobile: mock.mobile,
              personalEmail: mock.email,
              bankMobile: '9811234567',
              bankEmail: 'ahmed.bank@example.com',
              residentialAddress: mock.address,
            },
            visaInfo: {
              visaType: mock.visaTrack,
              consultancyName: 'Visa Consultancy Management',
              counsellorName: 'S. Mehta',
              destinationCountry: 'United Kingdom',
              university: 'University of Manchester',
              visaStatus: 'Active',
            },
            bankInfo: {
              bankId: mock.linkedBank.toLowerCase().replace(/[^a-z]/g, ''),
              bankName: mock.linkedBank,
              branchId: '',
              branchName: '',
              branchLocation: '',
              ifscCode: '',
              accountNumber: mock.accountNumber || '10293847561',
              chequeBook: 'Yes',
            },
            fdInfo: {
              initialFdAmount: 0,
              fdStartDate: '',
              fdEndDate: '',
              interestAmount: 0,
            },
            paymentInfo: {
              paidTo: 'Visa Consultancy Fiduciary Account',
              nextPaymentDate: '15-12-2026',
            },
            additionalInfo: {
              notes: 'Applicant portfolio prepared for casework review.',
              additionalRemarks: 'All solvency documentation reviewed by case officer.',
            },
            initialFinancialRecord: {
              transactionDate: mock.createdAt,
              initialAmount: mock.previousAmount || 0,
              notes: 'Verified proof-of-funds balance recorded at registration.',
            },
            status: mock.status as any,
            createdAt: mock.createdAt,
            createdBy: DEMO_ACTOR_NAME,
            updatedAt: mock.createdAt,
            updatedBy: DEMO_ACTOR_NAME,
          };
          setCustomer(synthesized);
          await loadFinancialData(synthesized.id);
          loadDocumentsAndHandovers(synthesized.id);
        } else {
          setCustomer(null);
        }
      } else {
        setCustomer(null);
      }
    }
    loadCustomer();
  }, [id, isEmptyStateMode, loadFinancialData, loadDocumentsAndHandovers]);

  const handleToggleStatus = async () => {
    if (!customer) return;
    const newStatus = customer.status === 'Active' ? 'Inactive' : 'Active';
    await customerService.setCustomerStatus(customer.id, newStatus);
    setCustomer({ ...customer, status: newStatus });
    setStatusNotice(`Customer status updated to "${newStatus}". (Note: Operational status is independent of Visa Status).`);
    const history = await customerService.getCustomerChangeHistory(customer.id);
    setChangeHistory(history);
  };

  const tabs: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'financial', label: 'Financial Ledger' },
    { id: 'documents', label: 'Documents & Custody', count: customerDocs.length },
    { id: 'personal', label: 'Personal Information' },
    { id: 'contact', label: 'Contact Details' },
    { id: 'visa', label: 'Visa & Consultancy' },
    { id: 'bank', label: 'Bank & FD Details' },
    { id: 'payment', label: 'Payment & Notes' },
    { id: 'history', label: 'Change History', count: changeHistory.length },
  ];

  if (!customer) {
    return (
      <div className="space-y-6">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>

        <EmptyState
          title="Customer Profile Not Available"
          description="In default Empty State mode, no customer records exist in the database for this reference ID. Register an applicant or switch to Sample Data mode to preview."
          actionText="Register Customer"
          onAction={() => navigate('/customers/new')}
        />
      </div>
    );
  }

  const isArchived = customer.status === 'Archived';

  // Render the Financial Overview Section (Cards & Health)
  const renderFinancialOverviewSection = () => {
    if (isLoadingFinancial) {
      return (
        <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-slate-200/80">
          Loading applicant financial position...
        </div>
      );
    }

    if (!financialSummary) {
      return (
        <div className="p-6 text-center text-slate-500 text-xs bg-slate-50 rounded-xl border border-slate-200">
          No financial summary available for this applicant.
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Section Header with Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-600" />
              <span>Financial Overview</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live proof-of-funds position, bank balances, and consultancy policy reserve compliance
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isArchived ? (
              <Button
                variant="primary"
                size="sm"
                icon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => navigate(`/financial-records?customerId=${customer.id}&action=add`)}
              >
                Log Transaction
              </Button>
            ) : (
              <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                Archived Account (Transactions Disabled)
              </span>
            )}

            <Button
              variant="secondary"
              size="sm"
              icon={<History className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/financial-records/history?customerId=${customer.id}`)}
            >
              Complete History
            </Button>

            <Button
              variant="secondary"
              size="sm"
              icon={<ExternalLink className="w-3.5 h-3.5" />}
              onClick={() => navigate(`/financial-records?customerId=${customer.id}`)}
            >
              View in Ledger
            </Button>
          </div>
        </div>

        {/* 4 Financial Position Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Current Bank Balance */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Bank Balance
              </span>
              <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Building2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {formatINR(financialSummary.currentBankBalance)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Liquid proof-of-funds balance
              </div>
            </div>
          </div>

          {/* 2. Fixed Deposit Amount */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Fixed Deposit (FD)
              </span>
              <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {formatINR(financialSummary.fdAmount)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Locked deposit holdings
              </div>
            </div>
          </div>

          {/* 3. Combined Financial Amount */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Combined Amount
              </span>
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {formatINR(financialSummary.combinedFinancialAmount)}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Bank Balance + FD Component
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
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  financialSummary.status === 'Healthy'
                    ? 'bg-emerald-50 text-emerald-600'
                    : financialSummary.status === 'Low Balance'
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-rose-50 text-rose-600'
                }`}
              >
                {financialSummary.status === 'Healthy' ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )}
              </div>
            </div>
            <div className="mt-2.5">
              <div
                className={`text-sm font-bold ${
                  financialSummary.status === 'Healthy'
                    ? 'text-emerald-700'
                    : financialSummary.status === 'Low Balance'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}
              >
                {financialSummary.status}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">
                Account balance standing
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Recent Financial Transactions Section
  const renderRecentTransactionsSection = () => {
    return (
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between pb-1">
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>Recent Financial Transactions</span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Latest 5 proof-of-funds transactions and balance updates
            </p>
          </div>

          <Link
            to={`/financial-records/history?customerId=${customer.id}`}
            className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            View Complete History ({financialSummary?.transactionCount || recentTransactions.length}) →
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/70 rounded-xl border border-slate-200/80">
            No financial transactions recorded for this customer yet.
          </div>
        ) : (
          <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Transaction Type</th>
                    <th className="px-4 py-2.5 text-center">Direction</th>
                    <th className="px-4 py-2.5 text-right whitespace-nowrap">Amount</th>
                    <th className="px-4 py-2.5 text-right whitespace-nowrap">Previous Balance</th>
                    <th className="px-4 py-2.5 text-right whitespace-nowrap">Current Balance</th>
                    <th className="px-4 py-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {recentTransactions.map((txn) => {
                    const isCorr = txn.transactionType === 'Correction Adjustment';
                    return (
                      <tr key={txn.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-2.5 whitespace-nowrap text-slate-600 font-medium">
                          {formatDate(txn.transactionDate)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1.5">
                            {isCorr && <CornerDownRight className="w-3 h-3 text-purple-600" />}
                            <span
                              className={`font-medium ${
                                isCorr ? 'text-purple-700 font-semibold' : 'text-slate-800'
                              }`}
                            >
                              {txn.transactionType}
                            </span>
                          </div>
                          {txn.description && (
                            <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                              {txn.description}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                          {txn.direction === 'Inflow' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/70">
                              <ArrowDownLeft className="w-3 h-3 text-emerald-600" />
                              Inflow
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200/70">
                              <ArrowUpRight className="w-3 h-3 text-rose-600" />
                              Outflow
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold tabular-nums whitespace-nowrap">
                          <span
                            className={
                              txn.direction === 'Inflow' ? 'text-emerald-700' : 'text-slate-900'
                            }
                          >
                            {txn.direction === 'Inflow' ? '+ ' : '- '}
                            {formatINR(txn.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right text-slate-500 tabular-nums whitespace-nowrap">
                          {formatINR(txn.previousBalance)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900 tabular-nums whitespace-nowrap">
                          {formatINR(txn.newBalance)}
                        </td>
                        <td className="px-4 py-2.5 text-center whitespace-nowrap">
                          <Link
                            to={`/financial-records/${txn.id}`}
                            className="p-1 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded inline-flex transition-colors"
                            title="Inspect Transaction Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div className="flex items-center justify-between">
        <Link
          to="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Active / Inactive Status Toggle */}
          <button
            onClick={handleToggleStatus}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
              customer.status === 'Active'
                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span>Set {customer.status === 'Active' ? 'Inactive' : 'Active'}</span>
          </button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Edit className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/customers/${customer.id}/edit`)}
          >
            Edit Profile
          </Button>
        </div>
      </div>

      {statusNotice && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{statusNotice}</span>
          </div>
          <button onClick={() => setStatusNotice(null)} className="text-blue-500 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Profile Summary Card with Masked Sensitive Data */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-2xl flex items-center justify-center shrink-0 shadow-sm">
              {customer.personalInfo.fullName.charAt(0) || 'C'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900">{customer.personalInfo.fullName}</h2>
                <Badge variant={customer.status === 'Active' ? 'active' : customer.status === 'Archived' ? 'neutral' : 'pending'}>
                  Customer: {customer.status}
                </Badge>
                <Badge variant={customer.visaInfo.visaStatus === 'Active' ? 'active' : 'pending'}>
                  Visa: {customer.visaInfo.visaStatus}
                </Badge>
                {financialSummary && (
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                      financialSummary.status === 'Healthy'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : financialSummary.status === 'Low Balance'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    Solvency: {financialSummary.status}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 mt-2">
                <span className="flex items-center gap-1.5 font-mono">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.contactInfo.personalMobile}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{customer.contactInfo.personalEmail}</span>
                </span>
                <span className="flex items-center gap-1.5 font-medium text-blue-700">
                  <Building2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>{customer.bankInfo.bankName} ({customer.bankInfo.branchName})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Masked Sensitive Identifiers Strip */}
          <div className="flex flex-wrap items-center gap-6 text-xs border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
            <div>
              <div className="text-slate-400 font-medium">Passport No</div>
              <div className="font-mono font-semibold text-slate-800 mt-0.5">
                {maskPassport(customer.personalInfo.passportNumber)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">PAN Number</div>
              <div className="font-mono font-semibold text-slate-800 mt-0.5">
                {maskPAN(customer.personalInfo.panNumber)}
              </div>
            </div>
            <div>
              <div className="text-slate-400 font-medium">Aadhaar (Masked)</div>
              <div className="font-mono font-semibold text-slate-800 mt-0.5">
                {maskAadhaar(customer.personalInfo.aadhaarNumber)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 pt-2 border-b border-slate-100">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <div className="p-6">
          {/* TAB: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* 1. Step 3: Integrated Financial Overview Section */}
              {renderFinancialOverviewSection()}

              {/* 2. Step 3: Integrated Recent Financial Transactions Section */}
              {renderRecentTransactionsSection()}

              {/* 3. Three Standard Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                {/* 1. Personal Overview */}
                <div className="rounded-xl border border-slate-200/90 p-5 bg-white">
                  <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
                    Personal Information
                  </h3>
                  <dl className="mt-4 space-y-3 text-xs">
                    <div>
                      <dt className="text-slate-400">Full Legal Name</dt>
                      <dd className="font-semibold text-slate-800 mt-0.5">{customer.personalInfo.fullName}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Date of Birth / Gender</dt>
                      <dd className="font-medium text-slate-800 mt-0.5">
                        {customer.personalInfo.dateOfBirth} ({customer.personalInfo.gender})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Nationality</dt>
                      <dd className="font-medium text-slate-800 mt-0.5">{customer.personalInfo.nationality}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Residential Address</dt>
                      <dd className="font-medium text-slate-800 mt-0.5 leading-relaxed">
                        {customer.contactInfo.residentialAddress}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* 2. Bank Overview */}
                <div className="rounded-xl border border-slate-200/90 p-5 bg-white">
                  <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
                    Bank Allocation (Permanent)
                  </h3>
                  <dl className="mt-4 space-y-3 text-xs">
                    <div>
                      <dt className="text-slate-400">Allocated Bank</dt>
                      <dd className="font-semibold text-blue-700 mt-0.5">{customer.bankInfo.bankName}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Branch & Location</dt>
                      <dd className="font-medium text-slate-800 mt-0.5">
                        {customer.bankInfo.branchName ? (
                          `${customer.bankInfo.branchName}${customer.bankInfo.branchLocation ? ` · ${customer.bankInfo.branchLocation}` : ''}`
                        ) : (
                          <span className="text-slate-400 font-normal">No branch registered</span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">IFSC Code</dt>
                      <dd className="font-mono font-medium text-slate-800 mt-0.5">
                        {customer.bankInfo.ifscCode || <span className="text-slate-400 font-normal font-sans">—</span>}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Account Number (Masked)</dt>
                      <dd className="font-mono font-semibold text-slate-900 mt-0.5">
                        {maskAccountNumber(customer.bankInfo.accountNumber)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Cheque Book Issued</dt>
                      <dd className="font-medium text-slate-800 mt-0.5">{customer.bankInfo.chequeBook}</dd>
                    </div>
                  </dl>
                </div>

                {/* 3. Visa & Consultancy Overview */}
                <div className="rounded-xl border border-slate-200/90 p-5 bg-white">
                  <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-100 pb-3">
                    Visa & Consultancy
                  </h3>
                  <dl className="mt-4 space-y-3 text-xs">
                    <div>
                      <dt className="text-slate-400">Visa Category</dt>
                      <dd className="font-semibold text-slate-800 mt-0.5">{customer.visaInfo.visaType}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Target Destination</dt>
                      <dd className="font-medium text-slate-800 mt-0.5">{customer.visaInfo.destinationCountry}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Assigned Counsellor</dt>
                      <dd className="font-medium text-slate-800 mt-0.5">{customer.visaInfo.counsellorName}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Initial Financial Note</dt>
                      <dd className="text-slate-600 mt-0.5 italic">
                        "{customer.initialFinancialRecord?.notes || 'Initial record verified'}"
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Navigation Entry Points */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                <Link
                  to={`/financial-records/history?customerId=${customer.id}`}
                  className="p-4 rounded-xl border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600">
                        Financial History Timeline
                      </h4>
                      <p className="text-[11px] text-slate-400">Inspect balance snapshots & audit trail</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                </Link>

                <Link
                  to="/documents"
                  className="p-4 rounded-xl border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-purple-600">
                        Customer Documents
                      </h4>
                      <p className="text-[11px] text-slate-400">Identity proofs & bank statements</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-purple-600" />
                </Link>

                <button
                  onClick={() => setActiveTab('history')}
                  className="p-4 rounded-xl border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex items-center justify-between group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900 group-hover:text-emerald-600">
                        Profile Audit Trail
                      </h4>
                      <p className="text-[11px] text-slate-400">{changeHistory.length} profile modification entries</p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
                </button>
              </div>
            </div>
          )}

          {/* TAB: FINANCIAL LEDGER */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              {renderFinancialOverviewSection()}
              {renderRecentTransactionsSection()}
            </div>
          )}

          {/* TAB: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="max-w-3xl space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div>
                  <span className="text-slate-400 font-medium">Full Legal Name:</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{customer.personalInfo.fullName}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Date of Birth:</span>
                  <p className="font-medium text-slate-900 mt-0.5">{customer.personalInfo.dateOfBirth}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Gender:</span>
                  <p className="font-medium text-slate-900 mt-0.5">{customer.personalInfo.gender}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Nationality:</span>
                  <p className="font-medium text-slate-900 mt-0.5">{customer.personalInfo.nationality}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Passport Number:</span>
                  <p className="font-mono font-semibold text-slate-900 mt-0.5">
                    {maskPassport(customer.personalInfo.passportNumber)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">PAN Number:</span>
                  <p className="font-mono font-semibold text-slate-900 mt-0.5">
                    {maskPAN(customer.personalInfo.panNumber)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Aadhaar (Masked):</span>
                  <p className="font-mono font-semibold text-slate-900 mt-0.5">
                    {maskAadhaar(customer.personalInfo.aadhaarNumber)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Father's Name:</span>
                  <p className="font-medium text-slate-900 mt-0.5">{customer.personalInfo.fatherName || '—'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Mother's Name:</span>
                  <p className="font-medium text-slate-900 mt-0.5">{customer.personalInfo.motherName || '—'}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: CONTACT DETAILS */}
          {activeTab === 'contact' && (
            <div className="max-w-3xl space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 font-medium">Personal Mobile:</span>
                    <p className="font-mono font-semibold text-slate-900 mt-0.5">{customer.contactInfo.personalMobile}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Personal Email:</span>
                    <p className="font-medium text-slate-900 mt-0.5">{customer.contactInfo.personalEmail}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-200/60">
                  <div>
                    <span className="text-slate-400 font-medium">Bank-Dedicated Mobile:</span>
                    <p className="font-mono font-medium text-slate-900 mt-0.5">
                      {customer.contactInfo.bankMobile || 'Same as personal'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Bank-Dedicated Email:</span>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {customer.contactInfo.bankEmail || 'Same as personal'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/60">
                  <span className="text-slate-400 font-medium">Residential Address:</span>
                  <p className="font-medium text-slate-900 mt-0.5 leading-relaxed">
                    {customer.contactInfo.residentialAddress}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: VISA & CONSULTANCY */}
          {activeTab === 'visa' && (
            <div className="max-w-3xl space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div>
                  <span className="text-slate-400 font-medium">Visa Category:</span>
                  <p className="font-semibold text-slate-900 mt-0.5">{customer.visaInfo.visaType}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Visa Status:</span>
                  <p className="font-semibold text-blue-700 mt-0.5">{customer.visaInfo.visaStatus}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Destination Country:</span>
                  <p className="font-medium text-slate-900 mt-0.5">{customer.visaInfo.destinationCountry}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">University / College:</span>
                  <p className="font-medium text-slate-900 mt-0.5">{customer.visaInfo.university || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Consultancy:</span>
                  <p className="font-medium text-slate-900 mt-0.5">{customer.visaInfo.consultancyName}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Assigned Counsellor:</span>
                  <p className="font-medium text-slate-900 mt-0.5">{customer.visaInfo.counsellorName}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB: BANK & FD DETAILS */}
          {activeTab === 'bank' && (
            <div className="max-w-3xl space-y-5 text-xs">
              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                <h4 className="font-semibold text-slate-900 border-b border-slate-200/60 pb-2">
                  Permanent Bank Allocation
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 font-medium">Bank Name:</span>
                    <p className="font-semibold text-blue-700 mt-0.5">{customer.bankInfo.bankName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Branch:</span>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {customer.bankInfo.branchName || <span className="text-slate-400 font-normal">No branch registered</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Branch Location:</span>
                    <p className="font-medium text-slate-900 mt-0.5">
                      {customer.bankInfo.branchLocation || <span className="text-slate-400 font-normal">—</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">IFSC Code:</span>
                    <p className="font-mono font-semibold text-slate-900 mt-0.5">
                      {customer.bankInfo.ifscCode || <span className="text-slate-400 font-normal font-sans">—</span>}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Account Number (Masked):</span>
                    <p className="font-mono font-semibold text-slate-900 mt-0.5">
                      {maskAccountNumber(customer.bankInfo.accountNumber)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Cheque Book Issued:</span>
                    <p className="font-medium text-slate-900 mt-0.5">{customer.bankInfo.chequeBook}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                <h4 className="font-semibold text-slate-900 border-b border-slate-200/60 pb-2">
                  Fixed Deposit (FD) Information
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400 font-medium">Initial FD Amount:</span>
                    <p className="font-bold text-slate-900 mt-0.5 tabular-nums">
                      {formatINR(customer.fdInfo?.initialFdAmount || 0)}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Interest Amount:</span>
                    <p className="font-semibold text-slate-700 mt-0.5 tabular-nums">
                      {customer.fdInfo?.interestAmount ? formatINR(customer.fdInfo.interestAmount) : 'Pending Schedule'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">FD Start Date:</span>
                    <p className="font-medium text-slate-900 mt-0.5">{customer.fdInfo?.fdStartDate || '—'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">FD End Date / Maturity:</span>
                    <p className="font-medium text-slate-900 mt-0.5">{customer.fdInfo?.fdEndDate || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PAYMENT & NOTES */}
          {activeTab === 'payment' && (
            <div className="max-w-3xl space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                <div>
                  <span className="text-slate-400 font-medium">Paid To:</span>
                  <p className="font-medium text-slate-900 mt-0.5">{customer.paymentInfo.paidTo || 'Pending Schedule'}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Next Payment Date:</span>
                  <p className="font-medium text-slate-900 mt-0.5">{customer.paymentInfo.nextPaymentDate || '—'}</p>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <span className="text-slate-400 font-medium">Case Officer Notes:</span>
                <p className="font-medium text-slate-800 leading-relaxed">
                  {customer.additionalInfo.notes || 'No general notes recorded.'}
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <span className="text-slate-400 font-medium">Additional Remarks:</span>
                <p className="font-medium text-slate-800 leading-relaxed">
                  {customer.additionalInfo.additionalRemarks || 'No additional remarks.'}
                </p>
              </div>
            </div>
          )}

          {/* TAB: DOCUMENTS & CUSTODY HANDOVERS (STEP 6) */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* Document Register Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span>Associated Customer Documents</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Identity cards, bank solvency letters, and academic verification records on file
                    </p>
                  </div>
                  <Link
                    to="/documents"
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    Manage In Repository →
                  </Link>
                </div>

                {customerDocs.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/70 rounded-xl border border-slate-200/80">
                    No documents recorded for this customer in the repository.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200/90 rounded-xl bg-white shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Document ID</th>
                          <th className="px-4 py-3">Document Name</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Received Date</th>
                          <th className="px-4 py-3 text-center">Status</th>
                          <th className="px-4 py-3">Remarks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerDocs.map((doc) => (
                          <tr key={doc.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                              {doc.id}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {doc.documentName}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                {doc.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                              {doc.receivedDate}
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <Badge
                                variant={
                                  doc.status === 'Verified'
                                    ? 'verified'
                                    : doc.status === 'Under Review'
                                    ? 'in-process'
                                    : doc.status === 'Rejected'
                                    ? 'rejected'
                                    : 'neutral'
                                }
                              >
                                {doc.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-slate-500 max-w-xs">
                              <div className="line-clamp-2">{doc.remarks || '—'}</div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Handover & Custody History Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-purple-600" />
                      <span>Document Custody & Handover History</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Physical custody movements, release slips, and consular dispatch records
                    </p>
                  </div>
                  <Link
                    to="/document-handovers"
                    className="text-xs font-semibold text-purple-600 hover:text-purple-800 transition-colors"
                  >
                    View Handover Log →
                  </Link>
                </div>

                {customerHandovers.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50/70 rounded-xl border border-slate-200/80">
                    No physical document handovers recorded for this customer.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200/90 rounded-xl bg-white shadow-xs">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          <th className="px-4 py-3">Handover Ref</th>
                          <th className="px-4 py-3">Date</th>
                          <th className="px-4 py-3">Document Item</th>
                          <th className="px-4 py-3">Given By</th>
                          <th className="px-4 py-3">Received By</th>
                          <th className="px-4 py-3">Notes & Acknowledgment</th>
                          <th className="px-4 py-3 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {customerHandovers.map((h) => (
                          <tr key={h.id} className="hover:bg-slate-50/70">
                            <td className="px-4 py-3 font-mono font-medium text-slate-700 whitespace-nowrap">
                              {h.id}
                            </td>
                            <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                              {h.handoverDate}
                            </td>
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {h.documentName}
                            </td>
                            <td className="px-4 py-3 text-slate-700">{h.givenBy}</td>
                            <td className="px-4 py-3 text-slate-700">{h.receivedBy}</td>
                            <td className="px-4 py-3 text-slate-500 max-w-xs">
                              <div className="line-clamp-2">{h.notes || '—'}</div>
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <Badge
                                variant={
                                  h.status === 'Submitted to Embassy' || h.status === 'Completed'
                                    ? 'completed'
                                    : 'in-process'
                                }
                              >
                                {h.status}
                              </Badge>
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

          {/* TAB: CUSTOMER CHANGE HISTORY (AUDIT TRAIL) */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">Customer Modification History</h3>
                  <p className="text-xs text-slate-500">Traceable audit logs of all profile field edits and status transitions</p>
                </div>
              </div>

              {changeHistory.length === 0 ? (
                <EmptyState
                  icon={<History className="w-6 h-6 text-slate-400" />}
                  title="No Changes Logged Yet"
                  description="This customer profile has not undergone any field modifications since initial registration."
                />
              ) : (
                <div className="overflow-x-auto border border-slate-200/90 rounded-xl">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase">
                        <th className="px-4 py-3">Timestamp</th>
                        <th className="px-4 py-3">Field Name</th>
                        <th className="px-4 py-3">Previous Value</th>
                        <th className="px-4 py-3">New Value</th>
                        <th className="px-4 py-3">Modified By</th>
                        <th className="px-4 py-3">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {changeHistory.map((chg) => (
                        <tr key={chg.id} className="hover:bg-slate-50/70">
                          <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                            {new Date(chg.modifiedAt).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{chg.fieldName}</td>
                          <td className="px-4 py-3 text-slate-500 font-mono">{chg.previousValue}</td>
                          <td className="px-4 py-3 text-emerald-700 font-mono font-semibold">{chg.newValue}</td>
                          <td className="px-4 py-3 text-slate-700">{chg.modifiedBy}</td>
                          <td className="px-4 py-3 text-slate-600">{chg.reason || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
