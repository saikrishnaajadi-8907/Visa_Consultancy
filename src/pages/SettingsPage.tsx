import React from 'react';
import { Settings, Save, Building, Shield, Globe, Bell } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader';
import { Button } from '../components/common/Button';
import { TextInput } from '../components/forms/TextInput';
import { SelectInput } from '../components/forms/SelectInput';

export const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Consultancy System Settings"
        subtitle="Manage organization parameters, currency defaults, and compliance audit policies"
        actions={
          <Button variant="primary" icon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Consultancy Info */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Building className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Organization Profile</h3>
          </div>
          <TextInput label="Consultancy Name" defaultValue="Visa Consultancy Management" />
          <TextInput label="Registration / License Number" defaultValue="VCMS-IND-HYD-2026-908" />
          <TextInput label="Primary Corporate Address" defaultValue="Level 4, Cyber Towers, Hitec City, Hyderabad - 500081" />
          <TextInput label="Official Compliance Email" defaultValue="compliance@visaconsultancy.com" />
        </div>

        {/* Currency & Financial Standards */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Globe className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-semibold text-slate-900">Financial & Currency Standards</h3>
          </div>
          <SelectInput
            label="Base Reporting Currency"
            options={['INR (₹ - Indian Rupee)', 'USD ($ - US Dollar)', 'GBP (£ - British Pound)', 'CAD ($ - Canadian Dollar)']}
          />
          <SelectInput
            label="Default Solvency Snapshot Retention"
            options={['7 Years (Consular Audit Standard)', '5 Years', '10 Years']}
          />
          <SelectInput
            label="Dual-Verification Required for Balances Above"
            options={['₹ 10,00,000', '₹ 25,00,000', '₹ 50,00,000']}
          />
        </div>
      </div>
    </div>
  );
};
