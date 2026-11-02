import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Landmark,
  Search,
  Building2,
  GitBranch,
  ShieldCheck,
  AlertTriangle,
  Edit2,
  Power,
  Trash2,
  CheckCircle2,
  Info,
  Clock,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { SearchInput } from '../components/forms/SearchInput';
import { SelectInput } from '../components/forms/SelectInput';
import { Modal } from '../components/common/Modal';
import { TextInput } from '../components/forms/TextInput';
import { bankService } from '../services/bankService';
import { BankMaster, MasterStatus } from '../types/bank';
import { formatDate } from '../utils/formatters';

export const BankMasterPage: React.FC = () => {
  const navigate = useNavigate();

  const [banks, setBanks] = useState<BankMaster[]>([]);
  const [branchCounts, setBranchCounts] = useState<Record<string, number>>({});
  const [linkedCustCounts, setLinkedCustCounts] = useState<Record<string, number>>({});
  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<MasterStatus | 'All'>('All');
  const [loading, setLoading] = useState<boolean>(true);

  // Modals state
  const [editingBank, setEditingBank] = useState<BankMaster | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editNotes, setEditNotes] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  const [statusModalBank, setStatusModalBank] = useState<BankMaster | null>(null);
  const [statusReason, setStatusReason] = useState<string>('');

  const [deleteModalBank, setDeleteModalBank] = useState<BankMaster | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const bankList = await bankService.getBanks();
      setBanks(bankList);

      const bCounts: Record<string, number> = {};
      const cCounts: Record<string, number> = {};

      for (const b of bankList) {
        const branches = await bankService.getBranches({ bankId: b.id });
        bCounts[b.id] = branches.length;
        cCounts[b.id] = await bankService.getLinkedCustomerCountForBank(b.id);
      }

      setBranchCounts(bCounts);
      setLinkedCustCounts(cCounts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredBanks = useMemo(() => {
    let list = [...banks];
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (b) => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)
      );
    }
    if (selectedStatus !== 'All') {
      list = list.filter((b) => b.status === selectedStatus);
    }
    return list;
  }, [banks, search, selectedStatus]);

  // Edit Handlers
  const handleOpenEdit = (bank: BankMaster) => {
    setEditingBank(bank);
    setEditName(bank.name);
    setEditNotes(bank.notes || '');
    setEditReason('');
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingBank) return;
    if (!editName.trim()) {
      setEditError('Bank name is required.');
      return;
    }
    try {
      await bankService.updateBank(editingBank.id, {
        name: editName.trim(),
        notes: editNotes.trim() || undefined,
        changeReason: editReason.trim() || 'Bank master amendment',
      });
      showToast(`Bank "${editName}" updated successfully.`);
      setEditingBank(null);
      await loadData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update bank.');
    }
  };

  // Status Handlers
  const handleToggleStatus = async () => {
    if (!statusModalBank) return;
    const nextStatus: MasterStatus = statusModalBank.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await bankService.toggleBankStatus(
        statusModalBank.id,
        nextStatus,
        statusReason.trim() || `Status updated to ${nextStatus}`
      );
      showToast(
        `Bank "${statusModalBank.name}" marked as ${nextStatus}. ${
          nextStatus === 'Inactive' ? 'Existing customer records retain their allocation.' : ''
        }`
      );
      setStatusModalBank(null);
      setStatusReason('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to change status.');
    }
  };

  // Delete Handlers
  const handleDeleteAttempt = async (bank: BankMaster) => {
    setDeleteModalBank(bank);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalBank) return;
    const result = await bankService.deleteBank(deleteModalBank.id);
    if (!result.success) {
      setDeleteError(result.error || 'Deletion failed.');
      await loadData();
    } else {
      showToast(`Bank "${deleteModalBank.name}" removed.`);
      setDeleteModalBank(null);
      await loadData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#111C34] text-white text-xs px-4 py-3 rounded-xl shadow-lg border border-blue-500/30 flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <PageHeader
        title="Bank Master Management"
        subtitle="10 approved fiduciary banking institutions authorized for visa applicant proof-of-funds"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              icon={<GitBranch className="w-4 h-4 text-blue-600" />}
              onClick={() => navigate('/branches')}
            >
              Open Branch Master
            </Button>
          </div>
        }
      />

      {/* Institutional Notice Callout */}
      <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-center gap-3">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
        <p className="text-blue-900 font-medium">
          Only client-approved banks are available for new registrations.
        </p>
      </div>

      {/* Filter and Metric Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-8">
          <SearchInput
            placeholder="Search bank by name or code (e.g. HDFC, State Bank of India, ICICI)..."
            value={search}
            onSearchChange={setSearch}
          />
        </div>
        <div className="md:col-span-4">
          <SelectInput
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as MasterStatus | 'All')}
            options={[
              { value: 'All', label: 'All Statuses' },
              { value: 'Active', label: 'Active' },
              { value: 'Inactive', label: 'Inactive' },
            ]}
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-semibold text-slate-900 tracking-wide uppercase">
              Approved Bank Records ({filteredBanks.length} of {banks.length})
            </h2>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            Active: <span className="text-emerald-700 font-semibold">{banks.filter(b => b.status === 'Active').length}</span> · Inactive: <span className="text-slate-700 font-semibold">{banks.filter(b => b.status === 'Inactive').length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-600 tracking-wider">
                <th className="py-3 px-4">Bank ID</th>
                <th className="py-3 px-4">Bank Name & Code</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Configured Branches</th>
                <th className="py-3 px-4">Linked Customers</th>
                <th className="py-3 px-4">Last Modified</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBanks.map((bank) => {
                const bCount = branchCounts[bank.id] ?? 0;
                const cCount = linkedCustCounts[bank.id] ?? 0;
                const isActive = bank.status === 'Active';

                return (
                  <tr key={bank.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-500">
                      {bank.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{bank.name}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                        <span className="font-mono bg-slate-100 px-1.5 py-0.2 rounded text-[10px] text-slate-600 font-semibold">
                          {bank.code}
                        </span>
                        {bank.notes && <span>· {bank.notes}</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => navigate(`/branches?bankId=${bank.id}`)}
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium group"
                      >
                        <GitBranch className="w-3.5 h-3.5" />
                        <span>{bCount} branch{bCount === 1 ? '' : 'es'}</span>
                        <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-medium ${cCount > 0 ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                        {cCount} customer{cCount === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      <div>{formatDate(bank.lastModifiedAt)}</div>
                      <div className="text-[10px] text-slate-400">{bank.lastModifiedBy}</div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5 justify-end">
                        <button
                          onClick={() => handleOpenEdit(bank)}
                          title="Edit Bank Information"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setStatusModalBank(bank);
                            setStatusReason('');
                          }}
                          title={isActive ? 'Deactivate Bank' : 'Activate Bank'}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isActive
                              ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                              : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAttempt(bank)}
                          title="Delete Bank (Protected)"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT BANK MODAL */}
      <Modal
        isOpen={!!editingBank}
        onClose={() => setEditingBank(null)}
        title={`Edit Bank Master: ${editingBank?.name}`}
      >
        <div className="space-y-4">
          {editError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {editError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Bank ID (Immutable)</label>
            <input
              type="text"
              disabled
              value={editingBank?.id || ''}
              className="w-full text-xs font-mono bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-600"
            />
          </div>

          <TextInput
            label="Official Bank Name"
            required
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
          />

          <TextInput
            label="Notes / Description"
            optional
            placeholder="e.g. Approved fiduciary partner bank"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
          />

          <TextInput
            label="Reason for Modification (Audit Trail)"
            optional
            placeholder="e.g. Updated institutional partner notes"
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
          />

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-start gap-2">
            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>
              All modifications generate an in-memory audit entry tagged with actor{' '}
              <strong>"Demo User"</strong>.
            </span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="secondary" onClick={() => setEditingBank(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              Save Bank Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* TOGGLE STATUS CONFIRMATION MODAL */}
      <Modal
        isOpen={!!statusModalBank}
        onClose={() => setStatusModalBank(null)}
        title={
          statusModalBank?.status === 'Active'
            ? `Deactivate Bank: ${statusModalBank?.name}`
            : `Activate Bank: ${statusModalBank?.name}`
        }
      >
        <div className="space-y-4">
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${
              statusModalBank?.status === 'Active'
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              {statusModalBank?.status === 'Active' ? (
                <>
                  <div className="font-semibold mb-1">Notice on Deactivation:</div>
                  Deactivating <strong>{statusModalBank?.name}</strong> will exclude it from future customer registration dropdowns and prevent the creation of new branches under this bank.
                  <div className="mt-2 font-medium">
                    Confirmed Business Rule: All existing customer records ({linkedCustCounts[statusModalBank?.id || ''] || 0} linked clients) and existing branch records will permanently retain their historical allocation.
                  </div>
                </>
              ) : (
                <>
                  <div className="font-semibold mb-1">Notice on Activation:</div>
                  Reactivating <strong>{statusModalBank?.name}</strong> will make it immediately available for new customer registrations and branch configuration.
                </>
              )}
            </div>
          </div>

          <TextInput
            label="Change Reason"
            optional
            placeholder="e.g. Client operational review / Fiduciary status update"
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="secondary" onClick={() => setStatusModalBank(null)}>
              Cancel
            </Button>
            <Button
              variant={statusModalBank?.status === 'Active' ? 'danger' : 'primary'}
              onClick={handleToggleStatus}
            >
              Confirm {statusModalBank?.status === 'Active' ? 'Deactivation' : 'Activation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE / LINKED RECORD PROTECTION MODAL */}
      <Modal
        isOpen={!!deleteModalBank}
        onClose={() => setDeleteModalBank(null)}
        title={`Delete Protection: ${deleteModalBank?.name}`}
      >
        <div className="space-y-4">
          {deleteError ? (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold">Action Blocked by Business Integrity Rules</div>
                <div className="mt-1 leading-relaxed">{deleteError}</div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-2">
              <div className="font-semibold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Linked Record Safety Verification
              </div>
              <p>
                Deleting a bank is only permitted if it has <strong>zero linked customer records</strong> and <strong>zero branch records</strong>.
              </p>
              <div className="text-slate-600 mt-2">
                Currently linked customers:{' '}
                <strong>{linkedCustCounts[deleteModalBank?.id || ''] || 0}</strong>
                <br />
                Currently configured branches:{' '}
                <strong>{branchCounts[deleteModalBank?.id || ''] || 0}</strong>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="secondary" onClick={() => setDeleteModalBank(null)}>
              Close
            </Button>
            {!deleteError && (
              <Button variant="danger" onClick={handleConfirmDelete}>
                Attempt Delete
              </Button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};
