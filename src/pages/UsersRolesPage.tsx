import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  Plus,
  Shield,
  Search,
  Eye,
  Edit,
  RotateCcw,
  User,
  Phone,
  Mail,
  Building,
  CheckSquare,
  Clock,
  AlertCircle,
  Briefcase,
  ToggleLeft,
  ToggleRight,
  ExternalLink,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { SearchInput } from '../components/forms/SearchInput';
import { SelectInput } from '../components/forms/SelectInput';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';
import { useAppState } from '../context/AppStateContext';
import { employeeService } from '../services/employeeService';
import {
  Employee,
  EmployeeRole,
  EmployeeStatus,
} from '../types/employee';
import { Task, FollowUp } from '../types/taskFollowUp';

export const UsersRolesPage: React.FC = () => {
  const { isEmptyStateMode } = useAppState();

  // Search & Filters state
  const [search, setSearch] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');

  // Employees state
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  // Form states
  const [formData, setFormData] = useState<{
    name: string;
    designation: string;
    department: string;
    contactNumber: string;
    email: string;
    role: EmployeeRole;
    status: EmployeeStatus;
  }>({
    name: '',
    designation: 'Senior Case Officer',
    department: 'Verification & Banking',
    contactNumber: '+91 98480 00000',
    email: '',
    role: 'Employee',
    status: 'Active',
  });

  const [formError, setFormError] = useState<string>('');

  // Refresh employee list
  const refreshEmployees = () => {
    const list = employeeService.getEmployees({
      isEmptyState: isEmptyStateMode,
      search,
      role: selectedRole,
      status: selectedStatus,
    });
    setEmployees(list);
  };

  useEffect(() => {
    refreshEmployees();
  }, [isEmptyStateMode, search, selectedRole, selectedStatus]);

  // Open Add Modal
  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      designation: 'Case Officer',
      department: 'Casework Operations',
      contactNumber: '+91 98480 00000',
      email: '',
      role: 'Employee',
      status: 'Active',
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Submit Add Employee
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Employee name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email address is required.');
      return;
    }

    employeeService.createEmployee({
      name: formData.name,
      designation: formData.designation,
      department: formData.department,
      contactNumber: formData.contactNumber,
      email: formData.email,
      role: formData.role,
      status: formData.status,
    });

    setIsAddModalOpen(false);
    refreshEmployees();
  };

  // Open Edit Modal
  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setFormData({
      name: emp.name,
      designation: emp.designation,
      department: emp.department || '',
      contactNumber: emp.contactNumber || '',
      email: emp.email,
      role: emp.role,
      status: emp.status,
    });
    setFormError('');
  };

  // Submit Edit Employee
  const handleUpdateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    if (!formData.name.trim()) {
      setFormError('Employee name is required.');
      return;
    }
    if (!formData.email.trim()) {
      setFormError('Email address is required.');
      return;
    }

    employeeService.updateEmployee(editingEmployee.id, {
      name: formData.name,
      designation: formData.designation,
      department: formData.department,
      contactNumber: formData.contactNumber,
      email: formData.email,
      role: formData.role,
      status: formData.status,
    });

    setEditingEmployee(null);
    refreshEmployees();
    if (viewingEmployee && viewingEmployee.id === editingEmployee.id) {
      setViewingEmployee(employeeService.getEmployeeById(editingEmployee.id));
    }
  };

  // Toggle Status
  const handleToggleStatus = (emp: Employee) => {
    const updated = employeeService.toggleEmployeeStatus(emp.id);
    refreshEmployees();
    if (viewingEmployee && viewingEmployee.id === emp.id) {
      setViewingEmployee(updated);
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearch('');
    setSelectedRole('All');
    setSelectedStatus('All');
  };

  // Helper for viewing workload in Details modal
  const viewingWorkload = useMemo(() => {
    if (!viewingEmployee) {
      return { taskCount: 0, followUpCount: 0, tasks: [], followUps: [] };
    }
    return employeeService.getEmployeeWorkload(viewingEmployee.name, isEmptyStateMode);
  }, [viewingEmployee, isEmptyStateMode]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Employee Management & Staff Directory"
        subtitle="Consultancy personnel directory, designated caseworker roles, and operational workload distribution"
        actions={
          <Button
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAddModal}
          >
            Add Employee
          </Button>
        }
      />

      {/* Filters Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              placeholder="Search by employee name, ID, designation, or email..."
              value={search}
              onSearchChange={setSearch}
            />
          </div>
          <div className="w-full md:w-48">
            <SelectInput
              options={[
                { value: 'All', label: 'All Roles' },
                { value: 'Head/Admin', label: 'Head/Admin' },
                { value: 'Employee', label: 'Employee' },
              ]}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            />
          </div>
          <div className="w-full md:w-40">
            <SelectInput
              options={[
                { value: 'All', label: 'All Statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            />
          </div>
          {(search || selectedRole !== 'All' || selectedStatus !== 'All') && (
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

      {/* Employee Listing or Empty State */}
      {isEmptyStateMode &&
      employees.length === 0 &&
      !search &&
      selectedRole === 'All' &&
      selectedStatus === 'All' ? (
        <EmptyState
          title="No Employees Registered"
          description="There are currently no staff members configured in the role directory. Add your first consultancy team member."
          actionText="Add Employee"
          onAction={handleOpenAddModal}
        />
      ) : employees.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800">No matching employees found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or clearing role and status filters.
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
            <table className="w-full min-w-[950px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/75 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5 whitespace-nowrap">Employee ID</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Employee Name</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Designation</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Department</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Contact Number</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Email Address</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Role</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Status</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Assigned Tasks</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Follow-ups</th>
                  <th className="px-4 py-3.5 text-center whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => {
                  const workload = employeeService.getEmployeeWorkload(
                    emp.name,
                    isEmptyStateMode
                  );

                  return (
                    <tr
                      key={emp.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* ID */}
                      <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                        <span className="font-mono font-medium text-slate-700">
                          {emp.id}
                        </span>
                      </td>

                      {/* Name & Avatar */}
                      <td className="px-4 py-3.5 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-xs">
                            {emp.name.charAt(0)}
                          </div>
                          <span className="font-semibold text-slate-900">{emp.name}</span>
                        </div>
                      </td>

                      {/* Designation */}
                      <td className="px-4 py-3.5 text-slate-800 font-medium align-middle">
                        {emp.designation}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3.5 text-slate-600 align-middle">
                        {emp.department || '—'}
                      </td>

                      {/* Contact Number */}
                      <td className="px-4 py-3.5 font-mono text-slate-600 align-middle whitespace-nowrap">
                        {emp.contactNumber || '—'}
                      </td>

                      {/* Email Address */}
                      <td className="px-4 py-3.5 font-mono text-slate-600 align-middle">
                        {emp.email}
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3.5 text-center align-middle whitespace-nowrap">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                            emp.role === 'Head/Admin'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}
                        >
                          {emp.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5 text-center align-middle whitespace-nowrap">
                        <Badge variant={emp.status === 'Active' ? 'active' : 'neutral'}>
                          {emp.status}
                        </Badge>
                      </td>

                      {/* Assigned Tasks */}
                      <td className="px-4 py-3.5 text-center align-middle whitespace-nowrap">
                        <button
                          onClick={() => setViewingEmployee(emp)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50/70 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors"
                          title="Click to view assigned tasks"
                        >
                          <CheckSquare className="w-3 h-3" />
                          <span>{workload.taskCount}</span>
                        </button>
                      </td>

                      {/* Assigned Follow-ups */}
                      <td className="px-4 py-3.5 text-center align-middle whitespace-nowrap">
                        <button
                          onClick={() => setViewingEmployee(emp)}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50/70 hover:bg-amber-100 text-amber-700 font-semibold text-xs transition-colors"
                          title="Click to view assigned follow-ups"
                        >
                          <Clock className="w-3 h-3" />
                          <span>{workload.followUpCount}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-center align-middle whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Toggle Status */}
                          <button
                            title={emp.status === 'Active' ? 'Deactivate Employee' : 'Activate Employee'}
                            onClick={() => handleToggleStatus(emp)}
                            className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors ${
                              emp.status === 'Active'
                                ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                            }`}
                          >
                            {emp.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </button>

                          {/* View */}
                          <button
                            title="View Employee Workload"
                            onClick={() => setViewingEmployee(emp)}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit */}
                          <button
                            title="Edit Employee"
                            onClick={() => handleOpenEditModal(emp)}
                            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
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

      {/* Add Employee Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Consultancy Team Member"
        subtitle="Register new case consultant or administrative personnel"
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateEmployee}>
              Save Employee
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. S. Mehta or Anita Rao"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Designation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Case Officer"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Department</label>
              <input
                type="text"
                placeholder="e.g. Verification & Banking"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Contact Number</label>
              <input
                type="text"
                placeholder="+91 98480 22101"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="e.g. s.mehta@visaconsultancy.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as EmployeeRole })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                <option value="Employee">Employee</option>
                <option value="Head/Admin">Head/Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as EmployeeStatus })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Employee Modal */}
      <Modal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        title={`Edit Employee: ${editingEmployee?.name}`}
        subtitle={`Update details and designation for ${editingEmployee?.id}`}
        maxWidth="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditingEmployee(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateEmployee}>
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpdateEmployee} className="space-y-4 text-xs">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Designation <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Contact Number</label>
              <input
                type="text"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as EmployeeRole })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                <option value="Employee">Employee</option>
                <option value="Head/Admin">Head/Admin</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as EmployeeStatus })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs text-slate-800"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* View Employee Details & Workload Modal */}
      <Modal
        isOpen={!!viewingEmployee}
        onClose={() => setViewingEmployee(null)}
        title={viewingEmployee ? `${viewingEmployee.name} (${viewingEmployee.id})` : 'Employee Details'}
        subtitle="Staff credentials, assignment workload, and casework distribution"
        maxWidth="lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              onClick={() => {
                if (viewingEmployee) handleToggleStatus(viewingEmployee);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                viewingEmployee?.status === 'Active'
                  ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              {viewingEmployee?.status === 'Active' ? 'Deactivate Employee' : 'Activate Employee'}
            </button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                icon={<Edit className="w-3.5 h-3.5" />}
                onClick={() => {
                  if (viewingEmployee) {
                    const e = viewingEmployee;
                    setViewingEmployee(null);
                    handleOpenEditModal(e);
                  }
                }}
              >
                Edit Details
              </Button>
              <Button variant="primary" onClick={() => setViewingEmployee(null)}>
                Done
              </Button>
            </div>
          </div>
        }
      >
        {viewingEmployee && (
          <div className="space-y-6 text-xs">
            {/* Info Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shrink-0">
                    {viewingEmployee.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">
                        {viewingEmployee.name}
                      </h4>
                      <Badge variant={viewingEmployee.status === 'Active' ? 'active' : 'neutral'}>
                        {viewingEmployee.status}
                      </Badge>
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          viewingEmployee.role === 'Head/Admin'
                            ? 'bg-purple-100 text-purple-800 border border-purple-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {viewingEmployee.role}
                      </span>
                    </div>
                    <p className="text-slate-600 font-medium text-xs mt-0.5">
                      {viewingEmployee.designation} · {viewingEmployee.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{viewingEmployee.contactNumber}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{viewingEmployee.email}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Workload KPI Row */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {viewingWorkload.taskCount}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">
                    Assigned Casework Tasks
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {viewingWorkload.followUpCount}
                  </div>
                  <div className="text-xs font-medium text-slate-500 mt-0.5">
                    Scheduled Follow-ups
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Assigned Tasks Table */}
            <div className="space-y-2">
              <h5 className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span>Assigned Tasks ({viewingWorkload.tasks.length})</span>
              </h5>

              {viewingWorkload.tasks.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-200/80">
                  No active casework tasks currently assigned to this officer.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                        <th className="px-3 py-2">Task ID</th>
                        <th className="px-3 py-2">Title</th>
                        <th className="px-3 py-2">Customer</th>
                        <th className="px-3 py-2">Due Date</th>
                        <th className="px-3 py-2 text-center">Priority</th>
                        <th className="px-3 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingWorkload.tasks.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/60">
                          <td className="px-3 py-2 font-mono text-slate-600">{t.id}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">{t.title}</td>
                          <td className="px-3 py-2 text-slate-600">{t.customerName || 'General'}</td>
                          <td className="px-3 py-2 text-slate-600">{t.dueDate}</td>
                          <td className="px-3 py-2 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                t.priority === 'High'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : t.priority === 'Medium'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {t.priority}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge
                              variant={
                                t.status === 'Completed'
                                  ? 'completed'
                                  : t.status === 'In Progress'
                                  ? 'in-process'
                                  : 'pending'
                              }
                            >
                              {t.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Assigned Follow-ups Table */}
            <div className="space-y-2">
              <h5 className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Scheduled Follow-ups ({viewingWorkload.followUps.length})</span>
              </h5>

              {viewingWorkload.followUps.length === 0 ? (
                <div className="p-4 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-200/80">
                  No applicant follow-ups currently scheduled for this officer.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                        <th className="px-3 py-2">Follow-up Ref</th>
                        <th className="px-3 py-2">Customer</th>
                        <th className="px-3 py-2">Purpose / Agenda</th>
                        <th className="px-3 py-2">Scheduled Date</th>
                        <th className="px-3 py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {viewingWorkload.followUps.map((f) => (
                        <tr key={f.id} className="hover:bg-slate-50/60">
                          <td className="px-3 py-2 font-mono text-slate-600">{f.id}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">{f.customerName}</td>
                          <td className="px-3 py-2 text-slate-700">{f.purpose}</td>
                          <td className="px-3 py-2 text-slate-600">{f.scheduledDate}</td>
                          <td className="px-3 py-2 text-center">
                            <Badge
                              variant={
                                f.status === 'Completed'
                                  ? 'completed'
                                  : f.status === 'Scheduled'
                                  ? 'in-process'
                                  : 'rejected'
                              }
                            >
                              {f.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
