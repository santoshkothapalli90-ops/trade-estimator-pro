'use client';

import React, { useState } from 'react';
import {
  EstimateLineItem,
  LineItemCategory,
  ProjectSettings,
} from '../lib/types';
import {
  calculateLineItemCost,
  formatCurrency,
  safeNumber,
} from '../lib/calculator';
import {
  Plus,
  Trash2,
  Boxes,
  Hammer,
  Truck,
  Wrench,
  Percent,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';

interface EstimatorTableProps {
  items: EstimateLineItem[];
  settings: ProjectSettings;
  overheadBurdenRate: number;
  onItemsChange: (items: EstimateLineItem[]) => void;
  onSettingsChange: (settings: ProjectSettings) => void;
}

const CATEGORY_TABS: { id: LineItemCategory | 'all'; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'All Items', icon: <Boxes className="h-3.5 w-3.5" /> },
  { id: 'materials', label: 'Materials', icon: <Boxes className="h-3.5 w-3.5 text-blue-500" /> },
  { id: 'labor', label: 'Labor', icon: <Hammer className="h-3.5 w-3.5 text-amber-500" /> },
  { id: 'subs', label: 'Subcontractors', icon: <Truck className="h-3.5 w-3.5 text-emerald-500" /> },
  { id: 'equipment', label: 'Equipment & Rentals', icon: <Wrench className="h-3.5 w-3.5 text-purple-500" /> },
];

