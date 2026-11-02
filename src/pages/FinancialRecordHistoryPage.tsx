import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  History,
  ChevronLeft,
  Calendar,
  Building2,
  Wallet,
  ShieldCheck,
  CornerDownRight,
  User,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Button } from '../components/common/Button';
import { SelectInput } from '../components/forms/SelectInput';
import { EmptyState } from '../components/common/EmptyState';
import {
  financialService,
  DEMO_ACTOR_NAME,
  DEMO_ACTOR_ROLE,
} from '../services/financialService';
import { customerService } from '../services/customerService';
import { MOCK_CUSTOMERS } from '../constants/mockData';
import { useAppState } from '../context/AppStateContext';
import {
  FinancialTransaction,
  FinancialCorrection,
  FinancialAuditEntry,
  CustomerFinancialSummary,
} from '../types/financial';
import { Customer } from '../types/customer';
import { formatINR, formatDate, maskAccountNumber } from '../utils/formatters';

export const FinancialRecordHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isEmptyStateMode } = useAppState();

  const [customers, setCustomers] = useState<
    Array<{ id: string; name: string; bank: string }>
  >([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    searchParams.get('customerId') || ''
  );
  const [historyData, setHistoryData] = useState<{
    transactions: FinancialTransaction[];
    corrections: FinancialCorrection[];
    auditEntries: FinancialAuditEntry[];
  } | null>(null);
  const [summary, setSummary] = useState<CustomerFinancialSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load customer options
  useEffect(() => {
    async function loadCustomers() {
      const sessionCusts: Customer[] = await customerService.getCustomers();
      const list: Array<{ id: string; name: string; bank: string }> = [];
      const seen = new Set<string>();

      for (const sc of sessionCusts) {
        list.push({
          id: sc.id,
          name: sc.personalInfo.fullName,
          bank: sc.bankInfo.bankName,
        });
        seen.add(sc.id);
      }

      if (!isEmptyStateMode) {
        for (const mc of MOCK_CUSTOMERS) {
          if (!seen.has(mc.id)) {
            list.push({
              id: mc.id,
              name: mc.name,
              bank: mc.linkedBank,
            });
            seen.add(mc.id);
          }
        }
      }

      setCustomers(list);

      // Default select first customer if none specified
      const initialId = searchParams.get('customerId') || list[0]?.id || '';
      setSelectedCustomerId(initialId);
    }

    loadCustomers();
  }, [isEmptyStateMode, searchParams]);

  // Load history data for selected customer
  useEffect(() => {
    async function loadCustomerHistory() {
      if (!selectedCustomerId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const hist = await financialService.getCustomerTransactionHistory(selectedCustomerId);
        setHistoryData(hist);
        const sum = await financialService.getCustomerFinancialSummary(selectedCustomerId);
        setSummary(sum);
      } catch (e) {
        console.error('Failed to load history:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadCustomerHistory();
  }, [selectedCustomerId]);

  const handleSelectCustomer = (newId: string) => {
    setSelectedCustomerId(newId);
    setSearchParams({ customerId: newId });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Financial Records', href: '/financial-records' },
              { label: 'Chronological History' },
            ]}
          />
        }
        title="Customer Proof-of-Funds Chronological History"
        subtitle="Audit-grade timeline of balance snapshots, transaction receipts, Option B corrections, and verified ledger provenance"
        actions={
          <Button
            variant="secondary"
            icon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => navigate('/financial-records')}
          >
            Back to Ledger
          </Button>
        }
      />

      {/* Customer Selector Strip */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <User className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="w-full sm:w-72">
            <SelectInput
              label="Selected Applicant Account"
              value={selectedCustomerId}
              onChange={(e) => handleSelectCustomer(e.target.value)}
              options={customers.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.bank})`,
              }))}
            />
          </div>
        </div>

        {summary && (
          <div className="flex flex-wrap items-center gap-5 sm:gap-6 text-xs text-slate-600 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
            <div>
              <span className="text-slate-400 block text-[11px]">Bank Balance</span>
              <span className="font-bold text-slate-900 text-sm tabular-nums">
                {formatINR(summary.currentBankBalance)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Fixed Deposit</span>
              <span className="font-bold text-purple-700 text-sm tabular-nums">
                {formatINR(summary.fdAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Combined Amount</span>
              <span className="font-bold text-blue-700 text-sm tabular-nums">
                {formatINR(summary.combinedFinancialAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Account Health</span>
              <span
                className={`font-semibold text-xs px-2 py-0.5 rounded ${
                  summary.status === 'Healthy'
                    ? 'bg-emerald-50 text-emerald-700'
                    : summary.status === 'Low Balance'
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {summary.status}
              </span>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center text-slate-500 text-xs">
          Loading chronological history...
        </div>
      ) : !historyData || historyData.transactions.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-8">
          <EmptyState
            icon={<History className="w-8 h-8 text-blue-600" />}
            title="No Transaction History Recorded"
            description="There are no financial transactions recorded for this applicant in the current session."
            actionText="Go to Ledger to Log Entry"
            onAction={() => navigate('/financial-records')}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Timeline of Transactions (2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-blue-600" />
                <span>Chronological Transaction Ledger</span>
              </h3>

              <div className="relative border-l-2 border-slate-200 ml-3 space-y-6 my-2 pl-5">
                {historyData.transactions.map((t) => {
                  const isCorr = t.transactionType === 'Correction Adjustment';
                  return (
                    <div key={t.id} className="relative">
                      {/* Marker */}
                      <div
                        className={`absolute -left-[27px] top-0.5 w-4 h-4 rounded-full border-2 border-white ${
                          isCorr
                            ? 'bg-purple-600 ring-2 ring-purple-100'
                            : t.direction === 'Inflow'
                            ? 'bg-emerald-600 ring-2 ring-emerald-100'
                            : 'bg-rose-600 ring-2 ring-rose-100'
                        }`}
                      />

                      <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-4 space-y-2 hover:border-slate-300 transition-colors">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-slate-800">{t.id}</span>
                            <span className="text-[11px] text-slate-500">
                              {formatDate(t.transactionDate)}
                            </span>
                            {isCorr && (
                              <span className="text-[10px] font-medium bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                                Option B Adjustment
                              </span>
                            )}
                          </div>
                          <div
                            className={`font-bold tabular-nums text-sm ${
                              t.direction === 'Inflow' ? 'text-emerald-700' : 'text-slate-900'
                            }`}
                          >
                            {t.direction === 'Inflow' ? '+ ' : '- '}
                            {formatINR(t.amount)}
                          </div>
                        </div>

                        <div className="text-xs text-slate-700 font-medium">{t.description}</div>

                        {t.notes && (
                          <div className="text-[11px] text-slate-500 italic bg-white/80 p-2 rounded border border-slate-200/60">
                            Notes: {t.notes}
                          </div>
                        )}

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                          <span>
                            Prev: {formatINR(t.previousBalance)} →{' '}
                            <strong className="text-slate-900 font-semibold">
                              New: {formatINR(t.newBalance)}
                            </strong>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            By {t.createdBy || DEMO_ACTOR_NAME}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar: Option B Corrections & Audit Trail (1 Col) */}
          <div className="space-y-6">
            {/* Option B Corrections */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CornerDownRight className="w-4 h-4 text-purple-600" />
                <span>Option B Corrections ({historyData.corrections.length})</span>
              </h3>

              {historyData.corrections.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No corrections applied to this account.</p>
              ) : (
                <div className="space-y-3">
                  {historyData.corrections.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 bg-purple-50/40 border border-purple-200 rounded-lg text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-purple-900 text-[11px]">{c.id}</span>
                        <span
                          className={`font-bold tabular-nums ${
                            c.adjustmentAmount > 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {c.adjustmentAmount > 0 ? '+ ' : ''}
                          {formatINR(c.adjustmentAmount)}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Target Txn: <span className="font-mono font-medium">{c.originalTransactionId}</span>
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Corrected to: {formatINR(c.correctedAmount)} (from {formatINR(c.previouslyAcceptedAmount)})
                      </div>
                      <div className="text-[11px] text-purple-950 italic bg-white/70 p-1.5 rounded border border-purple-100">
                        {c.correctionReason}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Audit Log Entries */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Audit Trail ({historyData.auditEntries.length})</span>
              </h3>

              <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto text-xs">
                {historyData.auditEntries.map((a) => (
                  <div key={a.id} className="py-2.5 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 text-[11px]">{a.action}</span>
                      <span className="text-[10px] text-slate-400">{formatDate(a.timestamp)}</span>
                    </div>
                    <p className="text-slate-600 text-[11px]">{a.details}</p>
                    <div className="text-[10px] text-slate-400">
                      Officer: {a.actor} ({a.role})
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
