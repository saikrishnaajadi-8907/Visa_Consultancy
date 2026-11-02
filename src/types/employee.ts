/**
 * VCMS Employee Management Type Definitions
 */

export type EmployeeRole = 'Head/Admin' | 'Employee';
export type EmployeeStatus = 'Active' | 'Inactive';

export interface Employee {
  id: string;
  name: string;
  designation: string;
  department: string;
  contactNumber: string;
  email: string;
  role: EmployeeRole;
  status: EmployeeStatus;
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateEmployeeRequest {
  name: string;
  designation: string;
  department?: string;
  contactNumber?: string;
  email: string;
  role: EmployeeRole;
  status: EmployeeStatus;
}

export interface UpdateEmployeeRequest {
  name?: string;
  designation?: string;
  department?: string;
  contactNumber?: string;
  email?: string;
  role?: EmployeeRole;
  status?: EmployeeStatus;
}
