/**
 * In-Memory Employee Management Service for VCMS Client Demonstration
 *
 * Manages consultancy personnel directory, designations, and workload linkages.
 * Operates purely in-memory (zero persistent storage or production authentication).
 */

import {
  Employee,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  EmployeeRole,
  EmployeeStatus,
} from '../types/employee';
import type { Task, FollowUp } from '../types/taskFollowUp';

type TaskFollowUpQuery = {
  getTasks: (opts?: any) => Task[];
  getFollowUps: (opts?: any) => FollowUp[];
};

let registeredTaskService: TaskFollowUpQuery | null = null;

// Baseline Demonstration Employees (1 Head/Admin + 6 Employees)
const DEMO_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-01',
    name: 'Admin Case Officer',
    designation: 'Head of Casework / Managing Director',
    department: 'Executive Casework',
    contactNumber: '+91 98480 11000',
    email: 'admin@visaconsultancy.com',
    role: 'Head/Admin',
    status: 'Active',
    isDemo: true,
    createdAt: '2026-10-01T09:00:00Z',
  },
  {
    id: 'EMP-02',
    name: 'S. Mehta',
    designation: 'Senior Case Officer',
    department: 'Verification & Banking',
    contactNumber: '+91 98480 22101',
    email: 's.mehta@visaconsultancy.com',
    role: 'Employee',
    status: 'Active',
    isDemo: true,
    createdAt: '2026-10-01T09:15:00Z',
  },
  {
    id: 'EMP-03',
    name: 'R. Sharma',
    designation: 'Junior Consultant',
    department: 'Client Intakes',
    contactNumber: '+91 98480 33202',
    email: 'r.sharma@visaconsultancy.com',
    role: 'Employee',
    status: 'Active',
    isDemo: true,
    createdAt: '2026-10-01T09:30:00Z',
  },
  {
    id: 'EMP-04',
    name: 'A. Joshi',
    designation: 'Compliance Associate',
    department: 'Legal & Audit',
    contactNumber: '+91 98480 44303',
    email: 'a.joshi@visaconsultancy.com',
    role: 'Employee',
    status: 'Active',
    isDemo: true,
    createdAt: '2026-10-01T10:00:00Z',
  },
  {
    id: 'EMP-05',
    name: 'Anita Rao',
    designation: 'Senior Counsellor',
    department: 'Visa Filings',
    contactNumber: '+91 98480 55404',
    email: 'anita.rao@visaconsultancy.com',
    role: 'Employee',
    status: 'Active',
    isDemo: true,
    createdAt: '2026-10-01T10:30:00Z',
  },
  {
    id: 'EMP-06',
    name: 'Vikram Patil',
    designation: 'Records Officer',
    department: 'Documentation & Vault',
    contactNumber: '+91 98480 66505',
    email: 'v.patil@visaconsultancy.com',
    role: 'Employee',
    status: 'Active',
    isDemo: true,
    createdAt: '2026-10-02T11:00:00Z',
  },
  {
    id: 'EMP-07',
    name: 'Neha Kapoor',
    designation: 'Processing Associate',
    department: 'Client Support',
    contactNumber: '+91 98480 77606',
    email: 'n.kapoor@visaconsultancy.com',
    role: 'Employee',
    status: 'Active',
    isDemo: true,
    createdAt: '2026-10-02T11:30:00Z',
  },
];

// In-Memory Storage across active browser session
let sessionEmployees: Employee[] = [];
let nextEmployeeIdCounter = 101;
const deletedDemoEmployeeIds = new Set<string>();

