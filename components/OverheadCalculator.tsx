'use client';

import React, { useState } from 'react';
import { OverheadState, OverheadCategory } from '../lib/types';
import {
  calculateOverheadBurdenRate,
  formatCurrency,
  safeNumber,
} from '../lib/calculator';
import { Plus, Trash2, HelpCircle, Users, Clock, Calendar, Info, TrendingUp } from 'lucide-react';

interface OverheadCalculatorProps {
  overhead: OverheadState;
  onChange: (updated: OverheadState) => void;
}

export const OverheadCalculator: React.FC<OverheadCalculatorProps> = ({
  overhead,
  onChange,
}) => {
  const [newExpName, setNewExpName] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);

  const {
    totalAnnualExpenses,
    grossAnnualHours,
    netBillableHours,
    burdenRatePerHour,
  } = calculateOverheadBurdenRate(overhead);

  const handleUpdateExpense = (id: string, amount: number) => {
    const updated = overhead.expenses.map((exp) =>
      exp.id === id ? { ...exp, amount: safeNumber(amount, 0) } : exp
    );
    onChange({ ...overhead, expenses: updated });
  };

  const handleRemoveExpense = (id: string) => {
    const updated = overhead.expenses.filter((exp) => exp.id !== id);
    onChange({ ...overhead, expenses: updated });
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpName.trim()) return;

    const newItem: OverheadCategory = {
      id: `exp-${Date.now()}`,
      name: newExpName.trim(),
      amount: safeNumber(newExpAmount, 0),
    };

    onChange({
      ...overhead,
      expenses: [...overhead.expenses, newItem],
    });
    setNewExpName('');
    setNewExpAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Summary Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-700/50">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold tracking-wide border border-indigo-400/30">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>INDIRECT BURDEN RATE FORMULA</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Contractor Overhead Recovery Engine
            </h2>
            <p className="text-sm text-indigo-200 leading-relaxed max-w-xl">
              Most contractors fail because they only charge direct wages. This module calculates your
              mandatory indirect cost burden per billable hour so every job pays for your business operations.
            </p>
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="text-xs text-amber-300 hover:text-amber-200 underline font-medium inline-flex items-center gap-1 pt-1"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              {showExplanation ? 'Hide how this is calculated' : 'Why is direct labor not enough?'}
            </button>
          </div>

          <div className="lg:col-span-5 bg-white/10 backdrop-blur-md rounded-xl p-5 border border-white/20 text-center flex flex-col items-center justify-center">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Your Business Overhead Burden
            </span>
            <div className="text-4xl sm:text-5xl font-black text-amber-400 my-1 font-mono">
              {formatCurrency(burdenRatePerHour)}
              <span className="text-lg font-normal text-indigo-200">/hr</span>
            </div>
            <span className="text-xs text-slate-300">
              Automatically added to every labor hour on project estimates
            </span>
            <div className="mt-4 pt-3 border-t border-white/10 w-full grid grid-cols-2 text-xs text-indigo-100">
              <div>
                <span className="block text-slate-400">Total Fixed Overhead</span>
                <span className="font-semibold text-white">{formatCurrency(totalAnnualExpenses)}/yr</span>
              </div>
              <div>
                <span className="block text-slate-400">Net Billable Hours</span>
                <span className="font-semibold text-white">{Math.round(netBillableHours).toLocaleString()} hrs/yr</span>
              </div>
            </div>
          </div>
        </div>

        {showExplanation && (
          <div className="mt-5 p-4 rounded-xl bg-slate-950/60 border border-indigo-500/40 text-xs text-slate-300 space-y-2 animate-in fade-in">
            <p className="font-semibold text-amber-300">The Contractor Trap Explained:</p>
            <p>
              If you pay a carpenter <strong>$35/hr</strong> and quote that exact $35/hr on bids, you are paying your company’s truck insurance,
              rent, software, and bookkeeper out of your own personal pocket!
            </p>
            <p>
              With your calculated burden rate of <strong>{formatCurrency(burdenRatePerHour)}/hr</strong>, the true cost of employing that carpenter
              on-site is <strong>{formatCurrency(35 + burdenRatePerHour)}/hr</strong> <em>before</em> any profit margin markup.
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Production Capacity Settings */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              Billable Production Capacity
            </h3>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <label htmlFor="crew-size" className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    Billable Crew Size (Field Technicians)
                  </label>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {overhead.activeCrewSize} people
                  </span>
                </div>
                <input
                  id="crew-size"
                  type="range"
                  min="1"
                  max="25"
                  step="1"
                  value={overhead.activeCrewSize}
                  onChange={(e) =>
                    onChange({
                      ...overhead,
                      activeCrewSize: safeNumber(e.target.value, 1, 1),
                    })
                  }
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] text-slate-500">Include yourself only if you work hands-on on jobs.</span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <label htmlFor="hours-week" className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-slate-400" />
                    Hours Worked per Week
                  </label>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {overhead.hoursPerWeek} hrs
                  </span>
                </div>
                <input
                  id="hours-week"
                  type="range"
                  min="20"
                  max="60"
                  step="1"
                  value={overhead.hoursPerWeek}
                  onChange={(e) =>
                    onChange({
                      ...overhead,
                      hoursPerWeek: safeNumber(e.target.value, 40, 1),
                    })
                  }
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <label htmlFor="weeks-year" className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-slate-400" />
                    Working Weeks per Year
                  </label>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {overhead.weeksPerYear} weeks
                  </span>
                </div>
                <input
                  id="weeks-year"
                  type="range"
                  min="30"
                  max="52"
                  step="1"
                  value={overhead.weeksPerYear}
                  onChange={(e) =>
                    onChange({
                      ...overhead,
                      weeksPerYear: safeNumber(e.target.value, 50, 1),
                    })
                  }
                  className="w-full accent-indigo-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] text-slate-500">Accounts for holidays, weather, and vacation.</span>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <label htmlFor="downtime-pct" className="flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                    Non-Billable Downtime & Travel %
                  </label>
                  <span className="font-bold text-amber-600 dark:text-amber-400 font-mono">
                    {overhead.unbillablePercent}%
                  </span>
                </div>
                <input
                  id="downtime-pct"
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={overhead.unbillablePercent}
                  onChange={(e) =>
                    onChange({
                      ...overhead,
                      unbillablePercent: safeNumber(e.target.value, 15, 0),
                    })
                  }
                  className="w-full accent-amber-500 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
                <span className="text-[11px] text-slate-500">
                  Drive time, supply warehouse runs, cleanup, and morning meetings.
                </span>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Theoretical Crew Hours:</span>
                <span className="font-mono font-medium">{grossAnnualHours.toLocaleString()} hrs</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Downtime Deduction:</span>
                <span className="font-mono text-rose-500">
                  -{Math.round(grossAnnualHours - netBillableHours).toLocaleString()} hrs
                </span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-700">
                <span>Actual Billable Capacity:</span>
                <span className="font-mono text-indigo-600 dark:text-indigo-400">
                  {Math.round(netBillableHours).toLocaleString()} hrs/yr
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Annual Indirect Overhead Expenses */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Annual Indirect Fixed Expenses
                </h3>
                <p className="text-xs text-slate-500">
                  Costs your business incurs regardless of whether you have an active job today.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Expenses</span>
                <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
                  {formatCurrency(totalAnnualExpenses)}
                </span>
              </div>
            </div>

            {/* Expenses List */}
            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {overhead.expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
                >
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200 block truncate">
                      {exp.name}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatCurrency(exp.amount / 12)} / month
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={exp.amount === 0 ? '' : exp.amount}
                        placeholder="0"
                        onChange={(e) =>
                          handleUpdateExpense(exp.id, parseFloat(e.target.value) || 0)
                        }
                        className="w-28 pl-6 pr-2 py-1 text-right text-xs font-mono font-semibold rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveExpense(exp.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Remove expense"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add New Expense Form */}
            <form onSubmit={handleAddExpense} className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex gap-2">
              <input
                type="text"
                placeholder="New expense (e.g. Storage Unit, CPA Fees)..."
                value={newExpName}
                onChange={(e) => setNewExpName(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="relative w-28">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  $
                </span>
                <input
                  type="number"
                  placeholder="Annual $"
                  value={newExpAmount}
                  onChange={(e) => setNewExpAmount(e.target.value)}
                  className="w-full pl-6 pr-2 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="submit"
                disabled={!newExpName.trim()}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white flex items-center gap-1 shadow-sm transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
