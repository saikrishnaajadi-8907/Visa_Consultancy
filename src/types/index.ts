/**
 * TypeScript Type Definitions for VCMS
 */

export * from './customer';
export * from './financial';
export * from './taskFollowUp';
export * from './document';
export * from './employee';

export type VisaTrack = 'Work Visa' | 'Student Visa' | 'Business Visa' | 'PR Visa' | 'Tourist Visa';

export type CustomerStatus = 'Active' | 'Pending' | 'Archived' | 'Suspended';

export type ApplicationStatus = 'In Process' | 'Approved' | 'Rejected' | 'On Hold';

export type VerificationStatus =
  | 'Independently Verified'
  | 'Superseded'
  | 'Employee Reviewed'
  | 'Customer-Supplied'
  | 'Pending Review';

export type InformationSource =
  | 'Independently verified information'
  | 'Information supported by documents'
  | 'Information reviewed by an employee'
  | 'Customer self-declaration';

export interface Customer {
  id: string;
  name: string;
  gender: 'Male' | 'Female' | 'Other';
  nationality: string;
  passportNo: string;
  applicationRef: string;
  mobile: string;
  email: string;
  address: string;
  dateOfBirth: string;
  visaTrack: VisaTrack;
  linkedBank: string;
  bankBranch: string;
  accountNumber?: string;
  previousAmount: number;
  currentAmount: number;
  status: CustomerStatus;
  createdAt: string;
  photoUrl?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  shortCode: string;
  ifsc: string;
  accountNumber: string;
  branch: string;
  status: 'Active' | 'Inactive';
  linkedCustomers: number;
  previousAmount: number;
  currentAmount: number;
  difference: number;
  color?: string;
}

export interface FinancialRecord {
  id: string;
  sequenceNo: number;
  customerName: string;
  customerId: string;
  passportRef: string;
  linkedBank: string;
  bankAccountMasked: string;
  recordDate: string;
  previousAmount: number;
  currentAmount: number;
  difference: number;
  sourceOfInformation: InformationSource;
  verificationStatus: VerificationStatus;
  statusNote?: string;
  enteredBy: string;
  role: string;
}

export interface ActivityLog {
  id: string;
  date: string;
  customerName: string;
  bank: string;
  type: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Failed';
}

export interface ApplicationRecord {
  id: string;
  customerName: string;
  visaType: VisaTrack;
  country: string;
  submissionDate: string;
  status: ApplicationStatus;
  caseOfficer: string;
  documentsCount: number;
  notes?: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: 'Identity' | 'Financial' | 'Academic' | 'Employment' | 'Legal';
  customerName: string;
  fileSize: string;
  uploadedDate: string;
  verificationStatus: 'Verified' | 'Pending' | 'Rejected';
  handoverStatus: 'In Custody' | 'Handed Over' | 'Submitted to Embassy';
}

export interface TaskItem {
  id: string;
  title: string;
  assignedTo: string;
  dueDate: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed';
  category: string;
}

export interface FollowUpItem {
  id: string;
  customerName: string;
  subject: string;
  scheduledDate: string;
  type: 'Bank Officer Review' | 'Embassy Biometrics' | 'Financial Proof' | 'Document Submission';
  status: 'Pending' | 'Completed' | 'Overdue';
  officer: string;
}

export interface UserRoleItem {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Senior Case Officer' | 'Junior Consultant' | 'Compliance Associate' | 'Finance Officer';
  department: string;
  status: 'Active' | 'Inactive';
  lastActive: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  ipAddress: string;
  details: string;
}
