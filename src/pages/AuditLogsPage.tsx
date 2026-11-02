import React, { useState } from 'react';
import { ShieldCheck, Download, Search, Filter } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { SearchInput } from '../components/forms/SearchInput';
import { EmptyState } from '../components/common/EmptyState';
import { useAppState } from '../context/AppStateContext';

export const AuditLogsPage: React.FC = () => {
  const { isEmptyStateMode } = useAppState();
  const [search, setSearch] = useState<string>('');

  const mockLogs = [
    {
      id: 'LOG-881',
      timestamp: '15 Oct 2026, 14:22:10',
      user: 'S. Mehta (Senior Case Officer)',
      action: 'Financial Record Creation',
      target: 'Amit Deshmukh (A2345678)',
      channel: 'Client Desk Session',
      details: 'Recorded SBI balance update +₹ 20,000 with verification note.',
    },
    {
      id: 'LOG-880',
      timestamp: '14 Oct 2026, 16:05:40',
      user: 'R. Sharma (Junior Consultant)',
      action: 'Customer Profile Edit',
      target: 'Ahmed Khan (C9876543)',
      channel: 'Client Desk Session',
      details: 'Updated residential address and provisional passport reference.',
    },
    {
      id: 'LOG-879',
      timestamp: '14 Oct 2026, 10:14:02',
      user: 'Admin Case Officer',
      action: 'Bank Account Parameter Audit',
      target: 'HDFC Bank - Banjara Hills',
      channel: 'Administrative Console',
      details: 'Validated branch status and customer allocation ledger consistency.',
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Activity & Audit Log"
        subtitle="Traceable activity log recording data creations, modifications, and officer balance sign-offs"
        actions={
          <Button variant="secondary" icon={<Download className="w-4 h-4" />}>
            Export Audit Trail (.csv)
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200/90 p-3.5">
        <SearchInput
          placeholder="Search by action, officer, customer, or channel..."
          value={search}
          onSearchChange={setSearch}
        />
      </div>

      {isEmptyStateMode ? (
        <EmptyState
          title="No Audit Entries Found"
          description="The system audit log contains no recorded administrative transactions."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase">
                  <th className="px-4 py-3.5">Timestamp</th>
                  <th className="px-4 py-3.5">Officer / User</th>
                  <th className="px-4 py-3.5">Action Type</th>
                  <th className="px-4 py-3.5">Target Entity</th>
                  <th className="px-4 py-3.5">Session Channel</th>
                  <th className="px-4 py-3.5">Audit Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="px-4 py-3.5 font-mono text-slate-500 whitespace-nowrap">
                      {log.timestamp}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">{log.user}</td>
                    <td className="px-4 py-3.5 font-medium text-blue-700">{log.action}</td>
                    <td className="px-4 py-3.5 text-slate-800">{log.target}</td>
                    <td className="px-4 py-3.5 text-slate-500">{log.channel}</td>
                    <td className="px-4 py-3.5 text-slate-600 max-w-md">{log.details}</td>
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
