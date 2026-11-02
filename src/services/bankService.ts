/**
 * Bank and Branch Master Service
 * In-memory state management adhering to VCMS Phase 3 specifications.
 * Provides typed asynchronous service contracts suitable for future backend drop-in.
 */

import {
  BankMaster,
  BranchMaster,
  BankAuditLog,
  CreateBranchRequest,
  UpdateBranchRequest,
  UpdateBankRequest,
  BankFilter,
  BranchFilter,
  MasterStatus,
} from '../types/bank';
import { BankOption, BranchOption } from '../types/customer';
import { validateIFSC, normalizeIFSC } from '../utils/validation';
import { customerService } from './customerService';

const ACTOR = 'Demo User';
const INITIAL_DATE = '2026-10-15T09:00:00.000Z';

/**
 * 10 Approved Fiduciary Banks
 * Predefined master banks authorized for visa applicant proof-of-funds and financial tracking.
 */
const INITIAL_BANKS: BankMaster[] = [
  {
    id: 'hdfc',
    name: 'HDFC Bank',
    code: 'HDFC',
    status: 'Active',
    createdAt: INITIAL_DATE,
    lastModifiedAt: INITIAL_DATE,
    lastModifiedBy: ACTOR,
    notes: 'Approved primary fiduciary partner bank.',
  },
  {
    id: 'sbi',
    name: 'State Bank of India (SBI)',
    code: 'SBI',
    status: 'Active',
    createdAt: INITIAL_DATE,
    lastModifiedAt: INITIAL_DATE,
    lastModifiedBy: ACTOR,
    notes: 'Public sector banking partner for government financial proof.',
  },
  {
    id: 'icici',
    name: 'ICICI Bank',
    code: 'ICICI',
    status: 'Active',
    createdAt: INITIAL_DATE,
    lastModifiedAt: INITIAL_DATE,
    lastModifiedBy: ACTOR,
    notes: 'Approved fiduciary partner bank for education loans and FDs.',
  },
  {
    id: 'idbi',
    name: 'IDBI Bank',
    code: 'IDBI',
    status: 'Active',
    createdAt: INITIAL_DATE,
    lastModifiedAt: INITIAL_DATE,
    lastModifiedBy: ACTOR,
    notes: 'Authorized institutional partner bank.',
  },
  {
    id: 'boi',
    name: 'Bank of India',
    code: 'BOI',
    status: 'Active',
    createdAt: INITIAL_DATE,
    lastModifiedAt: INITIAL_DATE,
    lastModifiedBy: ACTOR,
    notes: 'Authorized public sector partner bank.',
  },
  {
    id: 'bom',
    name: 'Bank of Maharashtra',
    code: 'BOM',
    status: 'Active',
    createdAt: INITIAL_DATE,
    lastModifiedAt: INITIAL_DATE,
    lastModifiedBy: ACTOR,
    notes: 'Approved regional partner bank.',
  },
  {
    id: 'canara',
    name: 'Canara Bank',
    code: 'CANARA',
    status: 'Active',
    createdAt: INITIAL_DATE,
    lastModifiedAt: INITIAL_DATE,
    lastModifiedBy: ACTOR,
    notes: 'Authorized public sector partner bank.',
  },
  {
    id: 'bob',
    name: 'Bank of Baroda',
    code: 'BOB',
    status: 'Active',
    createdAt: INITIAL_DATE,
    lastModifiedAt: INITIAL_DATE,
    lastModifiedBy: ACTOR,
    notes: 'Authorized fiduciary partner bank.',
  },
  {
    id: 'pnb',
    name: 'Punjab National Bank (PNB)',
    code: 'PNB',
    status: 'Active',
    createdAt: INITIAL_DATE,
    lastModifiedAt: INITIAL_DATE,
    lastModifiedBy: ACTOR,
    notes: 'Authorized public sector partner bank.',
  },
  {
    id: 'axis',
    name: 'Axis Bank',
    code: 'AXIS',
    status: 'Active',
    createdAt: INITIAL_DATE,
    lastModifiedAt: INITIAL_DATE,
    lastModifiedBy: ACTOR,
    notes: 'Approved private sector partner bank.',
  },
];

/**
 * Demonstration Branches Master Dataset
 * 20 fictional demonstration branches (2 for each of the 10 approved partner banks).
 * Clearly marked as: DEMO ONLY – NOT BANK VERIFIED.
 */
