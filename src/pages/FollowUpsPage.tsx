import React, { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  Plus,
  AlertCircle,
  CheckCircle2,
  Search,
  Calendar,
  User,
  Eye,
  Edit,
  Trash2,
  CalendarPlus,
  CheckSquare,
  RotateCcw,
  FileCheck,
  PhoneCall,
  History,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SearchInput } from '../components/forms/SearchInput';
import { SelectInput } from '../components/forms/SelectInput';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { KpiCard } from '../components/common/KpiCard';
import { useAppState } from '../context/AppStateContext';
import { taskFollowUpService, VCMS_EMPLOYEES } from '../services/taskFollowUpService';
import {
  FollowUp,
  FollowUpStatus,
  CustomerOption,
} from '../types/taskFollowUp';

export const FollowUpsPage: React.FC = () => {
  const { isEmptyStateMode } = useAppState();

  // Search & Filter state
  const [search, setSearch] = useState<string>('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDateFilter, setSelectedDateFilter] = useState<string>('All');

  // Follow-ups & Customers state
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [viewingFollowUp, setViewingFollowUp] = useState<FollowUp | null>(null);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [completingFollowUp, setCompletingFollowUp] = useState<FollowUp | null>(null);
  const [schedulingNextFor, setSchedulingNextFor] = useState<FollowUp | null>(null);
  const [deletingFollowUpId, setDeletingFollowUpId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    customerId: string;
    customerName: string;
    scheduledDate: string;
    purpose: string;
    assignedTo: string;
    notes: string;
    outcome: string;
    nextFollowUpDate: string;
    status: FollowUpStatus;
  }>({
    customerId: '',
    customerName: '',
    scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    purpose: 'Bank Officer Review',
    assignedTo: VCMS_EMPLOYEES[0].name,
    notes: '',
    outcome: '',
    nextFollowUpDate: '',
    status: 'Scheduled',
  });

  // Complete Outcome Form state
  const [completeOutcome, setCompleteOutcome] = useState<string>('');
  const [completeNextDate, setCompleteNextDate] = useState<string>('');

  // Schedule Next Form state
  const [nextDateVal, setNextDateVal] = useState<string>('');
  const [nextPurposeVal, setNextPurposeVal] = useState<string>('');

  const [formError, setFormError] = useState<string>('');

  // Refresh follow-ups
  const refreshFollowUps = () => {
    const list = taskFollowUpService.getFollowUps({
      isEmptyState: isEmptyStateMode,
      search,
      assignee: selectedAssignee,
      status: selectedStatus,
      dateFilter: selectedDateFilter,
    });
    setFollowUps(list);
  };

  useEffect(() => {
    refreshFollowUps();
  }, [isEmptyStateMode, search, selectedAssignee, selectedStatus, selectedDateFilter]);

  useEffect(() => {
    taskFollowUpService.getAvailableCustomers().then((res) => {
      setCustomers(res);
      if (res.length > 0 && !formData.customerId) {
        setFormData((prev) => ({
          ...prev,
          customerId: res[0].id,
          customerName: res[0].name,
        }));
      }
    });
  }, []);

  // Compute KPI metrics across active mode records (unfiltered by text search)
  const allModeFollowUps = useMemo(() => {
    return taskFollowUpService.getFollowUps({ isEmptyState: isEmptyStateMode });
  }, [isEmptyStateMode, followUps]);

  const kpis = useMemo(() => {
    const total = allModeFollowUps.length;
    const scheduled = allModeFollowUps.filter((f) => f.status === 'Scheduled').length;
    const completed = allModeFollowUps.filter((f) => f.status === 'Completed').length;
    const missed = allModeFollowUps.filter((f) => f.status === 'Missed').length;
    return { total, scheduled, completed, missed };
  }, [allModeFollowUps]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    const defaultCust = customers[0] || { id: '', name: '' };
    setFormData({
      customerId: defaultCust.id,
      customerName: defaultCust.name,
      scheduledDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
      purpose: 'Bank Officer Review',
      assignedTo: VCMS_EMPLOYEES[0].name,
      notes: '',
      outcome: 'Pending scheduled interaction',
      nextFollowUpDate: '',
      status: 'Scheduled',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Submit Add Follow-up
  const handleCreateFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId) {
      setFormError('Please select a customer.');
      return;
    }
    if (!formData.scheduledDate) {
      setFormError('Follow-up date is required.');
      return;
    }
    if (!formData.purpose.trim()) {
      setFormError('Purpose is required.');
      return;
    }

    const selectedCust = customers.find((c) => c.id === formData.customerId);

    taskFollowUpService.createFollowUp({
      customerId: formData.customerId,
      customerName: selectedCust ? selectedCust.name : formData.customerName,
      scheduledDate: formData.scheduledDate,
      purpose: formData.purpose,
      assignedTo: formData.assignedTo,
      notes: formData.notes,
      outcome: formData.outcome || 'Pending interaction',
      nextFollowUpDate: formData.nextFollowUpDate || undefined,
      status: formData.status,
    });

    setIsAddModalOpen(false);
    refreshFollowUps();
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: FollowUp) => {
    setEditingFollowUp(item);
    setFormData({
      customerId: item.customerId,
      customerName: item.customerName,
      scheduledDate: item.scheduledDate,
      purpose: item.purpose,
      assignedTo: item.assignedTo,
      notes: item.notes || '',
      outcome: item.outcome || '',
      nextFollowUpDate: item.nextFollowUpDate || '',
      status: item.status,
    });
    setFormError('');
  };

  // Submit Edit Follow-up
  const handleUpdateFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFollowUp) return;
    if (!formData.scheduledDate) {
      setFormError('Follow-up date is required.');
      return;
    }

    const selectedCust = customers.find((c) => c.id === formData.customerId);

    taskFollowUpService.updateFollowUp(editingFollowUp.id, {
      customerId: formData.customerId,
      customerName: selectedCust ? selectedCust.name : formData.customerName,
      scheduledDate: formData.scheduledDate,
      purpose: formData.purpose,
      assignedTo: formData.assignedTo,
      notes: formData.notes,
      outcome: formData.outcome,
      nextFollowUpDate: formData.nextFollowUpDate || undefined,
      status: formData.status,
    });

    setEditingFollowUp(null);
    refreshFollowUps();
    if (viewingFollowUp && viewingFollowUp.id === editingFollowUp.id) {
      setViewingFollowUp(taskFollowUpService.getFollowUpById(editingFollowUp.id));
    }
  };

  // Open Complete / Record Outcome Modal
  const handleOpenCompleteModal = (item: FollowUp) => {
    setCompletingFollowUp(item);
    setCompleteOutcome(item.outcome && item.outcome !== 'Pending scheduled interaction' ? item.outcome : '');
    setCompleteNextDate('');
    setFormError('');
  };

  // Submit Complete / Record Outcome
  const handleSubmitComplete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingFollowUp) return;
    if (!completeOutcome.trim()) {
      setFormError('Please record the interaction outcome or resolution notes.');
      return;
    }

    taskFollowUpService.completeFollowUp(
      completingFollowUp.id,
      completeOutcome,
      completeNextDate || undefined
    );

    setCompletingFollowUp(null);
    refreshFollowUps();
    if (viewingFollowUp && viewingFollowUp.id === completingFollowUp.id) {
      setViewingFollowUp(taskFollowUpService.getFollowUpById(completingFollowUp.id));
    }
  };

  // Open Schedule Next Modal
  const handleOpenScheduleNextModal = (item: FollowUp) => {
    setSchedulingNextFor(item);
    setNextDateVal(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
    setNextPurposeVal(`Follow-up: ${item.purpose}`);
    setFormError('');
  };

  // Submit Schedule Next Follow-up
  const handleSubmitScheduleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingNextFor) return;
    if (!nextDateVal) {
      setFormError('Next follow-up date is required.');
      return;
    }

    taskFollowUpService.scheduleNextFollowUp(
      schedulingNextFor.id,
      nextDateVal,
      nextPurposeVal
    );

    setSchedulingNextFor(null);
    refreshFollowUps();
    if (viewingFollowUp && viewingFollowUp.id === schedulingNextFor.id) {
      setViewingFollowUp(taskFollowUpService.getFollowUpById(schedulingNextFor.id));
    }
  };

  // Delete Follow-up
  const handleDeleteFollowUp = (id: string) => {
    taskFollowUpService.deleteFollowUp(id);
    setDeletingFollowUpId(null);
    if (viewingFollowUp && viewingFollowUp.id === id) {
      setViewingFollowUp(null);
    }
    refreshFollowUps();
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedAssignee('All');
    setSelectedStatus('All');
    setSelectedDateFilter('All');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Scheduled Follow-ups & Reminders"
        subtitle="Manage critical customer deadlines, consular appointments, and financial balance re-verifications"
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAddModal}
          >
            New Follow-up
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          value={kpis.scheduled}
          label="Scheduled Follow-ups"
          icon={<Clock className="w-5 h-5" />}
          theme="blue"
        />
        <KpiCard
          value={kpis.completed}
          label="Completed Follow-ups"
          icon={<CheckCircle2 className="w-5 h-5" />}
          theme="green"
        />
        <KpiCard
          value={kpis.missed}
          label="Missed Interactions"
          icon={<AlertCircle className="w-5 h-5" />}
          theme="orange"
        />
        <KpiCard
          value={kpis.total}
          label="Total Interactions"
          icon={<History className="w-5 h-5" />}
          theme="purple"
        />
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by customer name, purpose, notes, or outcome..."
              value={search}
              onSearchChange={setSearch}
            />
          </div>
          <div className="w-full md:w-48">
            <SelectInput
              options={[
                { value: 'All', label: 'All Officers' },
                ...VCMS_EMPLOYEES.map((e) => ({ value: e.name, label: e.name })),
              ]}
              value={selectedAssignee}
              onChange={(e) => setSelectedAssignee(e.target.value)}
            />
          </div>
          <div className="w-full md:w-40">
            <SelectInput
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Scheduled', label: 'Scheduled' },
                { value: 'Completed', label: 'Completed' },
                { value: 'Missed', label: 'Missed' },
              ]}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>
          <div className="w-full md:w-40">
            <SelectInput
              options={[
                { value: 'All', label: 'All Dates' },
                { value: 'Today', label: 'Today' },
                { value: 'Upcoming', label: 'Upcoming' },
                { value: 'Past', label: 'Past' },
              ]}
              value={selectedDateFilter}
              onChange={(e) => setSelectedDateFilter(e.target.value)}
            />
          </div>
          {(search ||
            selectedAssignee !== 'All' ||
            selectedStatus !== 'All' ||
            selectedDateFilter !== 'All') && (
            <Button
              variant="secondary"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={handleResetFilters}
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Follow-up Table or Empty State */}
      {isEmptyStateMode &&
      followUps.length === 0 &&
      !search &&
      selectedAssignee === 'All' &&
      selectedStatus === 'All' &&
      selectedDateFilter === 'All' ? (
        <EmptyState
          title="No Scheduled Follow-ups"
          description="There are currently no pending officer follow-ups or applicant reminders. Schedule your first appointment or verification follow-up."
          actionText="Schedule Follow-up"
          onAction={handleOpenAddModal}
        />
      ) : followUps.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">
            No matching follow-ups found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different status/officer filter.
          </p>
          <div className="mt-4">
            <Button variant="secondary" size="sm" onClick={handleResetFilters}>
              Clear All Filters
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5">Follow-up ID</th>
                  <th className="px-4 py-3.5">Customer Name</th>
                  <th className="px-4 py-3.5">Scheduled Date</th>
                  <th className="px-4 py-3.5">Purpose & Subject</th>
                  <th className="px-4 py-3.5">Assigned Officer</th>
                  <th className="px-4 py-3.5">Outcome & Notes</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {followUps.map((item) => {
                  const today = new Date().toISOString().slice(0, 10);
                  const isPastDue = item.status === 'Scheduled' && item.scheduledDate < today;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap align-top">
                        <span className="font-mono font-medium text-slate-700">
                          {item.id}
                        </span>
                      </td>

                      {/* Customer Name */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span>{item.customerName}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5 pl-5">
                          {item.customerId}
                        </div>
                      </td>

                      {/* Scheduled Date */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div
                          className={`flex items-center gap-1 font-medium ${
                            isPastDue ? 'text-rose-600 font-semibold' : 'text-slate-600'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{item.scheduledDate}</span>
                        </div>
                        {isPastDue && (
                          <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                            Overdue
                          </span>
                        )}
                        {item.nextFollowUpDate && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            Next: {item.nextFollowUpDate}
                          </div>
                        )}
                      </td>

                      {/* Purpose */}
                      <td className="px-4 py-3.5 align-top">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold text-[11px] border border-blue-200/80 mb-1">
                          {item.purpose}
                        </span>
                        {item.notes && (
                          <div className="text-slate-500 text-[11px] line-clamp-2 leading-relaxed">
                            {item.notes}
                          </div>
                        )}
                      </td>

                      {/* Case Officer */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap text-slate-700 font-medium">
                        {item.assignedTo}
                      </td>

                      {/* Outcome & Notes */}
                      <td className="px-4 py-3.5 align-top max-w-xs">
                        <div className="text-slate-800 font-medium leading-snug">
                          {item.outcome || 'Pending interaction'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 align-top text-center whitespace-nowrap">
                        <Badge
                          variant={
                            item.status === 'Completed'
                              ? 'completed'
                              : item.status === 'Scheduled'
                              ? 'in-process'
                              : 'rejected'
                          }
                        >
                          {item.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 align-top text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Complete / Record Outcome */}
                          {item.status !== 'Completed' && (
                            <button
                              title="Mark as Completed & Record Outcome"
                              onClick={() => handleOpenCompleteModal(item)}
                              className="px-2 py-1 text-[11px] font-semibold rounded border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
                            >
                              Resolve
                            </button>
                          )}

                          {/* Schedule Next */}
                          <button
                            title="Schedule Next Follow-up"
                            onClick={() => handleOpenScheduleNextModal(item)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <CalendarPlus className="w-4 h-4" />
                          </button>

                          {/* View */}
                          <button
                            title="View Follow-up Details"
                            onClick={() => setViewingFollowUp(item)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            title="Edit Follow-up"
                            onClick={() => handleOpenEditModal(item)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            title="Delete Follow-up"
                            onClick={() => setDeletingFollowUpId(item.id)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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
      )}

      {/* Add Follow-up Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Schedule Customer Follow-up"
        subtitle="Set up a bank officer review, biometric appointment, or document check reminder"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateFollowUp}>
              Schedule Follow-up
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateFollowUp} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Customer Name <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => {
                  const id = e.target.value;
                  const c = customers.find((cust) => cust.id === id);
                  setFormData({
                    ...formData,
                    customerId: id,
                    customerName: c ? c.name : '',
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id}) {c.visaTrack ? `— ${c.visaTrack}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Assigned Case Officer <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                {VCMS_EMPLOYEES.map((emp) => (
                  <option key={emp.name} value={emp.name}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Follow-up Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Purpose / Subject <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                <option value="Bank Officer Review">Bank Officer Review</option>
                <option value="Embassy Biometrics">Embassy Biometrics</option>
                <option value="Financial Proof">Financial Proof</option>
                <option value="Document Submission">Document Submission</option>
                <option value="Client Solvency Review">Client Solvency Review</option>
                <option value="Appointment Booking">Appointment Booking</option>
                <option value="Visa Stamping">Visa Stamping</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Follow-up Agenda & Case Notes
            </label>
            <textarea
              rows={3}
              placeholder="Enter meeting notes, verification items, or contact history..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as FollowUpStatus })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Missed">Missed</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Next Follow-up Date (Optional)
              </label>
              <input
                type="date"
                value={formData.nextFollowUpDate}
                onChange={(e) =>
                  setFormData({ ...formData, nextFollowUpDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Follow-up Modal */}
      <Modal
        isOpen={!!editingFollowUp}
        onClose={() => setEditingFollowUp(null)}
        title={`Edit Follow-up: ${editingFollowUp?.id}`}
        subtitle="Modify follow-up details, case notes, or assignment"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingFollowUp(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateFollowUp}>
              Update Follow-up
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateFollowUp} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Customer Name
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => {
                  const id = e.target.value;
                  const c = customers.find((cust) => cust.id === id);
                  setFormData({
                    ...formData,
                    customerId: id,
                    customerName: c ? c.name : '',
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Assigned Case Officer
              </label>
              <select
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                {VCMS_EMPLOYEES.map((emp) => (
                  <option key={emp.name} value={emp.name}>
                    {emp.name} ({emp.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Follow-up Date
              </label>
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Purpose / Subject
              </label>
              <input
                type="text"
                required
                value={formData.purpose}
                onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Case Notes & Agenda
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Outcome</label>
              <input
                type="text"
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as FollowUpStatus })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Missed">Missed</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Complete & Record Outcome Modal */}
      <Modal
        isOpen={!!completingFollowUp}
        onClose={() => setCompletingFollowUp(null)}
        title={`Resolve Follow-up: ${completingFollowUp?.id}`}
        subtitle={`Record final resolution for ${completingFollowUp?.customerName}`}
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCompletingFollowUp(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitComplete}>
              Mark Completed & Save Outcome
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitComplete} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-900">
            <div className="font-semibold text-xs">
              {completingFollowUp?.purpose} – {completingFollowUp?.customerName}
            </div>
            <div className="text-[11px] text-blue-700 mt-0.5">
              Scheduled Date: {completingFollowUp?.scheduledDate} | Assigned: {completingFollowUp?.assignedTo}
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Interaction Outcome & Resolution Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Bank officer verified ledger balance and endorsed letter. Customer notified."
              value={completeOutcome}
              onChange={(e) => setCompleteOutcome(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Next Action Date (Optional)
            </label>
            <input
              type="date"
              value={completeNextDate}
              onChange={(e) => setCompleteNextDate(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>
        </form>
      </Modal>

      {/* Schedule Next Follow-up Modal */}
      <Modal
        isOpen={!!schedulingNextFor}
        onClose={() => setSchedulingNextFor(null)}
        title="Schedule Next Follow-up"
        subtitle={`Create consecutive appointment for ${schedulingNextFor?.customerName}`}
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setSchedulingNextFor(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmitScheduleNext}>
              Schedule Consecutive Follow-up
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmitScheduleNext} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700">
            <div>
              <strong>Customer:</strong> {schedulingNextFor?.customerName} (
              {schedulingNextFor?.customerId})
            </div>
            <div className="mt-0.5">
              <strong>Previous Step:</strong> {schedulingNextFor?.purpose} (
              {schedulingNextFor?.scheduledDate})
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Next Follow-up Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={nextDateVal}
              onChange={(e) => setNextDateVal(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Purpose / Subject
            </label>
            <input
              type="text"
              value={nextPurposeVal}
              onChange={(e) => setNextPurposeVal(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>
        </form>
      </Modal>

      {/* View Follow-up Details Modal */}
      <Modal
        isOpen={!!viewingFollowUp}
        onClose={() => setViewingFollowUp(null)}
        title={viewingFollowUp ? `${viewingFollowUp.id} – ${viewingFollowUp.purpose}` : 'Follow-up Details'}
        subtitle="Complete record of applicant communication and casework follow-up"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="danger"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                const id = viewingFollowUp?.id;
                if (id) {
                  setDeletingFollowUpId(id);
                }
              }}
            >
              Delete
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                icon={<Edit className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (viewingFollowUp) {
                    const f = viewingFollowUp;
                    setViewingFollowUp(null);
                    handleOpenEditModal(f);
                  }
                }}
              >
                Edit
              </Button>
              {viewingFollowUp?.status !== 'Completed' && (
                <Button
                  variant="primary"
                  onClick={() => {
                    if (viewingFollowUp) {
                      const f = viewingFollowUp;
                      setViewingFollowUp(null);
                      handleOpenCompleteModal(f);
                    }
                  }}
                >
                  Resolve Interaction
                </Button>
              )}
            </div>
          </div>
        }
      >
        {viewingFollowUp && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Customer
                </span>
                <p className="font-semibold text-slate-800 mt-1">
                  {viewingFollowUp.customerName}
                </p>
                <span className="text-[10px] text-blue-600 font-mono">
                  {viewingFollowUp.customerId}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Assigned Officer
                </span>
                <p className="font-semibold text-slate-800 mt-1">
                  {viewingFollowUp.assignedTo}
                </p>
                <span className="text-[10px] text-slate-500">Casework Team</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Scheduled Date
                </span>
                <p className="font-semibold text-slate-800 mt-1">
                  {viewingFollowUp.scheduledDate}
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Status
                </span>
                <div className="mt-1">
                  <Badge
                    variant={
                      viewingFollowUp.status === 'Completed'
                        ? 'completed'
                        : viewingFollowUp.status === 'Scheduled'
                        ? 'in-process'
                        : 'rejected'
                    }
                  >
                    {viewingFollowUp.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Follow-up Notes & Context
              </div>
              <div className="text-slate-800 font-medium text-xs mt-1.5 leading-relaxed whitespace-pre-wrap">
                {viewingFollowUp.notes || 'No specific agenda recorded.'}
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-lg p-3.5 border border-blue-200/70">
              <div className="text-[11px] font-semibold text-blue-800 uppercase tracking-wide">
                Recorded Outcome
              </div>
              <div className="text-slate-800 font-medium text-xs mt-1.5 leading-relaxed">
                {viewingFollowUp.outcome || 'Pending interaction'}
              </div>
              {viewingFollowUp.nextFollowUpDate && (
                <div className="text-[11px] text-blue-700 mt-2 font-medium">
                  Next Follow-up Scheduled: {viewingFollowUp.nextFollowUpDate}
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Created: {new Date(viewingFollowUp.createdAt).toLocaleString()}</span>
              {viewingFollowUp.isDemo && (
                <span className="text-amber-600 font-medium">Demonstration Baseline Record</span>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingFollowUpId}
        onClose={() => setDeletingFollowUpId(null)}
        title="Confirm Follow-up Deletion"
        subtitle="This action will delete the follow-up record."
        maxWidth="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingFollowUpId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deletingFollowUpId) handleDeleteFollowUp(deletingFollowUpId);
              }}
            >
              Delete Follow-up
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Are you sure you want to delete follow-up{' '}
          <strong className="text-slate-800">{deletingFollowUpId}</strong>? This in-memory
          action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};
