import React, { useState } from 'react';
import { Bell, CheckCheck, Clock, ShieldAlert, CheckCircle } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { EmptyState } from '../components/common/EmptyState';
import { useAppState } from '../context/AppStateContext';

export const NotificationsPage: React.FC = () => {
  const { isEmptyStateMode } = useAppState();

  const mockNotifs = [
    {
      id: 'N-1',
      title: '3 Customer Proof-of-Funds Letters Pending Review',
      description: 'State Bank of India officer verification required before consular deadline.',
      timestamp: '15 Oct 2026, 11:30 AM',
      type: 'warning',
      isUnread: true,
    },
    {
      id: 'N-2',
      title: 'New Financial Entry Logged for Ahmed Khan',
      description: '₹ 25,000 document fee verified under ICICI Bank fiduciary account.',
      timestamp: '14 Oct 2026, 04:15 PM',
      type: 'info',
      isUnread: false,
    },
    {
      id: 'N-3',
      title: 'Monthly Bank Balance Schedule Generated',
      description: 'Audited balance report for all 10 custom company bank accounts is ready for download.',
      timestamp: '14 Oct 2026, 09:00 AM',
      type: 'success',
      isUnread: false,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Notifications & Alerts"
        subtitle="Automated alerts for pending balance certifications, document expiry, and application status updates"
        actions={
          <Button variant="secondary" icon={<CheckCheck className="w-4 h-4" />}>
            Mark All as Read
          </Button>
        }
      />

      {isEmptyStateMode ? (
        <EmptyState
          title="No Notifications"
          description="Your inbox is clear. You have no pending system alerts or action items."
        />
      ) : (
        <div className="space-y-3">
          {mockNotifs.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border bg-white shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex items-start gap-4 transition-all ${
                n.isUnread ? 'border-blue-200/90 bg-blue-50/20' : 'border-slate-200/90'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                  n.type === 'warning'
                    ? 'bg-amber-50 text-amber-600'
                    : n.type === 'success'
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-blue-50 text-blue-600'
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-900">{n.title}</h4>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">{n.timestamp}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
