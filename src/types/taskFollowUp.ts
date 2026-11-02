/**
 * VCMS Tasks & Follow-ups Types
 * Defines data structures for operations task management and client follow-ups.
 */

export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Pending' | 'In Progress' | 'Completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  customerId?: string;
  customerName?: string;
  assignedTo: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  category?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  customerId?: string;
  customerName?: string;
  assignedTo: string;
  dueDate: string;
  priority: TaskPriority;
  status?: TaskStatus;
  category?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  customerId?: string;
  customerName?: string;
  assignedTo?: string;
  dueDate?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  category?: string;
}

export type FollowUpStatus = 'Scheduled' | 'Completed' | 'Missed';

export interface FollowUp {
  id: string;
  customerId: string;
  customerName: string;
  scheduledDate: string;
  purpose: string;
  assignedTo: string;
  notes: string;
  outcome: string;
  nextFollowUpDate?: string;
  status: FollowUpStatus;
  isDemo?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface CreateFollowUpRequest {
  customerId: string;
  customerName: string;
  scheduledDate: string;
  purpose: string;
  assignedTo: string;
  notes?: string;
  outcome?: string;
  nextFollowUpDate?: string;
  status?: FollowUpStatus;
}

export interface UpdateFollowUpRequest {
  customerId?: string;
  customerName?: string;
  scheduledDate?: string;
  purpose?: string;
  assignedTo?: string;
  notes?: string;
  outcome?: string;
  nextFollowUpDate?: string;
  status?: FollowUpStatus;
}

export interface CustomerOption {
  id: string;
  name: string;
  visaTrack?: string;
  mobile?: string;
}

export interface EmployeeOption {
  name: string;
  role: string;
  department: string;
}
