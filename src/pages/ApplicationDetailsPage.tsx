import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileText, ChevronLeft, Calendar, UserCheck } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Button } from '../components/common/Button';
import { EmptyState } from '../components/common/EmptyState';

export const ApplicationDetailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Applications', href: '/applications' },
              { label: `Dossier #${id || 'Details'}` },
            ]}
          />
        }
        title={`Application Dossier: #${id || ''}`}
        subtitle="Future Module: Consular submission milestones, case officer notes, and biometric tracking"
        actions={
          <Button
            variant="secondary"
            icon={<ChevronLeft className="w-4 h-4" />}
            onClick={() => navigate('/applications')}
          >
            Back to Applications
          </Button>
        }
      />

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-8">
        <EmptyState
          icon={<FileText className="w-8 h-8 text-blue-600" />}
          title={`Application #${id || ''} Dossier`}
          description="Detailed consular submission timelines, officer task queues, and document checklist validations."
          actionText="Return to Applications Pipeline"
          onAction={() => navigate('/applications')}
        />
      </div>
    </div>
  );
};
