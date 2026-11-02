import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  GitBranch,
  Plus,
  Search,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Edit2,
  Power,
  Trash2,
  CheckCircle2,
  Info,
  Clock,
  Eye,
  Check,
  X,
  FileCheck2,
  AlertCircle,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { SearchInput } from '../components/forms/SearchInput';
import { SelectInput } from '../components/forms/SelectInput';
import { Modal } from '../components/common/Modal';
import { TextInput } from '../components/forms/TextInput';
import { EmptyState } from '../components/common/EmptyState';
import { bankService } from '../services/bankService';
import { BankMaster, BranchMaster, MasterStatus } from '../types/bank';
import { validateIFSC, normalizeIFSC } from '../utils/validation';
import { formatDate } from '../utils/formatters';

import { useAppState } from '../context/AppStateContext';

export const BranchMasterPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isEmptyStateMode } = useAppState();

  const [banks, setBanks] = useState<BankMaster[]>([]);
  const [branches, setBranches] = useState<BranchMaster[]>([]);
  const [linkedCustCounts, setLinkedCustCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [selectedBankId, setSelectedBankId] = useState<string>(
    searchParams.get('bankId') || 'All'
  );
  const [selectedStatus, setSelectedStatus] = useState<MasterStatus | 'All'>('All');
  const [isVerifiedOnly, setIsVerifiedOnly] = useState<boolean>(false);

  // Modal states: Add Branch
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [addBankId, setAddBankId] = useState<string>('');
  const [addBranchName, setAddBranchName] = useState<string>('');
  const [addBranchLocation, setAddBranchLocation] = useState<string>('');
  const [addIfscCode, setAddIfscCode] = useState<string>('');
  // Modal states: Dedicated Verify Branch
  const [verifyModalBranch, setVerifyModalBranch] = useState<BranchMaster | null>(null);
  const [verifyEvidenceNotes, setVerifyEvidenceNotes] = useState<string>('');
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  // Modal states: Edit Branch
  const [editingBranch, setEditingBranch] = useState<BranchMaster | null>(null);
  const [editBranchName, setEditBranchName] = useState<string>('');
  const [editBranchLocation, setEditBranchLocation] = useState<string>('');
  const [editIfscCode, setEditIfscCode] = useState<string>('');
  const [editIsVerified, setEditIsVerified] = useState<boolean>(true);
  const [editVerificationNotes, setEditVerificationNotes] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [editError, setEditError] = useState<string | null>(null);

  // Modal states: Details
  const [detailBranch, setDetailBranch] = useState<BranchMaster | null>(null);

  // Modal states: Status toggle
  const [statusModalBranch, setStatusModalBranch] = useState<BranchMaster | null>(null);
  const [statusReason, setStatusReason] = useState<string>('');

  // Modal states: Delete attempt
  const [deleteModalBranch, setDeleteModalBranch] = useState<BranchMaster | null>(null);
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

      const branchList = await bankService.getBranches({ isSampleMode: !isEmptyStateMode });
      setBranches(branchList);

      const cCounts: Record<string, number> = {};
      for (const br of branchList) {
        cCounts[br.id] = await bankService.getLinkedCustomerCountForBranch(br.id);
      }
      setLinkedCustCounts(cCounts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isEmptyStateMode]);

  // Update query param when filter changes
  const handleBankFilterChange = (val: string) => {
    setSelectedBankId(val);
    if (val === 'All') {
      searchParams.delete('bankId');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ bankId: val });
    }
  };

  const filteredBranches = useMemo(() => {
    let list = [...branches];

    if (selectedBankId !== 'All') {
      list = list.filter((br) => br.bankId === selectedBankId);
    }

    if (selectedStatus !== 'All') {
      list = list.filter((br) => br.status === selectedStatus);
    }

    if (isVerifiedOnly) {
      list = list.filter((br) => br.isVerified);
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      list = list.filter(
        (br) =>
          br.branchName.toLowerCase().includes(q) ||
          br.ifscCode.toLowerCase().includes(q) ||
          br.branchLocation.toLowerCase().includes(q) ||
          br.bankName.toLowerCase().includes(q)
      );
    }

    return list;
  }, [branches, selectedBankId, selectedStatus, isVerifiedOnly, search]);

  // Active banks for Add dropdown
  const activeBanks = useMemo(() => {
    return banks.filter((b) => b.status === 'Active');
  }, [banks]);

  // Handlers: Add Branch
  const handleOpenAdd = () => {
    const defaultBank = selectedBankId !== 'All' ? selectedBankId : (activeBanks[0]?.id || '');
    setAddBankId(defaultBank);
    setAddBranchName('');
    setAddBranchLocation('');
    setAddIfscCode('');
    setAddError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveAdd = async () => {
    setAddError(null);
    if (!addBankId) {
      setAddError('Please select a bank.');
      return;
    }
    if (!addBranchName.trim()) {
      setAddError('Branch name is required.');
      return;
    }
    if (!addBranchLocation.trim()) {
      setAddError('Branch location / address is required.');
      return;
    }
    const ifscCheck = validateIFSC(addIfscCode);
    if (!ifscCheck.isValid) {
      setAddError(ifscCheck.error || 'Invalid IFSC format.');
      return;
    }

    try {
      const created = await bankService.createBranch({
        bankId: addBankId,
        branchName: addBranchName.trim(),
        branchLocation: addBranchLocation.trim(),
        ifscCode: addIfscCode.trim(),
        status: 'Active',
      });

      showToast(`Branch "${created.branchName}" created in Unverified status.`);
      setIsAddModalOpen(false);
      await loadData();
    } catch (err: any) {
      setAddError(err.message || 'Failed to create branch.');
    }
  };

  // Dedicated verification handler
  const handleConfirmVerify = async () => {
    if (!verifyModalBranch) return;
    setVerifyError(null);
    if (!verifyEvidenceNotes.trim()) {
      setVerifyError('Verification evidence note is required. Blank or whitespace-only evidence is rejected.');
      return;
    }

    try {
      await bankService.verifyBranch(verifyModalBranch.id, verifyEvidenceNotes.trim());
      showToast(`Branch "${verifyModalBranch.branchName}" verified successfully.`);
      setVerifyModalBranch(null);
      setVerifyEvidenceNotes('');
      await loadData();
    } catch (err: any) {
      setVerifyError(err.message || 'Failed to verify branch.');
    }
  };

  // Handlers: Edit Branch
  const handleOpenEdit = (branch: BranchMaster) => {
    setEditingBranch(branch);
    setEditBranchName(branch.branchName);
    setEditBranchLocation(branch.branchLocation);
    setEditIfscCode(branch.ifscCode);
    setEditIsVerified(branch.isVerified);
    setEditVerificationNotes(branch.verificationNotes || '');
    setEditReason('');
    setEditError(null);
  };

  const handleSaveEdit = async () => {
    if (!editingBranch) return;
    setEditError(null);

    if (!editBranchName.trim()) {
      setEditError('Branch name is required.');
      return;
    }
    if (!editBranchLocation.trim()) {
      setEditError('Branch location is required.');
      return;
    }
    const ifscCheck = validateIFSC(editIfscCode);
    if (!ifscCheck.isValid) {
      setEditError(ifscCheck.error || 'Invalid IFSC format.');
      return;
    }

    // Detect if authoritative branch details changed
    const nameChanged = editBranchName.trim() !== editingBranch.branchName;
    const locChanged = editBranchLocation.trim() !== editingBranch.branchLocation;
    const ifscChanged = normalizeIFSC(editIfscCode) !== editingBranch.ifscCode;
    const detailsChanged = nameChanged || locChanged || ifscChanged;

    if (editIsVerified) {
      if (!editVerificationNotes.trim()) {
        setEditError(
          'Verification evidence note is required when marking a branch as client-confirmed. Blank or whitespace-only evidence is rejected.'
        );
        return;
      }
      // If previously verified and details changed, require fresh evidence
      if (editingBranch.isVerified && detailsChanged) {
        if (editVerificationNotes.trim() === (editingBranch.verificationNotes || '').trim()) {
          setEditError(
            'Authoritative branch details (Name, Location, or IFSC) have changed. Fresh client confirmation evidence note is required to re-confirm this record, or uncheck "Client-Confirmed" to save as unverified.'
          );
          return;
        }
      }
    }

    try {
      await bankService.updateBranch(editingBranch.id, {
        branchName: editBranchName.trim(),
        branchLocation: editBranchLocation.trim(),
        ifscCode: editIfscCode.trim(),
        isVerified: editIsVerified,
        verificationNotes: editIsVerified ? editVerificationNotes.trim() : (editVerificationNotes.trim() || undefined),
        changeReason: editReason.trim() || 'Branch master update',
      });

      showToast(`Branch "${editBranchName}" updated successfully.`);
      setEditingBranch(null);
      await loadData();
    } catch (err: any) {
      setEditError(err.message || 'Failed to update branch.');
    }
  };

  // Handlers: Status toggle
  const handleToggleStatus = async () => {
    if (!statusModalBranch) return;
    const nextStatus: MasterStatus = statusModalBranch.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await bankService.toggleBranchStatus(
        statusModalBranch.id,
        nextStatus,
        statusReason.trim() || `Status updated to ${nextStatus}`
      );
      showToast(
        `Branch "${statusModalBranch.branchName}" marked as ${nextStatus}. ${
          nextStatus === 'Inactive' ? 'Existing customer allocations remain intact.' : ''
        }`
      );
      setStatusModalBranch(null);
      setStatusReason('');
      await loadData();
    } catch (err: any) {
      showToast(err.message || 'Failed to change branch status.');
    }
  };

  // Handlers: Delete attempt
  const handleDeleteAttempt = async (branch: BranchMaster) => {
    setDeleteModalBranch(branch);
    setDeleteError(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteModalBranch) return;
    const result = await bankService.deleteBranch(deleteModalBranch.id);
    if (!result.success) {
      setDeleteError(result.error || 'Deletion blocked.');
      await loadData();
    } else {
      showToast(`Branch "${deleteModalBranch.branchName}" removed.`);
      setDeleteModalBranch(null);
      await loadData();
    }
  };

  // Live IFSC validation helper for modals
  const getIfscFeedback = (code: string) => {
    if (!code) return null;
    const check = validateIFSC(code);
    if (check.isValid) {
      return (
        <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1 mt-1">
          <Check className="w-3.5 h-3.5" /> Valid standard IFSC structure ({check.normalized}). Notice: Official banking validity requires RBI/bank records confirmation.
        </span>
      );
    }
    return (
      <span className="text-[11px] text-rose-600 font-medium flex items-center gap-1 mt-1">
        <X className="w-3.5 h-3.5" /> {check.error}
      </span>
    );
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
        title="Branch Master Management"
        subtitle="Configured bank branches, verified IFSC codes, and regional consultancy allocations"
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              icon={<Building2 className="w-4 h-4 text-slate-600" />}
              onClick={() => navigate('/banks')}
            >
              View Bank Master
            </Button>
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAdd}
            >
              Add Verified Branch
            </Button>
          </div>
        }
      />

      {/* Verified Data Notice */}
      <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
        <p className="text-amber-900 font-medium">
          Branch details and IFSC codes must be verified against official bank documents.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-xs grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        <div className="md:col-span-5">
          <SearchInput
            placeholder="Search branch name, IFSC code, or location..."
            value={search}
            onSearchChange={setSearch}
          />
        </div>
        <div className="md:col-span-4">
          <SelectInput
            value={selectedBankId}
            onChange={(e) => handleBankFilterChange(e.target.value)}
            options={[
              { value: 'All', label: 'All Banks' },
              ...banks.map((b) => ({ value: b.id, label: `${b.name} (${b.code})` })),
            ]}
          />
        </div>
        <div className="md:col-span-3">
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

      {/* Data Table or Empty State */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-semibold text-slate-900 tracking-wide uppercase">
              Configured Branches ({filteredBranches.length} record{filteredBranches.length === 1 ? '' : 's'})
            </h2>
          </div>
          {branches.length > 0 && (
            <div className="text-xs text-slate-500 font-medium">
              Verified: <span className="text-emerald-700 font-semibold">{branches.filter(b => b.isVerified).length}</span> · Active: <span className="text-blue-700 font-semibold">{branches.filter(b => b.status === 'Active').length}</span>
            </div>
          )}
        </div>

        {branches.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No Branches Configured"
              description="The consultancy's verified branch and IFSC dataset has not yet been loaded. Click 'Add Verified Branch' to configure your first client-verified bank branch."
              actionText="Add Verified Branch"
              onAction={handleOpenAdd}
            />
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No branch records matched your current search filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold text-slate-600 tracking-wider">
                  <th className="py-3 px-4">Bank Name</th>
                  <th className="py-3 px-4">Branch Name</th>
                  <th className="py-3 px-4">Location / Address</th>
                  <th className="py-3 px-4">IFSC Code</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Linked Customers</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBranches.map((branch) => {
                  const cCount = linkedCustCounts[branch.id] ?? 0;
                  const isActive = branch.status === 'Active';

                  return (
                    <tr key={branch.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{branch.bankName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{branch.bankId}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <div className="font-semibold text-slate-800">{branch.branchName}</div>
                          {branch.isDemo && (
                            <span className="text-[10px] uppercase font-semibold px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200/60 rounded">
                              Demo
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400">{branch.id}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {branch.branchLocation}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/60 text-[11px]">
                          {branch.ifscCode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {branch.isDemo ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/70 w-fit">
                              <Info className="w-3 h-3 text-amber-600" />
                              DEMO DATA
                            </span>
                            <span className="text-[10px] text-amber-700 font-medium">DEMO ONLY – NOT BANK VERIFIED</span>
                          </div>
                        ) : branch.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                            <FileCheck2 className="w-3 h-3 text-emerald-600" />
                            Client Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                            <Clock className="w-3 h-3 text-amber-600" />
                            Pending Verification
                          </span>
                        )}
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
                        <span className={`font-medium ${cCount > 0 ? 'text-slate-900 font-semibold' : 'text-slate-400'}`}>
                          {cCount} customer{cCount === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          {!branch.isVerified && (
                            <button
                              onClick={() => {
                                setVerifyModalBranch(branch);
                                setVerifyEvidenceNotes('');
                                setVerifyError(null);
                              }}
                              title="Verify Branch Record"
                              className="p-1.5 text-amber-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                            >
                              <FileCheck2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setDetailBranch(branch)}
                            title="View Branch Details"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(branch)}
                            title="Edit Branch"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setStatusModalBranch(branch);
                              setStatusReason('');
                            }}
                            title={isActive ? 'Deactivate Branch' : 'Activate Branch'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isActive
                                ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-slate-500 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteAttempt(branch)}
                            title="Delete Branch (Protected)"
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
        )}
      </div>

      {/* ADD BRANCH MODAL */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Branch (Starts as Unverified)"
      >
        <div className="space-y-4">
          {addError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
              {addError}
            </div>
          )}

          <SelectInput
            label="Parent Bank (Active Approved Banks)"
            required
            value={addBankId}
            onChange={(e) => setAddBankId(e.target.value)}
            options={[
              { value: '', label: 'Select Bank' },
              ...activeBanks.map((b) => ({ value: b.id, label: `${b.name} (${b.code})` })),
            ]}
          />

          <TextInput
            label="Branch Name"
            required
            placeholder="e.g. Somajiguda Corporate Branch"
            value={addBranchName}
            onChange={(e) => setAddBranchName(e.target.value)}
          />

          <TextInput
            label="Branch Location / Full Address"
            required
            placeholder="e.g. Raj Bhavan Road, Somajiguda, Hyderabad"
            value={addBranchLocation}
            onChange={(e) => setAddBranchLocation(e.target.value)}
          />

          <div>
            <TextInput
              label="IFSC Code (11 Characters)"
              required
              placeholder="e.g. HDFC0000020"
              value={addIfscCode}
              onChange={(e) => setAddIfscCode(normalizeIFSC(e.target.value))}
              helperText="Format: 4 letters (Bank), '0' (Zero), 6 alphanumeric (Branch)"
            />
            {getIfscFeedback(addIfscCode)}
          </div>

          <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 leading-relaxed">
            <span className="font-semibold block mb-0.5">Verification Rule:</span>
            New branches always start in Unverified status and cannot be selected for customer registration until verified. After creating the branch, verify it using the verification action by supplying official documentation evidence.
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveAdd}>
              Save Branch (Unverified)
            </Button>
          </div>
        </div>
      </Modal>

      {/* DEDICATED VERIFY BRANCH MODAL */}
      <Modal
        isOpen={!!verifyModalBranch}
        onClose={() => setVerifyModalBranch(null)}
        title={`Verify Branch: ${verifyModalBranch?.branchName}`}
      >
        <div className="space-y-4">
          {verifyError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
              {verifyError}
            </div>
          )}

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Bank Partner:</span>
              <span className="font-semibold text-slate-800">{verifyModalBranch?.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">IFSC Code:</span>
              <span className="font-mono font-bold text-blue-700">{verifyModalBranch?.ifscCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Branch Address:</span>
              <span className="text-slate-700">{verifyModalBranch?.branchLocation}</span>
            </div>
          </div>

          <TextInput
            label="Verification Evidence / Audit Note"
            required
            placeholder="e.g. Cross-checked with client official bank passbook / statement"
            value={verifyEvidenceNotes}
            onChange={(e) => setVerifyEvidenceNotes(e.target.value)}
            helperText="Mandatory: Enter non-empty verification proof note to mark branch as verified and make it available for customer registration."
          />

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="secondary" onClick={() => setVerifyModalBranch(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleConfirmVerify}>
              Confirm & Mark Verified
            </Button>
          </div>
        </div>
      </Modal>

      {/* EDIT BRANCH MODAL */}
      <Modal
        isOpen={!!editingBranch}
        onClose={() => setEditingBranch(null)}
        title={`Edit Branch: ${editingBranch?.branchName}`}
      >
        <div className="space-y-4">
          {editError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 leading-relaxed">
              {editError}
            </div>
          )}

          {editingBranch?.isVerified &&
            (editBranchName.trim() !== editingBranch.branchName ||
              editBranchLocation.trim() !== editingBranch.branchLocation ||
              normalizeIFSC(editIfscCode) !== editingBranch.ifscCode) && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Authoritative details changed:</strong> Branch name, location, or IFSC has been modified. To retain client-confirmed status, you must supply fresh confirmation evidence notes below.
                </span>
              </div>
            )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Parent Bank (Immutable Relationship)
            </label>
            <input
              type="text"
              disabled
              value={`${editingBranch?.bankName} (${editingBranch?.bankId})`}
              className="w-full text-xs font-semibold bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-slate-700"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Business Rule: A branch cannot be reassigned to a different bank.
            </span>
          </div>

          <TextInput
            label="Branch Name"
            required
            value={editBranchName}
            onChange={(e) => setEditBranchName(e.target.value)}
          />

          <TextInput
            label="Branch Location / Full Address"
            required
            value={editBranchLocation}
            onChange={(e) => setEditBranchLocation(e.target.value)}
          />

          <div>
            <TextInput
              label="IFSC Code (11 Characters)"
              required
              value={editIfscCode}
              onChange={(e) => setEditIfscCode(normalizeIFSC(e.target.value))}
            />
            {getIfscFeedback(editIfscCode)}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={editIsVerified}
                onChange={(e) => setEditIsVerified(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="text-xs">
                <span className="font-semibold text-slate-800">
                  Client-Confirmed / Authoritative Record
                </span>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Confirm that this record is verified against official client records.
                </p>
              </div>
            </label>

            <TextInput
              label="Verification Evidence / Notes"
              required={editIsVerified}
              placeholder="e.g. Cross-referenced with physical cheque book"
              value={editVerificationNotes}
              onChange={(e) => setEditVerificationNotes(e.target.value)}
              helperText={
                editIsVerified
                  ? 'Mandatory: Enter non-empty verification proof note. Fresh evidence is required if details changed.'
                  : 'Optional note for unverified branch record.'
              }
            />
          </div>

          <TextInput
            label="Reason for Modification (Audit Trail)"
            optional
            placeholder="e.g. Corrected postal address per bank statement"
            value={editReason}
            onChange={(e) => setEditReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="secondary" onClick={() => setEditingBranch(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              Save Branch Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* BRANCH DETAILS MODAL */}
      <Modal
        isOpen={!!detailBranch}
        onClose={() => setDetailBranch(null)}
        title="Branch Master Record Dossier"
      >
        {detailBranch && (
          <div className="space-y-4 text-xs">
            {detailBranch.isDemo && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <div className="font-semibold text-xs">DEMO DATA – Fictional Demonstration Branch</div>
                  <div className="text-[11px] text-amber-800">DEMO ONLY – NOT BANK VERIFIED. Provided for client demonstration purposes only.</div>
                </div>
              </div>
            )}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px] font-medium">Bank Partner</span>
                  <div className="text-sm font-bold text-slate-900">{detailBranch.bankName}</div>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[11px] font-medium">Branch ID</span>
                  <div className="font-mono text-slate-600">{detailBranch.id}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                <div>
                  <span className="text-slate-400 text-[11px] font-medium">Branch Name</span>
                  <div className="font-semibold text-slate-800">{detailBranch.branchName}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] font-medium">IFSC Code</span>
                  <div className="font-mono font-bold text-blue-700">{detailBranch.ifscCode}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 text-[11px] font-medium">Branch Address / Location</span>
                <div className="text-slate-700 mt-0.5 leading-relaxed">{detailBranch.branchLocation}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80">
                <div>
                  <span className="text-slate-400 text-[11px] font-medium">Operational Status</span>
                  <div className="mt-0.5">
                    {detailBranch.status === 'Active' ? (
                      <span className="text-emerald-700 font-semibold">Active (Available for registration)</span>
                    ) : (
                      <span className="text-slate-600 font-semibold">Inactive (Locked for new clients)</span>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] font-medium">Verification Status</span>
                  <div className="mt-0.5">
                    {detailBranch.isVerified ? (
                      <span className="text-emerald-700 font-semibold">Client Confirmed / Verified</span>
                    ) : (
                      <span className="text-amber-700 font-semibold">Pending Verification</span>
                    )}
                  </div>
                </div>
              </div>

              {detailBranch.verificationNotes && (
                <div className="pt-2 border-t border-slate-200/80">
                  <span className="text-slate-400 text-[11px] font-medium">Verification Evidence Notes</span>
                  <div className="text-slate-700 mt-0.5 italic">{detailBranch.verificationNotes}</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200/80 text-[11px] text-slate-500">
                <div>Created: {formatDate(detailBranch.createdAt)}</div>
                <div>Last Modified: {formatDate(detailBranch.lastModifiedAt)}</div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <Button variant="secondary" onClick={() => setDetailBranch(null)}>
                Close Dossier
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* STATUS CONFIRMATION MODAL */}
      <Modal
        isOpen={!!statusModalBranch}
        onClose={() => setStatusModalBranch(null)}
        title={
          statusModalBranch?.status === 'Active'
            ? `Deactivate Branch: ${statusModalBranch?.branchName}`
            : `Activate Branch: ${statusModalBranch?.branchName}`
        }
      >
        <div className="space-y-4">
          <div
            className={`p-3.5 rounded-xl border text-xs leading-relaxed flex items-start gap-3 ${
              statusModalBranch?.status === 'Active'
                ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              {statusModalBranch?.status === 'Active' ? (
                <>
                  <div className="font-semibold mb-1">Notice on Deactivation:</div>
                  Deactivating <strong>{statusModalBranch?.branchName}</strong> will remove it from the customer registration branch selection dropdown.
                  <div className="mt-2 font-medium">
                    Confirmed Business Rule: All {linkedCustCounts[statusModalBranch?.id || ''] || 0} existing customer records allocated to this branch will permanently retain their branch and IFSC reference.
                  </div>
                </>
              ) : (
                <>
                  <div className="font-semibold mb-1">Notice on Activation:</div>
                  Reactivating <strong>{statusModalBranch?.branchName}</strong> will immediately make it selectable for new customer registrations under {statusModalBranch?.bankName}.
                </>
              )}
            </div>
          </div>

          <TextInput
            label="Change Reason"
            optional
            placeholder="e.g. Branch operational status amendment"
            value={statusReason}
            onChange={(e) => setStatusReason(e.target.value)}
          />

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="secondary" onClick={() => setStatusModalBranch(null)}>
              Cancel
            </Button>
            <Button
              variant={statusModalBranch?.status === 'Active' ? 'danger' : 'primary'}
              onClick={handleToggleStatus}
            >
              Confirm {statusModalBranch?.status === 'Active' ? 'Deactivation' : 'Activation'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* DELETE / LINKED RECORD PROTECTION MODAL */}
      <Modal
        isOpen={!!deleteModalBranch}
        onClose={() => setDeleteModalBranch(null)}
        title={`Delete Protection: ${deleteModalBranch?.branchName}`}
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
                Deleting a branch is only permitted if it has <strong>zero linked customer records</strong>.
              </p>
              <div className="text-slate-600 mt-2">
                Currently linked customers:{' '}
                <strong>{linkedCustCounts[deleteModalBranch?.id || ''] || 0}</strong>
              </div>
            </div>
          )}

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button variant="secondary" onClick={() => setDeleteModalBranch(null)}>
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
