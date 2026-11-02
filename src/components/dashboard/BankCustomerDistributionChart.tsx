import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BankMaster } from '../../types/bank';

interface DashboardCustomer {
  id: string;
  name: string;
  bankName: string;
  bankId?: string;
  visaTrack: string;
  status: string;
}

interface BankCustomerDistributionChartProps {
  banks: BankMaster[];
  customers: DashboardCustomer[];
}

export const BankCustomerDistributionChart: React.FC<BankCustomerDistributionChartProps> = ({
  banks,
  customers,
}) => {
  const navigate = useNavigate();

  // Aggregate and sort all 10 approved partner banks by customer count descending
  const sortedBanks = useMemo(() => {
    const list = banks.map((b) => {
      const codeKey = b.code.toLowerCase();
      const bId = b.id.toLowerCase();
      const linked = customers.filter((c) => {
        if (c.bankId) {
          return c.bankId.toLowerCase() === bId;
        }
        const cBank = (c.bankName || '').toLowerCase();
        if (bId === 'sbi' || codeKey === 'sbi') {
          return cBank.includes('state bank') || cBank.includes('(sbi)');
        }
        if (bId === 'boi' || codeKey === 'boi') {
          return cBank.includes('bank of india') && !cBank.includes('state bank');
        }
        if (bId === 'bob' || codeKey === 'bob') {
          return cBank.includes('baroda') || cBank.includes('bob');
        }
        return cBank.includes(b.name.toLowerCase()) || cBank.includes(codeKey);
      });

      return {
        id: b.id,
        name: b.name,
        code: b.code,
        count: linked.length,
      };
    });

    // Sort descending by customer count, retaining all 10 banks
    return list.sort((a, b) => b.count - a.count);
  }, [banks, customers]);

  const maxCount = useMemo(() => {
    const max = Math.max(...sortedBanks.map((b) => b.count), 1);
    return max;
  }, [sortedBanks]);

  const totalAssigned = useMemo(() => {
    return sortedBanks.reduce((sum, b) => sum + b.count, 0);
  }, [sortedBanks]);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] px-5 py-4 sm:p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Bank-wise Customer Distribution
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Active customer portfolio allocation across all 10 approved partner banks
            </p>
          </div>
          <button
            onClick={() => navigate('/customers')}
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium cursor-pointer shrink-0"
          >
            View all
          </button>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="mt-3.5 space-y-1.5">
          {sortedBanks.map((bank) => {
            const barWidthPercent =
              maxCount > 0 && bank.count > 0 ? (bank.count / maxCount) * 100 : 0;

            return (
              <div
                key={bank.id}
                onClick={() => navigate(`/customers?bankId=${bank.id}`)}
                className="group flex items-center gap-2.5 py-0.5 px-1.5 rounded-md hover:bg-slate-50 transition-colors cursor-pointer"
                title={`${bank.name}: ${bank.count} assigned customers (click to view customers)`}
              >
                {/* Bank Name on vertical axis - readable without truncation */}
                <div className="w-44 sm:w-48 shrink-0 text-left">
                  <span className="text-xs font-medium text-slate-700 group-hover:text-blue-700 transition-colors truncate block">
                    {bank.name}
                  </span>
                </div>

                {/* Horizontal Bar Track */}
                <div className="flex-1 bg-slate-100 h-[18px] rounded-r-md overflow-hidden relative flex items-center">
                  <div
                    className="bg-blue-600 h-full rounded-r-md transition-all duration-500 ease-out group-hover:bg-blue-700"
                    style={{
                      width: `${barWidthPercent}%`,
                      minWidth: bank.count > 0 ? '6px' : '0px',
                    }}
                  />
                </div>

                {/* Exact Customer Count at end of bar */}
                <div className="w-8 text-right shrink-0">
                  <span
                    className={`text-xs font-bold tabular-nums ${
                      bank.count > 0 ? 'text-blue-700 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {bank.count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Meta */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>
          Total Assigned Clients: <strong className="text-slate-800">{totalAssigned}</strong>
        </span>
        <button
          onClick={() => navigate('/banks')}
          className="text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Manage Bank Master</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
