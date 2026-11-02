/**
 * Customer Service - Phase 2 Implementation
 * Encapsulates customer operations, duplicate detection, archiving, and audit change logging.
 *
 * NOTE: Operates strictly within in-memory React session state.
 * Zero browser storage (no localStorage/sessionStorage) or actual API requests.
 */

import {
  Customer,
  CustomerRegistrationRequest,
  CustomerUpdateRequest,
  CustomerSearchFilters,
  CustomerSearchResult,
  CustomerChangeHistory,
  BankOption,
  BranchOption,
} from '../types/customer';
import { normalizeIdentifier, normalizeMobile } from '../utils/validation';
import { bankService } from './bankService';


// Predefined Bank Options (from confirmed VCMS initial bank list)
export const PREDEFINED_BANKS: BankOption[] = [
  { id: 'sbi', name: 'State Bank of India', code: 'SBIN' },
  { id: 'hdfc', name: 'HDFC Bank', code: 'HDFC' },
  { id: 'icici', name: 'ICICI Bank', code: 'ICIC' },
  { id: 'axis', name: 'Axis Bank', code: 'UTIB' },
  { id: 'idbi', name: 'IDBI Bank', code: 'IBKL' },
  { id: 'boi', name: 'Bank of India', code: 'BKID' },
  { id: 'bom', name: 'Bank of Maharashtra', code: 'MAHB' },
  { id: 'canara', name: 'Canara Bank', code: 'CNRB' },
  { id: 'bob', name: 'Bank of Baroda', code: 'BARB' },
  { id: 'pnb', name: 'Punjab National Bank', code: 'PUNB' },
];

