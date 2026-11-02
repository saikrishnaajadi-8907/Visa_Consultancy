/**
 * VCMS Documents & Handovers Type Definitions
 * Defines data structures for the customer document register and physical custody chain.
 */

export type DocumentCategory =
  | 'Passport'
  | 'PAN Card'
  | 'Aadhaar Card'
  | 'Bank Statement'
  | 'Fixed Deposit Receipt'
  | 'Visa Application'
  | 'Educational Certificate'
  | 'Other';

export type DocumentStatus =
  | 'Received'
  | 'Pending'
  | 'Under Review'
  | 'Verified'
  | 'Rejected';

export type HandoverStatus =
  | 'Recorded'
  | 'Completed'
  | 'In Custody'
  | 'Handed Over'
  | 'Submitted to Embassy';

export interface DocumentRecord {
  id: string;
  customerId: string;
  customerName: string;
  documentName: string;
  category: DocumentCategory;
  receivedDate: string;
  status: DocumentStatus;
  remarks: string;
  lastUpdated: string;
  isDemo?: boolean;
  createdAt: string;
}

export interface CreateDocumentRequest {
  customerId: string;
  customerName?: string;
  documentName: string;
  category: DocumentCategory;
  receivedDate: string;
  status: DocumentStatus;
  remarks?: string;
}

export interface UpdateDocumentRequest {
  documentName?: string;
  category?: DocumentCategory;
  receivedDate?: string;
  status?: DocumentStatus;
  remarks?: string;
}

export interface HandoverRecord {
  id: string;
  customerId: string;
  customerName: string;
  documentId: string;
  documentName: string;
  handoverDate: string;
  givenBy: string;
  receivedBy: string;
  notes: string;
  status: HandoverStatus;
  isDemo?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateHandoverRequest {
  customerId: string;
  customerName?: string;
  documentId: string;
  documentName?: string;
  handoverDate: string;
  givenBy: string;
  receivedBy: string;
  notes?: string;
  status?: HandoverStatus;
}

export interface UpdateHandoverRequest {
  handoverDate?: string;
  givenBy?: string;
  receivedBy?: string;
  notes?: string;
  status?: HandoverStatus;
}
