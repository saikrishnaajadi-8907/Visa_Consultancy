import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BankMaster } from '../../types/bank';
import { CustomerFinancialSummary } from '../../types/financial';
import { formatINR } from '../../utils/formatters';
import { MOCK_CUSTOMERS } from '../../constants/mockData';

interface DashboardCustomer {
  id: string;
  name: string;
  bankName: string;
  bankId?: string;
  visaTrack: string;
  status: string;
}

interface BankBalanceSummaryChartProps {
  banks: BankMaster[];
  customers: DashboardCustomer[];
  customerSummaries: Record<string, CustomerFinancialSummary>;
  totalBankBalance: number;
  totalFdAmount: number;
  totalCombinedAmount: number;
}

// Approved 10 Fiduciary Partner Banks
const APPROVED_10_BANKS = [
  { id: 'hdfc', code: 'HDFC', name: 'HDFC Bank', shortLabel: 'HDFC' },
  { id: 'sbi', code: 'SBI', name: 'State Bank of India (SBI)', shortLabel: 'SBI' },
  { id: 'icici', code: 'ICICI', name: 'ICICI Bank', shortLabel: 'ICICI' },
  { id: 'idbi', code: 'IDBI', name: 'IDBI Bank', shortLabel: 'IDBI' },
  { id: 'boi', code: 'BOI', name: 'Bank of India', shortLabel: 'BOI' },
  { id: 'bom', code: 'BOM', name: 'Bank of Maharashtra', shortLabel: 'BOM' },
  { id: 'canara', code: 'CANARA', name: 'Canara Bank', shortLabel: 'CANARA' },
  { id: 'bob', code: 'BOB', name: 'Bank of Baroda', shortLabel: 'BOB' },
  { id: 'pnb', code: 'PNB', name: 'Punjab National Bank (PNB)', shortLabel: 'PNB' },
  { id: 'axis', code: 'AXIS', name: 'Axis Bank', shortLabel: 'AXIS' },
];

