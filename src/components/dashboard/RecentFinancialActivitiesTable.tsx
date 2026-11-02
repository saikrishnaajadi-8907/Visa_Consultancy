import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FinancialTransaction } from '../../types/financial';
import { formatINR } from '../../utils/formatters';

interface RecentFinancialActivitiesTableProps {
  transactions: FinancialTransaction[];
  customerMap: Record<string, string>;
}

export const RecentFinancialActivitiesTable: React.FC<RecentFinancialActivitiesTableProps> = ({
  transactions,
  customerMap,
}) => {
  const navigate = useNavigate();

  // Take the 6 most recent transactions
  const displayTxns = transactions.slice(0, 6);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Financial Activities</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified financial ledger entries and portfolio movements
            </p>
          </div>
          <button
            onClick={() => navigate('/financial-records')}
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium cursor-pointer"
          >
            View Financials →
          </button>
        </div>

        {displayTxns.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No recent financial activities recorded in the ledger.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                  <th className="pb-2.5 font-medium">Date</th>
                  <th className="pb-2.5 font-medium">Customer</th>
                  <th className="pb-2.5 font-medium">Bank</th>
                  <th className="pb-2.5 font-medium">Transaction Type</th>
                  <th className="pb-2.5 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {displayTxns.map((act) => {
                  const customerName = customerMap[act.customerId] || act.customerId;
                  const isPositive = act.direction === 'Inflow';

                  return (
                    <tr
                      key={act.id}
                      onClick={() => navigate('/financial-records')}
                      className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                      title={act.description}
                    >
                      {/* 1. Date */}
                      <td className="py-3 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                        {act.transactionDate}
                      </td>

                      {/* 2. Customer */}
                      <td className="py-3 font-semibold text-slate-900">
                        {customerName}
                      </td>

                      {/* 3. Bank */}
                      <td className="py-3 text-slate-600">
                        {act.bankName || 'Bank'}
                      </td>

                      {/* 4. Transaction Type */}
                      <td className="py-3 text-slate-700 font-medium">
                        {act.transactionType}
                      </td>

                      {/* 5. Amount: + Green / − Red */}
                      <td className="py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                        {isPositive ? (
                          <span className="text-emerald-600">
                            + {formatINR(act.amount)}
                          </span>
                        ) : (
                          <span className="text-rose-600">
                            − {formatINR(act.amount)}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Showing {displayTxns.length} of {transactions.length} ledger movements</span>
        <button
          onClick={() => navigate('/financial-records')}
          className="text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>All Financial Records</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
