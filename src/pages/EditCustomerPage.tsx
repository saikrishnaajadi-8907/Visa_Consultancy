import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  Save,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Lock,
  Building2,
  ShieldAlert,
} from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Breadcrumbs } from '../components/common/Breadcrumbs';
import { Button } from '../components/common/Button';
import { Tabs, TabItem } from '../components/common/Tabs';
import { TextInput } from '../components/forms/TextInput';
import { SelectInput } from '../components/forms/SelectInput';
import { DateInput } from '../components/forms/DateInput';
import { EmptyState } from '../components/common/EmptyState';
import { AlertBanner } from '../components/common/AlertBanner';
import { useAppState } from '../context/AppStateContext';
import { customerService } from '../services/customerService';
import { Customer, Gender, VisaStatus, ChequeBookAvailability } from '../types/customer';
import { MOCK_CUSTOMERS } from '../constants/mockData';
import { validateIndianMobile, validateEmail, validatePAN, validatePassport } from '../utils/validation';

export const EditCustomerPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isEmptyStateMode } = useAppState();

  const [activeTab, setActiveTab] = useState<string>('personal');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states for editable fields
  const [fullName, setFullName] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<Gender>('Male');
  const [nationality, setNationality] = useState<string>('');
  const [aadhaarNumber, setAadhaarNumber] = useState<string>('');
  const [panNumber, setPanNumber] = useState<string>('');
  const [passportNumber, setPassportNumber] = useState<string>('');
  const [fatherName, setFatherName] = useState<string>('');
  const [motherName, setMotherName] = useState<string>('');

  const [personalMobile, setPersonalMobile] = useState<string>('');
  const [personalEmail, setPersonalEmail] = useState<string>('');
  const [bankMobile, setBankMobile] = useState<string>('');
  const [bankEmail, setBankEmail] = useState<string>('');
  const [residentialAddress, setResidentialAddress] = useState<string>('');

  const [visaType, setVisaType] = useState<string>('');
  const [consultancyName, setConsultancyName] = useState<string>('');
  const [counsellorName, setCounsellorName] = useState<string>('');
  const [destinationCountry, setDestinationCountry] = useState<string>('');
  const [university, setUniversity] = useState<string>('');
  const [visaStatus, setVisaStatus] = useState<VisaStatus>('Active');

  const [fdStartDate, setFdStartDate] = useState<string>('');
  const [fdEndDate, setFdEndDate] = useState<string>('');
  const [paidTo, setPaidTo] = useState<string>('');
  const [nextPaymentDate, setNextPaymentDate] = useState<string>('');

  const [notes, setNotes] = useState<string>('');
  const [additionalRemarks, setAdditionalRemarks] = useState<string>('');
  const [changeReason, setChangeReason] = useState<string>('Routine customer profile update');

  useEffect(() => {
    async function fetchCustomer() {
      if (!id) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);

      // Check session customers
      const found = await customerService.getCustomerById(id);
      if (found) {
        populateForm(found);
        setCustomer(found);
        setIsLoading(false);
        return;
      }

      // In Sample Data mode, check mock data
      if (!isEmptyStateMode) {
        const mock = MOCK_CUSTOMERS.find((c) => c.id === id) || MOCK_CUSTOMERS[0];
        const synthesized: Customer = {
          id: mock.id,
          personalInfo: {
            fullName: mock.name,
            dateOfBirth: mock.dateOfBirth,
            gender: mock.gender as any,
            nationality: mock.nationality,
            aadhaarNumber: '543298761234',
            panNumber: 'ABCDE1234F',
            passportNumber: mock.passportNo,
            fatherName: 'Kailash Chandra',
            motherName: 'Shanti Devi',
          },
          contactInfo: {
            personalMobile: mock.mobile,
            personalEmail: mock.email,
            bankMobile: '9811234567',
            bankEmail: 'ahmed.bank@example.com',
            residentialAddress: mock.address,
          },
          visaInfo: {
            visaType: mock.visaTrack,
            consultancyName: 'Visa Consultancy Management',
            counsellorName: 'S. Mehta',
            destinationCountry: 'United Kingdom',
            university: 'University of Manchester',
            visaStatus: 'Active',
          },
          bankInfo: {
            bankId: 'icici',
            bankName: mock.linkedBank,
            branchId: '',
            branchName: '',
            branchLocation: '',
            ifscCode: '',
            accountNumber: mock.accountNumber || '10293847561',
            chequeBook: 'Yes',
          },
          fdInfo: {
            initialFdAmount: 500000,
            fdStartDate: '15-01-2026',
            fdEndDate: '15-01-2027',
            interestAmount: 35500,
          },
          paymentInfo: {
            paidTo: 'Visa Consultancy Fiduciary Account',
            nextPaymentDate: '15-12-2026',
          },
          additionalInfo: {
            notes: 'Applicant portfolio prepared for high commission review.',
            additionalRemarks: 'All solvency letters verified by senior case officer.',
          },
          initialFinancialRecord: {
            transactionDate: mock.createdAt,
            initialAmount: mock.currentAmount,
            notes: 'Verified proof-of-funds balance recorded at registration.',
          },
          status: mock.status as any,
          createdAt: mock.createdAt,
          createdBy: 'Demo User',
          updatedAt: mock.createdAt,
          updatedBy: 'Demo User',
        };
        customerService.seedSampleCustomer(synthesized);
        populateForm(synthesized);
        setCustomer(synthesized);
      } else {
        setCustomer(null);
      }
      setIsLoading(false);
    }

    fetchCustomer();
  }, [id, isEmptyStateMode]);

  const populateForm = (cust: Customer) => {
    setFullName(cust.personalInfo.fullName);
    setDateOfBirth(cust.personalInfo.dateOfBirth);
    setGender(cust.personalInfo.gender);
    setNationality(cust.personalInfo.nationality);
    setAadhaarNumber(cust.personalInfo.aadhaarNumber || '');
    setPanNumber(cust.personalInfo.panNumber);
    setPassportNumber(cust.personalInfo.passportNumber);
    setFatherName(cust.personalInfo.fatherName || '');
    setMotherName(cust.personalInfo.motherName || '');

    setPersonalMobile(cust.contactInfo.personalMobile);
    setPersonalEmail(cust.contactInfo.personalEmail);
    setBankMobile(cust.contactInfo.bankMobile || '');
    setBankEmail(cust.contactInfo.bankEmail || '');
    setResidentialAddress(cust.contactInfo.residentialAddress);

    setVisaType(cust.visaInfo.visaType);
    setConsultancyName(cust.visaInfo.consultancyName);
    setCounsellorName(cust.visaInfo.counsellorName);
    setDestinationCountry(cust.visaInfo.destinationCountry);
    setUniversity(cust.visaInfo.university || '');
    setVisaStatus(cust.visaInfo.visaStatus);

    setFdStartDate(cust.fdInfo?.fdStartDate || '');
    setFdEndDate(cust.fdInfo?.fdEndDate || '');
    setPaidTo(cust.paymentInfo?.paidTo || '');
    setNextPaymentDate(cust.paymentInfo?.nextPaymentDate || '');

    setNotes(cust.additionalInfo?.notes || '');
    setAdditionalRemarks(cust.additionalInfo?.additionalRemarks || '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer) return;

    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!fullName.trim()) {
      setErrorMessage('Full Legal Name cannot be empty.');
      return;
    }
    if (!validateIndianMobile(personalMobile)) {
      setErrorMessage('Personal Mobile Number must be a valid 10-digit number.');
      return;
    }
    if (personalEmail && personalEmail.trim() && !validateEmail(personalEmail)) {
      setErrorMessage('Personal Email Address is invalid.');
      return;
    }
    if (!validatePAN(panNumber)) {
      setErrorMessage('Invalid PAN format. Must be 10 characters (e.g. ABCDE1234F).');
      return;
    }
    if (!validatePassport(passportNumber)) {
      setErrorMessage('Invalid Passport format.');
      return;
    }

    setIsSaving(true);
    try {
      await customerService.updateCustomer(customer.id, {
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
        fdInfo: {
          fdStartDate,
          fdEndDate,
        },
        paymentInfo: {
          paidTo: paidTo.trim(),
          nextPaymentDate: nextPaymentDate.trim(),
        },
        additionalInfo: {
          notes: notes.trim(),
          additionalRemarks: additionalRemarks.trim(),
        },
        changeReason: changeReason.trim(),
      });

      setSuccessMessage('Customer profile updated successfully. Modification history logged.');
      setTimeout(() => {
        navigate(`/customers/${customer.id}`);
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update customer profile.');
      setIsSaving(false);
    }
  };

  const tabs: TabItem[] = [
    { id: 'personal', label: 'Personal Information' },
    { id: 'contact', label: 'Contact Details' },
    { id: 'visa', label: 'Visa & Consultancy' },
    { id: 'restricted-bank', label: 'Bank Allocation (Locked)' },
    { id: 'notes', label: 'Notes & Remarks' },
  ];

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-400">
        Loading customer record...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <PageHeader
          breadcrumbs={
            <Breadcrumbs
              items={[
                { label: 'Customers', href: '/customers' },
                { label: `Edit Customer (${id || 'Unknown'})` },
              ]}
            />
          }
          title="Edit Customer Profile"
          subtitle="Customer record modification and profile amendment"
        />

        <EmptyState
          title="Customer Record Unavailable"
          description="In default Empty State mode, no customer records exist in the database to edit. To edit a profile, first register an applicant or switch to Sample Data mode for preview."
          actionText="Back to Customer Directory"
          onAction={() => navigate('/customers')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: 'Customers', href: '/customers' },
              { label: customer.personalInfo.fullName, href: `/customers/${customer.id}` },
              { label: 'Edit Profile' },
            ]}
          />
        }
        title={`Edit Customer: ${customer.personalInfo.fullName}`}
        subtitle={`Amend permitted profile fields for reference ID: ${customer.id}`}
        actions={
          <>
            <Button
              type="button"
              variant="success"
              icon={<Save className="w-4 h-4" />}
              isLoading={isSaving}
              onClick={handleUpdate}
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              Cancel
            </Button>
          </>
        }
      />

      {errorMessage && (
        <AlertBanner
          type="warning"
          title="Validation Error"
          message={errorMessage}
        />
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMessage} Redirecting to Profile...</span>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 pt-2 border-b border-slate-100">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        <form onSubmit={handleUpdate} className="p-6">
          {/* TAB 1: PERSONAL INFORMATION */}
          {activeTab === 'personal' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextInput
                  label="Full Legal Name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <DateInput
                  label="Date of Birth"
                  required
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                />
                <SelectInput
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  options={['Male', 'Female', 'Other']}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextInput
                  label="Nationality"
                  required
                  value={nationality}
                  onChange={(e) => setNationality(e.target.value)}
                />
                <TextInput
                  label="PAN Number"
                  required
                  value={panNumber}
                  onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
                />
                <TextInput
                  label="Passport Number"
                  required
                  value={passportNumber}
                  onChange={(e) => setPassportNumber(e.target.value.toUpperCase())}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextInput
                  label="Aadhaar Number"
                  optional
                  value={aadhaarNumber}
                  onChange={(e) => setAadhaarNumber(e.target.value)}
                />
                <TextInput
                  label="Father's Name"
                  optional
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                />
                <TextInput
                  label="Mother's Name"
                  optional
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* TAB 2: CONTACT DETAILS */}
          {activeTab === 'contact' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextInput
                  label="Personal Mobile Number"
                  required
                  value={personalMobile}
                  onChange={(e) => setPersonalMobile(e.target.value)}
                />
                <TextInput
                  label="Personal Email Address"
                  optional
                  type="email"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100">
                <TextInput
                  label="Bank-Specific Mobile Number"
                  optional
                  value={bankMobile}
                  onChange={(e) => setBankMobile(e.target.value)}
                />
                <TextInput
                  label="Bank-Specific Email Address"
                  optional
                  type="email"
                  value={bankEmail}
                  onChange={(e) => setBankEmail(e.target.value)}
                />
              </div>

              <div>
                <TextInput
                  label="Residential Address"
                  required
                  value={residentialAddress}
                  onChange={(e) => setResidentialAddress(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* TAB 3: VISA & CONSULTANCY */}
          {activeTab === 'visa' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <SelectInput
                  label="Visa Category"
                  value={visaType}
                  onChange={(e) => setVisaType(e.target.value)}
                  options={['Work Visa', 'Student Visa', 'Business Visa', 'PR Visa', 'Tourist Visa']}
                />
                <TextInput
                  label="Destination Country"
                  value={destinationCountry}
                  onChange={(e) => setDestinationCountry(e.target.value)}
                />
                <SelectInput
                  label="Visa Status (Independent of Customer Status)"
                  value={visaStatus}
                  onChange={(e) => setVisaStatus(e.target.value as VisaStatus)}
                  options={['Active', 'Inactive', 'Pending']}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <TextInput
                  label="Consultancy Name"
                  value={consultancyName}
                  onChange={(e) => setConsultancyName(e.target.value)}
                />
                <TextInput
                  label="Assigned Counsellor"
                  value={counsellorName}
                  onChange={(e) => setCounsellorName(e.target.value)}
                />
                <TextInput
                  label="University / Institution"
                  optional
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* TAB 4: RESTRICTED BANK & BRANCH (NON-EDITABLE BUSINESS RULE) */}
          {activeTab === 'restricted-bank' && (
            <div className="space-y-6">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-semibold">
                  <Lock className="w-4 h-4 text-slate-600" />
                  <span>Restricted Bank Allocation Policy</span>
                </div>
                <p className="leading-relaxed text-slate-600">
                  According to confirmed VCMS business rules, a customer's bank, branch, location, IFSC code, and account number are permanently locked upon initial registration. They cannot be modified via the standard customer profile edit form.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-80">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <span>Allocated Bank</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">Permanent</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={customer.bankInfo.bankName}
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <span>Allocated Branch</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">Permanent</span>
                  </label>
                  <input
                    type="text"
                    disabled
                    value={
                      customer.bankInfo.branchName
                        ? `${customer.bankInfo.branchName}${customer.bankInfo.branchLocation ? ` (${customer.bankInfo.branchLocation})` : ''}`
                        : 'No registered branch'
                    }
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 opacity-80">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    disabled
                    value={customer.bankInfo.ifscCode || '—'}
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-mono text-slate-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">
                    Bank Account Number
                  </label>
                  <input
                    type="text"
                    disabled
                    value={customer.bankInfo.accountNumber}
                    className="w-full rounded-lg border border-slate-200 bg-slate-100 px-3.5 py-2 text-sm font-mono text-slate-600 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NOTES & CHANGE REASON */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Internal Case Notes
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 p-3 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1.5">
                  Reason for Profile Modification (Audit Trail) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g. Applicant updated mobile contact number following relocation"
                  className="w-full rounded-lg border border-slate-200 p-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  This justification is recorded into the customer's immutable change history.
                </p>
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              icon={<Save className="w-4 h-4" />}
              isLoading={isSaving}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
