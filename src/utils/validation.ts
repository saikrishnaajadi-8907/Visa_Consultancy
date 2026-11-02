/**
 * Customer Module Validation Utilities
 * Validates fields according to confirmed VCMS business rules and formats.
 */

import { CustomerRegistrationRequest } from '../types/customer';

export function normalizeIdentifier(val: string): string {
  return (val || '').trim().toUpperCase();
}

export function normalizeMobile(val: string): string {
  return (val || '').replace(/\D/g, '').slice(-10);
}

export function validatePAN(pan: string): boolean {
  if (!pan) return false;
  const normalized = normalizeIdentifier(pan);
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(normalized);
}

export function validatePassport(passport: string): boolean {
  if (!passport) return false;
  const normalized = normalizeIdentifier(passport);
  // Standard Indian passport format: 1 alphabet followed by 7 or 8 digits
  const passportRegex = /^[A-Z][0-9]{7,8}$/;
  return passportRegex.test(normalized);
}

export function validateIndianMobile(mobile: string): boolean {
  if (!mobile) return false;
  const digits = normalizeMobile(mobile);
  const mobileRegex = /^[6-9]\d{9}$/;
  return mobileRegex.test(digits);
}

export function validateEmail(email: string): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

export function validateAadhaar(aadhaar: string): boolean {
  if (!aadhaar) return true; // Optional field, validate only if provided
  const digits = (aadhaar || '').replace(/\D/g, '');
  return digits.length === 12;
}

/**
 * Normalizes IFSC string to uppercase with trimmed whitespace.
 */
export function normalizeIFSC(ifsc: string): string {
  return (ifsc || '').trim().toUpperCase();
}

/**
 * Validates IFSC format according to standard 11-character format:
 * - 4 letters (Bank code)
 * - 1 zero ('0')
 * - 6 alphanumeric characters (Branch identifier)
 *
 * NOTE: Frontend format validation confirms syntax structure only.
 * Official validity requires bank/RBI verification or client confirmation.
 */
export function validateIFSC(ifsc: string): { isValid: boolean; normalized: string; error?: string } {
  const normalized = normalizeIFSC(ifsc);
  if (!normalized) {
    return { isValid: false, normalized, error: 'IFSC code is required.' };
  }
  if (normalized.length !== 11) {
    return {
      isValid: false,
      normalized,
      error: `IFSC code must be exactly 11 characters (currently ${normalized.length}).`,
    };
  }
  const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
  if (!ifscRegex.test(normalized)) {
    if (!/^[A-Z]{4}/.test(normalized)) {
      return {
        isValid: false,
        normalized,
        error: 'First 4 characters must be alphabetic bank code (e.g., HDFC, SBIN, ICIC).',
      };
    }
    if (normalized.charAt(4) !== '0') {
      return {
        isValid: false,
        normalized,
        error: 'Fifth character must be "0" (zero).',
      };
    }
    return {
      isValid: false,
      normalized,
      error: 'Last 6 characters must be alphanumeric branch code.',
    };
  }
  return { isValid: true, normalized };
}


export interface ValidationErrors {
  [key: string]: string;
}

