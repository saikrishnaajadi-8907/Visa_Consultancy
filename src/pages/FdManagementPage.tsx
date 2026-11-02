import React, { useState } from 'react';
import { CreditCard, Plus, Landmark, Calendar, ShieldCheck, Search } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { KpiCard } from '../components/common/KpiCard';
import { SearchInput } from '../components/forms/SearchInput';
import { SelectInput } from '../components/forms/SelectInput';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { useAppState } from '../context/AppStateContext';
import { formatINR } from '../utils/formatters';

export const FdManagementPage: React.FC = () => {
  const { isEmptyStateMode } = useAppState();
  const [search, setSearch] = useState<string>('');

  const mockFds = [
    {
      id: 'FD-101',
      customer: 'Ahmed Khan',
      bank: 'ICICI Bank',
      fdNumber: 'FD99283110',
      principal: 500000,
      tenure: '12 Months',
      rate: '7.10%',
      maturityDate: '15 Oct 2027',
      status: 'Active',
    },
    {
      id: 'FD-102',
      customer: 'Amit Deshmukh',
      bank: 'State Bank of India (SBI)',
      fdNumber: 'FD88231002',
      principal: 750000,
      tenure: '24 Months',
      rate: '6.85%',
      maturityDate: '10 Aug 2028',
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fixed Deposit (FD) Management"
        subtitle="Manage client collateral fixed deposits, term yields, and embassy solvency guarantees"
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
            New FD Deposit
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          value={isEmptyStateMode ? '0' : '₹ 12,50,000'}
          label="Total Active FDs"
          icon={<CreditCard className="w-5 h-5" />}
          theme="blue"
        />
        <KpiCard
          value={isEmptyStateMode ? '0' : '2 Deposits'}
          label="Active Certificates"
          icon={<ShieldCheck className="w-5 h-5" />}
          theme="green"
        />
        <KpiCard
          value={isEmptyStateMode ? '0%' : '7.02%'}
          label="Weighted Avg Rate"
          icon={<Landmark className="w-5 h-5" />}
          theme="purple"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by FD Number, customer name or bank..."
            value={search}
            onSearchChange={setSearch}
          />
        </div>
        <div className="w-full md:w-48">
          <SelectInput options={['All Banks', 'ICICI Bank', 'SBI', 'HDFC Bank']} />
        </div>
      </div>

      {isEmptyStateMode ? (
        <EmptyState
          title="No Fixed Deposits Recorded"
          description="There are currently no customer fixed deposit accounts registered under consultancy custody."
          actionText="Create First Fixed Deposit"
          onAction={() => {}}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase">
                  <th className="px-4 py-3.5">FD Number</th>
                  <th className="px-4 py-3.5">Customer Name</th>
                  <th className="px-4 py-3.5">Bank</th>
                  <th className="px-4 py-3.5 text-right">Principal Amount</th>
                  <th className="px-4 py-3.5 text-center">Tenure / Rate</th>
                  <th className="px-4 py-3.5">Maturity Date</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockFds.map((fd) => (
                  <tr key={fd.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-mono font-semibold text-slate-900">{fd.fdNumber}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{fd.customer}</td>
                    <td className="px-4 py-3.5 text-slate-600">{fd.bank}</td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900 tabular-nums">
                      {formatINR(fd.principal)}
                    </td>
                    <td className="px-4 py-3.5 text-center text-slate-600">
                      {fd.tenure} @ {fd.rate}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{fd.maturityDate}</td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant="active">{fd.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
                        View Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
