import React, { useState, useMemo } from 'react';
import { BankMaster } from '../../types/bank';
import { FinancialTransaction, TransactionDirection } from '../../types/financial';
import { formatINR } from '../../utils/formatters';
import { Landmark, Calendar, AlertCircle } from 'lucide-react';

interface BankBalanceFluctuationChartProps {
  banks: BankMaster[];
  transactions: FinancialTransaction[];
  customerMap: Record<string, string>;
}

interface HistoricalPoint {
  id: string;
  transactionDate: string;
  customerName: string;
  transactionType: string;
  amount: number;
  direction: TransactionDirection;
  closingBankBalance: number;
}

export const BankBalanceFluctuationChart: React.FC<BankBalanceFluctuationChartProps> = ({
  banks,
  transactions,
  customerMap,
}) => {
  // 1. Bank selection - default to first bank that has transactions, else first bank in list
  const defaultBankId = useMemo(() => {
    // Check if Bank of Baroda or ICICI has transactions in the seed
    const candidate = banks.find((b) =>
      transactions.some((t) => {
        const tBank = (t.bankId || t.bankName || '').toLowerCase();
        return tBank.includes(b.code.toLowerCase()) || tBank.includes(b.id.toLowerCase());
      })
    );
    return candidate ? candidate.id : (banks[0]?.id || 'bob');
  }, [banks, transactions]);

  const [selectedBankId, setSelectedBankId] = useState<string>(defaultBankId);

  // 2. Date selection - Defaults to 2-month demonstration timeline (03 Sept 2026 to 03 Nov 2026)
  const [startDate, setStartDate] = useState<string>('2026-09-03');
  const [endDate, setEndDate] = useState<string>('2026-11-03');

  // Interactive tooltip state
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  // Find selected bank object
  const selectedBank = useMemo(() => {
    return banks.find((b) => b.id === selectedBankId) || banks[0];
  }, [banks, selectedBankId]);

  // Date range validation
  const dateError = useMemo(() => {
    if (startDate && endDate && endDate < startDate) {
      return 'End date cannot be earlier than start date.';
    }
    return null;
  }, [startDate, endDate]);

  // 3. Reconstruct running balance chronologically from actual ledger transactions
  const { allPointsForBank, filteredPoints } = useMemo(() => {
    if (!selectedBank) {
      return { allPointsForBank: [], filteredPoints: [] };
    }

    const bId = selectedBank.id.toLowerCase();
    const bCode = selectedBank.code.toLowerCase();
    const bName = selectedBank.name.toLowerCase();

    // Match transactions assigned to this bank
    const bankTxns = transactions.filter((t) => {
      const tBankId = (t.bankId || '').toLowerCase().trim();
      const tBankName = (t.bankName || '').toLowerCase().trim();

      return (
        tBankId === bId ||
        tBankId === bCode ||
        tBankName === bName ||
        tBankName.includes(bCode) ||
        (bId === 'bob' && (tBankName.includes('baroda') || tBankId.includes('bob'))) ||
        (bId === 'sbi' && (tBankName.includes('state bank') || tBankId.includes('sbi'))) ||
        (bId === 'pnb' && (tBankName.includes('punjab') || tBankId.includes('pnb'))) ||
        (bId === 'canara' && (tBankName.includes('canara') || tBankId.includes('canara'))) ||
        (bId === 'boi' && (tBankName.includes('bank of india') || tBankId.includes('boi'))) ||
        (bId === 'bom' && (tBankName.includes('maharashtra') || tBankId.includes('bom'))) ||
        (bId === 'hdfc' && (tBankName.includes('hdfc') || tBankId.includes('hdfc'))) ||
        (bId === 'axis' && (tBankName.includes('axis') || tBankId.includes('axis'))) ||
        (bId === 'icici' && (tBankName.includes('icici') || tBankId.includes('icici'))) ||
        (bId === 'idbi' && (tBankName.includes('idbi') || tBankId.includes('idbi')))
      );
    });

    // Sort chronologically ascending by creation time to preserve exact ledger sequence
    const chronological = [...bankTxns].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    let runningBalance = 0;
    const points: HistoricalPoint[] = [];

    for (const txn of chronological) {
      if (txn.direction === 'Inflow') {
        runningBalance += txn.amount;
      } else if (txn.direction === 'Outflow') {
        runningBalance -= txn.amount;
      }

      points.push({
        id: txn.id,
        transactionDate: txn.transactionDate,
        customerName: customerMap[txn.customerId] || txn.customerId,
        transactionType: txn.transactionType,
        amount: txn.amount,
        direction: txn.direction,
        closingBankBalance: runningBalance,
      });
    }

    // Filter points by user-selected date range
    const filtered = points.filter((p) => {
      if (startDate && p.transactionDate < startDate) return false;
      if (endDate && p.transactionDate > endDate) return false;
      return true;
    });

    return { allPointsForBank: points, filteredPoints: filtered };
  }, [selectedBank, transactions, customerMap, startDate, endDate]);

  // Graph geometry calculations
  const svgWidth = 840;
  const svgHeight = 260;
  const padLeft = 85;
  const padRight = 45;
  const padTop = 30;
  const padBottom = 50;

  const chartWidth = svgWidth - padLeft - padRight;
  const chartHeight = svgHeight - padTop - padBottom;

  const { minVal, maxVal, coordinates, pathD, areaD, yTicks } = useMemo(() => {
    if (filteredPoints.length === 0) {
      return {
        minVal: 0,
        maxVal: 0,
        coordinates: [],
        pathD: '',
        areaD: '',
        yTicks: [0],
      };
    }

    const balances = filteredPoints.map((p) => p.closingBankBalance);
    let min = Math.min(...balances);
    let max = Math.max(...balances);

    // Padding on Y axis so points do not clip
    if (min === max) {
      min = Math.max(0, min - 25000);
      max = max + 25000;
    } else {
      const span = max - min;
      min = Math.max(0, min - span * 0.1);
      max = max + span * 0.15;
    }

    // 4 Y axis grid ticks
    const ticks: number[] = [];
    const step = (max - min) / 3;
    for (let i = 0; i <= 3; i++) {
      ticks.push(Math.round(min + step * i));
    }

    const coords = filteredPoints.map((p, idx) => {
      const x =
        filteredPoints.length === 1
          ? padLeft + chartWidth / 2
          : padLeft + (idx / (filteredPoints.length - 1)) * chartWidth;
      const y =
        max === min
          ? padTop + chartHeight / 2
          : padTop + chartHeight - ((p.closingBankBalance - min) / (max - min)) * chartHeight;
      return { x, y, point: p };
    });

    // Build SVG polyline path
    let pD = '';
    let aD = '';
    if (coords.length > 0) {
      pD = `M ${coords[0].x} ${coords[0].y}`;
      for (let i = 1; i < coords.length; i++) {
        pD += ` L ${coords[i].x} ${coords[i].y}`;
      }
      const baselineY = padTop + chartHeight;
      aD = `${pD} L ${coords[coords.length - 1].x} ${baselineY} L ${coords[0].x} ${baselineY} Z`;
    }

    return {
      minVal: min,
      maxVal: max,
      coordinates: coords,
      pathD: pD,
      areaD: aD,
      yTicks: ticks,
    };
  }, [filteredPoints, chartWidth, chartHeight]);

  const activePoint =
    hoveredPointIndex !== null && coordinates[hoveredPointIndex]
      ? coordinates[hoveredPointIndex]
      : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
      {/* Header and Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Landmark className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">
              Bank Balance Fluctuations Summary
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological bank balance fluctuations reconstructed from verified ledger transactions
            (excludes Fixed Deposits)
          </p>
        </div>

        {/* Filter Controls: Bank Selector + Date Range */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Bank Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <span className="text-[11px] font-medium text-slate-500 uppercase">Bank:</span>
            <select
              value={selectedBankId}
              onChange={(e) => {
                setSelectedBankId(e.target.value);
                setHoveredPointIndex(null);
              }}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
            >
              {banks.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Date Range: Start Date & End Date */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setHoveredPointIndex(null);
                }}
                className="bg-transparent text-xs text-slate-700 focus:outline-none"
                title="Start Date"
              />
            </div>
            <span className="text-xs text-slate-400 font-medium">to</span>
            <div className="flex items-center gap-1 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setHoveredPointIndex(null);
                }}
                className="bg-transparent text-xs text-slate-700 focus:outline-none"
                title="End Date"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Date Validation Alert */}
      {dateError && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{dateError}</span>
        </div>
      )}

      {/* Main Chart Body */}
      {allPointsForBank.length === 0 ? (
        <div className="py-14 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
            <Landmark className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-700">
            Historical Ledger Data Unavailable for {selectedBank?.name}
          </p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            This partner bank has no recorded customer ledger transactions or initial deposits
            registered in the system.
          </p>
        </div>
      ) : filteredPoints.length === 0 ? (
        <div className="py-14 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-2">
            <Calendar className="w-5 h-5" />
          </div>
          <p className="text-xs font-semibold text-slate-700">
            No Transactions in Selected Date Range
          </p>
          <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
            {selectedBank?.name} has {allPointsForBank.length} recorded ledger transaction(s), but
            none occurred between {startDate} and {endDate}.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Active Data Point Inspection Tooltip */}
          {activePoint && (
            <div
              className="absolute z-20 pointer-events-none transition-all duration-150 transform -translate-x-1/2 -translate-y-full"
              style={{
                left: `${(activePoint.x / svgWidth) * 100}%`,
                top: `${(activePoint.y / svgHeight) * 100 - 4}%`,
              }}
            >
              <div className="bg-slate-900 text-white rounded-lg px-3 py-2 shadow-xl border border-slate-700 text-xs space-y-1 min-w-[190px]">
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
                  <span className="font-semibold text-blue-300 truncate max-w-[120px]">
                    {selectedBank?.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activePoint.point.transactionDate}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Closing Balance:</span>
                  <span className="font-bold text-emerald-400 tabular-nums">
                    {formatINR(activePoint.point.closingBankBalance)}
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 pt-0.5 border-t border-slate-800 flex items-center justify-between">
                  <span className="truncate max-w-[110px]">{activePoint.point.customerName}</span>
                  <span
                    className={
                      activePoint.point.direction === 'Inflow'
                        ? 'text-emerald-400 font-semibold'
                        : activePoint.point.direction === 'Outflow'
                        ? 'text-rose-400 font-semibold'
                        : 'text-slate-300 font-semibold'
                    }
                  >
                    {activePoint.point.direction === 'Inflow' ? '+' : activePoint.point.direction === 'Outflow' ? '−' : ''}{' '}
                    {formatINR(activePoint.point.amount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SVG Interactive Line Chart */}
          <div className="w-full overflow-x-auto">
            <svg
              className="w-full h-auto min-w-[640px]"
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              onMouseLeave={() => setHoveredPointIndex(null)}
            >
              <defs>
                {/* Subtle Area Gradient */}
                <linearGradient id="balanceAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Horizontal Gridlines & Y-axis labels */}
              {yTicks.map((val, idx) => {
                const y =
                  maxVal === minVal
                    ? padTop + chartHeight / 2
                    : padTop +
                      chartHeight -
                      ((val - minVal) / (maxVal - minVal || 1)) * chartHeight;

                return (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={y}
                      x2={padLeft + chartWidth}
                      y2={y}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={padLeft - 10}
                      y={y + 3.5}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 font-mono font-medium"
                    >
                      {formatINR(val)}
                    </text>
                  </g>
                );
              })}

              {/* Shaded Area Under Curve */}
              {areaD && <path d={areaD} fill="url(#balanceAreaGrad)" />}

              {/* Main Line Stroke */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Data Points with Hover & Tap Interactions */}
              {coordinates.map((coord, idx) => {
                const isHovered = hoveredPointIndex === idx;

                return (
                  <g key={coord.point.id || idx}>
                    {/* Vertical reference guideline on hover */}
                    {isHovered && (
                      <line
                        x1={coord.x}
                        y1={padTop}
                        x2={coord.x}
                        y2={padTop + chartHeight}
                        stroke="#94A3B8"
                        strokeDasharray="3 3"
                        strokeWidth="1.5"
                      />
                    )}

                    {/* Circular Marker */}
                    <circle
                      cx={coord.x}
                      cy={coord.y}
                      r={isHovered ? 7 : 5}
                      fill={isHovered ? '#1D4ED8' : '#2563EB'}
                      stroke="#FFFFFF"
                      strokeWidth={isHovered ? 3 : 2}
                      className="cursor-pointer transition-all duration-150"
                      onMouseEnter={() => setHoveredPointIndex(idx)}
                      onTouchStart={() => setHoveredPointIndex(idx)}
                    />

                    {/* X-axis Date Labels */}
                    <text
                      x={coord.x}
                      y={padTop + chartHeight + 20}
                      textAnchor="middle"
                      className={`text-[10px] font-mono transition-colors ${
                        isHovered ? 'fill-blue-700 font-bold' : 'fill-slate-500 font-medium'
                      }`}
                    >
                      {coord.point.transactionDate.slice(5)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Footer Ledger Legend */}
          <div className="pt-2 flex flex-wrap items-center justify-between text-xs text-slate-500 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
              <span>
                {selectedBank?.name}:{' '}
                <strong className="text-slate-800">
                  {formatINR(
                    filteredPoints[filteredPoints.length - 1]?.closingBankBalance || 0
                  )}
                </strong>{' '}
                closing balance as of{' '}
                {filteredPoints[filteredPoints.length - 1]?.transactionDate || endDate}
              </span>
            </span>
            <span className="text-[11px] text-slate-400">
              Hover/tap points to inspect exact closing balance
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
