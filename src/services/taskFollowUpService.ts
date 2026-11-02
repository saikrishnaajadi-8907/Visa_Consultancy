/**
 * In-Memory Tasks & Follow-ups Service for VCMS Client Demonstration
 *
 * Implements interactive operations task management and customer follow-up workflows.
 * Operates purely in-memory (zero persistent storage/database).
 */

import {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskStatus,
  TaskPriority,
  FollowUp,
  CreateFollowUpRequest,
  UpdateFollowUpRequest,
  FollowUpStatus,
  CustomerOption,
  EmployeeOption,
} from '../types/taskFollowUp';
import { customerService } from './customerService';
import { MOCK_CUSTOMERS } from '../constants/mockData';

import { employeeService } from './employeeService';

// Single source of truth: Personnel derived directly from Employee Management Master
export const VCMS_EMPLOYEES: EmployeeOption[] = employeeService.getEmployeeOptions();

// Seed Demo Tasks (Shown in Sample Data mode)
const DEMO_TASKS: Task[] = [
  {
    id: 'TSK-01',
    title: 'Obtain ICICI bank balance endorsement letter',
    description: 'Coordinate with ICICI Ameerpet branch officer to obtain official stamp & balance verification certificate.',
    customerId: 'cust-3',
    customerName: 'Ahmed Khan',
    assignedTo: 'S. Mehta',
    dueDate: '2026-10-25',
    priority: 'High',
    status: 'In Progress',
    category: 'Banking Verification',
    isDemo: true,
    createdAt: '2026-10-14T09:30:00Z',
  },
  {
    id: 'TSK-02',
    title: 'Verify ITR tax computation and Form 16 reconciliation',
    description: 'Examine 3 consecutive years of Income Tax returns against current bank escrow statements.',
    customerId: 'cust-81',
    customerName: 'Chetan Shah',
    assignedTo: 'A. Joshi',
    dueDate: '2026-10-28',
    priority: 'Medium',
    status: 'Pending',
    category: 'Compliance Audit',
    isDemo: true,
    createdAt: '2026-10-15T11:00:00Z',
  },
  {
    id: 'TSK-03',
    title: 'Upload certified medical examination clearance',
    description: 'Upload embassy-panel doctor certified medical fitness certificate to consular portal.',
    customerId: 'cust-8',
    customerName: 'Anjali Verma',
    assignedTo: 'R. Sharma',
    dueDate: '2026-10-22',
    priority: 'Low',
    status: 'Completed',
    category: 'Embassy Preparation',
    isDemo: true,
    createdAt: '2026-10-12T14:15:00Z',
    updatedAt: '2026-10-18T16:45:00Z',
  },
  {
    id: 'TSK-04',
    title: 'Schedule biometric appointment for Canadian PR file',
    description: 'Book biometrics enrollment slot at VFS Global Hyderabad center with biometrics fee receipt.',
    customerId: 'cust-91',
    customerName: 'Alok Mishra',
    assignedTo: 'Anita Rao',
    dueDate: '2026-10-29',
    priority: 'High',
    status: 'In Progress',
    category: 'Casework',
    isDemo: true,
    createdAt: '2026-10-16T10:00:00Z',
  },
  {
    id: 'TSK-05',
    title: 'Cross-check HDFC proof-of-funds with branch manager',
    description: 'Verify customer deposit authenticity and account minimum tenure requirements with branch.',
    customerId: 'cust-11',
    customerName: 'Amit Deshmukh',
    assignedTo: 'S. Mehta',
    dueDate: '2026-10-26',
    priority: 'High',
    status: 'Pending',
    category: 'Banking Verification',
    isDemo: true,
    createdAt: '2026-10-17T08:45:00Z',
  },
  {
    id: 'TSK-06',
    title: 'Legal affidavit notarization and apostille stamp',
    description: 'Secure state home department apostille and notary validation for overseas sponsorship undertaking.',
    customerId: 'cust-8',
    customerName: 'Anjali Verma',
    assignedTo: 'A. Joshi',
    dueDate: '2026-10-20',
    priority: 'Medium',
    status: 'Completed',
    category: 'Legal Verification',
    isDemo: true,
    createdAt: '2026-10-11T13:20:00Z',
    updatedAt: '2026-10-19T17:10:00Z',
  },
];

