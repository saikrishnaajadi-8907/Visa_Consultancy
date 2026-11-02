/**
 * In-Memory Documents & Handovers Service for VCMS Client Demonstration
 *
 * Manages customer document registers and chain-of-custody handovers.
 * Operates purely in-memory (zero file uploads or persistent backend storage).
 */

import {
  DocumentRecord,
  CreateDocumentRequest,
  UpdateDocumentRequest,
  DocumentCategory,
  DocumentStatus,
  HandoverRecord,
  CreateHandoverRequest,
  UpdateHandoverRequest,
  HandoverStatus,
} from '../types/document';
import { CustomerOption } from '../types/taskFollowUp';
import { customerService } from './customerService';
import { MOCK_CUSTOMERS } from '../constants/mockData';

export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
  'Passport',
  'PAN Card',
  'Aadhaar Card',
  'Bank Statement',
  'Fixed Deposit Receipt',
  'Visa Application',
  'Educational Certificate',
  'Other',
];

export const DOCUMENT_STATUSES: DocumentStatus[] = [
  'Received',
  'Pending',
  'Under Review',
  'Verified',
  'Rejected',
];

export const HANDOVER_STATUSES: HandoverStatus[] = [
  'Recorded',
  'Completed',
  'In Custody',
  'Handed Over',
  'Submitted to Embassy',
];

// Baseline Demonstration Documents (Shown in Sample Data mode)
const DEMO_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'DOC-01',
    customerId: 'cust-3',
    customerName: 'Ahmed Khan',
    documentName: 'Valid Passport Original Bio Page',
    category: 'Passport',
    receivedDate: '2026-10-12',
    status: 'Verified',
    remarks: 'Clear scan of bio page and address page; passport valid through 2032.',
    lastUpdated: '2026-10-15',
    isDemo: true,
    createdAt: '2026-10-12T10:00:00Z',
  },
  {
    id: 'DOC-02',
    customerId: 'cust-3',
    customerName: 'Ahmed Khan',
    documentName: 'Current Account Solvency Certificate',
    category: 'Bank Statement',
    receivedDate: '2026-10-14',
    status: 'Verified',
    remarks: 'ICICI Ameerpet branch solvency endorsement letter verifying ₹90,000 balance.',
    lastUpdated: '2026-10-15',
    isDemo: true,
    createdAt: '2026-10-14T11:30:00Z',
  },
  {
    id: 'DOC-03',
    customerId: 'cust-3',
    customerName: 'Ahmed Khan',
    documentName: 'PAN Card Signed Copy',
    category: 'PAN Card',
    receivedDate: '2026-10-10',
    status: 'Verified',
    remarks: 'Verified against NSDL tax records and passport spelling.',
    lastUpdated: '2026-10-10',
    isDemo: true,
    createdAt: '2026-10-10T09:15:00Z',
  },
  {
    id: 'DOC-04',
    customerId: 'cust-91',
    customerName: 'Alok Mishra',
    documentName: 'ITR Returns Assessment Year 2025-26',
    category: 'Bank Statement',
    receivedDate: '2026-10-08',
    status: 'Under Review',
    remarks: 'Awaiting Form 16 verification from chartered accountant.',
    lastUpdated: '2026-10-16',
    isDemo: true,
    createdAt: '2026-10-08T14:20:00Z',
  },
  {
    id: 'DOC-05',
    customerId: 'cust-91',
    customerName: 'Alok Mishra',
    documentName: 'IDBI Term Deposit Certificate',
    category: 'Fixed Deposit Receipt',
    receivedDate: '2026-10-09',
    status: 'Verified',
    remarks: 'Fixed deposit ₹1,90,000 maturing 2027 confirmed with IDBI Begumpet.',
    lastUpdated: '2026-10-11',
    isDemo: true,
    createdAt: '2026-10-09T16:00:00Z',
  },
  {
    id: 'DOC-06',
    customerId: 'cust-81',
    customerName: 'Chetan Shah',
    documentName: 'Fixed Deposit Term Certificate',
    category: 'Fixed Deposit Receipt',
    receivedDate: '2026-10-10',
    status: 'Verified',
    remarks: 'SBI sealed term deposit receipt for ₹1,50,000 held in escrow.',
    lastUpdated: '2026-10-10',
    isDemo: true,
    createdAt: '2026-10-10T12:00:00Z',
  },
  {
    id: 'DOC-07',
    customerId: 'cust-8',
    customerName: 'Anjali Verma',
    documentName: 'B.Tech Computer Science Degree Certificate',
    category: 'Educational Certificate',
    receivedDate: '2026-10-11',
    status: 'Verified',
    remarks: 'JNTU provisional degree certificate and consolidated marks transcripts.',
    lastUpdated: '2026-10-12',
    isDemo: true,
    createdAt: '2026-10-11T13:45:00Z',
  },
  {
    id: 'DOC-08',
    customerId: 'cust-11',
    customerName: 'Amit Deshmukh',
    documentName: 'Aadhaar Card Copy',
    category: 'Aadhaar Card',
    receivedDate: '2026-10-13',
    status: 'Verified',
    remarks: 'UIDAI verified electronic copy with masked number.',
    lastUpdated: '2026-10-13',
    isDemo: true,
    createdAt: '2026-10-13T10:10:00Z',
  },
  {
    id: 'DOC-09',
    customerId: 'cust-8',
    customerName: 'Anjali Verma',
    documentName: 'Visa Application Form Draft v2',
    category: 'Visa Application',
    receivedDate: '2026-10-16',
    status: 'Pending',
    remarks: 'Awaiting applicant signature on page 4 declaration section.',
    lastUpdated: '2026-10-17',
    isDemo: true,
    createdAt: '2026-10-16T15:30:00Z',
  },
];

