import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Building2,
  Users,
  Eye,
  ShieldCheck,
  Search,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { AlertBanner } from '../components/common/AlertBanner';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SearchInput } from '../components/forms/SearchInput';
import { SelectInput } from '../components/forms/SelectInput';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { TextInput } from '../components/forms/TextInput';
import { useAppState } from '../context/AppStateContext';
import { MOCK_BANKS } from '../constants/mockData';
import { formatINR } from '../utils/formatters';

export const BanksPage: React.FC = () => {
  const navigate = useNavigate();
  const { isEmptyStateMode } = useAppState();

  const [search, setSearch] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('All Statuses');
  const [selectedBranch, setSelectedBranch] = useState<string>('All Branches');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const filteredBanks = useMemo(() => {
    if (isEmptyStateMode) return [];

    let list = [...MOCK_BANKS];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (b) =>
          b.bankName.toLowerCase().includes(q) ||
          b.branch.toLowerCase().includes(q) ||
          b.ifsc.toLowerCase().includes(q) ||
          b.accountNumber.toLowerCase().includes(q)
      );
    }

    if (selectedStatus !== 'All Statuses') {
      list = list.filter((b) => b.status === selectedStatus);
    }

    if (selectedBranch !== 'All Branches') {
      list = list.filter((b) => b.branch.includes(selectedBranch));
    }

    return list;
  }, [isEmptyStateMode, search, selectedStatus, selectedBranch]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Company Bank Accounts"
        subtitle="10 custom fiduciary accounts managed by the consultancy for applicant fund verification"
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Bank Account
          </Button>
        }
      />

      {/* Consultancy Notice Callout matching screenshot image_b132e714.png */}
      <AlertBanner
        type="info"
        title="Consultancy Account Notice"
        message="These 10 custom bank accounts are held and administered directly by the consultancy for visa sponsorship, escrow, and official verification letters. Customer-specific recorded amounts represent individual verified balances and are strictly maintained separately from shared company vault balances."
      />

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 shadow-[0_1px_2px_rgba(0,0,0,0.02)] grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-6">
          <SearchInput
            placeholder="Search bank name, account number, branch, IFSC..."
            value={search}
            onSearchChange={setSearch}
          />
        </div>
        <div className="md:col-span-3">
          <SelectInput
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={['All Statuses', 'Active', 'Inactive']}
          />
        </div>
        <div className="md:col-span-3">
          <SelectInput
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            options={[
              'All Branches',
              'Hyderabad Main Branch',
              'Banjara Hills',
              'Ameerpet',
              'Jubilee Hills',
              'Kukatpally',
              'Begumpet',
            ]}
          />
        </div>
      </div>

      {/* Bank Accounts Table */}
      {isEmptyStateMode || filteredBanks.length === 0 ? (
        <EmptyState
          title="No Company Bank Accounts Configured"
          description="Configure company bank accounts to begin allocating applicant proof-of-funds ledgers and generating bank verification certificates."
          actionText="Add First Company Bank"
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5 text-center w-12">#</th>
                  <th className="px-4 py-3.5">Bank Name</th>
                  <th className="px-4 py-3.5">Account Number</th>
                  <th className="px-4 py-3.5">Branch</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Linked Customers</th>
                  <th className="px-4 py-3.5 text-right">Previous Amount</th>
                  <th className="px-4 py-3.5 text-right">Current Amount</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs sm:text-sm text-slate-700">
                {filteredBanks.map((bank, index) => (
                  <tr key={bank.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Index */}
                    <td className="px-4 py-3.5 text-center font-mono text-slate-400 text-xs">
                      {index + 1}
                    </td>

                    {/* Bank Name + IFSC */}
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900">{bank.bankName}</div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        IFSC: {bank.ifsc}
                      </div>
                    </td>

                    {/* Account Number */}
                    <td className="px-4 py-3.5 font-mono text-xs font-medium text-slate-800">
                      {bank.accountNumber}
                    </td>

                    {/* Branch */}
                    <td className="px-4 py-3.5 text-xs text-slate-700 font-medium">
                      {bank.branch}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant="active">{bank.status}</Badge>
                    </td>

                    {/* Linked Customers Pill with Icon */}
                    <td className="px-4 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold tabular-nums border border-blue-200/50">
                        <Users className="w-3.5 h-3.5 text-blue-500" />
                        <span>{bank.linkedCustomers}</span>
                      </span>
                    </td>

                    {/* Previous Amount */}
                    <td className="px-4 py-3.5 text-right tabular-nums text-slate-500">
                      {formatINR(bank.previousAmount)}
                    </td>

                    {/* Current Amount */}
                    <td className="px-4 py-3.5 text-right tabular-nums font-semibold text-slate-900">
                      {formatINR(bank.currentAmount)}
                    </td>

                    {/* Actions matching screenshot */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate('/customers')}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                          View Account
                        </button>
                        <button
                          onClick={() => navigate('/customers')}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          Customers
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Bank Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Company Fiduciary Bank Account"
        subtitle="Configure an official consultancy account for visa escrow & verification"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setIsAddModalOpen(false);
              }}
            >
              Save Bank Account
            </Button>
          </>
        }
      >
        <div className="space-y-4 text-xs">
          <TextInput label="Bank Name" required placeholder="e.g. State Bank of India (SBI)" />
          <TextInput label="Branch Name" required placeholder="e.g. Hyderabad Main Branch" />
          <div className="grid grid-cols-2 gap-4">
            <TextInput label="Account Number" required placeholder="e.g. 10293847561" />
            <TextInput label="IFSC Code" required placeholder="e.g. SBIN0001234" />
          </div>
          <SelectInput label="Account Status" options={['Active', 'Inactive']} />
        </div>
      </Modal>
    </div>
  );
};
