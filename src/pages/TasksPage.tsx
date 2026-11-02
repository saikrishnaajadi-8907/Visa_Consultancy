import React, { useState, useEffect, useMemo } from 'react';
import {
  CheckSquare,
  Plus,
  Clock,
  User,
  AlertCircle,
  Search,
  Eye,
  Edit,
  Trash2,
  Calendar,
  CheckCircle2,
  Filter,
  RotateCcw,
  Building,
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
  Task,
  TaskPriority,
  TaskStatus,
  CustomerOption,
} from '../types/taskFollowUp';

export const TasksPage: React.FC = () => {
  const { isEmptyStateMode } = useAppState();

  // Search & Filter state
  const [search, setSearch] = useState<string>('');
  const [selectedAssignee, setSelectedAssignee] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Tasks & Customers state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  // Form states for Add / Edit
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    customerId: string;
    assignedTo: string;
    dueDate: string;
    priority: TaskPriority;
    status: TaskStatus;
    category: string;
  }>({
    title: '',
    description: '',
    customerId: '',
    assignedTo: VCMS_EMPLOYEES[0].name,
    dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    priority: 'Medium',
    status: 'Pending',
    category: 'General Casework',
  });
  const [formError, setFormError] = useState<string>('');

  // Refresh tasks
  const refreshTasks = () => {
    const list = taskFollowUpService.getTasks({
      isEmptyState: isEmptyStateMode,
      search,
      assignee: selectedAssignee,
      priority: selectedPriority,
      status: selectedStatus,
    });
    setTasks(list);
  };

  useEffect(() => {
    refreshTasks();
  }, [isEmptyStateMode, search, selectedAssignee, selectedPriority, selectedStatus]);

  useEffect(() => {
    taskFollowUpService.getAvailableCustomers().then(setCustomers);
  }, []);

  // Compute KPI metrics from all active mode tasks (unfiltered by text search)
  const allModeTasks = useMemo(() => {
    return taskFollowUpService.getTasks({ isEmptyState: isEmptyStateMode });
  }, [isEmptyStateMode, tasks]);

  const kpis = useMemo(() => {
    const total = allModeTasks.length;
    const inProgress = allModeTasks.filter((t) => t.status === 'In Progress').length;
    const pending = allModeTasks.filter((t) => t.status === 'Pending').length;
    const completed = allModeTasks.filter((t) => t.status === 'Completed').length;
    return { total, inProgress, pending, completed };
  }, [allModeTasks]);

  // Handle open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      title: '',
      description: '',
      customerId: '',
      assignedTo: VCMS_EMPLOYEES[0].name,
      dueDate: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
      priority: 'Medium',
      status: 'Pending',
      category: 'General Casework',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Handle submit Add Task
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError('Task title is required.');
      return;
    }
    if (!formData.dueDate) {
      setFormError('Due date is required.');
      return;
    }

    const linkedCust = customers.find((c) => c.id === formData.customerId);

    taskFollowUpService.createTask({
      title: formData.title,
      description: formData.description,
      customerId: linkedCust ? linkedCust.id : undefined,
      customerName: linkedCust ? linkedCust.name : undefined,
      assignedTo: formData.assignedTo,
      dueDate: formData.dueDate,
      priority: formData.priority,
      status: formData.status,
      category: formData.category,
    });

    setIsAddModalOpen(false);
    refreshTasks();
  };

  // Handle open Edit Modal
  const handleOpenEditModal = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      customerId: task.customerId || '',
      assignedTo: task.assignedTo,
      dueDate: task.dueDate,
      priority: task.priority,
      status: task.status,
      category: task.category || 'General Casework',
    });
    setFormError('');
  };

  // Handle submit Edit Task
  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    if (!formData.title.trim()) {
      setFormError('Task title is required.');
      return;
    }
    if (!formData.dueDate) {
      setFormError('Due date is required.');
      return;
    }

    const linkedCust = customers.find((c) => c.id === formData.customerId);

    taskFollowUpService.updateTask(editingTask.id, {
      title: formData.title,
      description: formData.description,
      customerId: linkedCust ? linkedCust.id : undefined,
      customerName: linkedCust ? linkedCust.name : undefined,
      assignedTo: formData.assignedTo,
      dueDate: formData.dueDate,
      priority: formData.priority,
      status: formData.status,
      category: formData.category,
    });

    setEditingTask(null);
    refreshTasks();
    if (viewingTask && viewingTask.id === editingTask.id) {
      const refreshed = taskFollowUpService.getTaskById(editingTask.id);
      setViewingTask(refreshed);
    }
  };

  // Handle fast status toggle
  const handleToggleStatus = (task: Task) => {
    let nextStatus: TaskStatus = 'In Progress';
    if (task.status === 'Pending') nextStatus = 'In Progress';
    else if (task.status === 'In Progress') nextStatus = 'Completed';
    else if (task.status === 'Completed') nextStatus = 'Pending';

    taskFollowUpService.updateTaskStatus(task.id, nextStatus);
    refreshTasks();
    if (viewingTask && viewingTask.id === task.id) {
      setViewingTask(taskFollowUpService.getTaskById(task.id));
    }
  };

  // Handle Delete Task
  const handleDeleteTask = (id: string) => {
    taskFollowUpService.deleteTask(id);
    setDeletingTaskId(null);
    if (viewingTask && viewingTask.id === id) {
      setViewingTask(null);
    }
    refreshTasks();
  };

  // Clear filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedAssignee('All');
    setSelectedPriority('All');
    setSelectedStatus('All');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Operations Tasks & Workflows"
        subtitle="Manage daily officer casework assignments, verification checks, and embassy filing preparations"
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAddModal}
          >
            New Task
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          value={kpis.total}
          label="Total Tasks"
          icon={<CheckSquare className="w-5 h-5" />}
          theme="blue"
        />
        <KpiCard
          value={kpis.inProgress}
          label="In Progress"
          icon={<Clock className="w-5 h-5" />}
          theme="purple"
        />
        <KpiCard
          value={kpis.pending}
          label="Pending Assignment"
          icon={<AlertCircle className="w-5 h-5" />}
          theme="amber"
        />
        <KpiCard
          value={kpis.completed}
          label="Completed Tasks"
          icon={<CheckCircle2 className="w-5 h-5" />}
          theme="green"
        />
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by task title, description, customer, or ID..."
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
          <div className="w-full md:w-36">
            <SelectInput
              options={[
                { value: 'All', label: 'All Priorities' },
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' },
              ]}
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
            />
          </div>
          <div className="w-full md:w-40">
            <SelectInput
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Pending', label: 'Pending' },
                { value: 'In Progress', label: 'In Progress' },
                { value: 'Completed', label: 'Completed' },
              ]}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>
          {(search ||
            selectedAssignee !== 'All' ||
            selectedPriority !== 'All' ||
            selectedStatus !== 'All') && (
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

      {/* Task Listing or Empty State */}
      {isEmptyStateMode && tasks.length === 0 && !search && selectedAssignee === 'All' && selectedPriority === 'All' && selectedStatus === 'All' ? (
        <EmptyState
          title="No Operational Tasks"
          description="Your task queue is currently empty. Create your first casework assignment or verification checklist for your team."
          actionText="Create First Task"
          onAction={handleOpenAddModal}
        />
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No matching tasks found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or filters to locate casework assignments.
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
                  <th className="px-4 py-3.5">Task ID</th>
                  <th className="px-4 py-3.5">Task Details</th>
                  <th className="px-4 py-3.5">Linked Customer</th>
                  <th className="px-4 py-3.5">Assigned Officer</th>
                  <th className="px-4 py-3.5">Due Date</th>
                  <th className="px-4 py-3.5 text-center">Priority</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tasks.map((task) => {
                  const isOverdue =
                    task.status !== 'Completed' &&
                    task.dueDate < new Date().toISOString().slice(0, 10);

                  return (
                    <tr
                      key={task.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Task ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap align-top">
                        <span className="font-mono font-medium text-slate-700">
                          {task.id}
                        </span>
                        {task.category && (
                          <div className="text-[10px] text-slate-400 mt-1">
                            {task.category}
                          </div>
                        )}
                      </td>

                      {/* Task Details */}
                      <td className="px-4 py-3.5 align-top max-w-xs md:max-w-md">
                        <div className="font-semibold text-slate-900 leading-snug">
                          {task.title}
                        </div>
                        {task.description && (
                          <div className="text-slate-500 text-[11px] mt-1 line-clamp-2 leading-relaxed">
                            {task.description}
                          </div>
                        )}
                      </td>

                      {/* Linked Customer */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        {task.customerName ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                            <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                            <span>{task.customerName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">General Casework</span>
                        )}
                      </td>

                      {/* Assigned Officer */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap text-slate-700 font-medium">
                        {task.assignedTo}
                      </td>

                      {/* Due Date */}
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <div
                          className={`flex items-center gap-1 font-medium ${
                            isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-600'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>{task.dueDate}</span>
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] text-rose-600 font-bold tracking-tight block mt-0.5">
                            Overdue
                          </span>
                        )}
                      </td>

                      {/* Priority */}
                      <td className="px-4 py-3.5 align-top text-center whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold ${
                            task.priority === 'High'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : task.priority === 'Medium'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 align-top text-center whitespace-nowrap">
                        <Badge
                          variant={
                            task.status === 'Completed'
                              ? 'completed'
                              : task.status === 'In Progress'
                              ? 'in-process'
                              : 'pending'
                          }
                        >
                          {task.status}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 align-top text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Quick Toggle Status */}
                          <button
                            title="Advance / Toggle Status"
                            onClick={() => handleToggleStatus(task)}
                            className="px-2 py-1 text-[11px] font-medium rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
                          >
                            {task.status === 'Completed'
                              ? 'Reopen'
                              : task.status === 'Pending'
                              ? 'Start'
                              : 'Done'}
                          </button>

                          {/* View */}
                          <button
                            title="View Task Details"
                            onClick={() => setViewingTask(task)}
                            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            title="Edit Task"
                            onClick={() => handleOpenEditModal(task)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            title="Delete Task"
                            onClick={() => setDeletingTaskId(task.id)}
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

      {/* Add Task Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Create Casework Task"
        subtitle="Assign an operational verification, consular filing, or customer task"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateTask}>
              Save Task
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateTask} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Obtain ICICI bank balance endorsement letter"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Description & Casework Instructions
            </label>
            <textarea
              rows={3}
              placeholder="Detail specific guidelines, contact numbers, or document criteria..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Linked Customer
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                <option value="">None (General Operational Task)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id}) {c.visaTrack ? `— ${c.visaTrack}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Assigned Officer <span className="text-rose-500">*</span>
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Due Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as TaskPriority })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Initial Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as TaskStatus })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            >
              <option value="General Casework">General Casework</option>
              <option value="Banking Verification">Banking Verification</option>
              <option value="Compliance Audit">Compliance Audit</option>
              <option value="Embassy Preparation">Embassy Preparation</option>
              <option value="Legal Verification">Legal Verification</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* Edit Task Modal */}
      <Modal
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        title={`Edit Task: ${editingTask?.id}`}
        subtitle="Modify casework priority, due date, status, or assignee"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingTask(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateTask}>
              Update Task
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateTask} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Description & Instructions
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Linked Customer
              </label>
              <select
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                <option value="">None (General Operational Task)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Assigned Officer
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Due Date</label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as TaskPriority })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as TaskStatus })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Task Details Modal */}
      <Modal
        isOpen={!!viewingTask}
        onClose={() => setViewingTask(null)}
        title={viewingTask ? `${viewingTask.id} – ${viewingTask.title}` : 'Task Details'}
        subtitle="Complete operational task record and metadata"
        maxWidth="md"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="danger"
              icon={<Trash2 className="w-3.5 h-3.5" />}
              onClick={() => {
                const id = viewingTask?.id;
                if (id) {
                  setDeletingTaskId(id);
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
                  if (viewingTask) {
                    const t = viewingTask;
                    setViewingTask(null);
                    handleOpenEditModal(t);
                  }
                }}
              >
                Edit Task
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (viewingTask) {
                    handleToggleStatus(viewingTask);
                  }
                }}
              >
                {viewingTask?.status === 'Completed' ? 'Reopen Task' : 'Mark as Done'}
              </Button>
            </div>
          </div>
        }
      >
        {viewingTask && (
          <div className="space-y-4 text-xs">
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Instructions & Scope
              </div>
              <div className="text-slate-800 font-medium text-xs mt-1.5 leading-relaxed whitespace-pre-wrap">
                {viewingTask.description || 'No additional instructions recorded.'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Linked Customer
                </span>
                <p className="font-semibold text-slate-800 mt-1">
                  {viewingTask.customerName || 'General Operational Task'}
                </p>
                {viewingTask.customerId && (
                  <span className="text-[10px] text-blue-600 font-mono">
                    {viewingTask.customerId}
                  </span>
                )}
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Assigned Officer
                </span>
                <p className="font-semibold text-slate-800 mt-1">
                  {viewingTask.assignedTo}
                </p>
                <span className="text-[10px] text-slate-500">Casework Team</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Due Date
                </span>
                <p className="font-semibold text-slate-800 mt-1">
                  {viewingTask.dueDate}
                </p>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-500 uppercase font-semibold">
                  Priority & Status
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      viewingTask.priority === 'High'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : viewingTask.priority === 'Medium'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {viewingTask.priority}
                  </span>
                  <Badge
                    variant={
                      viewingTask.status === 'Completed'
                        ? 'completed'
                        : viewingTask.status === 'In Progress'
                        ? 'in-process'
                        : 'pending'
                    }
                  >
                    {viewingTask.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span>Created: {new Date(viewingTask.createdAt).toLocaleString()}</span>
              {viewingTask.isDemo && (
                <span className="text-amber-600 font-medium">Demonstration Baseline Record</span>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deletingTaskId}
        onClose={() => setDeletingTaskId(null)}
        title="Confirm Task Deletion"
        subtitle="This action will remove the task from the operational queue."
        maxWidth="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeletingTaskId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deletingTaskId) handleDeleteTask(deletingTaskId);
              }}
            >
              Delete Task
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Are you sure you want to delete task{' '}
          <strong className="text-slate-800">{deletingTaskId}</strong>? This in-memory demo
          action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};