export const EstimatorTable: React.FC<EstimatorTableProps> = ({
  items,
  settings,
  overheadBurdenRate,
  onItemsChange,
  onSettingsChange,
}) => {
  const [filterCat, setFilterCat] = useState<LineItemCategory | 'all'>('all');

  // Form for fast adding new line items
  const [trade, setTrade] = useState('Remodeling');
  const [category, setCategory] = useState<LineItemCategory>('materials');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('each');
  const [unitCost, setUnitCost] = useState('');
  const [wastePercent, setWastePercent] = useState('10');

  const filteredItems = items.filter(
    (item) => filterCat === 'all' || item.category === filterCat
  );

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newItem: EstimateLineItem = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`,
      trade: trade.trim() || 'General',
      category,
      description: description.trim(),
      quantity: safeNumber(quantity, 1, 0.1),
      unit: unit.trim() || 'each',
      unitCost: safeNumber(unitCost, 0),
      wastePercent: category === 'materials' ? safeNumber(wastePercent, 0) : 0,
    };

    onItemsChange([...items, newItem]);
    setDescription('');
    setUnitCost('');
    if (category === 'labor') setUnit('hrs');
  };

  const handleUpdateItem = (id: string, field: keyof EstimateLineItem, val: unknown) => {
    const updated = items.map((item) => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    });
    onItemsChange(updated);
  };

  const handleRemoveItem = (id: string, desc?: string) => {
    const itemName = desc ? `"${desc}"` : 'this line item';
    if (window.confirm(`Are you sure you want to delete ${itemName}?`)) {
      onItemsChange(items.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Pricing Strategy Control Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white uppercase tracking-wider">
                Pricing Strategy & Target Margins
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Prevent contractor math error: <strong>25% Markup</strong> yields only <strong>20% Gross Margin</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Model Toggle: Markup vs Gross Margin */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => onSettingsChange({ ...settings, pricingModel: 'margin' })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  settings.pricingModel === 'margin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Target Gross Margin %
              </button>
              <button
                type="button"
                onClick={() => onSettingsChange({ ...settings, pricingModel: 'markup' })}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                  settings.pricingModel === 'markup'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Markup on Cost %
              </button>
            </div>

            {/* Target Percentage Input */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label htmlFor="target-rate-input" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                {settings.pricingModel === 'margin' ? 'Target Margin:' : 'Markup %:'}
              </label>
              <input
                id="target-rate-input"
                type="number"
                min="0"
                max="90"
                step="1"
                value={settings.targetRatePercent}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    targetRatePercent: safeNumber(e.target.value, 20),
                  })
                }
                className="w-16 text-right px-2 py-1 text-xs font-mono font-bold rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-400">%</span>
            </div>

            {/* Contingency Buffer % */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label htmlFor="contingency-input" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Contingency:
              </label>
              <input
                id="contingency-input"
                type="number"
                min="0"
                max="30"
                step="1"
                value={settings.contingencyPercent}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    contingencyPercent: safeNumber(e.target.value, 0),
                  })
                }
                className="w-14 text-right px-2 py-1 text-xs font-mono font-bold rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-400">%</span>
            </div>

            {/* Sales Tax % */}
            <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <label htmlFor="salestax-input" className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Sales Tax:
              </label>
              <input
                id="salestax-input"
                type="number"
                min="0"
                max="15"
                step="0.25"
                value={settings.salesTaxPercent}
                onChange={(e) =>
                  onSettingsChange({
                    ...settings,
                    salesTaxPercent: safeNumber(e.target.value, 0),
                  })
                }
                className="w-16 text-right px-2 py-1 text-xs font-mono font-bold rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-slate-400">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Line Item Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <Plus className="h-3.5 w-3.5 text-indigo-500" />
          Add Direct Estimate Line Item
        </h4>

        <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
          {/* Category */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Cost Type</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => {
                  const val = e.target.value as LineItemCategory;
                  setCategory(val);
                  if (val === 'labor') setUnit('hrs');
                  else if (val === 'materials') setUnit('sqft');
                  else if (val === 'subs') setUnit('lump sum');
                  else if (val === 'equipment') setUnit('rental');
                }}
                className="w-full text-xs font-medium py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="materials">Materials</option>
                <option value="labor">Labor</option>
                <option value="subs">Subcontractor</option>
                <option value="equipment">Equipment</option>
              </select>
              <ChevronDown className="h-3.5 w-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {/* Trade / Specialty */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Trade / Phase</label>
            <input
              type="text"
              placeholder="e.g. Electrical, Tile"
              value={trade}
              onChange={(e) => setTrade(e.target.value)}
              className="w-full text-xs py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Scope Description */}
          <div className="lg:col-span-4">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">Scope Item Description</label>
            <input
              type="text"
              placeholder="e.g. 2x4 Framing studs, 4-gang electrical panel..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs py-2 px-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Quantity & Unit */}
          <div className="lg:col-span-2 flex gap-1">
            <div className="w-1/2">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Qty</label>
              <input
                type="number"
                min="0"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full text-xs font-mono py-2 px-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="w-1/2">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Unit</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full text-xs py-2 px-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Unit Cost */}
          <div className="lg:col-span-2">
            <label className="block text-[11px] font-medium text-slate-500 mb-1">
              {category === 'labor' ? 'Direct Wage $/hr' : 'Cost / Unit ($)'}
            </label>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">$</span>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="0.00"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full pl-6 pr-2 py-2 text-xs font-mono font-semibold rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Waste Factor for Materials */}
          {category === 'materials' && (
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-medium text-slate-500 mb-1">Waste Factor %</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={wastePercent}
                  onChange={(e) => setWastePercent(e.target.value)}
                  className="w-full pr-6 pl-2.5 py-2 text-xs font-mono rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <Percent className="h-3 w-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          )}

          {/* Submit button */}
          <div className={`${category === 'materials' ? 'lg:col-span-10' : 'lg:col-span-12'} flex justify-end`}>
            <button
              type="submit"
              disabled={!description.trim() || !unitCost}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-sm flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Add to Estimate</span>
            </button>
          </div>
        </form>
      </div>

      {/* Line Items List / Card Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Category Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 overflow-x-auto">
          {CATEGORY_TABS.map((tab) => {
            const count =
              tab.id === 'all'
                ? items.length
                : items.filter((i) => i.category === tab.id).length;
            return (
              <button
                key={tab.id}
                onClick={() => setFilterCat(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition ${
                  filterCat === tab.id
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 font-mono">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Item Rows */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No items in this category yet. Use the form above to add items.
            </div>
          ) : (
            filteredItems.map((item) => {
              const directCost = calculateLineItemCost(item);
              const isLabor = item.category === 'labor';
              const laborBurden = isLabor ? item.quantity * overheadBurdenRate : 0;

              return (
                <div
                  key={item.id}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.trade}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          item.category === 'materials'
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                            : item.category === 'labor'
                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : item.category === 'subs'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                        }`}
                      >
                        {item.category.toUpperCase()}
                      </span>
                      {item.wastePercent > 0 && item.category === 'materials' && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">
                          +{item.wastePercent}% waste
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">
                      {item.description}
                    </p>
                    {isLabor && overheadBurdenRate > 0 && (
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                        <span>Direct: {formatCurrency(directCost)}</span>
                        <span>+</span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                          Overhead Burden ({item.quantity} hrs × {formatCurrency(overheadBurdenRate)}/hr = {formatCurrency(laborBurden)})
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4">
                    {/* Inline Editable Qty & Unit Cost */}
                    <div className="flex items-center gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'quantity', safeNumber(e.target.value, 0))
                          }
                          className="w-14 px-1.5 py-1 text-center font-mono rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                        <span className="text-slate-400 text-[11px]">{item.unit}</span>
                      </div>
                      <span className="text-slate-400">×</span>
                      <div className="relative">
                        <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">$</span>
                        <input
                          type="number"
                          step="any"
                          value={item.unitCost}
                          onChange={(e) =>
                            handleUpdateItem(item.id, 'unitCost', safeNumber(e.target.value, 0))
                          }
                          className="w-16 pl-4 pr-1 py-1 text-right font-mono rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>

                    {/* Direct Cost Total */}
                    <div className="text-right min-w-[90px]">
                      <span className="block text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(directCost)}
                      </span>
                      <span className="text-[10px] text-slate-400">Direct Cost</span>
                    </div>

                    {/* Delete Action */}
                    <button
                      onClick={() => handleRemoveItem(item.id, item.description)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                      title="Delete item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
