/**
 * Bank and Branch Master Management - TypeScript Type Definitions
 * VCMS Phase 3: Bank Master, Branch Master, Audit Trail, and Relationships
 */

export type MasterStatus = 'Active' | 'Inactive';

export interface BankMaster {
  id: string; // e.g. 'hdfc', 'sbi', 'icici', etc.
  name: string; // e.g. 'HDFC Bank', 'State Bank of India (SBI)'
  code: string; // e.g. 'HDFC', 'SBI'
  status: MasterStatus;
  createdAt: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  notes?: string;
}

export interface BranchMaster {
  id: string; // e.g. 'br_01'
  bankId: string; // Foreign reference to BankMaster.id
  bankName: string; // Denormalized for display and historical integrity
  branchName: string;
  branchLocation: string; // Location / Address
  ifscCode: string; // Normalized 11-char uppercase IFSC
  status: MasterStatus;
  isVerified: boolean; // Distinguishes client-confirmed/verified entries from unverified
  verificationNotes?: string;
  createdAt: string;
  lastModifiedAt: string;
  lastModifiedBy: string;
  isDemo?: boolean;
}

export interface BankAuditLog {
  id: string;
  entityType: 'Bank' | 'Branch';
  entityId: string;
  entityName: string;
  action: 'Create' | 'Update' | 'Activate' | 'Deactivate' | 'Attempted Delete';
  fieldName?: string;
  previousValue?: string;
  newValue?: string;
  modifiedAt: string;
  modifiedBy: string;
  reason?: string;
}

export interface CreateBranchRequest {
  bankId: string;
  branchName: string;
  branchLocation: string;
  ifscCode: string;
  isVerified?: boolean;
  verificationNotes?: string;
  status?: MasterStatus;
}

export interface UpdateBranchRequest {
  branchName?: string;
  branchLocation?: string;
  ifscCode?: string;
  status?: MasterStatus;
  isVerified?: boolean;
  verificationNotes?: string;
  changeReason?: string;
}

export interface UpdateBankRequest {
  name?: string;
  status?: MasterStatus;
  notes?: string;
  changeReason?: string;
}

export interface BankFilter {
  search?: string;
  status?: MasterStatus | 'All';
}

export interface BranchFilter {
  search?: string;
  bankId?: string | 'All';
  status?: MasterStatus | 'All';
  isVerifiedOnly?: boolean;
  isSampleMode?: boolean;
}