// Baseline Demonstration Handovers (Shown in Sample Data mode)
const DEMO_HANDOVERS: HandoverRecord[] = [
  {
    id: 'HND-01',
    customerId: 'cust-3',
    customerName: 'Ahmed Khan',
    documentId: 'DOC-01',
    documentName: 'Valid Passport Original Bio Page',
    handoverDate: '2026-10-15',
    givenBy: 'S. Mehta (Senior Case Officer)',
    receivedBy: 'Ahmed Khan (Applicant in-person)',
    notes: 'Released for VFS Global Biometrics Appointment; signed receipt on file.',
    status: 'Handed Over',
    isDemo: true,
    createdAt: '2026-10-15T11:00:00Z',
  },
  {
    id: 'HND-02',
    customerId: 'cust-81',
    customerName: 'Chetan Shah',
    documentId: 'DOC-06',
    documentName: 'Fixed Deposit Term Certificate',
    handoverDate: '2026-10-12',
    givenBy: 'A. Joshi (Compliance Associate)',
    receivedBy: 'Consular Courier Representative',
    notes: 'Dispatched in sealed cover via BlueDart tracking #BLR88190 for direct consular filing.',
    status: 'Submitted to Embassy',
    isDemo: true,
    createdAt: '2026-10-12T14:30:00Z',
  },
  {
    id: 'HND-03',
    customerId: 'cust-8',
    customerName: 'Anjali Verma',
    documentId: 'DOC-07',
    documentName: 'B.Tech Computer Science Degree Certificate',
    handoverDate: '2026-10-14',
    givenBy: 'Anjali Verma (Applicant)',
    receivedBy: 'R. Sharma (Junior Consultant)',
    notes: 'Original degree taken into custody for consular apostille and verification.',
    status: 'In Custody',
    isDemo: true,
    createdAt: '2026-10-14T09:40:00Z',
  },
  {
    id: 'HND-04',
    customerId: 'cust-91',
    customerName: 'Alok Mishra',
    documentId: 'DOC-05',
    documentName: 'IDBI Term Deposit Certificate',
    handoverDate: '2026-10-16',
    givenBy: 'Alok Mishra (Applicant)',
    receivedBy: 'Anita Rao (Senior Counsellor)',
    notes: 'Fixed deposit certificate verified and logged into consultancy safe vault.',
    status: 'Recorded',
    isDemo: true,
    createdAt: '2026-10-16T16:15:00Z',
  },
];

// In-Memory Storage across active browser session
let sessionDocuments: DocumentRecord[] = [];
let sessionHandovers: HandoverRecord[] = [];
let nextDocIdCounter = 101;
let nextHandoverIdCounter = 101;

// Deleted demo record tracking
const deletedDemoDocIds = new Set<string>();
const deletedDemoHandoverIds = new Set<string>();

