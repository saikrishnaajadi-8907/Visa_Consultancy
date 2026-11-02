import React, { useState } from 'react';
import { FileText, Plus, CheckCircle, Clock, XCircle, Search, Filter } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { KpiCard } from '../components/common/KpiCard';
import { SearchInput } from '../components/forms/SearchInput';
import { SelectInput } from '../components/forms/SelectInput';
import { Badge, BadgeVariant } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { useAppState } from '../context/AppStateContext';
import { MOCK_APPLICATIONS } from '../constants/mockData';

export const ApplicationsPage: React.FC = () => {
  const { isEmptyStateMode } = useAppState();
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All Statuses');

  const getBadgeVariant = (status: string): BadgeVariant => {
    switch (status) {
      case 'Approved':
        return 'approved';
      case 'In Process':
        return 'in-process';
      case 'Rejected':
        return 'rejected';
      case 'On Hold':
        return 'on-hold';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Visa Applications Pipeline"
        subtitle="Track formal consular visa submissions, case officer assignments, and embassy decision milestones"
        actions={
          <Button variant="primary" icon={<Plus className="w-4 h-4" />}>
            New Application
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <KpiCard
          value={isEmptyStateMode ? '0' : '320'}
          label="In Process"
          icon={<Clock className="w-5 h-5" />}
          theme="blue"
        />
        <KpiCard
          value={isEmptyStateMode ? '0' : '120'}
          label="Approved"
          icon={<CheckCircle className="w-5 h-5" />}
          theme="green"
        />
        <KpiCard
          value={isEmptyStateMode ? '0' : '45'}
          label="Rejected"
          icon={<XCircle className="w-5 h-5" />}
          theme="orange"
        />
        <KpiCard
          value={isEmptyStateMode ? '0' : '15'}
          label="On Hold"
          icon={<Clock className="w-5 h-5" />}
          theme="slate"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <SearchInput
            placeholder="Search by customer name, country, case officer..."
            value={search}
            onSearchChange={setSearch}
          />
        </div>
        <div className="w-full md:w-56">
          <SelectInput
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={['All Statuses', 'In Process', 'Approved', 'Rejected', 'On Hold']}
          />
        </div>
      </div>

      {isEmptyStateMode ? (
        <EmptyState
          title="No Visa Applications Found"
          description="There are currently no active visa dossiers in the consular application pipeline."
          actionText="Create First Application"
          onAction={() => {}}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase">
                  <th className="px-4 py-3.5">Customer Name</th>
                  <th className="px-4 py-3.5">Visa Category</th>
                  <th className="px-4 py-3.5">Destination Country</th>
                  <th className="px-4 py-3.5">Submission Date</th>
                  <th className="px-4 py-3.5">Case Officer</th>
                  <th className="px-4 py-3.5 text-center">Docs Filed</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {MOCK_APPLICATIONS.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{app.customerName}</td>
                    <td className="px-4 py-3.5 font-medium text-slate-800">{app.visaType}</td>
                    <td className="px-4 py-3.5 text-slate-700">{app.country}</td>
                    <td className="px-4 py-3.5 text-slate-500">{app.submissionDate}</td>
                    <td className="px-4 py-3.5 text-slate-700">{app.caseOfficer}</td>
                    <td className="px-4 py-3.5 text-center font-mono font-semibold text-blue-600">
                      {app.documentsCount} files
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={getBadgeVariant(app.status)}>{app.status}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <button className="px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50">
                        View Pipeline
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
