import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Phone,
  Mail,
  Search,
  RotateCcw,
  Archive,
  ArchiveRestore,
  Eye,
  Edit,
  AlertCircle,
  CheckCircle,
  Filter,
  X,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SearchInput } from '../components/forms/SearchInput';
import { SelectInput } from '../components/forms/SelectInput';
import { Pagination } from '../components/tables/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { useAppState } from '../context/AppStateContext';
import { customerService } from '../services/customerService';
import { Customer, CustomerStatus } from '../types/customer';
import { formatINR, maskAccountNumber } from '../utils/formatters';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isEmptyStateMode, searchQuery, setSearchQuery } = useAppState();

  const queryBankId = searchParams.get('bankId') || searchParams.get('bank') || 'All';
  const rawVisaType = searchParams.get('visaType') || searchParams.get('category') || 'All';
  const queryCustomerStatus = searchParams.get('customerStatus') || 'All';
  const queryBranchId = searchParams.get('branchId') || 'All';
  const querySearch = searchParams.get('q') || searchParams.get('search') || searchQuery || '';

  // Normalize visa category against known types
  const resolvedVisaType = useMemo(() => {
    if (!rawVisaType || rawVisaType === 'All') return 'All';
    const known = ['Work Visa', 'PR Visa', 'Student Visa', 'Business Visa', 'Tourist Visa'];
    const match = known.find((k) => k.toLowerCase() === rawVisaType.toLowerCase().trim());
    return match || rawVisaType;
  }, [rawVisaType]);

  const [search, setSearch] = useState<string>(querySearch);
  const [selectedCustomerStatus, setSelectedCustomerStatus] = useState<string>(queryCustomerStatus);
  const [selectedVisaType, setSelectedVisaType] = useState<string>(resolvedVisaType);
  const [selectedBankId, setSelectedBankId] = useState<string>(queryBankId);
  const [selectedBranchId, setSelectedBranchId] = useState<string>(queryBranchId);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 8;

  // Synchronize state when browser Back, Forward, or URL changes occur
  useEffect(() => {
    setSelectedBankId(queryBankId);
    setSelectedVisaType(resolvedVisaType);
    setSelectedCustomerStatus(queryCustomerStatus);
    setSelectedBranchId(queryBranchId);
    if (querySearch !== search) {
      setSearch(querySearch);
    }
    setCurrentPage(1);
  }, [queryBankId, resolvedVisaType, queryCustomerStatus, queryBranchId, querySearch]);

  // Session customers state (controlled in-memory)
  const [sessionCustomers, setSessionCustomers] = useState<Customer[]>([]);
  const [archiveModalTarget, setArchiveModalTarget] = useState<Customer | null>(null);
  const [archiveReason, setArchiveReason] = useState<string>('');
  const [restoreModalTarget, setRestoreModalTarget] = useState<Customer | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Load customers using authoritative customerService
  const loadCustomers = useCallback(async () => {
    const list = await customerService.getCustomers({
      customerStatus: selectedCustomerStatus as any,
      visaType: selectedVisaType !== 'All' ? selectedVisaType : undefined,
      bankId: selectedBankId,
      branchId: selectedBranchId,
      query: search,
      isSampleMode: !isEmptyStateMode,
    });
    setSessionCustomers(list);
  }, [selectedCustomerStatus, selectedVisaType, selectedBankId, selectedBranchId, search, isEmptyStateMode]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const bankOptions = useMemo(() => customerService.getBankOptions(), []);
  const branchOptions = useMemo(() => {
    if (selectedBankId === 'All') return [];
    return customerService.getBranchesForBank(selectedBankId, !isEmptyStateMode);
  }, [selectedBankId, isEmptyStateMode]);

  // Helper to update filters both in state and URL search parameters
  const updateUrlFilters = (updates: Record<string, string>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([k, v]) => {
      if (!v || v === 'All') {
        next.delete(k);
        if (k === 'visaType') next.delete('category');
        if (k === 'bankId') next.delete('bank');
      } else {
        next.set(k, v);
        if (k === 'visaType') next.delete('category');
        if (k === 'bankId') next.delete('bank');
      }
    });
    setSearchParams(next);
  };

  const handleBankFilterChange = (bankId: string) => {
    setSelectedBankId(bankId);
    setSelectedBranchId('All');
    updateUrlFilters({ bankId, branchId: 'All' });
  };

  const clearFilters = () => {
    setSearchParams({});
    setSearch('');
    if (setSearchQuery) setSearchQuery('');
    setSelectedCustomerStatus('All');
    setSelectedVisaType('All');
    setSelectedBankId('All');
    setSelectedBranchId('All');
    setCurrentPage(1);
  };

  // Directly display authoritative customers returned by customerService (no fictitious fallback)
  const displayCustomers = sessionCustomers;

  // Pagination slice
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayCustomers.slice(start, start + pageSize);
  }, [displayCustomers, currentPage, pageSize]);

  // Execute Soft Archive
  const confirmArchive = async () => {
    if (!archiveModalTarget) return;
    await customerService.archiveCustomer(archiveModalTarget.id, archiveReason);
    setArchiveModalTarget(null);
    setArchiveReason('');
    setActionNotice(`Customer "${archiveModalTarget.personalInfo.fullName}" (${archiveModalTarget.id}) archived.`);
    await loadCustomers();
  };

  // Execute Restore
  const confirmRestore = async () => {
    if (!restoreModalTarget) return;
    await customerService.restoreCustomer(restoreModalTarget.id);
    setRestoreModalTarget(null);
    setActionNotice(`Customer "${restoreModalTarget.personalInfo.fullName}" restored to active status.`);
    await loadCustomers();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Customers"
        badge={
          !isEmptyStateMode && displayCustomers.length > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              {displayCustomers.length} Registered
            </span>
          ) : sessionCustomers.length > 0 ? (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              {sessionCustomers.length} in Session
            </span>
          ) : null
        }
        subtitle="Manage customer portfolios, contact allocations, visa status, and bank assignments"
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => navigate('/customers/new')}
          >
            Add Customer
          </Button>
        }
      />

      {/* Temporary Action Notice */}
      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-blue-500 hover:text-blue-700 text-xs font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar with Search and Multi-Parameter Selectors */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Global Search across 5 identifiers - moderately sized */}
          <div className="w-full sm:w-auto flex-1 min-w-[200px] lg:max-w-[250px]">
            <SearchInput
              placeholder="Search Name, Mobile, Account, PAN..."
              value={search}
              onSearchChange={(val) => {
                setSearch(val);
                updateUrlFilters({ q: val });
              }}
            />
          </div>

          {/* Bank Dropdown */}
          <div className="w-full sm:w-auto flex-1 min-w-[140px]">
            <SelectInput
              value={selectedBankId}
              onChange={(e) => handleBankFilterChange(e.target.value)}
              options={[
                { value: 'All', label: 'All Banks' },
                ...bankOptions.map((b) => ({ value: b.id, label: b.name })),
              ]}
            />
          </div>

          {/* Visa Track / Category */}
          <div className="w-full sm:w-auto flex-1 min-w-[160px]">
            <SelectInput
              value={selectedVisaType}
              onChange={(e) => {
                setSelectedVisaType(e.target.value);
                updateUrlFilters({ visaType: e.target.value });
              }}
              options={[
                { value: 'All', label: 'All Visa Categories' },
                { value: 'Work Visa', label: 'Work Visa' },
                { value: 'PR Visa', label: 'PR Visa' },
                { value: 'Student Visa', label: 'Student Visa' },
                { value: 'Business Visa', label: 'Business Visa' },
              ]}
            />
          </div>

          {/* Branch Dropdown (Dependent on Bank) */}
          <div className="w-full sm:w-auto flex-1 min-w-[170px]">
            <SelectInput
              value={selectedBranchId}
              disabled={selectedBankId === 'All' || branchOptions.length === 0}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                updateUrlFilters({ branchId: e.target.value });
              }}
              options={[
                {
                  value: 'All',
                  label:
                    selectedBankId === 'All'
                      ? 'Select Bank First'
                      : branchOptions.length === 0
                      ? 'No branches registered for this bank'
                      : 'All Branches',
                },
                ...branchOptions.map((br) => ({ value: br.id, label: br.name })),
              ]}
            />
          </div>

          {/* Customer Status - Full label & dropdown arrow visible */}
          <div className="w-full sm:w-auto flex-1 min-w-[130px]">
            <SelectInput
              value={selectedCustomerStatus}
              onChange={(e) => {
                setSelectedCustomerStatus(e.target.value);
                updateUrlFilters({ customerStatus: e.target.value });
              }}
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
                { value: 'Archived', label: 'Archived' },
              ]}
            />
          </div>
        </div>

        {/* Active Filter Chips Strip */}
        {(selectedBankId !== 'All' ||
          selectedVisaType !== 'All' ||
          selectedCustomerStatus !== 'All' ||
          !!search) && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Active Filters:
            </span>
            {selectedBankId !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 font-medium border border-blue-200">
                <span>
                  Bank:{' '}
                  {bankOptions.find((b) => b.id.toLowerCase() === selectedBankId.toLowerCase())
                    ?.name || selectedBankId}
                </span>
                <button
                  onClick={() => updateUrlFilters({ bankId: 'All', branchId: 'All' })}
                  className="hover:text-blue-900 cursor-pointer text-sm leading-none"
                  title="Remove Bank Filter"
                >
                  ×
                </button>
              </span>
            )}
            {selectedVisaType !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 font-medium border border-purple-200">
                <span>Category: {selectedVisaType}</span>
                <button
                  onClick={() => updateUrlFilters({ visaType: 'All' })}
                  className="hover:text-purple-900 cursor-pointer text-sm leading-none"
                  title="Remove Category Filter"
                >
                  ×
                </button>
              </span>
            )}
            {selectedCustomerStatus !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium border border-amber-200">
                <span>Customer Status: {selectedCustomerStatus}</span>
                <button
                  onClick={() => updateUrlFilters({ customerStatus: 'All' })}
                  className="hover:text-amber-900 cursor-pointer text-sm leading-none"
                  title="Remove Customer Status Filter"
                >
                  ×
                </button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium border border-slate-200">
                <span>Query: "{search}"</span>
                <button
                  onClick={() => {
                    setSearch('');
                    updateUrlFilters({ q: '' });
                  }}
                  className="hover:text-slate-900 cursor-pointer text-sm leading-none"
                  title="Clear Query"
                >
                  ×
                </button>
              </span>
            )}
          </div>
        )}

        {/* Action Row: Result Count and Clear Filters */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing <strong className="text-slate-700 font-semibold">{displayCustomers.length}</strong> matching customer records
            {selectedCustomerStatus === 'Archived' && (
              <span className="ml-2 font-medium text-amber-600">(Archived Portfolio View)</span>
            )}
          </div>

          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-blue-600 font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear Filters</span>
          </button>
        </div>
      </div>

      {/* Customer Directory Table or Empty State */}
      {displayCustomers.length === 0 ? (
        <EmptyState
          title={
            selectedBankId !== 'All' || selectedVisaType !== 'All'
              ? 'No Matching Customers Found'
              : selectedCustomerStatus === 'Archived'
              ? 'No Archived Customers'
              : 'No Customer Records Found'
          }
          description={
            selectedBankId !== 'All'
              ? `Zero customer portfolios are currently assigned to ${
                  bankOptions.find((b) => b.id.toLowerCase() === selectedBankId.toLowerCase())
                    ?.name || selectedBankId
                }. Clear the bank filter to view all customer records.`
              : selectedVisaType !== 'All'
              ? `Zero customer portfolios are registered under the "${selectedVisaType}" category. Clear the filter to view all applications.`
              : selectedCustomerStatus === 'Archived'
              ? 'There are currently no archived customer profiles matching the active filters.'
              : 'There are no customer profiles in the system. Register a new applicant or clear search filters to view records.'
          }
          actionText={
            selectedBankId !== 'All' || selectedVisaType !== 'All'
              ? 'Clear Filter'
              : selectedCustomerStatus === 'Archived'
              ? undefined
              : 'Add First Customer'
          }
          onAction={
            selectedBankId !== 'All' || selectedVisaType !== 'All'
              ? clearFilters
              : () => navigate('/customers/new')
          }
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5 whitespace-nowrap">Customer Name</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Mobile</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Bank</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Branch</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Visa Type</th>
                  <th className="px-4 py-3.5 text-right whitespace-nowrap">Current Amount</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Customer Status</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                {paginatedList.map((cust) => {
                  const isArchived = cust.status === 'Archived';
                  const isInactive = cust.status === 'Inactive';

                  return (
                    <tr
                      key={cust.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isArchived ? 'opacity-70 bg-slate-50/30' : ''
                      }`}
                    >
                      {/* 1. Customer Name */}
                      <td className="px-4 py-3.5">
                        <div
                          className="font-semibold text-slate-900 hover:text-blue-600 cursor-pointer"
                          onClick={() => navigate(`/customers/${cust.id}`)}
                        >
                          {cust.personalInfo.fullName}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          ID: <span className="font-mono">{cust.id}</span> · {cust.personalInfo.gender}
                        </div>
                      </td>

                      {/* 2. Mobile (Personal Mobile) */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-slate-800">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{cust.contactInfo.personalMobile}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[150px]">
                          {cust.contactInfo.personalEmail}
                        </div>
                      </td>

                      {/* 3. Bank */}
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-800">{cust.bankInfo.bankName}</span>
                        <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                          {maskAccountNumber(cust.bankInfo.accountNumber)}
                        </div>
                      </td>

                      {/* 4. Branch */}
                      <td className="px-4 py-3.5">
                        {cust.bankInfo.branchName ? (
                          <>
                            <span className="text-xs text-slate-700">{cust.bankInfo.branchName}</span>
                            {cust.bankInfo.ifscCode && (
                              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                                IFSC: {cust.bankInfo.ifscCode}
                              </div>
                            )}
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No branch registered</span>
                        )}
                      </td>

                      {/* 5. Visa Type */}
                      <td className="px-4 py-3.5 text-center">
                         <span className="text-xs font-medium text-slate-700">
                        {cust.visaInfo.visaType || 'Not specified'}
                        </span>
                      </td>     

                      {/* 6. Current Amount (Initial financial amount or placeholder) */}
                      <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-slate-900">
                        {cust.initialFinancialRecord?.initialAmount
                          ? formatINR(cust.initialFinancialRecord.initialAmount)
                          : '₹ 0'}
                      </td>

                      {/* 7. Customer Status */}
                      <td className="px-4 py-3.5 text-center">
                        <Badge
                          variant={
                            cust.status === 'Active'
                              ? 'active'
                              : cust.status === 'Archived'
                              ? 'neutral'
                              : 'pending'
                          }
                        >
                          {cust.status}
                        </Badge>
                      </td>

                      {/* 8. Actions */}
                      <td className="px-4 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => navigate(`/customers/${cust.id}`)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-blue-700 hover:bg-blue-50 transition-colors"
                            title="View Customer Profile"
                          >
                            View
                          </button>

                          {!isArchived && (
                            <button
                              onClick={() => navigate(`/customers/${cust.id}/edit`)}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                              title="Edit Customer Profile"
                            >
                              Edit
                            </button>
                          )}

                          {!isArchived ? (
                            <button
                              onClick={() => setArchiveModalTarget(cust)}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Archive Customer Profile (Soft Delete)"
                            >
                              Archive
                            </button>
                          ) : (
                            <button
                              onClick={() => setRestoreModalTarget(cust)}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="Restore Archived Customer"
                            >
                              Restore
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

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(displayCustomers.length / pageSize) || 1}
            totalItems={displayCustomers.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Soft Archive Confirmation Modal */}
      {archiveModalTarget && (
        <Modal
          isOpen={true}
          onClose={() => setArchiveModalTarget(null)}
          title={`Archive Customer: ${archiveModalTarget.personalInfo.fullName}`}
          subtitle="Customer soft deletion with full data retention"
          footer={
            <>
              <Button variant="ghost" onClick={() => setArchiveModalTarget(null)}>
                Cancel
              </Button>
              <Button variant="danger" icon={<Archive className="w-4 h-4" />} onClick={confirmArchive}>
                Confirm Archive
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 leading-relaxed">
              <strong>Soft Archive Rule:</strong> The customer record will disappear from the active customer listing. However, personal documents, bank records, FD schedules, and audit change logs will remain strictly retained for compliance inspection.
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                Archive Reason (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Visa granted and applicant transitioned to foreign residence..."
                value={archiveReason}
                onChange={(e) => setArchiveReason(e.target.value)}
                className="w-full rounded-lg border border-slate-200 p-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Restore Confirmation Modal */}
      {restoreModalTarget && (
        <Modal
          isOpen={true}
          onClose={() => setRestoreModalTarget(null)}
          title={`Restore Customer: ${restoreModalTarget.personalInfo.fullName}`}
          subtitle="Reactivate archived customer portfolio"
          footer={
            <>
              <Button variant="ghost" onClick={() => setRestoreModalTarget(null)}>
                Cancel
              </Button>
              <Button variant="success" icon={<ArchiveRestore className="w-4 h-4" />} onClick={confirmRestore}>
                Restore Customer
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 leading-relaxed">
              <strong>Restoration Notice:</strong> Restoring this customer will re-enable them in the active customer directory and allow operational casework to resume.
            </div>

            <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200/80 text-amber-900 leading-relaxed text-[11px]">
              <strong>Authorization Policy:</strong> Customer restoration is restricted to designated administrator roles.
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