export const documentService = {
  /**
   * Resolves available customers from session and mock data
   */
  async getAvailableCustomers(): Promise<CustomerOption[]> {
    const map = new Map<string, CustomerOption>();

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
   * Retrieves Document records based on active mode and filters
   */
  getDocuments(options?: {
    isEmptyState?: boolean;
    search?: string;
    customerId?: string;
    category?: string;
    status?: string;
  }): DocumentRecord[] {
    const isEmpty = options?.isEmptyState ?? false;
    let list: DocumentRecord[] = [];

    if (!isEmpty) {
      const activeDemo = DEMO_DOCUMENTS.filter((d) => !deletedDemoDocIds.has(d.id));
      list = [...activeDemo, ...sessionDocuments];
    } else {
      list = [...sessionDocuments];
    }

    // Search query (customer name, document name, id, remarks)
    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(
        (d) =>
          d.documentName.toLowerCase().includes(q) ||
          d.customerName.toLowerCase().includes(q) ||
          d.id.toLowerCase().includes(q) ||
          d.remarks.toLowerCase().includes(q)
      );
    }

    // Filter by Customer
    if (options?.customerId && options.customerId !== 'All') {
      list = list.filter((d) => d.customerId === options.customerId);
    }

    // Filter by Category
    if (options?.category && options.category !== 'All') {
      list = list.filter((d) => d.category === options.category);
    }

    // Filter by Status
    if (options?.status && options.status !== 'All') {
      list = list.filter((d) => d.status === options.status);
    }

    return list;
  },

  /**
   * Get single document by ID
   */
  getDocumentById(id: string): DocumentRecord | null {
    const session = sessionDocuments.find((d) => d.id === id);
    if (session) return session;

    if (!deletedDemoDocIds.has(id)) {
      const demo = DEMO_DOCUMENTS.find((d) => d.id === id);
      if (demo) return demo;
    }

    return null;
  },

  /**
   * Get documents for specific customer
   */
  getDocumentsForCustomer(customerId: string, isEmptyState = false): DocumentRecord[] {
    return this.getDocuments({ customerId, isEmptyState });
  },

  /**
   * Count documents for specific customer
   */
  getCustomerDocumentsCount(customerId: string, isEmptyState = false): number {
    return this.getDocumentsForCustomer(customerId, isEmptyState).length;
  },

  /**
   * Create a new document metadata record
   */
  createDocument(data: CreateDocumentRequest): DocumentRecord {
    const today = new Date().toISOString().slice(0, 10);
    const newDoc: DocumentRecord = {
      id: `DOC-${nextDocIdCounter++}`,
      customerId: data.customerId,
      customerName: (data.customerName || '').trim(),
      documentName: data.documentName.trim(),
      category: data.category,
      receivedDate: data.receivedDate || today,
      status: data.status || 'Received',
      remarks: (data.remarks || '').trim(),
      lastUpdated: today,
      isDemo: false,
      createdAt: new Date().toISOString(),
    };

    sessionDocuments.unshift(newDoc);
    return newDoc;
  },

  /**
   * Update existing document record
   */
  updateDocument(id: string, updates: UpdateDocumentRequest): DocumentRecord {
    const today = new Date().toISOString().slice(0, 10);

    const sessionIdx = sessionDocuments.findIndex((d) => d.id === id);
    if (sessionIdx !== -1) {
      const existing = sessionDocuments[sessionIdx];
      const updated: DocumentRecord = {
        ...existing,
        ...updates,
        lastUpdated: today,
      };
      sessionDocuments[sessionIdx] = updated;
      return updated;
    }

    const demo = DEMO_DOCUMENTS.find((d) => d.id === id);
    if (demo && !deletedDemoDocIds.has(id)) {
      deletedDemoDocIds.add(id);
      const updated: DocumentRecord = {
        ...demo,
        ...updates,
        isDemo: true,
        lastUpdated: today,
      };
      sessionDocuments.unshift(updated);
      return updated;
    }

    throw new Error(`Document with ID ${id} not found.`);
  },

  /**
   * Quick status change
   */
  updateDocumentStatus(id: string, status: DocumentStatus): DocumentRecord {
    return this.updateDocument(id, { status });
  },

  /**
   * Delete document record
   */
  deleteDocument(id: string): boolean {
    const sessionIdx = sessionDocuments.findIndex((d) => d.id === id);
    if (sessionIdx !== -1) {
      sessionDocuments.splice(sessionIdx, 1);
      return true;
    }

    if (DEMO_DOCUMENTS.some((d) => d.id === id)) {
      deletedDemoDocIds.add(id);
      return true;
    }

    return false;
  },

  /**
   * Retrieves Handover records based on active mode and filters
   */
  getHandovers(options?: {
    isEmptyState?: boolean;
    search?: string;
    customerId?: string;
    status?: string;
  }): HandoverRecord[] {
    const isEmpty = options?.isEmptyState ?? false;
    let list: HandoverRecord[] = [];

    if (!isEmpty) {
      const activeDemo = DEMO_HANDOVERS.filter((h) => !deletedDemoHandoverIds.has(h.id));
      list = [...activeDemo, ...sessionHandovers];
    } else {
      list = [...sessionHandovers];
    }

    // Search query (customer, document, parties, notes, id)
    if (options?.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      list = list.filter(
        (h) =>
          h.customerName.toLowerCase().includes(q) ||
          h.documentName.toLowerCase().includes(q) ||
          h.givenBy.toLowerCase().includes(q) ||
          h.receivedBy.toLowerCase().includes(q) ||
          h.notes.toLowerCase().includes(q) ||
          h.id.toLowerCase().includes(q)
      );
    }

    // Filter by Customer
    if (options?.customerId && options.customerId !== 'All') {
      list = list.filter((h) => h.customerId === options.customerId);
    }

    // Filter by Status
    if (options?.status && options.status !== 'All') {
      list = list.filter((h) => h.status === options.status);
    }

    return list;
  },

  /**
   * Get single handover by ID
   */
  getHandoverById(id: string): HandoverRecord | null {
    const session = sessionHandovers.find((h) => h.id === id);
    if (session) return session;

    if (!deletedDemoHandoverIds.has(id)) {
      const demo = DEMO_HANDOVERS.find((h) => h.id === id);
      if (demo) return demo;
    }

    return null;
  },

  /**
   * Get handovers for customer
   */
  getHandoversForCustomer(customerId: string, isEmptyState = false): HandoverRecord[] {
    return this.getHandovers({ customerId, isEmptyState });
  },

  /**
   * Get handovers for a specific document
   */
  getHandoversForDocument(documentId: string, isEmptyState = false): HandoverRecord[] {
    const list = this.getHandovers({ isEmptyState });
    return list.filter((h) => h.documentId === documentId);
  },

  /**
   * Create a new handover custody record
   */
  createHandover(data: CreateHandoverRequest): HandoverRecord {
    const newHandover: HandoverRecord = {
      id: `HND-${nextHandoverIdCounter++}`,
      customerId: data.customerId,
      customerName: (data.customerName || '').trim(),
      documentId: data.documentId,
      documentName: (data.documentName || '').trim(),
      handoverDate: data.handoverDate,
      givenBy: data.givenBy.trim(),
      receivedBy: data.receivedBy.trim(),
      notes: (data.notes || '').trim(),
      status: data.status || 'Recorded',
      isDemo: false,
      createdAt: new Date().toISOString(),
    };

    sessionHandovers.unshift(newHandover);
    return newHandover;
  },

  /**
   * Update existing handover record
   */
  updateHandover(id: string, updates: UpdateHandoverRequest): HandoverRecord {
    const sessionIdx = sessionHandovers.findIndex((h) => h.id === id);
    if (sessionIdx !== -1) {
      const existing = sessionHandovers[sessionIdx];
      const updated: HandoverRecord = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      sessionHandovers[sessionIdx] = updated;
      return updated;
    }

    const demo = DEMO_HANDOVERS.find((h) => h.id === id);
    if (demo && !deletedDemoHandoverIds.has(id)) {
      deletedDemoHandoverIds.add(id);
      const updated: HandoverRecord = {
        ...demo,
        ...updates,
        isDemo: true,
        updatedAt: new Date().toISOString(),
      };
      sessionHandovers.unshift(updated);
      return updated;
    }

    throw new Error(`Handover with ID ${id} not found.`);
  },

  /**
   * Delete handover record
   */
  deleteHandover(id: string): boolean {
    const sessionIdx = sessionHandovers.findIndex((h) => h.id === id);
    if (sessionIdx !== -1) {
      sessionHandovers.splice(sessionIdx, 1);
      return true;
    }

    if (DEMO_HANDOVERS.some((h) => h.id === id)) {
      deletedDemoHandoverIds.add(id);
      return true;
    }

    return false;
  },

  /**
   * Reset session arrays (for test teardowns)
   */
  resetSessionData(): void {
    sessionDocuments = [];
    sessionHandovers = [];
    deletedDemoDocIds.clear();
    deletedDemoHandoverIds.clear();
  },
};
