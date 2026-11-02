import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../layouts/AppLayout';
import { DashboardPage } from '../pages/DashboardPage';
import { CustomersPage } from '../pages/CustomersPage';
import { AddCustomerPage } from '../pages/AddCustomerPage';
import { EditCustomerPage } from '../pages/EditCustomerPage';
import { CustomerDetailsPage } from '../pages/CustomerDetailsPage';
import { BankMasterPage } from '../pages/BankMasterPage';
import { BranchMasterPage } from '../pages/BranchMasterPage';
import { BanksPage } from '../pages/BanksPage';
import { FinancialRecordsPage } from '../pages/FinancialRecordsPage';
import { FinancialRecordHistoryPage } from '../pages/FinancialRecordHistoryPage';
import { FinancialRecordDetailsPage } from '../pages/FinancialRecordDetailsPage';
import { FdManagementPage } from '../pages/FdManagementPage';
import { ApplicationsPage } from '../pages/ApplicationsPage';
import { ApplicationDetailsPage } from '../pages/ApplicationDetailsPage';
import { DocumentsPage } from '../pages/DocumentsPage';
import { DocumentHandoversPage } from '../pages/DocumentHandoversPage';
import { TasksPage } from '../pages/TasksPage';
import { FollowUpsPage } from '../pages/FollowUpsPage';
import { ReportsPage } from '../pages/ReportsPage';
import { NotificationsPage } from '../pages/NotificationsPage';
import { UsersRolesPage } from '../pages/UsersRolesPage';
import { AuditLogsPage } from '../pages/AuditLogsPage';
import { SettingsPage } from '../pages/SettingsPage';
import { LoginPage } from '../pages/LoginPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Main Authenticated Layout Routes */}
      <Route path="/" element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Customers */}
        <Route path="customers" element={<CustomersPage />} />
        <Route path="customers/new" element={<AddCustomerPage />} />
        <Route path="customers/:id" element={<CustomerDetailsPage />} />
        <Route path="customers/:id/edit" element={<EditCustomerPage />} />

        {/* Banks & Branches Master */}
        <Route path="banks" element={<BankMasterPage />} />
        <Route path="banks/master" element={<BankMasterPage />} />
        <Route path="banks/branches" element={<BranchMasterPage />} />
        <Route path="branches" element={<BranchMasterPage />} />
        <Route path="banks/accounts" element={<BanksPage />} />
        <Route path="banks/:id" element={<BankMasterPage />} />


        {/* Financial Records: ensure history is declared before :id */}
        <Route path="financial-records" element={<FinancialRecordsPage />} />
        <Route path="financial-records/history" element={<FinancialRecordHistoryPage />} />
        <Route path="financial-records/:id" element={<FinancialRecordDetailsPage />} />

        {/* Applications */}
        <Route path="applications" element={<ApplicationsPage />} />
        <Route path="applications/:id" element={<ApplicationDetailsPage />} />

        {/* Additional Modules */}
        <Route path="fd-management" element={<FdManagementPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="document-handovers" element={<DocumentHandoversPage />} />
        <Route path="tasks" element={<TasksPage />} />
        <Route path="follow-ups" element={<FollowUpsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="users-roles" element={<UsersRolesPage />} />
        <Route path="employees" element={<UsersRolesPage />} />
        <Route path="audit-log" element={<AuditLogsPage />} />
        <Route path="audit-logs" element={<AuditLogsPage />} />
        <Route path="settings" element={<SettingsPage />} />

        {/* Catch-all redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