export const DEMO_BRANCHES: BranchMaster[] = [
  // 1. HDFC Bank
  {
    id: 'br_hdfc_01',
    bankId: 'hdfc',
    bankName: 'HDFC Bank',
    branchName: 'Somajiguda Branch (Demo)',
    branchLocation: 'Somajiguda, Hyderabad, Telangana',
    ifscCode: 'HDFC0001842',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  {
    id: 'br_hdfc_02',
    bankId: 'hdfc',
    bankName: 'HDFC Bank',
    branchName: 'Fort Main Branch (Demo)',
    branchLocation: 'Fort, Mumbai, Maharashtra',
    ifscCode: 'HDFC0000060',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  // 2. State Bank of India (SBI)
  {
    id: 'br_sbi_01',
    bankId: 'sbi',
    bankName: 'State Bank of India (SBI)',
    branchName: 'Hyderabad Main Branch (Demo)',
    branchLocation: 'Koti, Hyderabad, Telangana',
    ifscCode: 'SBIN0000847',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  {
    id: 'br_sbi_02',
    bankId: 'sbi',
    bankName: 'State Bank of India (SBI)',
    branchName: 'Nariman Point Branch (Demo)',
    branchLocation: 'Nariman Point, Mumbai, Maharashtra',
    ifscCode: 'SBIN0008586',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  // 3. ICICI Bank
  {
    id: 'br_icici_01',
    bankId: 'icici',
    bankName: 'ICICI Bank',
    branchName: 'Ameerpet Branch (Demo)',
    branchLocation: 'Ameerpet, Hyderabad, Telangana',
    ifscCode: 'ICIC0000048',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  {
    id: 'br_icici_02',
    bankId: 'icici',
    bankName: 'ICICI Bank',
    branchName: 'Connaught Place Branch (Demo)',
    branchLocation: 'Connaught Place, New Delhi',
    ifscCode: 'ICIC0000007',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  // 4. IDBI Bank
  {
    id: 'br_idbi_01',
    bankId: 'idbi',
    bankName: 'IDBI Bank',
    branchName: 'Begumpet Branch (Demo)',
    branchLocation: 'Begumpet, Hyderabad, Telangana',
    ifscCode: 'IBKL0000028',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  {
    id: 'br_idbi_02',
    bankId: 'idbi',
    bankName: 'IDBI Bank',
    branchName: 'Cuffe Parade Branch (Demo)',
    branchLocation: 'Cuffe Parade, Mumbai, Maharashtra',
    ifscCode: 'IBKL0000004',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  // 5. Bank of India
  {
    id: 'br_boi_01',
    bankId: 'boi',
    bankName: 'Bank of India',
    branchName: 'Abids Branch (Demo)',
    branchLocation: 'Abids, Hyderabad, Telangana',
    ifscCode: 'BKID0005600',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  {
    id: 'br_boi_02',
    bankId: 'boi',
    bankName: 'Bank of India',
    branchName: 'Fort Main Branch (Demo)',
    branchLocation: 'Fort, Mumbai, Maharashtra',
    ifscCode: 'BKID0000001',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  // 6. Bank of Maharashtra
  {
    id: 'br_bom_01',
    bankId: 'bom',
    bankName: 'Bank of Maharashtra',
    branchName: 'Sultan Bazar Branch (Demo)',
    branchLocation: 'Sultan Bazar, Hyderabad, Telangana',
    ifscCode: 'MAHB0000115',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  {
    id: 'br_bom_02',
    bankId: 'bom',
    bankName: 'Bank of Maharashtra',
    branchName: 'Shivajinagar Branch (Demo)',
    branchLocation: 'Shivajinagar, Pune, Maharashtra',
    ifscCode: 'MAHB0000002',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  // 7. Canara Bank
  {
    id: 'br_canara_01',
    bankId: 'canara',
    bankName: 'Canara Bank',
    branchName: 'MG Road Branch (Demo)',
    branchLocation: 'MG Road, Bengaluru, Karnataka',
    ifscCode: 'CNRB0000101',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  {
    id: 'br_canara_02',
    bankId: 'canara',
    bankName: 'Canara Bank',
    branchName: 'Secunderabad Branch (Demo)',
    branchLocation: 'Secunderabad, Telangana',
    ifscCode: 'CNRB0000305',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  // 8. Bank of Baroda
  {
    id: 'br_bob_01',
    bankId: 'bob',
    bankName: 'Bank of Baroda',
    branchName: 'Dilsukhnagar Branch (Demo)',
    branchLocation: 'Dilsukhnagar, Hyderabad, Telangana',
    ifscCode: 'BARB0DILSUK',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  {
    id: 'br_bob_02',
    bankId: 'bob',
    bankName: 'Bank of Baroda',
    branchName: 'Alkapuri Branch (Demo)',
    branchLocation: 'Alkapuri, Vadodara, Gujarat',
    ifscCode: 'BARB0ALKAPU',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  // 9. Punjab National Bank (PNB)
  {
    id: 'br_pnb_01',
    bankId: 'pnb',
    bankName: 'Punjab National Bank (PNB)',
    branchName: 'Raj Bhavan Road Branch (Demo)',
    branchLocation: 'Raj Bhavan Road, Somajiguda, Hyderabad',
    ifscCode: 'PUNB0152400',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  {
    id: 'br_pnb_02',
    bankId: 'pnb',
    bankName: 'Punjab National Bank (PNB)',
    branchName: 'Sector 17 Branch (Demo)',
    branchLocation: 'Sector 17, Chandigarh',
    ifscCode: 'PUNB0043300',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  // 10. Axis Bank
  {
    id: 'br_axis_01',
    bankId: 'axis',
    bankName: 'Axis Bank',
    branchName: 'Jubilee Hills Branch (Demo)',
    branchLocation: 'Road No 36, Jubilee Hills, Hyderabad',
    ifscCode: 'UTIB0000522',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
  {
    id: 'br_axis_02',
    bankId: 'axis',
    bankName: 'Axis Bank',
    branchName: 'Bandra West Branch (Demo)',
    branchLocation: 'Hill Road, Bandra West, Mumbai',
    ifscCode: 'UTIB0000028',
    status: 'Active',
    isVerified: true,
    verificationNotes: 'DEMO ONLY – NOT BANK VERIFIED',
    createdAt: '2026-09-01T09:00:00.000Z',
    lastModifiedAt: '2026-09-01T09:00:00.000Z',
    lastModifiedBy: ACTOR,
    isDemo: true,
  },
];

/**
 * In-memory stores (Controlled Session Scope)
 * Pre-populated with permanent demonstration branches for the 10 approved partner banks.
 */
let sessionBanks: BankMaster[] = [...INITIAL_BANKS];
let sessionBranches: BranchMaster[] = [...DEMO_BRANCHES];
let sessionBankAuditLogs: BankAuditLog[] = [];

function generateBranchId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `br_${crypto.randomUUID().replace(/-/g, '').slice(0, 10)}`;
  }
  return `br_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
}

export const bankService = {
  // ==========================================
  // BANK MASTER OPERATIONS
  // ==========================================

  /**
   * Retrieves all banks matching optional filters.
   */
  async getBanks(filter?: BankFilter): Promise<BankMaster[]> {
    let list = [...sessionBanks];

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (b) => b.name.toLowerCase().includes(q) || b.code.toLowerCase().includes(q)
      );
    }

    if (filter?.status && filter.status !== 'All') {
      list = list.filter((b) => b.status === filter.status);
    }

    return list;
  },

  /**
   * Retrieves a single bank by ID.
   */
  async getBankById(id: string): Promise<BankMaster | null> {
    const bank = sessionBanks.find((b) => b.id === id);
    return bank || null;
  },

  /**
   * Updates bank information with audit logging.
   */
  async updateBank(id: string, req: UpdateBankRequest): Promise<BankMaster> {
    const bank = sessionBanks.find((b) => b.id === id);
    if (!bank) {
      throw new Error(`Bank with ID "${id}" not found.`);
    }

    const now = new Date().toISOString();
    const reason = req.changeReason || 'Bank master update';

    if (req.name && req.name.trim() && req.name.trim() !== bank.name) {
      const prevName = bank.name;
      bank.name = req.name.trim();
      sessionBankAuditLogs.unshift({
        id: `LOG-${Date.now()}-1`,
        entityType: 'Bank',
        entityId: id,
        entityName: bank.name,
        action: 'Update',
        fieldName: 'Bank Name',
        previousValue: prevName,
        newValue: bank.name,
        modifiedAt: now,
        modifiedBy: ACTOR,
        reason,
      });
    }

    if (req.notes !== undefined && req.notes !== bank.notes) {
      const prevNotes = bank.notes || 'None';
      bank.notes = req.notes;
      sessionBankAuditLogs.unshift({
        id: `LOG-${Date.now()}-2`,
        entityType: 'Bank',
        entityId: id,
        entityName: bank.name,
        action: 'Update',
        fieldName: 'Notes',
        previousValue: prevNotes,
        newValue: req.notes || 'None',
        modifiedAt: now,
        modifiedBy: ACTOR,
        reason,
      });
    }

    if (req.status && req.status !== bank.status) {
      await this.toggleBankStatus(id, req.status, reason);
    }

    bank.lastModifiedAt = now;
    bank.lastModifiedBy = ACTOR;

    return bank;
  },

  /**
   * Toggles bank active/inactive status with audit logging.
   */
  async toggleBankStatus(id: string, newStatus: MasterStatus, reason?: string): Promise<BankMaster> {
    const bank = sessionBanks.find((b) => b.id === id);
    if (!bank) {
      throw new Error(`Bank with ID "${id}" not found.`);
    }

    const prevStatus = bank.status;
    if (prevStatus === newStatus) return bank;

    const now = new Date().toISOString();
    bank.status = newStatus;
    bank.lastModifiedAt = now;
    bank.lastModifiedBy = ACTOR;

    sessionBankAuditLogs.unshift({
      id: `LOG-${Date.now()}-STS`,
      entityType: 'Bank',
      entityId: id,
      entityName: bank.name,
      action: newStatus === 'Active' ? 'Activate' : 'Deactivate',
      fieldName: 'Bank Status',
      previousValue: prevStatus,
      newValue: newStatus,
      modifiedAt: now,
      modifiedBy: ACTOR,
      reason: reason || `Status changed from ${prevStatus} to ${newStatus}`,
    });

    return bank;
  },

  /**
   * Deletes a bank ONLY if no customer records reference it and no branches exist.
   */
  async deleteBank(id: string): Promise<{ success: boolean; error?: string }> {
    const bank = sessionBanks.find((b) => b.id === id);
    if (!bank) {
      return { success: false, error: `Bank with ID "${id}" not found.` };
    }

    // 1. Check linked customer records
    const linkedCustCount = await this.getLinkedCustomerCountForBank(id);
    if (linkedCustCount > 0) {
      // Record attempted delete in audit trail
      sessionBankAuditLogs.unshift({
        id: `LOG-${Date.now()}-DEL-BLOCKED`,
        entityType: 'Bank',
        entityId: id,
        entityName: bank.name,
        action: 'Attempted Delete',
        modifiedAt: new Date().toISOString(),
        modifiedBy: ACTOR,
        reason: `Deletion blocked: ${linkedCustCount} customer record(s) linked to this bank. Deactivation required instead.`,
      });

      return {
        success: false,
        error: `Deletion Blocked: Bank "${bank.name}" is linked to ${linkedCustCount} customer record(s). Bank records cannot be deleted while customer allocations exist. You may deactivate the bank instead.`,
      };
    }

    // 2. Check child branch records
    const linkedBranches = sessionBranches.filter((br) => br.bankId === id);
    if (linkedBranches.length > 0) {
      return {
        success: false,
        error: `Deletion Blocked: Bank "${bank.name}" has ${linkedBranches.length} branch record(s) attached. Delete or reassign branches first, or deactivate the bank.`,
      };
    }

    // Perform deletion
    sessionBanks = sessionBanks.filter((b) => b.id !== id);
    sessionBankAuditLogs.unshift({
      id: `LOG-${Date.now()}-DEL`,
      entityType: 'Bank',
      entityId: id,
      entityName: bank.name,
      action: 'Update',
      fieldName: 'Bank Record',
      previousValue: bank.name,
      newValue: 'Deleted',
      modifiedAt: new Date().toISOString(),
      modifiedBy: ACTOR,
      reason: 'Bank removed (unlinked)',
    });

    return { success: true };
  },

  // ==========================================
  // BRANCH MASTER OPERATIONS
  // ==========================================

  /**
   * Retrieves all branches matching optional filters.
   */
  async getBranches(filter?: BranchFilter): Promise<BranchMaster[]> {
    let list = [...sessionBranches];

    if (filter?.isSampleMode === false) {
      list = list.filter((br) => !br.isDemo);
    }

    if (filter?.bankId && filter.bankId !== 'All') {
      list = list.filter((br) => br.bankId === filter.bankId);
    }

    if (filter?.status && filter.status !== 'All') {
      list = list.filter((br) => br.status === filter.status);
    }

    if (filter?.isVerifiedOnly) {
      list = list.filter((br) => br.isVerified);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase().trim();
      list = list.filter(
        (br) =>
          br.branchName.toLowerCase().includes(q) ||
          br.ifscCode.toLowerCase().includes(q) ||
          br.branchLocation.toLowerCase().includes(q) ||
          br.bankName.toLowerCase().includes(q)
      );
    }

    return list;
  },

  /**
   * Retrieves a single branch by ID.
   */
  async getBranchById(id: string): Promise<BranchMaster | null> {
    const branch = sessionBranches.find((br) => br.id === id);
    return branch || null;
  },

  /**
   * Validates IFSC uniqueness within the current branch master dataset.
   */
  checkIfscUnique(ifsc: string, excludeBranchId?: string): boolean {
    const norm = normalizeIFSC(ifsc);
    return !sessionBranches.some(
      (br) => br.ifscCode === norm && (!excludeBranchId || br.id !== excludeBranchId)
    );
  },

  /**
   * Adds a new branch under an existing active bank.
   */
  async createBranch(req: CreateBranchRequest): Promise<BranchMaster> {
    // 1. Parent bank validation
    const bank = sessionBanks.find((b) => b.id === req.bankId);
    if (!bank) {
      throw new Error(`Invalid Bank ID: "${req.bankId}". Bank does not exist in the master.`);
    }
    if (bank.status === 'Inactive') {
      throw new Error(`Cannot add branch to inactive bank "${bank.name}". Reactivate the bank first.`);
    }

    // 2. Branch Name & Location validation
    if (!req.branchName || !req.branchName.trim()) {
      throw new Error('Branch name is required.');
    }
    if (!req.branchLocation || !req.branchLocation.trim()) {
      throw new Error('Branch location / address is required.');
    }

    // 3. IFSC format validation
    const ifscCheck = validateIFSC(req.ifscCode);
    if (!ifscCheck.isValid) {
      throw new Error(ifscCheck.error || 'Invalid IFSC format.');
    }

    // 4. IFSC uniqueness validation
    if (!this.checkIfscUnique(ifscCheck.normalized)) {
      throw new Error(
        `IFSC Code "${ifscCheck.normalized}" already exists in the Branch Master dataset. Duplicate IFSC codes are not permitted.`
      );
    }

    const newId = generateBranchId();
    const now = new Date().toISOString();

    // Rule: Every newly created branch must automatically start as Unverified
    const newBranch: BranchMaster = {
      id: newId,
      bankId: bank.id,
      bankName: bank.name,
      branchName: req.branchName.trim(),
      branchLocation: req.branchLocation.trim(),
      ifscCode: ifscCheck.normalized,
      status: req.status || 'Active',
      isVerified: false,
      verificationNotes: undefined,
      createdAt: now,
      lastModifiedAt: now,
      lastModifiedBy: ACTOR,
    };

    sessionBranches.unshift(newBranch);

    // Audit log
    sessionBankAuditLogs.unshift({
      id: `LOG-${Date.now()}-BR-CREATE`,
      entityType: 'Branch',
      entityId: newId,
      entityName: `${bank.name} - ${newBranch.branchName}`,
      action: 'Create',
      modifiedAt: now,
      modifiedBy: ACTOR,
      reason: 'Created unverified branch record. Requires separate client verification.',
    });

    return newBranch;
  },

  /**
   * Dedicated verification action: marks an unverified branch as verified with mandatory evidence.
   */
  async verifyBranch(id: string, verificationNotes: string): Promise<BranchMaster> {
    const branch = sessionBranches.find((br) => br.id === id);
    if (!branch) {
      throw new Error(`Branch with ID "${id}" not found.`);
    }

    const trimmedNotes = (verificationNotes || '').trim();
    if (!trimmedNotes) {
      throw new Error(
        'Verification evidence note is required when marking a branch as verified. Blank or whitespace-only evidence is rejected.'
      );
    }

    const now = new Date().toISOString();
    branch.isVerified = true;
    branch.verificationNotes = trimmedNotes;
    branch.lastModifiedAt = now;
    branch.lastModifiedBy = ACTOR;

    sessionBankAuditLogs.unshift({
      id: `LOG-${Date.now()}-BR-VERIFY`,
      entityType: 'Branch',
      entityId: id,
      entityName: branch.branchName,
      action: 'Update',
      fieldName: 'Verification Status',
      previousValue: 'Unverified',
      newValue: 'Verified',
      modifiedAt: now,
      modifiedBy: ACTOR,
      reason: `Branch verified with evidence: ${trimmedNotes}`,
    });

    return branch;
  },

  /**
   * Updates an existing branch.
   * Business rule: Branch cannot be reassigned to a different bank (immutable relationship).
   */
  async updateBranch(id: string, req: UpdateBranchRequest): Promise<BranchMaster> {
    const branch = sessionBranches.find((br) => br.id === id);
    if (!branch) {
      throw new Error(`Branch with ID "${id}" not found.`);
    }

    const now = new Date().toISOString();
    const reason = req.changeReason || 'Branch master update';

    // Detect if authoritative branch details changed
    const nameChanged = req.branchName !== undefined && req.branchName.trim() !== branch.branchName;
    const locChanged = req.branchLocation !== undefined && req.branchLocation.trim() !== branch.branchLocation;
    const ifscChanged = req.ifscCode !== undefined && normalizeIFSC(req.ifscCode) !== branch.ifscCode;
    const authoritativeDetailsChanged = nameChanged || locChanged || ifscChanged;

    // Rule: Editing authoritative details (Name, Location, or IFSC) returns branch to Unverified
    if (authoritativeDetailsChanged) {
      if (req.isVerified === true) {
        // If caller explicitly asks to re-verify during the same edit, require fresh evidence note
        const submittedNotes = (req.verificationNotes || '').trim();
        if (!submittedNotes) {
          throw new Error(
            'Verification evidence note is required when confirming branch details. Blank or whitespace-only evidence is rejected.'
          );
        }
        if (branch.isVerified && submittedNotes === (branch.verificationNotes || '').trim()) {
          throw new Error(
            'Authoritative branch details (Name, Location, or IFSC) have changed. Fresh client confirmation evidence note is required to re-confirm this record.'
          );
        }
      } else {
        // Automatically return branch to Unverified
        if (branch.isVerified) {
          branch.isVerified = false;
          branch.verificationNotes = undefined;
          sessionBankAuditLogs.unshift({
            id: `LOG-${Date.now()}-UNVER`,
            entityType: 'Branch',
            entityId: id,
            entityName: branch.branchName,
            action: 'Update',
            fieldName: 'Verification Status',
            previousValue: 'Verified',
            newValue: 'Unverified',
            modifiedAt: now,
            modifiedBy: ACTOR,
            reason: 'Authoritative branch details modified; record reverted to Unverified pending re-confirmation.',
          });
        }
      }
    } else if (req.isVerified === true) {
      const submittedNotes = (req.verificationNotes !== undefined ? req.verificationNotes : (branch.verificationNotes || '')).trim();
      if (!submittedNotes) {
        throw new Error(
          'Verification evidence note is required when marking a branch as client-confirmed. Blank or whitespace-only evidence is rejected.'
        );
      }
    }

    // Update branch name
    if (nameChanged && req.branchName) {
      const prev = branch.branchName;
      branch.branchName = req.branchName.trim();
      sessionBankAuditLogs.unshift({
        id: `LOG-${Date.now()}-BRN`,
        entityType: 'Branch',
        entityId: id,
        entityName: branch.branchName,
        action: 'Update',
        fieldName: 'Branch Name',
        previousValue: prev,
        newValue: branch.branchName,
        modifiedAt: now,
        modifiedBy: ACTOR,
        reason,
      });
    }

    // Update branch location
    if (locChanged && req.branchLocation) {
      const prev = branch.branchLocation;
      branch.branchLocation = req.branchLocation.trim();
      sessionBankAuditLogs.unshift({
        id: `LOG-${Date.now()}-BRL`,
        entityType: 'Branch',
        entityId: id,
        entityName: branch.branchName,
        action: 'Update',
        fieldName: 'Branch Location',
        previousValue: prev,
        newValue: branch.branchLocation,
        modifiedAt: now,
        modifiedBy: ACTOR,
        reason,
      });
    }

    // Update IFSC Code
    if (ifscChanged && req.ifscCode) {
      const ifscCheck = validateIFSC(req.ifscCode);
      if (!ifscCheck.isValid) {
        throw new Error(ifscCheck.error || 'Invalid IFSC format.');
      }
      if (!this.checkIfscUnique(ifscCheck.normalized, id)) {
        throw new Error(`IFSC Code "${ifscCheck.normalized}" already exists for another branch.`);
      }

      const prevIfsc = branch.ifscCode;
      branch.ifscCode = ifscCheck.normalized;
      sessionBankAuditLogs.unshift({
        id: `LOG-${Date.now()}-IFSC`,
        entityType: 'Branch',
        entityId: id,
        entityName: branch.branchName,
        action: 'Update',
        fieldName: 'IFSC Code',
        previousValue: prevIfsc,
        newValue: branch.ifscCode,
        modifiedAt: now,
        modifiedBy: ACTOR,
        reason,
      });
    }

    // Update Verification status
    if (req.isVerified !== undefined && req.isVerified !== branch.isVerified) {
      const prev = branch.isVerified ? 'Verified' : 'Unverified';
      const next = req.isVerified ? 'Verified' : 'Unverified';
      branch.isVerified = req.isVerified;
      sessionBankAuditLogs.unshift({
        id: `LOG-${Date.now()}-VER`,
        entityType: 'Branch',
        entityId: id,
        entityName: branch.branchName,
        action: 'Update',
        fieldName: 'Verification Status',
        previousValue: prev,
        newValue: next,
        modifiedAt: now,
        modifiedBy: ACTOR,
        reason,
      });
    }

    // Update Verification evidence note
    if (req.verificationNotes !== undefined) {
      const prevNote = branch.verificationNotes || 'None';
      const nextNote = req.verificationNotes.trim() || undefined;
      if (prevNote !== (nextNote || 'None')) {
        branch.verificationNotes = nextNote;
        sessionBankAuditLogs.unshift({
          id: `LOG-${Date.now()}-VERNOTE`,
          entityType: 'Branch',
          entityId: id,
          entityName: branch.branchName,
          action: 'Update',
          fieldName: 'Verification Evidence',
          previousValue: prevNote,
          newValue: nextNote || 'None',
          modifiedAt: now,
          modifiedBy: ACTOR,
          reason,
        });
      }
    }

    // Update Status
    if (req.status && req.status !== branch.status) {
      await this.toggleBranchStatus(id, req.status, reason);
    }

    branch.lastModifiedAt = now;
    branch.lastModifiedBy = ACTOR;

    return branch;
  },

  /**
   * Toggles branch active/inactive status with audit logging.
   */
  async toggleBranchStatus(id: string, newStatus: MasterStatus, reason?: string): Promise<BranchMaster> {
    const branch = sessionBranches.find((br) => br.id === id);
    if (!branch) {
      throw new Error(`Branch with ID "${id}" not found.`);
    }

    const prevStatus = branch.status;
    if (prevStatus === newStatus) return branch;

    const now = new Date().toISOString();
    branch.status = newStatus;
    branch.lastModifiedAt = now;
    branch.lastModifiedBy = ACTOR;

    sessionBankAuditLogs.unshift({
      id: `LOG-${Date.now()}-BR-STS`,
      entityType: 'Branch',
      entityId: id,
      entityName: branch.branchName,
      action: newStatus === 'Active' ? 'Activate' : 'Deactivate',
      fieldName: 'Branch Status',
      previousValue: prevStatus,
      newValue: newStatus,
      modifiedAt: now,
      modifiedBy: ACTOR,
      reason: reason || `Status changed from ${prevStatus} to ${newStatus}`,
    });

    return branch;
  },

  /**
   * Deletes a branch ONLY if no customer records reference it.
   */
  async deleteBranch(id: string): Promise<{ success: boolean; error?: string }> {
    const branch = sessionBranches.find((br) => br.id === id);
    if (!branch) {
      return { success: false, error: `Branch with ID "${id}" not found.` };
    }

    const linkedCustCount = await this.getLinkedCustomerCountForBranch(id);
    if (linkedCustCount > 0) {
      sessionBankAuditLogs.unshift({
        id: `LOG-${Date.now()}-BR-DEL-BLOCKED`,
        entityType: 'Branch',
        entityId: id,
        entityName: branch.branchName,
        action: 'Attempted Delete',
        modifiedAt: new Date().toISOString(),
        modifiedBy: ACTOR,
        reason: `Deletion blocked: ${linkedCustCount} customer record(s) linked to this branch. Deactivation required instead.`,
      });

      return {
        success: false,
        error: `Deletion Blocked: Branch "${branch.branchName}" is linked to ${linkedCustCount} customer record(s). Branch records cannot be deleted while customer allocations exist. You may deactivate the branch instead.`,
      };
    }

    sessionBranches = sessionBranches.filter((br) => br.id !== id);
    sessionBankAuditLogs.unshift({
      id: `LOG-${Date.now()}-BR-DEL`,
      entityType: 'Branch',
      entityId: id,
      entityName: branch.branchName,
      action: 'Update',
      fieldName: 'Branch Record',
      previousValue: branch.branchName,
      newValue: 'Deleted',
      modifiedAt: new Date().toISOString(),
      modifiedBy: ACTOR,
      reason: 'Branch removed (unlinked)',
    });

    return { success: true };
  },

  // ==========================================
  // LINKED RECORD CHECKS & DROPDOWN INTEGRATION
  // ==========================================

  /**
   * Counts customer records allocated to a specific bank ID.
   */
  async getLinkedCustomerCountForBank(bankId: string): Promise<number> {
    const customers = await customerService.getCustomers({ customerStatus: 'All' });
    return customers.filter((c) => c.bankInfo?.bankId === bankId).length;
  },

  /**
   * Counts customer records allocated to a specific branch ID.
   */
  async getLinkedCustomerCountForBranch(branchId: string): Promise<number> {
    const customers = await customerService.getCustomers({ customerStatus: 'All' });
    return customers.filter((c) => c.bankInfo?.branchId === branchId).length;
  },

  /**
   * Active Bank options for customer registration dropdowns.
   * Only Active banks are returned.
   */
  getActiveBankOptions(): BankOption[] {
    return sessionBanks
      .filter((b) => b.status === 'Active')
      .map((b) => ({
        id: b.id,
        name: b.name,
        code: b.code,
      }));
  },

  /**
   * Active Branch options for customer registration dropdowns.
   * Business Rule: A branch is returned ONLY when all conditions are true:
   * 1. br.bankId === bankId
   * 2. br.status === 'Active'
   * 3. br.isVerified === true
   * Unverified branches must NEVER appear in customer registration dropdowns.
   */
  getActiveBranchesForBank(bankId: string, isSampleMode: boolean = true): BranchOption[] {
    if (!bankId) return [];
    return sessionBranches
      .filter((br) => {
        if (br.bankId !== bankId) return false;
        if (br.status !== 'Active') return false;
        if (!br.isVerified) return false;
        if (!isSampleMode && br.isDemo) return false;
        return true;
      })
      .map((br) => ({
        id: br.id,
        bankId: br.bankId,
        name: br.branchName,
        location: br.branchLocation,
        ifscCode: br.ifscCode,
      }));
  },

  /**
   * Independent Service-Level Branch Validation for Customer Registration.
   * Validates all 7 mandatory business requirements:
   * 1. The selected bank exists.
   * 2. The selected bank is Active.
   * 3. The selected branch exists.
   * 4. The branch belongs to the selected bank.
   * 5. The branch status is Active.
   * 6. The branch has isVerified === true.
   * 7. The submitted branch name, location and IFSC match the resolved master record.
   */
  validateBranchForRegistration(
    bankId: string,
    branchId: string,
    submittedDetails?: {
      branchName?: string;
      branchLocation?: string;
      ifscCode?: string;
    }
  ): {
    isValid: boolean;
    error?: string;
    authoritativeBank?: BankMaster;
    authoritativeBranch?: BranchMaster;
  } {
    // 1. Selected bank exists
    if (!bankId) {
      return { isValid: false, error: 'Bank selection is mandatory.' };
    }
    const bank = sessionBanks.find((b) => b.id === bankId);
    if (!bank) {
      return { isValid: false, error: 'Selected bank does not exist in master records.' };
    }

    // 2. Selected bank is Active
    if (bank.status !== 'Active') {
      return {
        isValid: false,
        error: `Selected bank "${bank.name}" is currently inactive. Inactive banks cannot receive customer allocations.`,
      };
    }

    // 3. Selected branch exists
    if (!branchId) {
      return {
        isValid: false,
        error: 'No active branches configured for this bank. Customer registration requires verified branch master data.',
      };
    }
    const branch = sessionBranches.find((br) => br.id === branchId);
    if (!branch) {
      return {
        isValid: false,
        error: 'Selected branch does not exist in branch master records.',
      };
    }

    // 4. Branch belongs to selected bank
    if (branch.bankId !== bank.id) {
      return {
        isValid: false,
        error: `The selected branch "${branch.branchName}" belongs to ${branch.bankName}, not ${bank.name}.`,
      };
    }

    // 5. Branch status is Active
    if (branch.status !== 'Active') {
      return {
        isValid: false,
        error: `The selected branch "${branch.branchName}" is currently inactive. Inactive branches cannot receive customer allocations.`,
      };
    }

    // 6. Branch has isVerified === true
    if (!branch.isVerified) {
      return {
        isValid: false,
        error: `The selected branch "${branch.branchName}" is unverified. Only client-confirmed authoritative branches are eligible for customer registration.`,
      };
    }

    // 7. Submitted branch details match master record (if provided)
    if (submittedDetails) {
      if (
        submittedDetails.branchName &&
        submittedDetails.branchName.trim().toLowerCase() !== branch.branchName.toLowerCase()
      ) {
        return {
          isValid: false,
          error: `Submitted branch name "${submittedDetails.branchName}" does not match authoritative master record "${branch.branchName}".`,
        };
      }
      if (
        submittedDetails.branchLocation &&
        submittedDetails.branchLocation.trim().toLowerCase() !== branch.branchLocation.toLowerCase()
      ) {
        return {
          isValid: false,
          error: `Submitted branch location does not match authoritative master record.`,
        };
      }
      if (
        submittedDetails.ifscCode &&
        normalizeIFSC(submittedDetails.ifscCode) !== branch.ifscCode
      ) {
        return {
          isValid: false,
          error: `Submitted IFSC code "${submittedDetails.ifscCode}" does not match authoritative master record "${branch.ifscCode}".`,
        };
      }
    }

    return {
      isValid: true,
      authoritativeBank: bank,
      authoritativeBranch: branch,
    };
  },

  /**
   * Retrieves audit logs for banks or branches.
   */
  async getAuditLogs(filter?: { entityType?: 'Bank' | 'Branch'; entityId?: string }): Promise<BankAuditLog[]> {
    let logs = [...sessionBankAuditLogs];
    if (filter?.entityType) {
      logs = logs.filter((l) => l.entityType === filter.entityType);
    }
    if (filter?.entityId) {
      logs = logs.filter((l) => l.entityId === filter.entityId);
    }
    return logs;
  },
};
