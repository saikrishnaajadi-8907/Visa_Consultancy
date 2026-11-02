import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FileText,
  ChevronLeft,
  ShieldCheck,
  Building2,
  Wallet,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  CornerDownRight,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import {
  financialService,
  DEMO_ACTOR_NAME,
  DEMO_ACTOR_ROLE,
} from '../services/financialService';
import { FinancialTransaction, FinancialCorrection } from '../types/financial';
import { formatINR, formatDate } from '../utils/formatters';

export const FinancialRecordDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const [transaction, setTransaction] = useState<FinancialTransaction | null>(null);
  const [corrections, setCorrections] = useState<FinancialCorrection[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Option B Correction Modal state
  const [isCorrModalOpen, setIsCorrModalOpen] = useState<boolean>(false);
  const [corrIntendedAmount, setCorrIntendedAmount] = useState<string>('');
  const [corrReason, setCorrReason] = useState<string>('');
  const [corrError, setCorrError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRecord() {
      if (!id) return;
      setIsLoading(true);
      try {
        const found = await financialService.getTransactionById(id);
        setTransaction(found);
        if (found) {
          const allCorrs = await financialService.getCustomerCorrections(found.customerId);
          const related = allCorrs.filter((c) => c.originalTransactionId === found.id);
          setCorrections(related);
        }
      } catch (e) {
        console.error('Failed to load transaction details:', e);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecord();
  }, [id]);

  const handleOpenCorrection = () => {
    if (!transaction) return;
    setCorrError(null);
    setCorrReason('');
    const latestAccepted = corrections.length > 0
      ? corrections[corrections.length - 1].correctedAmount
      : transaction.amount;
    setCorrIntendedAmount(String(latestAccepted));
    setIsCorrModalOpen(true);
  };

  const handleCorrectionSubmit = async () => {
    if (!transaction) return;
    setCorrError(null);
    try {
      const num = parseFloat(corrIntendedAmount);
      if (isNaN(num) || num < 0) {
        setCorrError('Intended amount must be non-negative.');
        return;
      }
      if (!corrReason.trim()) {
        setCorrError('Mandatory correction reason must be provided.');
        return;
      }

      await financialService.createCorrection({
        customerId: transaction.customerId,
        originalTransactionId: transaction.id,
        correctedAmount: num,
        correctionReason: corrReason.trim(),
      });

      setIsCorrModalOpen(false);
      // Reload
      const updated = await financialService.getTransactionById(transaction.id);
      setTransaction(updated);
      const allCorrs = await financialService.getCustomerCorrections(transaction.customerId);
      setCorrections(allCorrs.filter((c) => c.originalTransactionId === transaction.id));
    } catch (e: any) {
      setCorrError(e.message || 'Correction failed.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-slate-500 text-xs">
        Loading financial record details...
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={
            <Breadcrumbs
              items={[
                { label: 'Financial Records', href: '/financial-records' },
                { label: 'Record Not Found' },
              ]}
            />
          }
          title="Financial Record Not Found"
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
        <div className="bg-white rounded-xl border border-slate-200/90 p-8">
          <EmptyState
            title="Transaction Record Not Found"
            description={`No transaction record with ID "${id}" exists in the in-memory ledger.`}
            actionText="Return to Financial Records"
            onAction={() => navigate('/financial-records')}
          />
        </div>
      </div>
    );
  }

  const isCorrection = transaction.transactionType === 'Correction Adjustment';

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Financial Records', href: '/financial-records' },
              { label: transaction.id },
            ]}
          />
        }
        title={`Financial Record: ${transaction.id}`}
        subtitle="Audit-grade proof-of-funds balance transaction record and provenance tracking"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={<ChevronLeft className="w-4 h-4" />}
              onClick={() => navigate('/financial-records')}
            >
              Back to Ledger
            </Button>
            {!isCorrection && (
              <Button
                variant="primary"
                onClick={handleOpenCorrection}
              >
                Option B Correction
              </Button>
            )}
          </div>
        }
      />

      {/* Main Details Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6 space-y-6">
        {/* Top Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
          <div>
            <span className="text-slate-400 text-xs block">Customer Identifier</span>
            <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
              {transaction.customerId}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-xs block">Linked Bank & Branch</span>
            <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
              {transaction.bankName || 'Fiduciary Bank'}
            </span>
            <span className="text-[11px] text-slate-500">{transaction.branchName || ''}</span>
          </div>
          <div>
            <span className="text-slate-400 text-xs block">Masked Account Number</span>
            <span className="font-mono font-medium text-slate-800 text-sm mt-0.5 block">
              {transaction.accountNumberMasked || 'XXXX 0000'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-xs block">Transaction Date</span>
            <span className="font-semibold text-slate-900 text-sm mt-0.5 block">
              {formatDate(transaction.transactionDate)}
            </span>
          </div>
        </div>

        {/* Balance Snapshot Strip */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
          <div>
            <span className="text-xs text-slate-500 font-medium block">Previous Balance Snapshot</span>
            <span className="text-xl font-bold text-slate-700 tabular-nums mt-1 block">
              {formatINR(transaction.previousBalance)}
            </span>
          </div>
          <div className="sm:border-x sm:border-slate-200 sm:px-4">
            <span className="text-xs text-slate-500 font-medium block">
              Transaction Amount ({transaction.direction})
            </span>
            <span
              className={`text-xl font-bold tabular-nums mt-1 block ${
                transaction.direction === 'Inflow' ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {transaction.direction === 'Inflow' ? '+ ' : '- '}
              {formatINR(transaction.amount)}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Resulting Current Balance</span>
            <span className="text-xl font-bold text-slate-900 tabular-nums mt-1 block">
              {formatINR(transaction.newBalance)}
            </span>
          </div>
        </div>

        {/* Description & Mandatory Notes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="font-semibold text-slate-700 block mb-1">Transaction Description:</span>
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800">
              {transaction.description || '—'}
            </div>
          </div>
          <div>
            <span className="font-semibold text-slate-700 block mb-1">Mandatory Officer Notes:</span>
            <div className="p-3 bg-white border border-slate-200 rounded-lg text-slate-800 whitespace-pre-wrap">
              {transaction.notes || 'No supplementary notes.'}
            </div>
          </div>
        </div>

        {/* Option B Traceability (if this is a correction adjustment) */}
        {isCorrection && (
          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-xl text-purple-950 text-xs space-y-2">
            <div className="font-semibold text-purple-900 flex items-center gap-2 text-sm">
              <CornerDownRight className="w-4 h-4" />
              <span>Option B Current Balance Correction Record</span>
            </div>
            <p className="text-slate-600">
              This entry represents a non-destructive current balance adjustment. The original record was preserved without modification.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
              <div>
                <span className="text-slate-500">Correction ID:</span>
                <span className="font-mono font-semibold ml-1">{transaction.correctionId}</span>
              </div>
              <div>
                <span className="text-slate-500">Original Transaction Reference:</span>
                <span className="font-mono font-semibold ml-1">{transaction.originalTransactionId}</span>
              </div>
            </div>
          </div>
        )}

        {/* Existing Corrections Chain for this Transaction */}
        {corrections.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h4 className="font-semibold text-sm text-slate-800 flex items-center gap-2">
              <CornerDownRight className="w-4 h-4 text-purple-600" />
              <span>Option B Correction Adjustments Applied to this Record ({corrections.length})</span>
            </h4>
            <div className="border border-purple-200 rounded-xl divide-y divide-purple-100 overflow-hidden bg-purple-50/20 text-xs">
              {corrections.map((c) => (
                <div key={c.id} className="p-4 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-purple-900">{c.id}</span>
                    <span
                      className={`font-bold tabular-nums ${
                        c.adjustmentAmount > 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {c.adjustmentAmount > 0 ? '+ ' : ''}
                      {formatINR(c.adjustmentAmount)}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Corrected Intended Amount: {formatINR(c.correctedAmount)} (Previously Accepted:{' '}
                    {formatINR(c.previouslyAcceptedAmount)})
                  </div>
                  <div className="text-purple-950 italic">Reason: {c.correctionReason}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Audit Provenance Footer */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Recorded by:{' '}
            <strong className="text-slate-800 font-semibold">{transaction.createdBy || DEMO_ACTOR_NAME}</strong>{' '}
            ({DEMO_ACTOR_ROLE})
          </div>
          <div>Logged: {formatDate(transaction.createdAt)}</div>
        </div>
      </div>

      {/* Option B Modal */}
      {isCorrModalOpen && (
        <Modal
          isOpen={true}
          onClose={() => setIsCorrModalOpen(false)}
          title={`Option B Correction: ${transaction.id}`}
          subtitle="Non-destructive current balance adjustment"
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setIsCorrModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCorrectionSubmit}>
                Apply Adjustment
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            {corrError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg">
                {corrError}
              </div>
            )}
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Intended Corrected Amount (INR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={corrIntendedAmount}
                onChange={(e) => setCorrIntendedAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-medium mb-1">
                Mandatory Correction Reason <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                value={corrReason}
                onChange={(e) => setCorrReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
