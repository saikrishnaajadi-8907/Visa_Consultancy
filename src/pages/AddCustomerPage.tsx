import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Save,
  CheckCircle,
  AlertCircle,
  Building2,
  CreditCard,
  FileText,
  ShieldCheck,
  User,
  Phone,
  Landmark,
  IndianRupee,
  Calendar,
  Lock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Button } from '../components/common/Button';
import { TextInput } from '../components/forms/TextInput';
import { SelectInput } from '../components/forms/SelectInput';
import { DateInput } from '../components/forms/DateInput';
import { AlertBanner } from '../components/common/AlertBanner';
import { Modal } from '../components/common/Modal';
import { customerService } from '../services/customerService';
import { bankService } from '../services/bankService';
import { financialService } from '../services/financialService';
import {
  validateCustomerRegistration,
  ValidationErrors,
  validatePAN,
  validatePassport,
  validateIndianMobile,
  validateEmail,
  validateAadhaar,
} from '../utils/validation';
import { CustomerRegistrationRequest, Gender, ChequeBookAvailability, VisaStatus } from '../types/customer';

// The seven canonical customer registration sections in strict order
const SECTIONS = [
  { id: 'personal', num: 1, title: 'Personal Info' },
  { id: 'contact', num: 2, title: 'Contact Info' },
  { id: 'visa', num: 3, title: 'Visa & Consultancy' },
  { id: 'bank', num: 4, title: 'Bank Account' },
  { id: 'fd', num: 5, title: 'Fixed Deposit' },
  { id: 'financial', num: 6, title: 'Initial Financial Record' },
  { id: 'additional', num: 7, title: 'Notes & Payment' },
] as const;

type SectionId = typeof SECTIONS[number]['id'];