// Approved Demonstration Customers matching approved sample data
export const DEMO_CUSTOMERS: Customer[] = [
  {
    id: 'cust-3',
    personalInfo: {
      fullName: 'Ahmed Khan',
      dateOfBirth: '1988-02-11',
      gender: 'Male',
      nationality: 'Indian',
      aadhaarNumber: '9988 7766 5544',
      panNumber: 'AKHPA1234F',
      passportNumber: 'C9876543',
      fatherName: 'Rashid Khan',
      motherName: 'Zehra Khan',
    },
    contactInfo: {
      personalMobile: '9811234567',
      personalEmail: 'ahmed.k@example.com',
      bankMobile: '9811234567',
      bankEmail: 'ahmed.k@example.com',
      residentialAddress: '8-2-293 Banjara Hills, Hyderabad',
    },
    visaInfo: {
      visaType: 'Work Visa',
      consultancyName: 'Visa Consultancy Management',
      counsellorName: 'S. Mehta',
      destinationCountry: 'United Kingdom',
      university: '',
      visaStatus: 'Active',
    },
    bankInfo: {
      bankId: 'icici',
      bankName: 'ICICI Bank',
      branchId: 'br_icici_01',
      branchName: 'Ameerpet Branch (Demo)',
      branchLocation: 'Ameerpet, Hyderabad, Telangana',
      ifscCode: 'ICIC0000048',
      accountNumber: 'XXXX 9012',
      chequeBook: 'Yes',
    },
    fdInfo: {
      initialFdAmount: 0,
      fdStartDate: '',
      fdEndDate: '',
    },
    paymentInfo: {
      paidTo: 'Consultancy',
      nextPaymentDate: '',
    },
    additionalInfo: {
      notes: 'Approved demo client',
      additionalRemarks: '',
    },
    initialFinancialRecord: {
      transactionDate: '2026-10-01',
      initialAmount: 75000,
      notes: 'Verified via ICICI Statement (Self-funding savings deposit)',
    },
    status: 'Active',
    createdAt: '2026-10-01T10:00:00.000Z',
    createdBy: 'Demo User',
    updatedAt: '2026-10-15T12:00:00.000Z',
    updatedBy: 'Demo User',
  },
  {
    id: 'cust-91',
    personalInfo: {
      fullName: 'Alok Mishra',
      dateOfBirth: '1992-08-24',
      gender: 'Male',
      nationality: 'Indian',
      aadhaarNumber: '8877 6655 4433',
      panNumber: 'ALMPA5678G',
      passportNumber: 'I4598670',
      fatherName: 'R. Mishra',
      motherName: 'S. Mishra',
    },
    contactInfo: {
      personalMobile: '9877890011',
      personalEmail: 'alok.m@example.com',
      bankMobile: '9877890011',
      bankEmail: 'alok.m@example.com',
      residentialAddress: '45, Jubilee Enclave, Madhapur, Hyderabad',
    },
    visaInfo: {
      visaType: 'PR Visa',
      consultancyName: 'Visa Consultancy Management',
      counsellorName: 'S. Mehta',
      destinationCountry: 'Canada',
      university: '',
      visaStatus: 'Active',
    },
    bankInfo: {
      bankId: 'idbi',
      bankName: 'IDBI Bank',
      branchId: 'br_idbi_01',
      branchName: 'Begumpet Branch (Demo)',
      branchLocation: 'Begumpet, Hyderabad, Telangana',
      ifscCode: 'IBKL0000028',
      accountNumber: 'XXXX 1144',
      chequeBook: 'Yes',
    },
    fdInfo: {
      initialFdAmount: 0,
      fdStartDate: '',
      fdEndDate: '',
    },
    paymentInfo: {
      paidTo: 'Consultancy',
      nextPaymentDate: '',
    },
    additionalInfo: {
      notes: 'Approved demo client',
      additionalRemarks: '',
    },
    initialFinancialRecord: {
      transactionDate: '2026-09-28',
      initialAmount: 160000,
      notes: 'Initial registration deposit',
    },
    status: 'Active',
    createdAt: '2026-09-28T09:30:00.000Z',
    createdBy: 'Demo User',
    updatedAt: '2026-10-12T10:00:00.000Z',
    updatedBy: 'Demo User',
  },
  {
    id: 'cust-11',
    personalInfo: {
      fullName: 'Amit Deshmukh',
      dateOfBirth: '1990-05-15',
      gender: 'Male',
      nationality: 'Indian',
      aadhaarNumber: '7766 5544 3322',
      panNumber: 'AMDPA9012H',
      passportNumber: 'A2345678',
      fatherName: 'V. Deshmukh',
      motherName: 'K. Deshmukh',
    },
    contactInfo: {
      personalMobile: '9876501234',
      personalEmail: 'amit.d@example.com',
      bankMobile: '9876501234',
      bankEmail: 'amit.d@example.com',
      residentialAddress: 'Plot 12, Road No 36, Jubilee Hills, Hyderabad',
    },
    visaInfo: {
      visaType: 'Work Visa',
      consultancyName: 'Visa Consultancy Management',
      counsellorName: 'S. Mehta',
      destinationCountry: 'United Kingdom',
      university: '',
      visaStatus: 'Active',
    },
    bankInfo: {
      bankId: 'sbi',
      bankName: 'State Bank of India (SBI)',
      branchId: 'br_sbi_01',
      branchName: 'Hyderabad Main Branch (Demo)',
      branchLocation: 'Koti, Hyderabad, Telangana',
      ifscCode: 'SBIN0000847',
      accountNumber: 'XXXX 4321',
      chequeBook: 'Yes',
    },
    fdInfo: {
      initialFdAmount: 0,
      fdStartDate: '',
      fdEndDate: '',
    },
    paymentInfo: {
      paidTo: 'Consultancy',
      nextPaymentDate: '',
    },
    additionalInfo: {
      notes: 'Approved demo client',
      additionalRemarks: '',
    },
    initialFinancialRecord: {
      transactionDate: '2026-10-02',
      initialAmount: 60000,
      notes: 'Initial registration deposit',
    },
    status: 'Active',
    createdAt: '2026-10-02T10:00:00.000Z',
    createdBy: 'Demo User',
    updatedAt: '2026-10-29T10:00:00.000Z',
    updatedBy: 'Demo User',
  },
  {
    id: 'cust-8',
    personalInfo: {
      fullName: 'Anjali Verma',
      dateOfBirth: '1994-11-19',
      gender: 'Female',
      nationality: 'Indian',
      aadhaarNumber: '6655 4433 2211',
      panNumber: 'ANVPA3456J',
      passportNumber: 'H7821903',
      fatherName: 'M. Verma',
      motherName: 'P. Verma',
    },
    contactInfo: {
      personalMobile: '9866778899',
      personalEmail: 'anjali.v@example.com',
      bankMobile: '9866778899',
      bankEmail: 'anjali.v@example.com',
      residentialAddress: 'Flat 402, Sai Residency, Dilsukhnagar, Hyderabad',
    },
    visaInfo: {
      visaType: 'Student Visa',
      consultancyName: 'Visa Consultancy Management',
      counsellorName: 'S. Mehta',
      destinationCountry: 'Australia',
      university: 'University of Melbourne',
      visaStatus: 'Active',
    },
    bankInfo: {
      bankId: 'bob',
      bankName: 'Bank of Baroda',
      branchId: 'br_bob_01',
      branchName: 'Dilsukhnagar Branch (Demo)',
      branchLocation: 'Dilsukhnagar, Hyderabad, Telangana',
      ifscCode: 'BARB0DILSUK',
      accountNumber: 'XXXX 9901',
      chequeBook: 'Yes',
    },
    fdInfo: {
      initialFdAmount: 0,
      fdStartDate: '',
      fdEndDate: '',
    },
    paymentInfo: {
      paidTo: 'Consultancy',
      nextPaymentDate: '',
    },
    additionalInfo: {
      notes: 'Approved demo client',
      additionalRemarks: '',
    },
    initialFinancialRecord: {
      transactionDate: '2026-10-01',
      initialAmount: 90000,
      notes: 'Initial registration deposit',
    },
    status: 'Active',
    createdAt: '2026-10-01T10:00:00.000Z',
    createdBy: 'Demo User',
    updatedAt: '2026-10-04T10:00:00.000Z',
    updatedBy: 'Demo User',
  },
  {
    id: 'cust-81',
    personalInfo: {
      fullName: 'Chetan Shah',
      dateOfBirth: '1987-03-03',
      gender: 'Male',
      nationality: 'Indian',
      aadhaarNumber: '5544 3322 1100',
      panNumber: 'CHSPA7890K',
      passportNumber: 'H6710892',
      fatherName: 'D. Shah',
      motherName: 'L. Shah',
    },
    contactInfo: {
      personalMobile: '9866789900',
      personalEmail: 'chetan.shah@example.com',
      bankMobile: '9866789900',
      bankEmail: 'chetan.shah@example.com',
      residentialAddress: '14/B, Sindhi Colony, Secunderabad',
    },
    visaInfo: {
      visaType: 'Business Visa',
      consultancyName: 'Visa Consultancy Management',
      counsellorName: 'A. Joshi',
      destinationCountry: 'United States',
      university: '',
      visaStatus: 'Active',
    },
    bankInfo: {
      bankId: 'bob',
      bankName: 'Bank of Baroda',
      branchId: 'br_bob_01',
      branchName: 'Dilsukhnagar Branch (Demo)',
      branchLocation: 'Dilsukhnagar, Hyderabad, Telangana',
      ifscCode: 'BARB0DILSUK',
      accountNumber: 'XXXX 8712',
      chequeBook: 'Yes',
    },
    fdInfo: {
      initialFdAmount: 0,
      fdStartDate: '',
      fdEndDate: '',
    },
    paymentInfo: {
      paidTo: 'Consultancy',
      nextPaymentDate: '',
    },
    additionalInfo: {
      notes: 'Approved demo client',
      additionalRemarks: '',
    },
    initialFinancialRecord: {
      transactionDate: '2026-10-01',
      initialAmount: 150000,
      notes: 'Initial registration deposit',
    },
    status: 'Active',
    createdAt: '2026-10-01T10:00:00.000Z',
    createdBy: 'Demo User',
    updatedAt: '2026-10-05T10:00:00.000Z',
    updatedBy: 'Demo User',
  },
  // 6. HDFC Bank - Arvind Swaminathan
  {
    id: 'cust-hdfc-1',
    personalInfo: {
      fullName: 'Arvind Swaminathan',
      dateOfBirth: '1991-04-18',
      gender: 'Male',
      nationality: 'Indian',
      aadhaarNumber: '4433 2211 0099',
      panNumber: 'ASWPA4567M',
      passportNumber: 'M8921456',
      fatherName: 'K. Swaminathan',
      motherName: 'R. Swaminathan',
    },
    contactInfo: {
      personalMobile: '9844556677',
      personalEmail: 'arvind.s@example.com',
      bankMobile: '9844556677',
      bankEmail: 'arvind.s@example.com',
      residentialAddress: 'Plot 55, Road No 10, Somajiguda, Hyderabad',
    },
    visaInfo: {
      visaType: 'Student Visa',
      consultancyName: 'Visa Consultancy Management',
      counsellorName: 'S. Mehta',
      destinationCountry: 'United Kingdom',
      university: 'Imperial College London',
      visaStatus: 'Active',
    },
    bankInfo: {
      bankId: 'hdfc',
      bankName: 'HDFC Bank',
      branchId: 'br_hdfc_01',
      branchName: 'Somajiguda Branch (Demo)',
      branchLocation: 'Somajiguda, Hyderabad, Telangana',
      ifscCode: 'HDFC0001842',
      accountNumber: 'XXXX 5012',
      chequeBook: 'Yes',
    },
    fdInfo: {
      initialFdAmount: 100000,
      fdStartDate: '2026-09-03',
      fdEndDate: '2027-09-03',
      interestAmount: 6500,
    },
    paymentInfo: {
      paidTo: 'Consultancy',
      nextPaymentDate: '2026-11-20',
    },
    additionalInfo: {
      notes: 'Approved demo client – HDFC Bank account holder',
      additionalRemarks: 'Proof of funds certified via Somajiguda branch',
    },
    initialFinancialRecord: {
      transactionDate: '2026-09-03',
      initialAmount: 100000,
      notes: 'Opening deposit verified via HDFC Somajiguda statement',
    },
    status: 'Active',
    createdAt: '2026-09-03T10:00:00.000Z',
    createdBy: 'Demo User',
    updatedAt: '2026-10-26T14:00:00.000Z',
    updatedBy: 'Demo User',
  },
  // 7. Bank of India - Rajesh Nair
  {
    id: 'cust-boi-1',
    personalInfo: {
      fullName: 'Rajesh Nair',
      dateOfBirth: '1993-07-22',
      gender: 'Male',
      nationality: 'Indian',
      aadhaarNumber: '3322 1100 9988',
      panNumber: 'RJNPA9876P',
      passportNumber: 'K3456789',
      fatherName: 'G. Nair',
      motherName: 'M. Nair',
    },
    contactInfo: {
      personalMobile: '9822334455',
      personalEmail: 'rajesh.nair@example.com',
      bankMobile: '9822334455',
      bankEmail: 'rajesh.nair@example.com',
      residentialAddress: '12-4-89, Tilak Road, Abids, Hyderabad',
    },
    visaInfo: {
      visaType: 'Work Visa',
      consultancyName: 'Visa Consultancy Management',
      counsellorName: 'A. Joshi',
      destinationCountry: 'Germany',
      university: '',
      visaStatus: 'Active',
    },
    bankInfo: {
      bankId: 'boi',
      bankName: 'Bank of India',
      branchId: 'br_boi_01',
      branchName: 'Abids Branch (Demo)',
      branchLocation: 'Abids, Hyderabad, Telangana',
      ifscCode: 'BKID0005600',
      accountNumber: 'XXXX 3389',
      chequeBook: 'Yes',
    },
    fdInfo: {
      initialFdAmount: 50000,
      fdStartDate: '2026-09-06',
      fdEndDate: '2027-09-06',
      interestAmount: 3250,
    },
    paymentInfo: {
      paidTo: 'Consultancy',
      nextPaymentDate: '',
    },
    additionalInfo: {
      notes: 'Approved demo client – Bank of India account holder',
      additionalRemarks: 'German EU Blue Card applicant',
    },
    initialFinancialRecord: {
      transactionDate: '2026-09-06',
      initialAmount: 75000,
      notes: 'Initial registration proof of funds verified via BOI Abids',
    },
    status: 'Active',
    createdAt: '2026-09-06T09:30:00.000Z',
    createdBy: 'Demo User',
    updatedAt: '2026-11-01T11:00:00.000Z',
    updatedBy: 'Demo User',
  },
  // 8. Bank of Maharashtra - Sneha Kulkarni
  {
    id: 'cust-bom-1',
    personalInfo: {
      fullName: 'Sneha Kulkarni',
      dateOfBirth: '1995-12-05',
      gender: 'Female',
      nationality: 'Indian',
      aadhaarNumber: '2211 0099 8877',
      panNumber: 'SNKPA8765Q',
      passportNumber: 'L6789012',
      fatherName: 'P. Kulkarni',
      motherName: 'S. Kulkarni',
    },
    contactInfo: {
      personalMobile: '9833445566',
      personalEmail: 'sneha.k@example.com',
      bankMobile: '9833445566',
      bankEmail: 'sneha.k@example.com',
      residentialAddress: 'Flat 301, Shree Ganesh Heights, Koti, Hyderabad',
    },
    visaInfo: {
      visaType: 'Student Visa',
      consultancyName: 'Visa Consultancy Management',
      counsellorName: 'S. Mehta',
      destinationCountry: 'Canada',
      university: 'University of Toronto',
      visaStatus: 'Active',
    },
    bankInfo: {
      bankId: 'bom',
      bankName: 'Bank of Maharashtra',
      branchId: 'br_bom_01',
      branchName: 'Sultan Bazar Branch (Demo)',
      branchLocation: 'Sultan Bazar, Hyderabad, Telangana',
      ifscCode: 'MAHB0000115',
      accountNumber: 'XXXX 7721',
      chequeBook: 'Yes',
    },
    fdInfo: {
      initialFdAmount: 75000,
      fdStartDate: '2026-09-08',
      fdEndDate: '2027-09-08',
      interestAmount: 4800,
    },
    paymentInfo: {
      paidTo: 'Consultancy',
      nextPaymentDate: '',
    },
    additionalInfo: {
      notes: 'Approved demo client – Bank of Maharashtra account holder',
      additionalRemarks: 'GIC and student visa funding package',
    },
    initialFinancialRecord: {
      transactionDate: '2026-09-08',
      initialAmount: 85000,
      notes: 'Savings deposit verified by Bank of Maharashtra passbook',
    },
    status: 'Active',
    createdAt: '2026-09-08T10:15:00.000Z',
    createdBy: 'Demo User',
    updatedAt: '2026-10-17T15:00:00.000Z',
    updatedBy: 'Demo User',
  },
  // 9. Canara Bank - Vikram Rao
  {
    id: 'cust-canara-1',
    personalInfo: {
      fullName: 'Vikram Rao',
      dateOfBirth: '1989-09-14',
      gender: 'Male',
      nationality: 'Indian',
      aadhaarNumber: '1100 9988 7766',
      panNumber: 'VKRPA7654R',
      passportNumber: 'N4567890',
      fatherName: 'B. Rao',
      motherName: 'V. Rao',
    },
    contactInfo: {
      personalMobile: '9855667788',
      personalEmail: 'vikram.rao@example.com',
      bankMobile: '9855667788',
      bankEmail: 'vikram.rao@example.com',
      residentialAddress: '24, Park Lane, Secunderabad, Telangana',
    },
    visaInfo: {
      visaType: 'PR Visa',
      consultancyName: 'Visa Consultancy Management',
      counsellorName: 'A. Joshi',
      destinationCountry: 'Australia',
      university: '',
      visaStatus: 'Active',
    },
    bankInfo: {
      bankId: 'canara',
      bankName: 'Canara Bank',
      branchId: 'br_canara_02',
      branchName: 'Secunderabad Branch (Demo)',
      branchLocation: 'Secunderabad, Telangana',
      ifscCode: 'CNRB0000305',
      accountNumber: 'XXXX 4410',
      chequeBook: 'Yes',
    },
    fdInfo: {
      initialFdAmount: 120000,
      fdStartDate: '2026-09-10',
      fdEndDate: '2027-09-10',
      interestAmount: 7800,
    },
    paymentInfo: {
      paidTo: 'Consultancy',
      nextPaymentDate: '',
    },
    additionalInfo: {
      notes: 'Approved demo client – Canara Bank account holder',
      additionalRemarks: 'Australian General Skilled Migration applicant',
    },
    initialFinancialRecord: {
      transactionDate: '2026-09-10',
      initialAmount: 120000,
      notes: 'Verified via Canara Bank certificate of deposit',
    },
    status: 'Active',
    createdAt: '2026-09-10T11:00:00.000Z',
    createdBy: 'Demo User',
    updatedAt: '2026-10-10T16:00:00.000Z',
    updatedBy: 'Demo User',
  },
  // 10. Punjab National Bank - Harpreet Singh
  {
    id: 'cust-pnb-1',
    personalInfo: {
      fullName: 'Harpreet Singh',
      dateOfBirth: '1990-06-30',
      gender: 'Male',
      nationality: 'Indian',
      aadhaarNumber: '9900 8877 6655',
      panNumber: 'HPSPA6543S',
      passportNumber: 'P2345678',
      fatherName: 'J. Singh',
      motherName: 'K. Kaur',
    },
    contactInfo: {
      personalMobile: '9877665544',
      personalEmail: 'harpreet.s@example.com',
      bankMobile: '9877665544',
      bankEmail: 'harpreet.s@example.com',
      residentialAddress: 'House 18, Somajiguda Officers Colony, Hyderabad',
    },
    visaInfo: {
      visaType: 'Business Visa',
      consultancyName: 'Visa Consultancy Management',
      counsellorName: 'S. Mehta',
      destinationCountry: 'United States',
      university: '',
      visaStatus: 'Active',
    },
    bankInfo: {
      bankId: 'pnb',
      bankName: 'Punjab National Bank (PNB)',
      branchId: 'br_pnb_01',
      branchName: 'Raj Bhavan Road Branch (Demo)',
      branchLocation: 'Raj Bhavan Road, Somajiguda, Hyderabad',
      ifscCode: 'PUNB0152400',
      accountNumber: 'XXXX 6632',
      chequeBook: 'Yes',
    },
    fdInfo: {
      initialFdAmount: 150000,
      fdStartDate: '2026-09-12',
      fdEndDate: '2027-09-12',
      interestAmount: 9750,
    },
    paymentInfo: {
      paidTo: 'Consultancy',
      nextPaymentDate: '',
    },
    additionalInfo: {
      notes: 'Approved demo client – Punjab National Bank account holder',
      additionalRemarks: 'US B1/B2 trade visit and partner capital proof',
    },
    initialFinancialRecord: {
      transactionDate: '2026-09-12',
      initialAmount: 110000,
      notes: 'PNB business account verified proof of capital',
    },
    status: 'Active',
    createdAt: '2026-09-12T09:45:00.000Z',
    createdBy: 'Demo User',
    updatedAt: '2026-10-20T12:00:00.000Z',
    updatedBy: 'Demo User',
  },
  // 11. Axis Bank - Priya Sharma
  {
    id: 'cust-axis-1',
    personalInfo: {
      fullName: 'Priya Sharma',
      dateOfBirth: '1996-01-28',
      gender: 'Female',
      nationality: 'Indian',
      aadhaarNumber: '8800 7766 5544',
      panNumber: 'PRSPA5432T',
      passportNumber: 'R9012345',
      fatherName: 'R. Sharma',
      motherName: 'M. Sharma',
    },
    contactInfo: {
      personalMobile: '9888776655',
      personalEmail: 'priya.sharma@example.com',
      bankMobile: '9888776655',
      bankEmail: 'priya.sharma@example.com',
      residentialAddress: 'Villa 8, Whisper Valley, Jubilee Hills, Hyderabad',
    },
    visaInfo: {
      visaType: 'Student Visa',
      consultancyName: 'Visa Consultancy Management',
      counsellorName: 'A. Joshi',
      destinationCountry: 'United Kingdom',
      university: 'London School of Economics',
      visaStatus: 'Active',
    },
    bankInfo: {
      bankId: 'axis',
      bankName: 'Axis Bank',
      branchId: 'br_axis_01',
      branchName: 'Jubilee Hills Branch (Demo)',
      branchLocation: 'Road No 36, Jubilee Hills, Hyderabad',
      ifscCode: 'UTIB0000522',
      accountNumber: 'XXXX 8190',
      chequeBook: 'Yes',
    },
    fdInfo: {
      initialFdAmount: 100000,
      fdStartDate: '2026-09-14',
      fdEndDate: '2027-09-14',
      interestAmount: 6500,
    },
    paymentInfo: {
      paidTo: 'Consultancy',
      nextPaymentDate: '',
    },
    additionalInfo: {
      notes: 'Approved demo client – Axis Bank account holder',
      additionalRemarks: 'UK Tier 4 postgraduate degree financing',
    },
    initialFinancialRecord: {
      transactionDate: '2026-09-14',
      initialAmount: 95000,
      notes: 'Verified via Axis Priority Banking statement',
    },
    status: 'Active',
    createdAt: '2026-09-14T10:30:00.000Z',
    createdBy: 'Demo User',
    updatedAt: '2026-11-03T16:00:00.000Z',
    updatedBy: 'Demo User',
  },
];