export const BankBalanceSummaryChart: React.FC<BankBalanceSummaryChartProps> = ({
  banks,
  customers,
  customerSummaries,
  totalBankBalance,
  totalFdAmount,
  totalCombinedAmount,
}) => {
  const navigate = useNavigate();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Compile full 10-bank data in approved order
  const bankData = useMemo(() => {
    return APPROVED_10_BANKS.map((approved) => {
      // Match from master banks if available for metadata
      const master = banks.find(
        (b) =>
          b.id.toLowerCase() === approved.id.toLowerCase() ||
          b.code.toUpperCase() === approved.code.toUpperCase()
      );
      const bankId = master ? master.id : approved.id;
      const bankName = master ? master.name : approved.name;
      const bankCode = master ? master.code : approved.code;

      // Link customers assigned to this bank
      const targetId = bankId.toLowerCase();
      const bCode = bankCode.toLowerCase();
      const linked = customers.filter((c) => {
        if (c.bankId) {
          return c.bankId.toLowerCase() === targetId;
        }
        const cBankName = (c.bankName || '').toLowerCase();
        if (targetId === 'sbi' || bCode === 'sbi') {
          return cBankName.includes('state bank') || cBankName.includes('(sbi)');
        }
        if (targetId === 'boi' || bCode === 'boi') {
          return cBankName.includes('bank of india') && !cBankName.includes('state bank');
        }
        if (targetId === 'bob' || bCode === 'bob') {
          return cBankName.includes('baroda') || cBankName.includes('bob');
        }
        return (
          cBankName.includes(bankName.toLowerCase()) ||
          cBankName.includes(bCode) ||
          (bCode === 'pnb' && cBankName.includes('punjab')) ||
          (bCode === 'bom' && cBankName.includes('maharashtra'))
        );
      });

      let prevAmt = 0;
      let currAmt = 0;

      for (const cust of linked) {
        const summary = customerSummaries[cust.id];
        if (summary) {
          // Strictly bank balances only; excludes FD amounts
          prevAmt += summary.initialAmount;
          currAmt += summary.currentBankBalance;
        } else {
          // Fallback to sample customer mock amounts if summary is pending
          const mock = MOCK_CUSTOMERS.find((mc) => mc.id === cust.id);
          if (mock) {
            prevAmt += mock.previousAmount;
            currAmt += mock.currentAmount;
          }
        }
      }

      const increase = currAmt - prevAmt;

      return {
        id: bankId,
        bankName,
        code: bankCode,
        shortLabel: approved.shortLabel,
        linkedCustomers: linked.length,
        previousAmount: prevAmt,
        currentAmount: currAmt,
        increase,
      };
    });
  }, [banks, customers, customerSummaries]);

  // Determine dynamic Y-axis scale based on highest balance
  const { maxY, ticks } = useMemo(() => {
    const highestVal = Math.max(
      ...bankData.map((b) => Math.max(b.previousAmount, b.currentAmount)),
      1
    );

    let step = 50000;
    let targetMax = 300000;

    if (highestVal > 300000) {
      step = Math.ceil(highestVal / 6 / 50000) * 50000;
      targetMax = Math.ceil(highestVal / step) * step;
    }

    const tickList: number[] = [];
    for (let t = 0; t <= targetMax; t += step) {
      tickList.push(t);
    }

    return { maxY: targetMax, ticks: tickList };
  }, [bankData]);

  // SVG Chart Geometry
  const svgWidth = 720;
  const svgHeight = 310;
  const paddingLeft = 78;
  const paddingRight = 20;
  const paddingTop = 36;
  const paddingBottom = 34;

  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;
  const baselineY = paddingTop + plotHeight;
  const bankStep = plotWidth / bankData.length;

  const barWidth = 15;
  const barGap = 3;

  const formatTickINR = (val: number): string => {
    const formatter = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });
    return `₹${formatter.format(val)}`;
  };

  const handleBankClick = (bankId: string) => {
    navigate(`/financial-records?bankId=${bankId}`);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between h-full">
      <div>
        {/* Card Header & Legend */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Bank-wise Bank Balance Summary
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregated client bank balances across all 10 approved partner banks
            </p>
          </div>

          <button
            onClick={() => navigate('/banks')}
            className="text-xs text-blue-600 hover:text-blue-700 hover:underline font-medium cursor-pointer self-start sm:self-auto"
          >
            Inspect Banks
          </button>
        </div>

        {/* Legend matching visual reference */}
        <div className="mt-3.5 flex flex-wrap items-center gap-5 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#94A3B8] inline-block shrink-0" />
            <span className="font-medium text-slate-700">Previous balance</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-xs bg-[#2563EB] inline-block shrink-0" />
            <span className="font-medium text-slate-700">Current balance</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-emerald-600">
            <span>+ ₹</span>
            <span>Increase</span>
          </div>
        </div>

        {/* Grouped Vertical Bar Chart */}
        <div className="mt-4 overflow-x-auto relative">
          <div className="min-w-[580px]">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto select-none overflow-visible"
            >
              {/* Horizontal Gridlines & Y-Axis Labels */}
              {ticks.map((tick) => {
                const tickY = baselineY - (tick / maxY) * plotHeight;
                const isBaseline = tick === 0;

                return (
                  <g key={tick}>
                    <line
                      x1={paddingLeft - 8}
                      y1={tickY}
                      x2={svgWidth - paddingRight}
                      y2={tickY}
                      stroke={isBaseline ? '#94A3B8' : '#F1F5F9'}
                      strokeWidth={isBaseline ? 1.5 : 1}
                    />
                    <text
                      x={paddingLeft - 14}
                      y={tickY + 3.5}
                      textAnchor="end"
                      fill="#64748B"
                      fontSize="10"
                      className="font-medium tabular-nums"
                    >
                      {formatTickINR(tick)}
                    </text>
                  </g>
                );
              })}

              {/* Bank Groups */}
              {bankData.map((bank, index) => {
                const groupCenterX = paddingLeft + (index + 0.5) * bankStep;
                const isHovered = hoveredIndex === index;

                const prevHeight = maxY > 0 ? (bank.previousAmount / maxY) * plotHeight : 0;
                const currHeight = maxY > 0 ? (bank.currentAmount / maxY) * plotHeight : 0;

                const prevBarX = groupCenterX - barWidth - barGap / 2;
                const currBarX = groupCenterX + barGap / 2;

                const prevBarY = baselineY - prevHeight;
                const currBarY = baselineY - currHeight;

                const hasPositiveIncrease = bank.increase > 0 && bank.currentAmount > 0;

                return (
                  <g
                    key={bank.id}
                    className="cursor-pointer transition-all duration-150"
                    onClick={() => handleBankClick(bank.id)}
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {/* Hover Column Highlight */}
                    {isHovered && (
                      <rect
                        x={groupCenterX - bankStep / 2 + 3}
                        y={paddingTop - 10}
                        width={bankStep - 6}
                        height={plotHeight + 40}
                        fill="#F8FAFC"
                        rx="6"
                        className="pointer-events-none"
                      />
                    )}

                    {/* Previous Balance Bar (Grey) */}
                    {prevHeight > 0 ? (
                      <rect
                        x={prevBarX}
                        y={prevBarY}
                        width={barWidth}
                        height={prevHeight}
                        fill={isHovered ? '#64748B' : '#94A3B8'}
                        rx={prevHeight >= 3 ? 3 : 0}
                        className="transition-colors duration-150"
                      />
                    ) : (
                      // Zero-height bar indicator for visual precision
                      <rect
                        x={prevBarX}
                        y={baselineY - 1}
                        width={barWidth}
                        height={1}
                        fill="#CBD5E1"
                        opacity={0.5}
                      />
                    )}

                    {/* Current Balance Bar (Blue) */}
                    {currHeight > 0 ? (
                      <rect
                        x={currBarX}
                        y={currBarY}
                        width={barWidth}
                        height={currHeight}
                        fill={isHovered ? '#1D4ED8' : '#2563EB'}
                        rx={currHeight >= 3 ? 3 : 0}
                        className="transition-colors duration-150"
                      />
                    ) : (
                      // Zero-height bar indicator for visual precision
                      <rect
                        x={currBarX}
                        y={baselineY - 1}
                        width={barWidth}
                        height={1}
                        fill="#CBD5E1"
                        opacity={0.5}
                      />
                    )}

                    {/* Positive Increase Label in Green above Current Balance bar */}
                    {hasPositiveIncrease && (
                      <text
                        x={currBarX + barWidth / 2}
                        y={currBarY - 7}
                        textAnchor="middle"
                        fill="#15803D"
                        fontSize="9.5"
                        fontWeight="600"
                        className="tabular-nums select-none"
                      >
                        + {formatTickINR(bank.increase)}
                      </text>
                    )}

                    {/* X-Axis Bank Short Label */}
                    <text
                      x={groupCenterX}
                      y={baselineY + 18}
                      textAnchor="middle"
                      fill={isHovered ? '#2563EB' : '#475569'}
                      fontSize="10.5"
                      fontWeight={isHovered ? '600' : '500'}
                      className="select-none transition-colors duration-150"
                    >
                      {bank.shortLabel}
                    </text>

                    {/* Invisible Hitbox for seamless clicking across the column */}
                    <rect
                      x={groupCenterX - bankStep / 2}
                      y={paddingTop - 15}
                      width={bankStep}
                      height={plotHeight + 45}
                      fill="transparent"
                      className="cursor-pointer"
                    />
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Interactive Hover Tooltip */}
          {hoveredIndex !== null && bankData[hoveredIndex] && (
            <div
              className="absolute z-20 pointer-events-none transition-all duration-150 bg-slate-900/95 text-white rounded-lg px-3.5 py-2.5 shadow-xl text-xs backdrop-blur-xs border border-slate-700/80"
              style={{
                left: `${
                  ((paddingLeft + (hoveredIndex + 0.5) * bankStep) / svgWidth) * 100
                }%`,
                top: '12px',
                transform:
                  hoveredIndex > 6
                    ? 'translateX(-90%)'
                    : hoveredIndex < 2
                    ? 'translateX(0%)'
                    : 'translateX(-50%)',
              }}
            >
              <div className="font-semibold text-slate-100 flex items-center gap-1.5 border-b border-slate-700/80 pb-1 mb-1.5">
                <span>{bankData[hoveredIndex].bankName}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 font-mono">
                  {bankData[hoveredIndex].code}
                </span>
              </div>
              <div className="space-y-1 text-[11px]">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Previous Balance:</span>
                  <span className="font-semibold tabular-nums text-slate-200">
                    {formatINR(bankData[hoveredIndex].previousAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Current Balance:</span>
                  <span className="font-semibold tabular-nums text-blue-300">
                    {formatINR(bankData[hoveredIndex].currentAmount)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Increase / Change:</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      bankData[hoveredIndex].increase > 0
                        ? 'text-emerald-400'
                        : bankData[hoveredIndex].increase < 0
                        ? 'text-rose-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {bankData[hoveredIndex].increase > 0 ? '+ ' : ''}
                    {formatINR(bankData[hoveredIndex].increase)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 pt-0.5 border-t border-slate-800 text-slate-400">
                  <span>Assigned Clients:</span>
                  <span className="font-medium text-slate-300">
                    {bankData[hoveredIndex].linkedCustomers}
                  </span>
                </div>
              </div>
              <div className="mt-2 text-[10px] text-blue-300/90 italic text-center">
                Click to filter Financial Records →
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Card Footer Summary */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 gap-2">
        <span>
          Total Bank Balances:{' '}
          <strong className="text-slate-800">{formatINR(totalBankBalance)}</strong>
          {totalFdAmount > 0 ? (
            <>
              {' '}
              · Fixed Deposits (FD):{' '}
              <strong className="text-slate-800">{formatINR(totalFdAmount)}</strong> ·
              Combined: <strong className="text-slate-800">{formatINR(totalCombinedAmount)}</strong>
            </>
          ) : (
            <span className="text-slate-400"> (No active fixed deposits registered)</span>
          )}
        </span>
        <button
          onClick={() => navigate('/financial-records')}
          className="text-blue-600 hover:text-blue-700 font-medium hover:underline flex items-center gap-1 cursor-pointer shrink-0"
        >
          <span>View Financial Records</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