export const AddCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<SectionId>('personal');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);

  // 1. Personal Information
  const [fullName, setFullName] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<Gender>('Male');
  const [nationality, setNationality] = useState<string>('Indian');
  const [aadhaarNumber, setAadhaarNumber] = useState<string>('');
  const [panNumber, setPanNumber] = useState<string>('');
  const [passportNumber, setPassportNumber] = useState<string>('');
  const [fatherName, setFatherName] = useState<string>('');
  const [motherName, setMotherName] = useState<string>('');

  // 2. Contact Information (Personal & Bank Contact strictly separated)
  const [personalMobile, setPersonalMobile] = useState<string>('');
  const [personalEmail, setPersonalEmail] = useState<string>('');
  const [bankMobile, setBankMobile] = useState<string>('');
  const [bankEmail, setBankEmail] = useState<string>('');
  const [residentialAddress, setResidentialAddress] = useState<string>('');

  // 3. Visa and Consultancy Information
  const [visaType, setVisaType] = useState<string>('Work Visa');
  const [consultancyName, setConsultancyName] = useState<string>('Visa Consultancy Management');
  const [counsellorName, setCounsellorName] = useState<string>('');
  const [destinationCountry, setDestinationCountry] = useState<string>('');
  const [university, setUniversity] = useState<string>('');
  const [visaStatus, setVisaStatus] = useState<VisaStatus>('Pending');

  // 4. Bank Account Information (Mandatory Predefined Dropdowns)
  const [selectedBankId, setSelectedBankId] = useState<string>('');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [chequeBook, setChequeBook] = useState<ChequeBookAvailability>('Yes');

  // 5. Fixed Deposit Information
  const [initialFdAmount, setInitialFdAmount] = useState<string>('0');
  const [fdStartDate, setFdStartDate] = useState<string>('');
  const [fdEndDate, setFdEndDate] = useState<string>('');
  const [interestAmount, setInterestAmount] = useState<string>('');

  // 6. Payment Information
  const [paidTo, setPaidTo] = useState<string>('');
  const [nextPaymentDate, setNextPaymentDate] = useState<string>('');

  // 7. Additional Notes
  const [notes, setNotes] = useState<string>('');
  const [additionalRemarks, setAdditionalRemarks] = useState<string>('');

  // 8. Initial Financial Record (Mandatory Atomic Registration)
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  // Initial amount starts blank; user must explicitly enter verified initial proof-of-funds amount
  const [initialAmount, setInitialAmount] = useState<string>('');
  const [initialNotes, setInitialNotes] = useState<string>('');

  // Current active section index (0-based: 0 to 6)
  const currentSectionIndex = useMemo(() => {
    const idx = SECTIONS.findIndex((s) => s.id === activeTab);
    return idx >= 0 ? idx : 0;
  }, [activeTab]);

  // Bank & Dependent Branch lookup
  const bankOptions = useMemo(() => customerService.getBankOptions(), []);
  const branchOptions = useMemo(() => {
    return customerService.getBranchesForBank(selectedBankId);
  }, [selectedBankId]);

  const selectedBank = bankOptions.find((b) => b.id === selectedBankId);
  const selectedBranch = branchOptions.find((b) => b.id === selectedBranchId);

  const handleBankChange = (newBankId: string) => {
    setSelectedBankId(newBankId);
    clearError('bankName');
    clearError('branchName');
    const newBranches = customerService.getBranchesForBank(newBankId);
    if (newBranches.length > 0) {
      setSelectedBranchId(newBranches[0].id);
    } else {
      setSelectedBranchId('');
    }
  };

  // Helper to clear a field's validation error when updated
  const clearError = (fieldKey: string) => {
    setValidationErrors((prev) => {
      if (!prev[fieldKey]) return prev;
      const copy = { ...prev };
      delete copy[fieldKey];
      return copy;
    });
    setGeneralError(null);
  };

  // Maps section ID to its contained input field names
  const getSectionFields = (sectionId: string): string[] => {
    switch (sectionId) {
      case 'personal':
        return ['fullName', 'dateOfBirth', 'gender', 'nationality', 'panNumber', 'passportNumber', 'aadhaarNumber', 'fatherName', 'motherName'];
      case 'contact':
        return ['personalMobile', 'personalEmail', 'bankMobile', 'bankEmail', 'residentialAddress'];
      case 'visa':
        return ['visaType', 'destinationCountry', 'consultancyName', 'counsellorName', 'university', 'visaStatus'];
      case 'bank':
        return ['bankName', 'branchName', 'accountNumber', 'chequeBook'];
      case 'fd':
        return ['initialFdAmount', 'interestAmount', 'fdStartDate', 'fdEndDate'];
      case 'financial':
        return ['transactionDate', 'initialAmount', 'initialNotes'];
      case 'additional':
        return ['paidTo', 'nextPaymentDate', 'notes', 'additionalRemarks'];
      default:
        return [];
    }
  };

  // Validates a specific section according to confirmed business rules
  const validateSection = (sectionId: string): ValidationErrors => {
    const errors: ValidationErrors = {};

    if (sectionId === 'personal') {
      if (!fullName.trim()) {
        errors['fullName'] = 'Full Legal Name is required.';
      }
      if (!dateOfBirth.trim()) {
        errors['dateOfBirth'] = 'Date of Birth is required.';
      }
      if (!gender) {
        errors['gender'] = 'Gender selection is required.';
      }
      if (!nationality.trim()) {
        errors['nationality'] = 'Nationality is required.';
      }
      if (!panNumber.trim()) {
        errors['panNumber'] = 'PAN Number is required.';
      } else if (!validatePAN(panNumber)) {
        errors['panNumber'] = 'Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F).';
      } else {
        const dup = customerService.checkDuplicates(panNumber, '', '');
        if (dup.hasDuplicate && dup.field === 'pan') {
          errors['panNumber'] = dup.message || 'A customer with this PAN number already exists.';
        }
      }
      if (!passportNumber.trim()) {
        errors['passportNumber'] = 'Passport Number is required.';
      } else if (!validatePassport(passportNumber)) {
        errors['passportNumber'] = 'Invalid Passport format. Must start with a letter followed by 7-8 digits.';
      } else {
        const dup = customerService.checkDuplicates('', passportNumber, '');
        if (dup.hasDuplicate && dup.field === 'passport') {
          errors['passportNumber'] = dup.message || 'A customer with this Passport number already exists.';
        }
      }
      if (aadhaarNumber.trim() && !validateAadhaar(aadhaarNumber)) {
        errors['aadhaarNumber'] = 'Invalid Aadhaar Number. Must be exactly 12 digits.';
      }
    } else if (sectionId === 'contact') {
      if (!personalMobile.trim()) {
        errors['personalMobile'] = 'Personal Mobile Number is required.';
      } else if (!validateIndianMobile(personalMobile)) {
        errors['personalMobile'] = 'Invalid 10-digit mobile number (e.g. 9876543210).';
      } else {
        const dup = customerService.checkDuplicates('', '', personalMobile);
        if (dup.hasDuplicate && dup.field === 'mobile') {
          errors['personalMobile'] = dup.message || 'A customer with this Mobile number already exists.';
        }
      }
      if (personalEmail.trim() && !validateEmail(personalEmail)) {
        errors['personalEmail'] = 'Invalid personal email format.';
      }
      if (bankMobile.trim() && !validateIndianMobile(bankMobile)) {
        errors['bankMobile'] = 'Invalid bank mobile number format (must be 10 digits).';
      }
      if (bankEmail.trim() && !validateEmail(bankEmail)) {
        errors['bankEmail'] = 'Invalid bank email format.';
      }
      if (!residentialAddress.trim()) {
        errors['residentialAddress'] = 'Residential Address is required.';
      }
    } else if (sectionId === 'visa') {
      if (!visaType.trim()) {
        errors['visaType'] = 'Visa Type selection is required.';
      }
      if (!destinationCountry.trim()) {
        errors['destinationCountry'] = 'Destination Country is required.';
      }
      if (!consultancyName.trim()) {
        errors['consultancyName'] = 'Consultancy Name is required.';
      }
      if (!visaStatus) {
        errors['visaStatus'] = 'Visa Status selection is required.';
      }
    } else if (sectionId === 'bank') {
      if (!selectedBankId || !selectedBank?.name) {
        errors['bankName'] = 'Bank selection is mandatory.';
      }
      if (!selectedBranchId || !selectedBranch?.name) {
        errors['branchName'] = 'No active branches configured for this bank. Customer registration requires verified branch master data.';
      } else if (selectedBankId && selectedBranchId) {
        const branchValidation = bankService.validateBranchForRegistration(
          selectedBankId,
          selectedBranchId,
          {
            branchName: selectedBranch?.name,
            branchLocation: selectedBranch?.location,
            ifscCode: selectedBranch?.ifscCode,
          }
        );
        if (branchValidation && !branchValidation.isValid) {
          errors['branchName'] = branchValidation.error || 'The selected branch is not eligible for customer registration.';
        }
      }
      if (!accountNumber.trim()) {
        errors['accountNumber'] = 'Bank Account Number is required.';
      }
    } else if (sectionId === 'fd') {
      if (initialFdAmount.trim() !== '' && (isNaN(Number(initialFdAmount)) || Number(initialFdAmount) < 0)) {
        errors['initialFdAmount'] = 'Initial FD Amount cannot be negative.';
      }
    } else if (sectionId === 'financial') {
      if (!transactionDate.trim()) {
        errors['transactionDate'] = 'Initial transaction date is required.';
      }
      if (
        initialAmount === undefined ||
        initialAmount === null ||
        initialAmount.trim() === '' ||
        isNaN(Number(initialAmount))
      ) {
        errors['initialAmount'] = 'Initial Bank Balance is required.';
      } else if (Number(initialAmount) < 0) {
        errors['initialAmount'] = 'Initial Bank Balance cannot be negative.';
      }
      if (!initialNotes || !initialNotes.trim()) {
        errors['initialNotes'] = 'Transaction notes are mandatory for the initial financial record.';
      }
    }

    return errors;
  };

  // Helper to scroll and focus the first invalid field
  const focusFirstError = (errors: ValidationErrors) => {
    const errorKeys = Object.keys(errors);
    if (errorKeys.length === 0) return;
    const firstKey = errorKeys[0];

    setTimeout(() => {
      const el =
        document.getElementById(firstKey) ||
        document.querySelector(`[name="${firstKey}"]`) ||
        document.querySelector('.border-rose-300, .border-rose-500, textarea.border-rose-300, [aria-invalid="true"]');

      if (el) {
        (el as HTMLElement).focus?.();
        (el as HTMLElement).scrollIntoView?.({ behavior: 'smooth', block: 'center' });
      }
    }, 60);
  };

  // Navigation: Next (Sections 1–6)
  const handleNext = () => {
    setGeneralError(null);
    const currentErrors = validateSection(activeTab);
    if (Object.keys(currentErrors).length > 0) {
      setValidationErrors((prev) => ({ ...prev, ...currentErrors }));
      setGeneralError('Please resolve the highlighted validation errors before proceeding to the next section.');
      focusFirstError(currentErrors);
      return;
    }

    // Clear any previous errors on the current section
    setValidationErrors((prev) => {
      const nextErrors = { ...prev };
      getSectionFields(activeTab).forEach((key) => delete nextErrors[key]);
      return nextErrors;
    });

    if (currentSectionIndex < SECTIONS.length - 1) {
      const nextSection = SECTIONS[currentSectionIndex + 1];
      setActiveTab(nextSection.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Navigation: Previous (Sections 2–7)
  const handlePrevious = () => {
    setGeneralError(null);
    if (currentSectionIndex > 0) {
      const prevSection = SECTIONS[currentSectionIndex - 1];
      setActiveTab(prevSection.id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Tab click navigation
  const handleTabClick = (targetTabId: SectionId) => {
    const targetIndex = SECTIONS.findIndex((s) => s.id === targetTabId);
    if (targetIndex === -1 || targetIndex === currentSectionIndex) return;

    if (targetIndex < currentSectionIndex) {
      // Backward navigation is always allowed freely without validation
      setGeneralError(null);
      setActiveTab(targetTabId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Moving forward: validate current section first
      const currentErrors = validateSection(activeTab);
      if (Object.keys(currentErrors).length > 0) {
        setValidationErrors((prev) => ({ ...prev, ...currentErrors }));
        setGeneralError('Please resolve the required fields in the current section before proceeding.');
        focusFirstError(currentErrors);
        return;
      }

      // Also validate intermediate sections to prevent bypassing validation
      for (let i = currentSectionIndex; i < targetIndex; i++) {
        const stepErrors = validateSection(SECTIONS[i].id);
        if (Object.keys(stepErrors).length > 0) {
          setActiveTab(SECTIONS[i].id);
          setValidationErrors((prev) => ({ ...prev, ...stepErrors }));
          setGeneralError(`Please complete Section ${SECTIONS[i].num}: ${SECTIONS[i].title} before proceeding.`);
          focusFirstError(stepErrors);
          return;
        }
      }

      setGeneralError(null);
      setActiveTab(targetTabId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Detect whether any unsaved information has been entered by the user
  const hasEnteredInformation = useMemo(() => {
    return Boolean(
      fullName.trim() ||
      dateOfBirth.trim() ||
      gender !== 'Male' ||
      nationality !== 'Indian' ||
      aadhaarNumber.trim() ||
      panNumber.trim() ||
      passportNumber.trim() ||
      fatherName.trim() ||
      motherName.trim() ||
      personalMobile.trim() ||
      personalEmail.trim() ||
      bankMobile.trim() ||
      bankEmail.trim() ||
      residentialAddress.trim() ||
      visaType !== 'Work Visa' ||
      consultancyName !== 'Visa Consultancy Management' ||
      counsellorName.trim() ||
      destinationCountry.trim() ||
      university.trim() ||
      visaStatus !== 'Pending' ||
      selectedBankId ||
      selectedBranchId ||
      accountNumber.trim() ||
      (initialFdAmount && initialFdAmount !== '0') ||
      fdStartDate.trim() ||
      fdEndDate.trim() ||
      interestAmount.trim() ||
      paidTo.trim() ||
      nextPaymentDate.trim() ||
      notes.trim() ||
      additionalRemarks.trim() ||
      initialAmount.trim() ||
      initialNotes.trim()
    );
  }, [
    fullName, dateOfBirth, gender, nationality, aadhaarNumber, panNumber, passportNumber,
    fatherName, motherName, personalMobile, personalEmail, bankMobile, bankEmail,
    residentialAddress, visaType, consultancyName, counsellorName, destinationCountry,
    university, visaStatus, selectedBankId, selectedBranchId, accountNumber, initialFdAmount,
    fdStartDate, fdEndDate, interestAmount, paidTo, nextPaymentDate, notes, additionalRemarks,
    initialAmount, initialNotes,
  ]);

  // Cancel Handler: Show dialog if dirty, or navigate immediately if clean
  const handleCancel = () => {
    if (!hasEnteredInformation) {
      navigate('/customers');
    } else {
      setShowCancelModal(true);
    }
  };

  // Final Registration Submission (Section 7 only)
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return; // Prevent duplicate registration from repeated clicks

    setGeneralError(null);
    setValidationErrors({});

    // Comprehensive validation across all seven sections
    const allErrors: ValidationErrors = {};
    for (const section of SECTIONS) {
      const sectionErrors = validateSection(section.id);
      Object.assign(allErrors, sectionErrors);
    }

    if (Object.keys(allErrors).length > 0) {
      setValidationErrors(allErrors);
      setGeneralError('Please resolve the highlighted validation errors across the registration form.');

      // Automatically switch to the first section that contains an error
      for (const section of SECTIONS) {
        const sErrors = validateSection(section.id);
        if (Object.keys(sErrors).length > 0) {
          setActiveTab(section.id);
          focusFirstError(sErrors);
          break;
        }
      }
      return;
    }

    const registrationRequest: CustomerRegistrationRequest = {
      personalInfo: {
        fullName: fullName.trim(),
        dateOfBirth: dateOfBirth.trim(),
        gender,
        nationality: nationality.trim(),
        aadhaarNumber: aadhaarNumber.trim(),
        panNumber: panNumber.trim().toUpperCase(),
        passportNumber: passportNumber.trim().toUpperCase(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
      },
      contactInfo: {
        personalMobile: personalMobile.trim(),
        personalEmail: personalEmail.trim(),
        bankMobile: bankMobile.trim(),
        bankEmail: bankEmail.trim(),
        residentialAddress: residentialAddress.trim(),
      },
      visaInfo: {
        visaType,
        consultancyName: consultancyName.trim(),
        counsellorName: counsellorName.trim(),
        destinationCountry: destinationCountry.trim(),
        university: university.trim(),
        visaStatus,
      },
      bankInfo: {
        bankId: selectedBankId,
        bankName: selectedBank?.name || '',
        branchId: selectedBranch?.id || '',
        branchName: selectedBranch?.name || '',
        branchLocation: selectedBranch?.location || '',
        ifscCode: selectedBranch?.ifscCode || '',
        accountNumber: accountNumber.trim(),
        chequeBook,
      },
      fdInfo: {
        initialFdAmount: parseFloat(initialFdAmount) || 0,
        fdStartDate: fdStartDate.trim(),
        fdEndDate: fdEndDate.trim(),
        interestAmount: interestAmount ? parseFloat(interestAmount) : undefined,
      },
      paymentInfo: {
        paidTo: paidTo.trim(),
        nextPaymentDate: nextPaymentDate.trim(),
      },
      additionalInfo: {
        notes: notes.trim(),
        additionalRemarks: additionalRemarks.trim(),
      },
      initialFinancialRecord: {
        transactionDate: transactionDate.trim(),
        initialAmount: initialAmount.trim() === '' ? (NaN as any) : parseFloat(initialAmount),
        notes: initialNotes.trim(),
      },
    };

    setIsSubmitting(true);
    try {
      const createdCustomer = await customerService.createCustomerWithInitialRecord(registrationRequest);
      // Synchronize in-memory financial session ledger
      financialService.seedInitialCustomerFinancialRecord(createdCustomer);

      setSuccessMessage(`Customer "${createdCustomer.personalInfo.fullName}" registered successfully with ID: ${createdCustomer.id}`);
      setTimeout(() => {
        navigate(`/customers/${createdCustomer.id}`);
      }, 1200);
    } catch (err: any) {
      setGeneralError(err.message || 'Failed to complete registration.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Customers', href: '/customers' },
              { label: 'New Registration' },
            ]}
          />
        }
        title="Register New Customer"
        subtitle="Register a client with identity, bank and financial details."
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
            >
              Cancel
            </Button>
            {currentSectionIndex < 6 ? (
              <Button
                type="button"
                variant="primary"
                onClick={handleNext}
                icon={<ChevronRight className="w-4 h-4" />}
                iconPosition="right"
              >
                Next
              </Button>
            ) : (
              <Button
                type="button"
                variant="success"
                icon={<Save className="w-4 h-4" />}
                isLoading={isSubmitting}
                onClick={handleSubmit}
              >
                Complete Registration
              </Button>
            )}
          </div>
        }
      />

      {/* Global alert messages */}
      {generalError && (
        <AlertBanner
          type="warning"
          title="Registration Action Blocked"
          message={generalError}
        />
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage} Redirecting to Customer Profile...</span>
        </div>
      )}

      {/* Main Registration Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        {/* Step Progress Header */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
              Section {currentSectionIndex + 1} of 7
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {SECTIONS[currentSectionIndex].title}
            </span>
          </div>

          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <span className="font-medium">Step {currentSectionIndex + 1} of 7</span>
            <div className="w-28 sm:w-36 bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentSectionIndex + 1) / 7) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Multi-step Section Navigation Tabs */}
        <div className="px-6 border-b border-slate-200/80 bg-white">
          <nav
            className="flex space-x-2 sm:space-x-3 overflow-x-auto scrollbar-none py-2.5"
            aria-label="Customer Registration Sections"
          >
            {SECTIONS.map((section, idx) => {
              const isActive = section.id === activeTab;
              const isPast = idx < currentSectionIndex;
              const isCompleted = isPast && Object.keys(validateSection(section.id)).length === 0;

              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => handleTabClick(section.id)}
                  className={`group flex items-center gap-2 py-2 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                    isActive
                      ? 'bg-blue-50/80 border-blue-600 text-blue-700 font-semibold shadow-xs'
                      : isCompleted
                      ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'bg-white border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-3.5 h-3.5" /> : section.num}
                  </span>
                  <span>{section.title}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* SECTION 1: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Personal Information</h3>
                <p className="text-xs text-slate-500">Legal name, identification numbers, and family details</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextInput
                  id="fullName"
                  name="fullName"
                  label="Full Legal Name"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={fullName}
                  error={validationErrors['fullName']}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    clearError('fullName');
                  }}
                />
                <DateInput
                  id="dateOfBirth"
                  name="dateOfBirth"
                  label="Date of Birth"
                  required
                  placeholder="DD-MM-YYYY"
                  value={dateOfBirth}
                  error={validationErrors['dateOfBirth']}
                  onChange={(e) => {
                    setDateOfBirth(e.target.value);
                    clearError('dateOfBirth');
                  }}
                />
                <SelectInput
                  id="gender"
                  name="gender"
                  label="Gender"
                  required
                  value={gender}
                  onChange={(e) => {
                    setGender(e.target.value as Gender);
                    clearError('gender');
                  }}
                  options={['Male', 'Female', 'Other']}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextInput
                  id="nationality"
                  name="nationality"
                  label="Nationality"
                  required
                  placeholder="e.g. Indian"
                  value={nationality}
                  error={validationErrors['nationality']}
                  onChange={(e) => {
                    setNationality(e.target.value);
                    clearError('nationality');
                  }}
                />
                <TextInput
                  id="panNumber"
                  name="panNumber"
                  label="PAN Number"
                  required
                  placeholder="e.g. ABCDE1234F"
                  value={panNumber}
                  error={validationErrors['panNumber']}
                  onChange={(e) => {
                    setPanNumber(e.target.value.toUpperCase());
                    clearError('panNumber');
                  }}
                  helperText="10-digit alphanumeric permanent account number"
                />
                <TextInput
                  id="passportNumber"
                  name="passportNumber"
                  label="Passport Number"
                  required
                  placeholder="e.g. Z9821034"
                  value={passportNumber}
                  error={validationErrors['passportNumber']}
                  onChange={(e) => {
                    setPassportNumber(e.target.value.toUpperCase());
                    clearError('passportNumber');
                  }}
                  helperText="Primary travel document identifier"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextInput
                  id="aadhaarNumber"
                  name="aadhaarNumber"
                  label="Aadhaar Number (12 Digits)"
                  optional
                  placeholder="e.g. 5432 9876 1234"
                  value={aadhaarNumber}
                  error={validationErrors['aadhaarNumber']}
                  onChange={(e) => {
                    setAadhaarNumber(e.target.value);
                    clearError('aadhaarNumber');
                  }}
                  helperText="Masked in standard profile displays"
                />
                <TextInput
                  id="fatherName"
                  name="fatherName"
                  label="Father's Name"
                  optional
                  placeholder="e.g. Kailash Chandra"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                />
                <TextInput
                  id="motherName"
                  name="motherName"
                  label="Mother's Name"
                  optional
                  placeholder="e.g. Shanti Devi"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* SECTION 2: CONTACT INFORMATION */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Contact Information</h3>
                <p className="text-xs text-slate-500">
                  Personal communications and bank-specific registered contacts are maintained separately.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Privacy Standard:</strong> Personal contact info and bank-dedicated contact info are recorded separately. VCMS never solicits or stores banking credentials, passwords, PINs, or OTPs.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextInput
                  id="personalMobile"
                  name="personalMobile"
                  label="Personal Mobile Number"
                  required
                  placeholder="e.g. 9876543210"
                  value={personalMobile}
                  error={validationErrors['personalMobile']}
                  onChange={(e) => {
                    setPersonalMobile(e.target.value);
                    clearError('personalMobile');
                  }}
                  helperText="Primary applicant mobile for consultancy follow-ups"
                />
                <TextInput
                  id="personalEmail"
                  name="personalEmail"
                  label="Personal Email Address"
                  optional
                  type="email"
                  placeholder="client@example.com"
                  value={personalEmail}
                  error={validationErrors['personalEmail']}
                  onChange={(e) => {
                    setPersonalEmail(e.target.value);
                    clearError('personalEmail');
                  }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-slate-100">
                <TextInput
                  id="bankMobile"
                  name="bankMobile"
                  label="Bank-Specific Mobile Number"
                  optional
                  placeholder="e.g. 9811223344"
                  value={bankMobile}
                  error={validationErrors['bankMobile']}
                  onChange={(e) => {
                    setBankMobile(e.target.value);
                    clearError('bankMobile');
                  }}
                  helperText="Mobile number linked specifically with applicant bank account"
                />
                <TextInput
                  id="bankEmail"
                  name="bankEmail"
                  label="Bank-Specific Email Address"
                  optional
                  type="email"
                  placeholder="bankalerts@example.com"
                  value={bankEmail}
                  error={validationErrors['bankEmail']}
                  onChange={(e) => {
                    setBankEmail(e.target.value);
                    clearError('bankEmail');
                  }}
                  helperText="Official email on bank file for statements"
                />
              </div>

              <div>
                <TextInput
                  id="residentialAddress"
                  name="residentialAddress"
                  label="Residential Address"
                  required
                  placeholder="e.g. Flat 402, Jubilee Heights, Road No 36, Hyderabad - 500033"
                  value={residentialAddress}
                  error={validationErrors['residentialAddress']}
                  onChange={(e) => {
                    setResidentialAddress(e.target.value);
                    clearError('residentialAddress');
                  }}
                />
              </div>
            </div>
          )}

          {/* SECTION 3: VISA & CONSULTANCY */}
          {activeTab === 'visa' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Visa & Consultancy Information</h3>
                <p className="text-xs text-slate-500">Consular category, assigned counsellor, and destination country</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <SelectInput
                  id="visaType"
                  name="visaType"
                  label="Visa Type"
                  required
                  value={visaType}
                  onChange={(e) => {
                    setVisaType(e.target.value);
                    clearError('visaType');
                  }}
                  options={['Work Visa', 'Student Visa', 'Business Visa', 'PR Visa', 'Tourist Visa']}
                />
                <TextInput
                  id="destinationCountry"
                  name="destinationCountry"
                  label="Destination Country"
                  required
                  placeholder="e.g. United Kingdom"
                  value={destinationCountry}
                  error={validationErrors['destinationCountry']}
                  onChange={(e) => {
                    setDestinationCountry(e.target.value);
                    clearError('destinationCountry');
                  }}
                />
                <SelectInput
                  id="visaStatus"
                  name="visaStatus"
                  label="Visa Status (Independent of Customer Status)"
                  required
                  value={visaStatus}
                  onChange={(e) => {
                    setVisaStatus(e.target.value as VisaStatus);
                    clearError('visaStatus');
                  }}
                  options={['Pending', 'Active', 'Inactive']}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextInput
                  id="consultancyName"
                  name="consultancyName"
                  label="Consultancy Name"
                  required
                  value={consultancyName}
                  onChange={(e) => {
                    setConsultancyName(e.target.value);
                    clearError('consultancyName');
                  }}
                />
                <TextInput
                  id="counsellorName"
                  name="counsellorName"
                  label="Allocated Counsellor"
                  placeholder="e.g. S. Mehta (Senior Case Officer)"
                  value={counsellorName}
                  onChange={(e) => setCounsellorName(e.target.value)}
                />
                <TextInput
                  id="university"
                  name="university"
                  label="University / Institution (If applicable)"
                  optional
                  placeholder="e.g. University of Manchester"
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* SECTION 4: BANK ACCOUNT INFORMATION */}
          {activeTab === 'bank' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Bank Account Information</h3>
                <p className="text-xs text-slate-500">
                  Predefined master banks and branch allocations. Allocation becomes permanent upon registration.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Confirmed Business Rule:</strong> Each customer is allocated exactly one bank and one branch from the approved master list. Bank and branch allocations become permanent after registration and cannot be modified via normal customer profile edits.
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectInput
                  id="selectedBankId"
                  name="selectedBankId"
                  label="Select Approved Bank"
                  required
                  value={selectedBankId}
                  onChange={(e) => handleBankChange(e.target.value)}
                  options={[
                    { value: '', label: 'Select Approved Bank' },
                    ...bankOptions.map((b) => ({ value: b.id, label: b.name })),
                  ]}
                  error={validationErrors['bankName']}
                />

                <SelectInput
                  id="selectedBranchId"
                  name="selectedBranchId"
                  label="Select Branch (Dependent on Bank)"
                  required
                  value={selectedBranchId}
                  disabled={!selectedBankId || branchOptions.length === 0}
                  onChange={(e) => {
                    setSelectedBranchId(e.target.value);
                    clearError('branchName');
                  }}
                  error={validationErrors['branchName']}
                  options={
                    !selectedBankId
                      ? [{ value: '', label: 'Select Bank First' }]
                      : branchOptions.length > 0
                      ? [
                          { value: '', label: 'Select Active Branch' },
                          ...branchOptions.map((br) => ({ value: br.id, label: `${br.name} (${br.location})` })),
                        ]
                      : [{ value: '', label: 'No active branches configured for this bank' }]
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div>
                  <span className="text-xs text-slate-400 font-medium">Branch Location</span>
                  <div className="text-xs font-semibold text-slate-800 mt-1">
                    {selectedBranch?.location || (selectedBankId ? 'No active branches configured for this bank' : 'Select Bank')}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">IFSC Code</span>
                  <div className="text-xs font-mono font-semibold text-blue-700 mt-1">
                    {selectedBranch?.ifscCode || '—'}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-slate-400 font-medium">Allocation Status</span>
                  <div className="text-xs font-semibold text-slate-600 mt-1">
                    {selectedBankId && branchOptions.length === 0
                      ? 'Registration Blocked (No Active Branch)'
                      : selectedBranch
                      ? 'Permanent Allocation on Submit'
                      : 'Pending Selection'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextInput
                  id="accountNumber"
                  name="accountNumber"
                  label="Customer Bank Account Number"
                  required
                  placeholder="e.g. 10293847561"
                  value={accountNumber}
                  error={validationErrors['accountNumber']}
                  onChange={(e) => {
                    setAccountNumber(e.target.value);
                    clearError('accountNumber');
                  }}
                  helperText="Masked in customer directory listings"
                />
                <SelectInput
                  id="chequeBook"
                  name="chequeBook"
                  label="Cheque Book Availability"
                  value={chequeBook}
                  onChange={(e) => setChequeBook(e.target.value as ChequeBookAvailability)}
                  options={['Yes', 'No']}
                />
              </div>
            </div>
          )}

          {/* SECTION 5: FIXED DEPOSIT INFORMATION */}
          {activeTab === 'fd' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Fixed Deposit (FD) Information</h3>
                <p className="text-xs text-slate-500">
                  Customer collateral fixed deposit schedule.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextInput
                  id="initialFdAmount"
                  name="initialFdAmount"
                  label="Initial FD Amount (INR)"
                  type="number"
                  placeholder="e.g. 500000"
                  value={initialFdAmount}
                  error={validationErrors['initialFdAmount']}
                  onChange={(e) => {
                    setInitialFdAmount(e.target.value);
                    clearError('initialFdAmount');
                  }}
                  helperText="Single primary FD record in agreed scope"
                />
                <TextInput
                  id="interestAmount"
                  name="interestAmount"
                  label="Interest Amount"
                  optional
                  placeholder="e.g. 35000"
                  value={interestAmount}
                  onChange={(e) => setInterestAmount(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DateInput
                  id="fdStartDate"
                  name="fdStartDate"
                  label="FD Start Date"
                  optional
                  placeholder="DD-MM-YYYY"
                  value={fdStartDate}
                  onChange={(e) => setFdStartDate(e.target.value)}
                />
                <DateInput
                  id="fdEndDate"
                  name="fdEndDate"
                  label="FD Maturity / End Date"
                  optional
                  placeholder="DD-MM-YYYY"
                  value={fdEndDate}
                  onChange={(e) => setFdEndDate(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* SECTION 6: INITIAL FINANCIAL RECORD (CRITICAL BUSINESS REQUIREMENT) */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Initial Bank Balance & Financial Record</h3>
                <p className="text-xs text-slate-500">
                  Opening bank account deposit captured concurrently during registration.
                </p>
              </div>

              <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2.5">
                <Landmark className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Registration Policy:</strong> Customer registration and initial bank deposit record creation are submitted concurrently. Enter the actual initial bank deposit amount (Fixed Deposit is captured separately in Section 5).
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <DateInput
                  id="transactionDate"
                  name="transactionDate"
                  label="Transaction / Snapshot Date"
                  required
                  placeholder="YYYY-MM-DD"
                  value={transactionDate}
                  error={validationErrors['transactionDate']}
                  onChange={(e) => {
                    setTransactionDate(e.target.value);
                    clearError('transactionDate');
                  }}
                />
                <TextInput
                  id="initialAmount"
                  name="initialAmount"
                  label="Initial Bank Balance (INR)"
                  required
                  type="number"
                  placeholder="Enter initial bank deposit amount (e.g. 10000)"
                  value={initialAmount}
                  error={validationErrors['initialAmount']}
                  onChange={(e) => {
                    setInitialAmount(e.target.value);
                    clearError('initialAmount');
                  }}
                  helperText="Opening verified balance for the linked bank account (separate from Fixed Deposit)"
                />
              </div>

              {/* Combined Amount Overview Preview */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block">Initial Bank Balance</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">
                    {initialAmount && !isNaN(Number(initialAmount))
                      ? `₹ ${Number(initialAmount).toLocaleString('en-IN')}`
                      : '₹ 0'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Fixed Deposit (Section 5)</span>
                  <span className="text-sm font-bold text-purple-700 tabular-nums">
                    {initialFdAmount && !isNaN(Number(initialFdAmount))
                      ? `₹ ${Number(initialFdAmount).toLocaleString('en-IN')}`
                      : '₹ 0'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block">Combined Amount</span>
                  <span className="text-sm font-bold text-blue-700 tabular-nums">
                    {`₹ ${(
                      (parseFloat(initialAmount) || 0) +
                      (parseFloat(initialFdAmount) || 0)
                    ).toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>

              <div>
                <label htmlFor="initialNotes" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Initial Transaction Notes <span className="text-rose-500">*</span>
                </label>
                <textarea
                  id="initialNotes"
                  name="initialNotes"
                  rows={3}
                  required
                  value={initialNotes}
                  onChange={(e) => {
                    setInitialNotes(e.target.value);
                    clearError('initialNotes');
                  }}
                  placeholder="Mandatory notes explaining verification source, bank statement reference, or officer endorsement..."
                  className={`w-full rounded-lg border bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                    validationErrors['initialNotes'] ? 'border-rose-300' : 'border-slate-200'
                  }`}
                />
                {validationErrors['initialNotes'] && (
                  <p className="text-xs text-rose-600 mt-1">{validationErrors['initialNotes']}</p>
                )}
              </div>
            </div>
          )}

          {/* SECTION 7: ADDITIONAL INFORMATION & PAYMENT */}
          {activeTab === 'additional' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-sm font-semibold text-slate-900">Payment & Additional Notes</h3>
                <p className="text-xs text-slate-500">General case remarks and preliminary payment schedule fields</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextInput
                  id="paidTo"
                  name="paidTo"
                  label="Paid To"
                  optional
                  placeholder="e.g. Consultancy Account / Officer"
                  value={paidTo}
                  onChange={(e) => setPaidTo(e.target.value)}
                />
                <DateInput
                  id="nextPaymentDate"
                  name="nextPaymentDate"
                  label="Next Payment Date"
                  optional
                  placeholder="DD-MM-YYYY"
                  value={nextPaymentDate}
                  onChange={(e) => setNextPaymentDate(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="notes" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Internal Case Notes
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={3}
                  placeholder="Interview notes, documentation checklist observations, or special requirements..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="additionalRemarks" className="block text-xs font-medium text-slate-700 mb-1.5">
                  Additional Remarks
                </label>
                <textarea
                  id="additionalRemarks"
                  name="additionalRemarks"
                  rows={2}
                  placeholder="Any operational remarks or consular notes..."
                  value={additionalRemarks}
                  onChange={(e) => setAdditionalRemarks(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Form Actions Footer */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={currentSectionIndex === 0}
                onClick={handlePrevious}
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Previous
              </Button>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Section {currentSectionIndex + 1} of 7: <span className="text-slate-800 font-semibold">{SECTIONS[currentSectionIndex].title}</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
              >
                Cancel
              </Button>

              {currentSectionIndex < 6 ? (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleNext}
                  icon={<ChevronRight className="w-4 h-4" />}
                  iconPosition="right"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="success"
                  icon={<Save className="w-4 h-4" />}
                  isLoading={isSubmitting}
                  onClick={handleSubmit}
                >
                  Complete Registration
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Registration"
        maxWidth="sm"
        footer={
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCancelModal(false)}
            >
              Continue Editing
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={() => {
                setShowCancelModal(false);
                navigate('/customers');
              }}
            >
              Discard & Exit
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3 py-1">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-slate-600">
            You have unsaved customer information. Are you sure you want to cancel registration?
          </p>
        </div>
      </Modal>
    </div>
  );
};