export function validateCustomerRegistration(
  req: CustomerRegistrationRequest,
  branchValidationResult?: { isValid: boolean; error?: string }
): ValidationErrors {
  const errors: ValidationErrors = {};

  // 1. Personal Information
  if (!req.personalInfo.fullName.trim()) {
    errors['fullName'] = 'Full Legal Name is required.';
  }
  if (!req.personalInfo.dateOfBirth.trim()) {
    errors['dateOfBirth'] = 'Date of Birth is required.';
  }
  if (!req.personalInfo.gender) {
    errors['gender'] = 'Gender selection is required.';
  }
  if (!req.personalInfo.nationality.trim()) {
    errors['nationality'] = 'Nationality is required.';
  }
  if (!req.personalInfo.panNumber.trim()) {
    errors['panNumber'] = 'PAN Number is required.';
  } else if (!validatePAN(req.personalInfo.panNumber)) {
    errors['panNumber'] = 'Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F).';
  }
  if (!req.personalInfo.passportNumber.trim()) {
    errors['passportNumber'] = 'Passport Number is required.';
  } else if (!validatePassport(req.personalInfo.passportNumber)) {
    errors['passportNumber'] = 'Invalid Passport format. Must start with a letter followed by 7-8 digits.';
  }
  if (req.personalInfo.aadhaarNumber.trim() && !validateAadhaar(req.personalInfo.aadhaarNumber)) {
    errors['aadhaarNumber'] = 'Invalid Aadhaar Number. Must be exactly 12 digits.';
  }

  // 2. Contact Information
  if (!req.contactInfo.personalMobile.trim()) {
    errors['personalMobile'] = 'Personal Mobile Number is required.';
  } else if (!validateIndianMobile(req.contactInfo.personalMobile)) {
    errors['personalMobile'] = 'Invalid 10-digit mobile number (e.g. 9876543210).';
  }
  // Personal Email is optional per approved client specification; validate format only if provided
  if (req.contactInfo.personalEmail && req.contactInfo.personalEmail.trim() && !validateEmail(req.contactInfo.personalEmail)) {
    errors['personalEmail'] = 'Invalid personal email format.';
  }
  if (req.contactInfo.bankMobile.trim() && !validateIndianMobile(req.contactInfo.bankMobile)) {
    errors['bankMobile'] = 'Invalid bank mobile number format (must be 10 digits).';
  }
  if (req.contactInfo.bankEmail.trim() && !validateEmail(req.contactInfo.bankEmail)) {
    errors['bankEmail'] = 'Invalid bank email format.';
  }
  if (!req.contactInfo.residentialAddress.trim()) {
    errors['residentialAddress'] = 'Residential Address is required.';
  }

  // 3. Visa and Consultancy Information
  if (!req.visaInfo.visaType.trim()) {
    errors['visaType'] = 'Visa Type selection is required.';
  }
  if (!req.visaInfo.destinationCountry.trim()) {
    errors['destinationCountry'] = 'Destination Country is required.';
  }
  if (!req.visaInfo.consultancyName.trim()) {
    errors['consultancyName'] = 'Consultancy Name is required.';
  }

  // 4. Bank Account Information (Mandatory dropdown selections & master validation)
  if (!req.bankInfo.bankId || !req.bankInfo.bankName) {
    errors['bankName'] = 'Bank selection is mandatory.';
  }
  if (!req.bankInfo.branchId || !req.bankInfo.branchName) {
    errors['branchName'] = 'No active branches configured for this bank. Customer registration requires verified branch master data.';
  } else if (branchValidationResult && !branchValidationResult.isValid) {
    errors['branchName'] = branchValidationResult.error || 'The selected branch is not eligible for customer registration.';
  }

  if (!req.bankInfo.accountNumber.trim()) {
    errors['accountNumber'] = 'Bank Account Number is required.';
  }

  // 5. Initial Financial Record (Mandatory and atomic with registration)
  if (!req.initialFinancialRecord.transactionDate.trim()) {
    errors['transactionDate'] = 'Initial transaction date is required.';
  }
  if (
    req.initialFinancialRecord.initialAmount === undefined ||
    req.initialFinancialRecord.initialAmount === null ||
    isNaN(req.initialFinancialRecord.initialAmount) ||
    String(req.initialFinancialRecord.initialAmount).trim() === ''
  ) {
    errors['initialAmount'] = 'Initial Bank Balance is required.';
  } else if (req.initialFinancialRecord.initialAmount < 0) {
    errors['initialAmount'] = 'Initial Bank Balance cannot be negative.';
  }
  if (!req.initialFinancialRecord.notes || !req.initialFinancialRecord.notes.trim()) {
    errors['initialNotes'] = 'Transaction notes are mandatory for the initial financial record.';
  }

  return errors;
}
