'use client';

import React from 'react';
import { ProjectCalculationResult } from '../lib/types';
import { formatCurrency, formatPercent } from '../lib/calculator';
import {
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  Briefcase,
  Layers,
  Scale,
  TrendingUp,
  ShieldAlert,
} from 'lucide-react';

interface DashboardGaugesProps {
  calc: ProjectCalculationResult;
  pricingModel: 'markup' | 'margin';
}

export const DashboardGauges: React.FC<DashboardGaugesProps> = ({
  calc,
  pricingModel,
}) => {
  // Margin Health Determination:
  // < 15%: Danger (Red)
  // 15% - 24.9%: Warning (Amber)
  // 25% - 39.9%: Good / Healthy (Emerald)
  // 40%+: Premium (Indigo)
  let healthColor = 'text-emerald-500';
  let badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
  let healthLabel = 'Healthy Margin';

  if (calc.grossMarginPercent < 15 || calc.netProfitDollar <= 0) {
    healthColor = 'text-rose-500';
    badgeColor = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    healthLabel = 'Under-bidding Danger';
  } else if (calc.grossMarginPercent < 25) {
    healthColor = 'text-amber-500';
    badgeColor = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800';
    healthLabel = 'Thin Margin Warning';
  } else if (calc.grossMarginPercent >= 40) {
    healthColor = 'text-indigo-500';
    badgeColor = 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800';
    healthLabel = 'Premium Target Margin';
  }

  return (
    <div className="space-y-6">
      {/* Critical Under-bidding Alert Banner */}
      {calc.isUnderbidding && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-start gap-3 animate-pulse">
          <ShieldAlert className="h-5 w-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wide">
              Under-Bidding Guard Triggered
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-400">
              {calc.underbiddingWarning ||
                'This project margin is critically thin. After accounting for indirect business burden and field overhead, your net profit will likely disappear.'}
            </p>
          </div>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Contract Bid */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Contract Price (Bid)</span>
            <DollarSign className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {formatCurrency(calc.contractPrice)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Client-facing price (incl. {formatCurrency(calc.salesTaxAmount)} tax)
          </p>
        </div>

        {/* Direct Job Cost */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Direct Job Costs</span>
            <Briefcase className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {formatCurrency(calc.directJobCost)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Materials, direct wages, subs & equipment
          </p>
        </div>

        {/* True Breakeven Cost */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">True Breakeven Cost</span>
            <Scale className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-mono">
            {formatCurrency(calc.trueBreakevenCost)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Includes {formatCurrency(calc.totalOverheadBurdenCost)} indirect burden
          </p>
        </div>

        {/* Net Profit */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
            <span className="font-semibold uppercase tracking-wider">Net Business Profit</span>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono ${calc.netProfitDollar <= 0 ? 'text-rose-600' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {formatCurrency(calc.netProfitDollar)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatPercent(calc.netMarginPercent)} net profit margin
          </p>
        </div>
      </div>

      {/* Margin Gauge Visualizer & Cost Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Margin Gauge Card */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Gross Profit Margin Gauge
              </h3>
              <p className="text-xs text-slate-500">
                Calculated on Contract Revenue: (Price - Direct Costs) / Price
              </p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${badgeColor}`}>
              {healthLabel}
            </span>
          </div>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-5xl font-black font-mono tracking-tight my-2">
              <span className={healthColor}>{formatPercent(calc.grossMarginPercent)}</span>
            </div>
            <span className="text-xs text-slate-500">
              Pricing model used:{' '}
              <span className="font-bold uppercase text-slate-700 dark:text-slate-300">
                {pricingModel}
              </span>
            </span>

            {/* Visual Gauge Bar */}
            <div className="w-full mt-6 space-y-2">
              <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${Math.min(100, Math.max(0, calc.grossMarginPercent))}%` }}
                  className={`h-full transition-all duration-500 ${
                    calc.grossMarginPercent < 15
                      ? 'bg-rose-500'
                      : calc.grossMarginPercent < 25
                      ? 'bg-amber-500'
                      : calc.grossMarginPercent < 40
                      ? 'bg-emerald-500'
                      : 'bg-indigo-500'
                  }`}
                />
              </div>

              {/* Threshold Guides */}
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>0% Breakeven</span>
                <span>15% Min</span>
                <span>25% Target</span>
                <span>40%+ Premium</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="block text-slate-400 text-[10px]">Overhead Burden Share</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatCurrency(calc.totalOverheadBurdenCost)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                ({calc.totalLaborHours} labor hrs × {formatCurrency(calc.overheadBurdenRatePerHour)}/hr)
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="block text-slate-400 text-[10px]">Contingency Reserve</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {formatCurrency(calc.contingencyAmount)}
              </span>
              <span className="text-[10px] text-slate-500 block">Risk protection buffer</span>
            </div>
          </div>
        </div>

        {/* Cost Breakdown Composition */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Direct Cost Distribution
              </h3>
              <p className="text-xs text-slate-500">Breakdown of outbound project expenses</p>
            </div>
            <Layers className="h-4 w-4 text-slate-400" />
          </div>

          <div className="space-y-3 pt-2">
            {/* Materials */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Materials & Supplies</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(calc.totalMaterialsCost)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${calc.directJobCost > 0 ? (calc.totalMaterialsCost / calc.directJobCost) * 100 : 0}%`,
                  }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            </div>

            {/* Direct Labor */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Direct Field Wages</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(calc.totalDirectLaborCost)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${calc.directJobCost > 0 ? (calc.totalDirectLaborCost / calc.directJobCost) * 100 : 0}%`,
                  }}
                  className="h-full bg-amber-500 rounded-full"
                />
              </div>
            </div>

            {/* Subcontractors */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Subcontractor Trade Fees</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(calc.totalSubcontractorCost)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${calc.directJobCost > 0 ? (calc.totalSubcontractorCost / calc.directJobCost) * 100 : 0}%`,
                  }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>

            {/* Equipment */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300 font-medium">Equipment Rentals & Dumpster</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(calc.totalEquipmentCost)}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  style={{
                    width: `${calc.directJobCost > 0 ? (calc.totalEquipmentCost / calc.directJobCost) * 100 : 0}%`,
                  }}
                  className="h-full bg-purple-500 rounded-full"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>Total Direct Cost:</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
              {formatCurrency(calc.directJobCost)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
