/**
 * Customer Management Module - TypeScript Type Definitions
 * Fully supports Phase 2 Customer Management and future module integrations.
 */

export type CustomerStatus = 'Active' | 'Inactive' | 'Archived';

export type VisaStatus = 'Active' | 'Inactive' | 'Pending';

export type Gender = 'Male' | 'Female' | 'Other';

export type ChequeBookAvailability = 'Yes' | 'No';

export interface PersonalInformation {
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  nationality: string;
  aadhaarNumber: string;
  panNumber: string;
  passportNumber: string;
  fatherName: string;
  motherName: string;
}

export interface ContactInformation {
  personalMobile: string;
  personalEmail: string;
  bankMobile: string;
  bankEmail: string;
  residentialAddress: string;
}

export interface VisaConsultancyInformation {
  visaType: string;
  consultancyName: string;
  counsellorName: string;
  destinationCountry: string;
  university: string;
  visaStatus: VisaStatus;
}

export interface BankAccountInformation {
  bankId: string;
  bankName: string;
  branchId: string;
  branchName: string;
  branchLocation: string;
  ifscCode: string;
  accountNumber: string;
  chequeBook: ChequeBookAvailability;
}

export interface FixedDepositInformation {
  initialFdAmount: number;
  fdStartDate: string;
  fdEndDate: string;
  interestAmount?: number;
}

export interface PaymentInformation {
  paidTo: string;
  nextPaymentDate: string;
}

export interface AdditionalInformation {
  notes: string;
  additionalRemarks: string;
}

export interface InitialFinancialRecord {
  transactionDate: string;
  initialAmount: number;
  notes: string; // Mandatory transaction notes
}

export interface Customer {
  id: string;
  personalInfo: PersonalInformation;
  contactInfo: ContactInformation;
  visaInfo: VisaConsultancyInformation;
  bankInfo: BankAccountInformation;
  fdInfo: FixedDepositInformation;
  paymentInfo: PaymentInformation;
  additionalInfo: AdditionalInformation;
  initialFinancialRecord: InitialFinancialRecord;
  status: CustomerStatus;
  archivedAt?: string;
  archiveReason?: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface CustomerRegistrationRequest {
  personalInfo: PersonalInformation;
  contactInfo: ContactInformation;
  visaInfo: VisaConsultancyInformation;
  bankInfo: BankAccountInformation;
  fdInfo: FixedDepositInformation;
  paymentInfo: PaymentInformation;
  additionalInfo: AdditionalInformation;
  initialFinancialRecord: InitialFinancialRecord;
}

export interface CustomerUpdateRequest {
  personalInfo?: Partial<PersonalInformation>;
  contactInfo?: Partial<ContactInformation>;
  visaInfo?: Partial<VisaConsultancyInformation>;
  fdInfo?: Partial<FixedDepositInformation>;
  paymentInfo?: Partial<PaymentInformation>;
  additionalInfo?: Partial<AdditionalInformation>;
  changeReason?: string;
}

export interface CustomerSearchFilters {
  query?: string;
  customerStatus?: CustomerStatus | 'All';
  visaStatus?: VisaStatus | 'All';
  visaType?: string;
  bankId?: string;
  branchId?: string;
  isSampleMode?: boolean;
}

export interface CustomerSearchResult {
  id: string;
  fullName: string;
  personalMobile: string;
  bankName: string;
  branchName: string;
  visaStatus: VisaStatus;
  currentAmount: number;
  customerStatus: CustomerStatus;
}

export interface CustomerChangeHistory {
  id: string;
  customerId: string;
  fieldName: string;
  previousValue: string;
  newValue: string;
  modifiedBy: string;
  modifiedAt: string;
  reason?: string;
}

export interface BankOption {
  id: string;
  name: string;
  code: string;
}

export interface BranchOption {
  id: string;
  bankId: string;
  name: string;
  location: string;
  ifscCode: string;
}