// Seed Demo Follow-ups (Shown in Sample Data mode)
const DEMO_FOLLOW_UPS: FollowUp[] = [
  {
    id: 'FLU-01',
    customerId: 'cust-3',
    customerName: 'Ahmed Khan',
    scheduledDate: '2026-10-24',
    purpose: 'Bank Officer Review',
    assignedTo: 'S. Mehta',
    notes: 'Direct branch manager call scheduled to inspect ₹90,000 ledger balance letter and verification stamp.',
    outcome: 'Pending branch manager counter-signature',
    nextFollowUpDate: '2026-10-28',
    status: 'Scheduled',
    isDemo: true,
    createdAt: '2026-10-14T09:45:00Z',
  },
  {
    id: 'FLU-02',
    customerId: 'cust-91',
    customerName: 'Alok Mishra',
    scheduledDate: '2026-10-22',
    purpose: 'Embassy Biometrics',
    assignedTo: 'Anita Rao',
    notes: 'Remind applicant to carry original passport, appointment confirmation, and VFS fee receipt.',
    outcome: 'Applicant confirmed readiness; SMS reminder sent',
    nextFollowUpDate: '2026-10-30',
    status: 'Scheduled',
    isDemo: true,
    createdAt: '2026-10-16T10:15:00Z',
  },
  {
    id: 'FLU-03',
    customerId: 'cust-8',
    customerName: 'Anjali Verma',
    scheduledDate: '2026-10-18',
    purpose: 'Document Submission',
    assignedTo: 'R. Sharma',
    notes: 'Collect original degree certificates, transcripts, and apostille-stamped clearances.',
    outcome: 'All academic certificates received and scanned into dossier',
    status: 'Completed',
    isDemo: true,
    createdAt: '2026-10-12T14:30:00Z',
    completedAt: '2026-10-18T15:00:00Z',
  },
  {
    id: 'FLU-04',
    customerId: 'cust-11',
    customerName: 'Amit Deshmukh',
    scheduledDate: '2026-10-20',
    purpose: 'Financial Proof',
    assignedTo: 'S. Mehta',
    notes: 'Clarify source of funds for recent ₹2,00,000 fixed deposit transaction before embassy audit.',
    outcome: 'Awaiting revised bank letter with deposit source verification',
    nextFollowUpDate: '2026-10-27',
    status: 'Scheduled',
    isDemo: true,
    createdAt: '2026-10-17T09:00:00Z',
  },
  {
    id: 'FLU-05',
    customerId: 'cust-81',
    customerName: 'Chetan Shah',
    scheduledDate: '2026-10-15',
    purpose: 'Client Solvency Review',
    assignedTo: 'A. Joshi',
    notes: 'Review discrepancies in submitted property valuation certificate and CA net worth report.',
    outcome: 'Applicant did not answer 2 attempted phone calls',
    nextFollowUpDate: '2026-10-26',
    status: 'Missed',
    isDemo: true,
    createdAt: '2026-10-13T11:20:00Z',
  },
];

// In-Memory Storage across active browser session
let sessionTasks: Task[] = [];
let sessionFollowUps: FollowUp[] = [];
let nextTaskIdCounter = 101;
let nextFollowUpIdCounter = 101;

// Deleted demo record IDs tracking
const deletedDemoTaskIds = new Set<string>();
const deletedDemoFollowUpIds = new Set<string>();