export const employeeService = {
  /**
   * Retrieves list of employees based on active mode and filters
   */
  getEmployees(options?: {
    isEmptyState?: boolean;
    search?: string;
    role?: string;
    status?: string;
  }): Employee[] {
    const isEmpty = options?.isEmptyState ?? false;
    let list: Employee[] = [];

    if (!isEmpty) {
      const activeDemo = DEMO_EMPLOYEES.filter((e) => !deletedDemoEmployeeIds.has(e.id));
      list = [...activeDemo, ...sessionEmployees];
    } else {
      list = [...sessionEmployees];
    }

    // Search query (name, id, designation, email)
    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.id.toLowerCase().includes(q) ||
          e.designation.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q)
      );
    }

    // Filter by Role
    if (options?.role && options.role !== 'All') {
      list = list.filter((e) => e.role === options.role);
    }

    // Filter by Status
    if (options?.status && options.status !== 'All') {
      list = list.filter((e) => e.status === options.status);
    }

    return list;
  },

  /**
   * Get employee by ID
   */
  getEmployeeById(id: string): Employee | null {
    const session = sessionEmployees.find((e) => e.id === id);
    if (session) return session;

    if (!deletedDemoEmployeeIds.has(id)) {
      const demo = DEMO_EMPLOYEES.find((e) => e.id === id);
      if (demo) return demo;
    }

    return null;
  },

  /**
   * Get employee by Name
   */
  getEmployeeByName(name: string): Employee | null {
    const session = sessionEmployees.find((e) => e.name.toLowerCase() === name.toLowerCase());
    if (session) return session;

    const demo = DEMO_EMPLOYEES.find(
      (e) => !deletedDemoEmployeeIds.has(e.id) && e.name.toLowerCase() === name.toLowerCase()
    );
    if (demo) return demo;

    return null;
  },

  /**
   * Create new employee record
   */
  createEmployee(data: CreateEmployeeRequest): Employee {
    const newEmp: Employee = {
      id: `EMP-${nextEmployeeIdCounter++}`,
      name: data.name.trim(),
      designation: (data.designation || 'Case Consultant').trim(),
      department: (data.department || 'Casework Operations').trim(),
      contactNumber: (data.contactNumber || '+91 98480 00000').trim(),
      email: data.email.trim(),
      role: data.role || 'Employee',
      status: data.status || 'Active',
      isDemo: false,
      createdAt: new Date().toISOString(),
    };

    sessionEmployees.unshift(newEmp);
    return newEmp;
  },

  /**
   * Update existing employee
   */
  updateEmployee(id: string, updates: UpdateEmployeeRequest): Employee {
    const sessionIdx = sessionEmployees.findIndex((e) => e.id === id);
    if (sessionIdx !== -1) {
      const existing = sessionEmployees[sessionIdx];
      const updated: Employee = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      sessionEmployees[sessionIdx] = updated;
      return updated;
    }

    const demo = DEMO_EMPLOYEES.find((e) => e.id === id);
    if (demo && !deletedDemoEmployeeIds.has(id)) {
      deletedDemoEmployeeIds.add(id);
      const updated: Employee = {
        ...demo,
        ...updates,
        isDemo: true,
        updatedAt: new Date().toISOString(),
      };
      sessionEmployees.unshift(updated);
      return updated;
    }

    throw new Error(`Employee with ID ${id} not found.`);
  },

  /**
   * Toggle Active / Inactive status without reassigning tasks
   */
  toggleEmployeeStatus(id: string): Employee {
    const emp = this.getEmployeeById(id);
    if (!emp) {
      throw new Error(`Employee with ID ${id} not found.`);
    }

    const newStatus: EmployeeStatus = emp.status === 'Active' ? 'Inactive' : 'Active';
    return this.updateEmployee(id, { status: newStatus });
  },

  /**
   * Delete an employee
   */
  deleteEmployee(id: string): boolean {
    const sessionIdx = sessionEmployees.findIndex((e) => e.id === id);
    if (sessionIdx !== -1) {
      sessionEmployees.splice(sessionIdx, 1);
      return true;
    }

    if (DEMO_EMPLOYEES.some((e) => e.id === id)) {
      deletedDemoEmployeeIds.add(id);
      return true;
    }

    return false;
  },

  /**
   * Single source of truth for employee options in task and follow-up assignment dropdowns
   */
  getEmployeeOptions(): { name: string; role: string; department: string }[] {
    const list = this.getEmployees({ isEmptyState: false });
    return list.map((e) => ({
      name: e.name,
      role: e.designation,
      department: e.department,
    }));
  },

  /**
   * Backward-compatible mapping from employee display name to employee ID
   */
  getEmployeeIdByName(name: string): string | undefined {
    const emp = this.getEmployeeByName(name);
    return emp?.id;
  },

  /**
   * Backward-compatible mapping from employee ID to employee display name
   */
  getEmployeeNameById(id: string): string | undefined {
    const emp = this.getEmployeeById(id);
    return emp?.name;
  },

  /**
   * Register task and follow-up query provider (decouples circular module imports)
   */
  setTaskFollowUpService(service: TaskFollowUpQuery): void {
    registeredTaskService = service;
  },

  /**
   * Dynamic calculation of assigned tasks and follow-ups from taskFollowUpService
   */
  getEmployeeWorkload(
    employeeName: string,
    isEmptyState = false
  ): {
    taskCount: number;
    followUpCount: number;
    tasks: Task[];
    followUps: FollowUp[];
  } {
    const allTasks = registeredTaskService
      ? registeredTaskService.getTasks({
          isEmptyState,
          assignee: employeeName,
        })
      : [];

    const allFollowUps = registeredTaskService
      ? registeredTaskService.getFollowUps({
          isEmptyState,
          assignee: employeeName,
        })
      : [];

    return {
      taskCount: allTasks.length,
      followUpCount: allFollowUps.length,
      tasks: allTasks,
      followUps: allFollowUps,
    };
  },

  /**
   * Reset session state (for test teardowns)
   */
  resetSessionData(): void {
    sessionEmployees = [];
    deletedDemoEmployeeIds.clear();
  },
};