export const DEMO_CUSTOMER_IDS = new Set(DEMO_CUSTOMERS.map((c) => c.id));

/**
 * In-memory customer state storage for active session.
 * Pre-populated with the 11 approved demo customers across all 10 partner banks.
 */
let sessionCustomers: Customer[] = [...DEMO_CUSTOMERS];
let sessionChangeHistory: CustomerChangeHistory[] = [];

/**
 * Generate a stable, unique opaque customer identifier.
 * Does not assume sequential numbering or business-rule formatting.
 */
function generateOpaqueCustomerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `cust_${crypto.randomUUID().replace(/-/g, '').slice(0, 12)}`;
  }
  return `cust_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}

export const customerService = {
  getBankOptions(): BankOption[] {
    // Phase 3: Delegate to bankService for live active master banks
    const active = bankService.getActiveBankOptions();
    return active.length > 0 ? active : PREDEFINED_BANKS;
  },

  /**
   * Returns active, verified branches configured in Branch Master for a bank.
   * Operational branches come ONLY from branches explicitly created and verified.
   * Unverified branches or synthetic demo branches never appear in customer registration.
   */
  getBranchesForBank(bankId: string, isSampleMode: boolean = true): BranchOption[] {
    if (!bankId) return [];
    return bankService.getActiveBranchesForBank(bankId, isSampleMode);
  },

  getBranchById(branchId: string): BranchOption | undefined {
    if (!branchId) return undefined;
    const allBranches = bankService.getActiveBranchesForBank('');
    return allBranches.find((b) => b.id === branchId);
  },


  /**
   * Duplicate validation check:
   * Inspects existing session records by PAN, Passport, and Personal Mobile.
   */
  checkDuplicates(
    pan: string,
    passport: string,
    mobile: string,
    excludeCustomerId?: string
  ): { hasDuplicate: boolean; field?: 'pan' | 'passport' | 'mobile'; message?: string } {
    const normPan = normalizeIdentifier(pan);
    const normPassport = normalizeIdentifier(passport);
    const normMobile = normalizeMobile(mobile);

    for (const cust of sessionCustomers) {
      if (excludeCustomerId && cust.id === excludeCustomerId) continue;
      // Archived customers are also checked to prevent duplicate re-registration
      if (normPan && normalizeIdentifier(cust.personalInfo.panNumber) === normPan) {
        return {
          hasDuplicate: true,
          field: 'pan',
          message: `A customer record with PAN "${normPan}" already exists (ID: ${cust.id}, ${cust.personalInfo.fullName}).`,
        };
      }
      if (normPassport && normalizeIdentifier(cust.personalInfo.passportNumber) === normPassport) {
        return {
          hasDuplicate: true,
          field: 'passport',
          message: `A customer record with Passport "${normPassport}" already exists (ID: ${cust.id}, ${cust.personalInfo.fullName}).`,
        };
      }
      if (normMobile && normalizeMobile(cust.contactInfo.personalMobile) === normMobile) {
        return {
          hasDuplicate: true,
          field: 'mobile',
          message: `A customer record with Mobile "${normMobile}" already exists (ID: ${cust.id}, ${cust.personalInfo.fullName}).`,
        };
      }
    }

    return { hasDuplicate: false };
  },

  /**
   * Creates a customer atomically with their initial financial record.
   */
  async createCustomerWithInitialRecord(
    req: CustomerRegistrationRequest
  ): Promise<Customer> {
    // 1. Verify duplicates
    const dupCheck = this.checkDuplicates(
      req.personalInfo.panNumber,
      req.personalInfo.passportNumber,
      req.contactInfo.personalMobile
    );
    if (dupCheck.hasDuplicate) {
      throw new Error(dupCheck.message || 'Duplicate registration detected.');
    }

    // 2. Validate mandatory initial financial notes
    if (!req.initialFinancialRecord.notes || !req.initialFinancialRecord.notes.trim()) {
      throw new Error('Mandatory transaction notes must be provided for the initial financial record.');
    }

    // 3. Authoritative Service-Level Master Bank & Branch Validation
    // Independently resolve selected bank & branch; do not rely exclusively on dropdown filtering
    const branchCheck = bankService.validateBranchForRegistration(
      req.bankInfo.bankId,
      req.bankInfo.branchId,
      {
        branchName: req.bankInfo.branchName,
        branchLocation: req.bankInfo.branchLocation,
        ifscCode: req.bankInfo.ifscCode,
      }
    );

    if (!branchCheck.isValid) {
      throw new Error(branchCheck.error || 'Bank/Branch verification failed for customer registration.');
    }

    const authBank = branchCheck.authoritativeBank!;
    const authBranch = branchCheck.authoritativeBranch!;

    // Stable, unique opaque identifier (independent of sequential business assumptions)
    const newId = generateOpaqueCustomerId();
    const now = new Date().toISOString();
    const actor = 'Demo User';

    const newCustomer: Customer = {
      id: newId,
      personalInfo: { ...req.personalInfo },
      contactInfo: { ...req.contactInfo },
      visaInfo: { ...req.visaInfo },
      // Authoritative master bank and branch data replaces any arbitrary form values
      bankInfo: {
        ...req.bankInfo,
        bankId: authBank.id,
        bankName: authBank.name,
        branchId: authBranch.id,
        branchName: authBranch.branchName,
        branchLocation: authBranch.branchLocation,
        ifscCode: authBranch.ifscCode,
      },
      fdInfo: { ...req.fdInfo },
      paymentInfo: { ...req.paymentInfo },
      additionalInfo: { ...req.additionalInfo },
      initialFinancialRecord: { ...req.initialFinancialRecord },
      status: 'Active',
      createdAt: now,
      createdBy: actor,
      updatedAt: now,
      updatedBy: actor,
    };

    // Atomic in-memory commit
    sessionCustomers.unshift(newCustomer);

    // Initial audit change log
    // NOTE: Maintained in-memory for session tracking; true immutable audit logging requires backend persistence
    sessionChangeHistory.push({
      id: `CHG-${Date.now()}-001`,
      customerId: newId,
      fieldName: 'Customer Registration',
      previousValue: 'None',
      newValue: 'Registered with initial financial record',
      modifiedBy: actor,
      modifiedAt: now,
      reason: req.initialFinancialRecord.notes,
    });

    return newCustomer;
  },

  /**
   * Retrieves customers matching search and filter parameters.
   */
  async getCustomers(filters?: CustomerSearchFilters): Promise<Customer[]> {
    let result = [...sessionCustomers];

    if (!filters) return result;

    if (filters.isSampleMode === false) {
      result = result.filter((c) => !DEMO_CUSTOMER_IDS.has(c.id));
    }

    if (filters.customerStatus && filters.customerStatus !== 'All') {
      result = result.filter((c) => c.status === filters.customerStatus);
    } else {
      // By default, exclude archived customers from the active view
      result = result.filter((c) => c.status !== 'Archived');
    }

    if (filters.visaStatus && filters.visaStatus !== 'All') {
      result = result.filter(
        (c) => c.visaInfo.visaStatus.toLowerCase() === filters.visaStatus!.toLowerCase()
      );
    }

    if (filters.visaType && filters.visaType !== 'All') {
      const vTrack = filters.visaType.toLowerCase().trim();
      result = result.filter(
        (c) =>
          ((c.visaInfo && c.visaInfo.visaType) || (c as any).visaTrack || '')
            .toLowerCase()
            .trim() === vTrack
      );
    }

    if (filters.bankId && filters.bankId !== 'All') {
      const targetBankId = filters.bankId.toLowerCase().trim();
      result = result.filter((c) => {
        const cBankId = (c.bankInfo?.bankId || '').toLowerCase().trim();
        if (cBankId) {
          return cBankId === targetBankId;
        }
        // Defensive fallback only if bankId is completely missing on a legacy record
        const cBankName = (c.bankInfo?.bankName || '').toLowerCase().trim();
        if (targetBankId === 'sbi') return cBankName.includes('state bank') || cBankName.includes('(sbi)');
        if (targetBankId === 'boi') return cBankName.includes('bank of india') && !cBankName.includes('state bank');
        if (targetBankId === 'bob') return cBankName.includes('baroda') || cBankName.includes('(bob)');
        if (targetBankId === 'icici') return cBankName.includes('icici');
        if (targetBankId === 'idbi') return cBankName.includes('idbi');
        if (targetBankId === 'hdfc') return cBankName.includes('hdfc');
        if (targetBankId === 'axis') return cBankName.includes('axis');
        if (targetBankId === 'pnb') return cBankName.includes('punjab');
        if (targetBankId === 'canara') return cBankName.includes('canara');
        if (targetBankId === 'bom') return cBankName.includes('maharashtra');
        return false;
      });
    }

    if (filters.branchId && filters.branchId !== 'All') {
      result = result.filter((c) => c.bankInfo.branchId === filters.branchId);
    }

    if (filters.query && filters.query.trim()) {
      const q = filters.query.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.personalInfo.fullName.toLowerCase().includes(q) ||
          c.contactInfo.personalMobile.includes(q) ||
          c.bankInfo.accountNumber.includes(q) ||
          c.personalInfo.panNumber.toLowerCase().includes(q) ||
          c.personalInfo.passportNumber.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
      );
    }

    return result;
  },

  /**
   * Retrieves customer by ID.
   */
  async getCustomerById(id: string): Promise<Customer | null> {
    const found = sessionCustomers.find((c) => c.id === id);
    return found || null;
  },

  /**
   * Updates permitted customer profile fields.
   * Enforces business rule: Bank, Branch, Location, IFSC, Account Number are RESTRICTED and permanently locked.
   * Compares all old vs new values to generate granular field-by-field audit entries without fabricating identities.
   */
  async updateCustomer(
    id: string,
    updates: CustomerUpdateRequest
  ): Promise<Customer> {
    const cust = sessionCustomers.find((c) => c.id === id);
    if (!cust) {
      throw new Error(`Customer with ID ${id} not found.`);
    }

    if (cust.status === 'Archived') {
      throw new Error('Cannot update an archived customer. Customer must be restored first.');
    }

    const now = new Date().toISOString();
    const actor = 'Demo User';
    const reason = updates.changeReason || 'Profile amendment';

    let changeSeq = 0;
    const recordFieldChange = (fieldName: string, prevVal: any, newVal: any) => {
      if (newVal === undefined) return;
      const prevNorm = prevVal !== undefined && prevVal !== null ? String(prevVal).trim() : '';
      const newNorm = newVal !== null ? String(newVal).trim() : '';
      if (prevNorm !== newNorm) {
        changeSeq += 1;
        sessionChangeHistory.push({
          id: `CHG-${Date.now()}-${changeSeq}`,
          customerId: id,
          fieldName,
          previousValue: prevNorm || 'None',
          newValue: newNorm || 'None',
          modifiedBy: actor,
          modifiedAt: now,
          reason,
        });
      }
    };

    // 1. Personal Information comparison
    if (updates.personalInfo) {
      recordFieldChange('Full Legal Name', cust.personalInfo.fullName, updates.personalInfo.fullName);
      recordFieldChange('Date of Birth', cust.personalInfo.dateOfBirth, updates.personalInfo.dateOfBirth);
      recordFieldChange('Gender', cust.personalInfo.gender, updates.personalInfo.gender);
      recordFieldChange('Nationality', cust.personalInfo.nationality, updates.personalInfo.nationality);
      recordFieldChange('Aadhaar Number', cust.personalInfo.aadhaarNumber, updates.personalInfo.aadhaarNumber);
      recordFieldChange('PAN Number', cust.personalInfo.panNumber, updates.personalInfo.panNumber);
      recordFieldChange('Passport Number', cust.personalInfo.passportNumber, updates.personalInfo.passportNumber);
      recordFieldChange("Father's Name", cust.personalInfo.fatherName, updates.personalInfo.fatherName);
      recordFieldChange("Mother's Name", cust.personalInfo.motherName, updates.personalInfo.motherName);
      cust.personalInfo = { ...cust.personalInfo, ...updates.personalInfo };
    }

    // 2. Contact Information comparison
    if (updates.contactInfo) {
      recordFieldChange('Personal Mobile Number', cust.contactInfo.personalMobile, updates.contactInfo.personalMobile);
      recordFieldChange('Personal Email Address', cust.contactInfo.personalEmail, updates.contactInfo.personalEmail);
      recordFieldChange('Bank Mobile Number', cust.contactInfo.bankMobile, updates.contactInfo.bankMobile);
      recordFieldChange('Bank Email Address', cust.contactInfo.bankEmail, updates.contactInfo.bankEmail);
      recordFieldChange('Residential Address', cust.contactInfo.residentialAddress, updates.contactInfo.residentialAddress);
      cust.contactInfo = { ...cust.contactInfo, ...updates.contactInfo };
    }

    // 3. Visa Information comparison
    if (updates.visaInfo) {
      recordFieldChange('Visa Category', cust.visaInfo.visaType, updates.visaInfo.visaType);
      recordFieldChange('Consultancy Name', cust.visaInfo.consultancyName, updates.visaInfo.consultancyName);
      recordFieldChange('Allocated Counsellor', cust.visaInfo.counsellorName, updates.visaInfo.counsellorName);
      recordFieldChange('Destination Country', cust.visaInfo.destinationCountry, updates.visaInfo.destinationCountry);
      recordFieldChange('University / Institution', cust.visaInfo.university, updates.visaInfo.university);
      recordFieldChange('Visa Status', cust.visaInfo.visaStatus, updates.visaInfo.visaStatus);
      cust.visaInfo = { ...cust.visaInfo, ...updates.visaInfo };
    }

    // 4. Fixed Deposit Information comparison
    if (updates.fdInfo) {
      recordFieldChange('Initial FD Amount', cust.fdInfo?.initialFdAmount, updates.fdInfo.initialFdAmount);
      recordFieldChange('FD Start Date', cust.fdInfo?.fdStartDate, updates.fdInfo.fdStartDate);
      recordFieldChange('FD End Date', cust.fdInfo?.fdEndDate, updates.fdInfo.fdEndDate);
      recordFieldChange('Interest Amount', cust.fdInfo?.interestAmount, updates.fdInfo.interestAmount);
      cust.fdInfo = { ...cust.fdInfo, ...updates.fdInfo };
    }

    // 5. Payment Information comparison
    if (updates.paymentInfo) {
      recordFieldChange('Payment Recipient (Paid To)', cust.paymentInfo?.paidTo, updates.paymentInfo.paidTo);
      recordFieldChange('Next Payment Date', cust.paymentInfo?.nextPaymentDate, updates.paymentInfo.nextPaymentDate);
      cust.paymentInfo = { ...cust.paymentInfo, ...updates.paymentInfo };
    }

    // 6. Additional Notes comparison
    if (updates.additionalInfo) {
      recordFieldChange('Case Notes', cust.additionalInfo?.notes, updates.additionalInfo.notes);
      recordFieldChange('Additional Remarks', cust.additionalInfo?.additionalRemarks, updates.additionalInfo.additionalRemarks);
      cust.additionalInfo = { ...cust.additionalInfo, ...updates.additionalInfo };
    }

    cust.updatedAt = now;
    cust.updatedBy = actor;

    return cust;
  },

  /**
   * Soft archive: Customer disappears from active list but profile and history are preserved.
   */
  async archiveCustomer(id: string, reason?: string): Promise<boolean> {
    const cust = sessionCustomers.find((c) => c.id === id);
    if (!cust) return false;

    const now = new Date().toISOString();
    const actor = 'Demo User';
    cust.status = 'Archived';
    cust.archivedAt = now;
    cust.archiveReason = reason || 'Customer case closed or archived by case officer.';
    cust.updatedAt = now;

    sessionChangeHistory.push({
      id: `CHG-${Date.now()}-ARC`,
      customerId: id,
      fieldName: 'Customer Status',
      previousValue: 'Active',
      newValue: 'Archived',
      modifiedBy: actor,
      modifiedAt: now,
      reason: reason || 'Soft Archive',
    });

    return true;
  },

  /**
   * Restore archived customer.
   */
  async restoreCustomer(id: string): Promise<boolean> {
    const cust = sessionCustomers.find((c) => c.id === id);
    if (!cust) return false;

    const now = new Date().toISOString();
    const actor = 'Demo User';
    cust.status = 'Active';
    cust.archivedAt = undefined;
    cust.archiveReason = undefined;
    cust.updatedAt = now;

    sessionChangeHistory.push({
      id: `CHG-${Date.now()}-RST`,
      customerId: id,
      fieldName: 'Customer Status',
      previousValue: 'Archived',
      newValue: 'Active',
      modifiedBy: actor,
      modifiedAt: now,
      reason: 'Customer restored to active portfolio',
    });

    return true;
  },

  /**
   * Toggle Active / Inactive status.
   */
  async setCustomerStatus(id: string, newStatus: 'Active' | 'Inactive', reason?: string): Promise<boolean> {
    const cust = sessionCustomers.find((c) => c.id === id);
    if (!cust || cust.status === 'Archived') return false;

    const previousStatus = cust.status;
    const now = new Date().toISOString();
    const actor = 'Demo User';
    cust.status = newStatus;
    cust.updatedAt = now;

    sessionChangeHistory.push({
      id: `CHG-${Date.now()}-STS`,
      customerId: id,
      fieldName: 'Customer Operational Status',
      previousValue: previousStatus,
      newValue: newStatus,
      modifiedBy: actor,
      modifiedAt: now,
      reason: reason || `Operational status changed to ${newStatus}`,
    });

    return true;
  },

  /**
   * Dedicated Global Customer Search supporting:
   * 1. Customer Name
   * 2. Personal Mobile Number
   * 3. Bank Account Number
   * 4. PAN Number
   * 5. Passport Number
   */
  async searchCustomers(
    query: string,
    filters?: CustomerSearchFilters
  ): Promise<CustomerSearchResult[]> {
    const q = (query || '').trim().toLowerCase();
    let records = await this.getCustomers(filters);

    if (q) {
      records = records.filter((c) => {
        return (
          c.personalInfo.fullName.toLowerCase().includes(q) ||
          c.contactInfo.personalMobile.includes(q) ||
          c.bankInfo.accountNumber.includes(q) ||
          c.personalInfo.panNumber.toLowerCase().includes(q) ||
          c.personalInfo.passportNumber.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q)
        );
      });
    }

    return records.map((c) => ({
      id: c.id,
      fullName: c.personalInfo.fullName,
      personalMobile: c.contactInfo.personalMobile,
      bankName: c.bankInfo.bankName,
      branchName: c.bankInfo.branchName,
      visaStatus: c.visaInfo.visaStatus,
      currentAmount: c.initialFinancialRecord?.initialAmount || 0,
      customerStatus: c.status,
    }));
  },

  /**
   * Retrieves change history audit log for a specific customer.
   */
  async getCustomerChangeHistory(customerId: string): Promise<CustomerChangeHistory[]> {
    return sessionChangeHistory.filter((h) => h.customerId === customerId);
  },

  /**
   * Helper to seed session for demonstration mode when Sample Data mode is turned on.
   */
  seedSampleCustomer(customer: Customer) {
    if (!sessionCustomers.some((c) => c.id === customer.id)) {
      sessionCustomers.push(customer);
    }
  },
};