export const taskFollowUpService = {
  /**
   * Returns list of consultancy officers from authoritative Employee Management
   */
  getEmployees(): EmployeeOption[] {
    return employeeService.getEmployeeOptions();
  },

  /**
   * Resolves available customers from both session customer registration and demo mock data.
   */
  async getAvailableCustomers(): Promise<CustomerOption[]> {
    const map = new Map<string, CustomerOption>();

    // 1. Session registered customers
    try {
      const reg = await customerService.getCustomers({ customerStatus: 'All' });
      for (const c of reg) {
        map.set(c.id, {
          id: c.id,
          name: c.personalInfo.fullName,
          visaTrack: c.visaInfo.visaStatus,
          mobile: c.contactInfo.personalMobile,
        });
      }
    } catch {
      // fallback
    }

    // 2. Mock customers
    for (const mc of MOCK_CUSTOMERS) {
      if (!map.has(mc.id)) {
        map.set(mc.id, {
          id: mc.id,
          name: mc.name,
          visaTrack: mc.visaTrack,
          mobile: mc.mobile,
        });
      }
    }

    return Array.from(map.values());
  },

  /**
   * Retrieves Tasks based on active mode and filters
   */
  getTasks(options?: {
    isEmptyState?: boolean;
    search?: string;
    assignee?: string;
    priority?: string;
    status?: string;
  }): Task[] {
    const isEmpty = options?.isEmptyState ?? false;
    let list: Task[] = [];

    if (!isEmpty) {
      // Include non-deleted demo tasks
      const activeDemo = DEMO_TASKS.filter((t) => !deletedDemoTaskIds.has(t.id));
      list = [...activeDemo, ...sessionTasks];
    } else {
      // Empty state mode: show only tasks created in current session
      list = [...sessionTasks];
    }

    // Search query (title, description, customerName, id)
    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          (t.customerName && t.customerName.toLowerCase().includes(q)) ||
          t.id.toLowerCase().includes(q)
      );
    }

    // Filter by Assignee
    if (options?.assignee && options.assignee !== 'All') {
      list = list.filter((t) => t.assignedTo === options.assignee);
    }

    // Filter by Priority
    if (options?.priority && options.priority !== 'All') {
      list = list.filter((t) => t.priority === options.priority);
    }

    // Filter by Status
    if (options?.status && options.status !== 'All') {
      list = list.filter((t) => t.status === options.status);
    }

    return list;
  },

  /**
   * Get single task by ID
   */
  getTaskById(id: string): Task | null {
    const session = sessionTasks.find((t) => t.id === id);
    if (session) return session;

    if (!deletedDemoTaskIds.has(id)) {
      const demo = DEMO_TASKS.find((t) => t.id === id);
      if (demo) return demo;
    }

    return null;
  },

  /**
   * Create a new task
   */
  createTask(data: CreateTaskRequest): Task {
    const newTask: Task = {
      id: `TSK-${nextTaskIdCounter++}`,
      title: data.title.trim(),
      description: (data.description || '').trim(),
      customerId: data.customerId || undefined,
      customerName: data.customerName || undefined,
      assignedTo: data.assignedTo || 'S. Mehta',
      dueDate: data.dueDate,
      priority: data.priority || 'Medium',
      status: data.status || 'Pending',
      category: data.category || 'General Casework',
      isDemo: false,
      createdAt: new Date().toISOString(),
    };

    sessionTasks.unshift(newTask);
    return newTask;
  },

  /**
   * Update existing task
   */
  updateTask(id: string, updates: UpdateTaskRequest): Task {
    // Check session tasks first
    const sessionIdx = sessionTasks.findIndex((t) => t.id === id);
    if (sessionIdx !== -1) {
      const existing = sessionTasks[sessionIdx];
      const updated: Task = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      sessionTasks[sessionIdx] = updated;
      return updated;
    }

    // Check demo tasks (convert to modified session task if edited)
    const demo = DEMO_TASKS.find((t) => t.id === id);
    if (demo && !deletedDemoTaskIds.has(id)) {
      deletedDemoTaskIds.add(id);
      const updated: Task = {
        ...demo,
        ...updates,
        isDemo: true, // preserve demo tag visual
        updatedAt: new Date().toISOString(),
      };
      sessionTasks.unshift(updated);
      return updated;
    }

    throw new Error(`Task with ID ${id} not found.`);
  },

  /**
   * Fast toggle / update task status
   */
  updateTaskStatus(id: string, status: TaskStatus): Task {
    return this.updateTask(id, { status });
  },

  /**
   * Delete a task
   */
  deleteTask(id: string): boolean {
    const sessionIdx = sessionTasks.findIndex((t) => t.id === id);
    if (sessionIdx !== -1) {
      sessionTasks.splice(sessionIdx, 1);
      return true;
    }

    if (DEMO_TASKS.some((t) => t.id === id)) {
      deletedDemoTaskIds.add(id);
      return true;
    }

    return false;
  },

  /**
   * Retrieves Follow-ups based on active mode and filters
   */
  getFollowUps(options?: {
    isEmptyState?: boolean;
    search?: string;
    assignee?: string;
    status?: string;
    dateFilter?: string;
  }): FollowUp[] {
    const isEmpty = options?.isEmptyState ?? false;
    let list: FollowUp[] = [];

    if (!isEmpty) {
      const activeDemo = DEMO_FOLLOW_UPS.filter((f) => !deletedDemoFollowUpIds.has(f.id));
      list = [...activeDemo, ...sessionFollowUps];
    } else {
      list = [...sessionFollowUps];
    }

    // Search query (customerName, purpose, notes, outcome, id)
    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.customerName.toLowerCase().includes(q) ||
          f.purpose.toLowerCase().includes(q) ||
          f.notes.toLowerCase().includes(q) ||
          f.outcome.toLowerCase().includes(q) ||
          f.id.toLowerCase().includes(q)
      );
    }

    // Filter by Assignee
    if (options?.assignee && options.assignee !== 'All') {
      list = list.filter((f) => f.assignedTo === options.assignee);
    }

    // Filter by Status
    if (options?.status && options.status !== 'All') {
      list = list.filter((f) => f.status === options.status);
    }

    // Filter by Date
    if (options?.dateFilter && options.dateFilter !== 'All') {
      const today = new Date().toISOString().slice(0, 10);
      if (options.dateFilter === 'Today') {
        list = list.filter((f) => f.scheduledDate === today);
      } else if (options.dateFilter === 'Upcoming') {
        list = list.filter((f) => f.scheduledDate >= today && f.status === 'Scheduled');
      } else if (options.dateFilter === 'Past') {
        list = list.filter((f) => f.scheduledDate < today || f.status !== 'Scheduled');
      }
    }

    return list;
  },

  /**
   * Get single follow-up by ID
   */
  getFollowUpById(id: string): FollowUp | null {
    const session = sessionFollowUps.find((f) => f.id === id);
    if (session) return session;

    if (!deletedDemoFollowUpIds.has(id)) {
      const demo = DEMO_FOLLOW_UPS.find((f) => f.id === id);
      if (demo) return demo;
    }

    return null;
  },

  /**
   * Create a new follow-up
   */
  createFollowUp(data: CreateFollowUpRequest): FollowUp {
    const newFollowUp: FollowUp = {
      id: `FLU-${nextFollowUpIdCounter++}`,
      customerId: data.customerId,
      customerName: data.customerName,
      scheduledDate: data.scheduledDate,
      purpose: data.purpose || 'Casework Review',
      assignedTo: data.assignedTo || 'S. Mehta',
      notes: (data.notes || '').trim(),
      outcome: (data.outcome || 'Pending interaction').trim(),
      nextFollowUpDate: data.nextFollowUpDate || undefined,
      status: data.status || 'Scheduled',
      isDemo: false,
      createdAt: new Date().toISOString(),
    };

    sessionFollowUps.unshift(newFollowUp);
    return newFollowUp;
  },

  /**
   * Update existing follow-up
   */
  updateFollowUp(id: string, updates: UpdateFollowUpRequest): FollowUp {
    const sessionIdx = sessionFollowUps.findIndex((f) => f.id === id);
    if (sessionIdx !== -1) {
      const existing = sessionFollowUps[sessionIdx];
      const updated: FollowUp = {
        ...existing,
        ...updates,
      };
      sessionFollowUps[sessionIdx] = updated;
      return updated;
    }

    const demo = DEMO_FOLLOW_UPS.find((f) => f.id === id);
    if (demo && !deletedDemoFollowUpIds.has(id)) {
      deletedDemoFollowUpIds.add(id);
      const updated: FollowUp = {
        ...demo,
        ...updates,
        isDemo: true,
      };
      sessionFollowUps.unshift(updated);
      return updated;
    }

    throw new Error(`Follow-up with ID ${id} not found.`);
  },

  /**
   * Mark follow-up as completed with outcome and optional next follow-up date
   */
  completeFollowUp(id: string, outcome: string, nextFollowUpDate?: string): FollowUp {
    return this.updateFollowUp(id, {
      status: 'Completed',
      outcome: outcome.trim() || 'Completed satisfactorily',
      nextFollowUpDate: nextFollowUpDate || undefined,
    });
  },

  /**
   * Schedule next follow-up and create consecutive follow-up entry
   */
  scheduleNextFollowUp(id: string, nextDate: string, purpose?: string): FollowUp {
    const current = this.getFollowUpById(id);
    if (!current) {
      throw new Error(`Follow-up with ID ${id} not found.`);
    }

    // Update current follow-up's next date
    this.updateFollowUp(id, { nextFollowUpDate: nextDate });

    // Create a new scheduled follow-up
    return this.createFollowUp({
      customerId: current.customerId,
      customerName: current.customerName,
      scheduledDate: nextDate,
      purpose: purpose || `Next Step: ${current.purpose}`,
      assignedTo: current.assignedTo,
      notes: `Scheduled following previous interaction (${current.id})`,
      outcome: 'Pending scheduled interaction',
      status: 'Scheduled',
    });
  },

  /**
   * Delete follow-up
   */
  deleteFollowUp(id: string): boolean {
    const sessionIdx = sessionFollowUps.findIndex((f) => f.id === id);
    if (sessionIdx !== -1) {
      sessionFollowUps.splice(sessionIdx, 1);
      return true;
    }

    if (DEMO_FOLLOW_UPS.some((f) => f.id === id)) {
      deletedDemoFollowUpIds.add(id);
      return true;
    }

    return false;
  },

  /**
   * Count scheduled follow-ups
   */
  getPendingFollowUpsCount(isEmptyState = false): number {
    const list = this.getFollowUps({ isEmptyState, status: 'Scheduled' });
    return list.length;
  },

  /**
   * Reset session arrays (for test teardowns)
   */
  resetSessionData(): void {
    sessionTasks = [];
    sessionFollowUps = [];
    deletedDemoTaskIds.clear();
    deletedDemoFollowUpIds.clear();
  },
};

// Register workload query provider with Employee Management
employeeService.setTaskFollowUpService(taskFollowUpService);

