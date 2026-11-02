import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Landmark,
  FileText,
  IndianRupee,
} from 'lucide-react';
import { KpiCard } from '../components/common/KpiCard';
import { AlertBanner } from '../components/common/AlertBanner';
import { EmptyState } from '../components/common/EmptyState';
import { useAppState } from '../context/AppStateContext';
import { MOCK_CUSTOMERS } from '../constants/mockData';
import { formatINR } from '../utils/formatters';
import { taskFollowUpService } from '../services/taskFollowUpService';
import { bankService } from '../services/bankService';
import { customerService } from '../services/customerService';
import { financialService } from '../services/financialService';
import { BankMaster } from '../types/bank';
import { CustomerFinancialSummary, FinancialTransaction } from '../types/financial';
import { BankCustomerDistributionChart } from '../components/dashboard/BankCustomerDistributionChart';
import { BankBalanceFluctuationChart } from '../components/dashboard/BankBalanceFluctuationChart';
import { ApplicationsPipelineDonutChart } from '../components/dashboard/ApplicationsPipelineDonutChart';
import { RecentFinancialActivitiesTable } from '../components/dashboard/RecentFinancialActivitiesTable';
import { BankBalanceSummaryChart } from '../components/dashboard/BankBalanceSummaryChart';

interface DashboardCustomer {
  id: string;
  name: string;
  bankName: string;
  bankId?: string;
  visaTrack: string;
  status: string;
}

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isEmptyStateMode } = useAppState();
  const [customers, setCustomers] = useState<DashboardCustomer[]>([]);
  const [masterBanks, setMasterBanks] = useState<BankMaster[]>([]);
  const [allTransactions, setAllTransactions] = useState<FinancialTransaction[]>([]);
  const [customerSummaries, setCustomerSummaries] = useState<Record<string, CustomerFinancialSummary>>({});
  const [totalBankBalance, setTotalBankBalance] = useState<number>(0);
  const [totalFdAmount, setTotalFdAmount] = useState<number>(0);
  const [totalCombinedAmount, setTotalCombinedAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      const [sessionCusts, banks, txns] = await Promise.all([
        customerService.getCustomers({ isSampleMode: !isEmptyStateMode }),
        bankService.getBanks(),
        financialService.getAllFinancialTransactions(!isEmptyStateMode),
      ]);

      if (isMounted) {
        setMasterBanks(banks);
        setAllTransactions(txns);
      }

      let activeList: DashboardCustomer[] = [];
      if (!isEmptyStateMode) {
        if (sessionCusts.length > 0) {
          activeList = sessionCusts.map((c) => ({
            id: c.id,
            name: c.personalInfo.fullName,
            bankName: c.bankInfo.bankName,
            bankId: c.bankInfo.bankId,
            visaTrack: c.visaInfo.visaType,
            status: c.status || c.visaInfo.visaStatus,
          }));
        } else {
          // Direct from MOCK_CUSTOMERS without fabricated PAN, IFSC, FD dates, or notes
          const resolveCanonicalBankId = (name: string): string => {
            const norm = (name || '').toLowerCase();
            if (norm.includes('state bank') || norm.includes('(sbi)')) return 'sbi';
            if (norm.includes('bank of india') && !norm.includes('state bank')) return 'boi';
            if (norm.includes('baroda') || norm.includes('bob')) return 'bob';
            if (norm.includes('icici')) return 'icici';
            if (norm.includes('idbi')) return 'idbi';
            if (norm.includes('hdfc')) return 'hdfc';
            if (norm.includes('axis')) return 'axis';
            if (norm.includes('punjab') || norm.includes('pnb')) return 'pnb';
            if (norm.includes('canara')) return 'canara';
            if (norm.includes('maharashtra') || norm.includes('bom')) return 'bom';
            return norm.replace(/[^a-z]/g, '');
          };

          activeList = MOCK_CUSTOMERS.map((mc) => ({
            id: mc.id,
            name: mc.name,
            bankName: mc.linkedBank,
            bankId: resolveCanonicalBankId(mc.linkedBank),
            visaTrack: mc.visaTrack,
            status: mc.status,
          }));
        }
      } else {
        activeList = sessionCusts.map((c) => ({
          id: c.id,
          name: c.personalInfo.fullName,
          bankName: c.bankInfo.bankName,
          bankId: c.bankInfo.bankId,
          visaTrack: c.visaInfo.visaType,
          status: c.status || c.visaInfo.visaStatus,
        }));
      }

      if (!isMounted) return;
      setCustomers(activeList);

      // Dynamically compute sum of bank balances and FDs from financial service
      if (activeList.length === 0) {
        setTotalBankBalance(0);
        setTotalFdAmount(0);
        setTotalCombinedAmount(0);
        setCustomerSummaries({});
      } else {
        let bankTotal = 0;
        let fdTotal = 0;
        let combinedTotal = 0;
        const summariesMap: Record<string, CustomerFinancialSummary> = {};
        for (const cust of activeList) {
          try {
            const summary = await financialService.getCustomerFinancialSummary(cust.id);
            summariesMap[cust.id] = summary;
            bankTotal += summary.currentBankBalance;
            fdTotal += summary.fdAmount;
            combinedTotal += summary.combinedFinancialAmount;
          } catch {
            // No financial record: default to 0 (no fallback or invented amounts)
          }
        }
        if (isMounted) {
          setCustomerSummaries(summariesMap);
          setTotalBankBalance(bankTotal);
          setTotalFdAmount(fdTotal);
          setTotalCombinedAmount(combinedTotal);
        }
      }
      setIsLoading(false);
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [isEmptyStateMode]);

  // Customer map for resolving transaction customer names
  const customerMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of customers) {
      map[c.id] = c.name;
    }
    return map;
  }, [customers]);



  if (isEmptyStateMode && customers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard value="0" label="Total Customers" icon={<Users className="w-5 h-5" />} theme="blue" />
          <KpiCard value={String(masterBanks.length || 10)} label="Approved Partner Banks" icon={<Landmark className="w-5 h-5" />} theme="green" />
          <KpiCard value="0" label="Active Applications" icon={<FileText className="w-5 h-5" />} theme="purple" />
          <KpiCard value="₹ 0" label="Total Bank Balance" icon={<IndianRupee className="w-5 h-5" />} theme="orange" />
        </div>

        <EmptyState
          title="No Operational Data Available"
          description="Your consultancy records are currently empty. Register your first client portfolio or manage approved partner banks."
          actionText="Register First Customer"
          onAction={() => navigate('/customers/new')}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Follow-up Alert Banner */}
      {taskFollowUpService.getPendingFollowUpsCount(isEmptyStateMode) > 0 && (
        <AlertBanner
          type="warning"
          title="Pending Follow-ups"
          message={`${taskFollowUpService.getPendingFollowUpsCount(isEmptyStateMode)} customer follow-ups and verification letters pending officer review.`}
          actionText="View Follow-ups"
          actionLink="/follow-ups"
          secondaryActionText="View Casework Tasks"
          onActionClick={() => navigate('/follow-ups')}
          onSecondaryActionClick={() => navigate('/tasks')}
        />
      )}

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          value={isLoading ? '...' : String(customers.length)}
          label="Total Customers"
          icon={<Users className="w-5 h-5 text-blue-600" />}
          theme="blue"
          onClick={() => navigate('/customers')}
        />
        <KpiCard
          value={isLoading ? '...' : String(masterBanks.length || 10)}
          label="Approved Partner Banks"
          icon={<Landmark className="w-5 h-5 text-emerald-600" />}
          theme="green"
          onClick={() => navigate('/banks')}
        />
        <KpiCard
          value={isLoading ? '...' : String(customers.filter((c) => c.status === 'Active').length)}
          label="Active Applications"
          icon={<FileText className="w-5 h-5 text-purple-600" />}
          theme="purple"
          onClick={() => navigate('/customers?customerStatus=Active')}
        />
        <KpiCard
          value={isLoading ? '...' : formatINR(totalBankBalance)}
          label="Total Bank Balance"
          icon={<IndianRupee className="w-5 h-5 text-amber-600" />}
          theme="orange"
          onClick={() => navigate('/financial-records')}
          trend={
            totalFdAmount > 0
              ? {
                  value: `+ ${formatINR(totalFdAmount)} in FDs (Combined: ${formatINR(totalCombinedAmount)})`,
                  isPositive: true,
                }
              : undefined
          }
        />
      </div>

      {/* Row 1: Bank-wise Customer Distribution Horizontal Bar Chart & Bank Balance Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Bank-wise Customer Distribution Horizontal Bar Chart */}
        <div className="lg:col-span-5 flex flex-col">
          <BankCustomerDistributionChart banks={masterBanks} customers={customers} />
        </div>

        {/* Right: Bank-wise Bank Balance Summary Grouped Bar Chart */}
        <div className="lg:col-span-7 flex flex-col">
          <BankBalanceSummaryChart
            banks={masterBanks}
            customers={customers}
            customerSummaries={customerSummaries}
            totalBankBalance={totalBankBalance}
            totalFdAmount={totalFdAmount}
            totalCombinedAmount={totalCombinedAmount}
          />
        </div>
      </div>

      {/* Row 2: Bank Balance Fluctuations Summary */}
      <BankBalanceFluctuationChart
        banks={masterBanks}
        transactions={allTransactions}
        customerMap={customerMap}
      />

      {/* Row 3: Applications Pipeline Donut Chart & Recent Financial Activities Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Applications Pipeline Donut Chart */}
        <div className="lg:col-span-5">
          <ApplicationsPipelineDonutChart customers={customers} />
        </div>

        {/* Right: Recent Financial Activities Table */}
        <div className="lg:col-span-7">
          <RecentFinancialActivitiesTable
            transactions={allTransactions}
            customerMap={customerMap}
          />
        </div>
      </div>
    </div>
  );
};
