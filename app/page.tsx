'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  OverheadState,
  EstimateLineItem,
  ProjectSettings,
  ContractorProfile,
  ClientInfo,
} from '../lib/types';
import {
  defaultOverheadState,
  defaultContractorProfile,
  sampleProjects,
} from '../lib/sampleData';
import {
  calculateProjectEstimate,
  calculateOverheadBurdenRate,
  formatCurrency,
  formatPercent,
} from '../lib/calculator';
import { Header } from '../components/Header';
import { OverheadCalculator } from '../components/OverheadCalculator';
import { EstimatorTable } from '../components/EstimatorTable';
import { DashboardGauges } from '../components/DashboardGauges';
import { ClientProposalView } from '../components/ClientProposalView';
import { CompanyProfileModal } from '../components/CompanyProfileModal';
import {
  Building2,
  FileSpreadsheet,
  LayoutDashboard,
  FileText,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

const STORAGE_KEY = 'trade_estimator_pro_state_v1';

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overhead' | 'estimator' | 'dashboard' | 'proposal'>('estimator');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Core Application State
  const [overhead, setOverhead] = useState<OverheadState>(defaultOverheadState);
  const [profile, setProfile] = useState<ContractorProfile>(defaultContractorProfile);
  const [client, setClient] = useState<ClientInfo>(sampleProjects.remodel.client);
  const [settings, setSettings] = useState<ProjectSettings>(sampleProjects.remodel.settings);
  const [items, setItems] = useState<EstimateLineItem[]>(sampleProjects.remodel.items);

  // Initialize and persist state with LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.overhead) setOverhead(parsed.overhead);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.client) setClient(parsed.client);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.items) setItems(parsed.items);
      }
    } catch (e) {
      console.warn('Could not restore from localStorage:', e);
    }

    // Check system dark mode
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      setDarkMode(true);
    }

    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const bundle = { overhead, profile, client, settings, items };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }, [mounted, overhead, profile, client, settings, items]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Derived calculation metrics memoized for maximum performance
  const { burdenRatePerHour } = useMemo(
    () => calculateOverheadBurdenRate(overhead),
    [overhead]
  );
  const calculationResult = useMemo(
    () => calculateProjectEstimate(items, overhead, settings),
    [items, overhead, settings]
  );

  // Preset Loaders
  const handleSelectSample = (key: string) => {
    const selected = sampleProjects[key];
    if (selected) {
      setClient(selected.client);
      setSettings(selected.settings);
      setItems(selected.items);
      setActiveTab('dashboard');
    }
  };

  const handleResetWorkspace = () => {
    if (confirm('Reset to a new blank project estimate? Your overhead settings will be kept.')) {
      setItems([]);
      setClient({
        name: 'New Client',
        projectTitle: 'Residential Estimate',
        address: '123 Main St',
        phone: '',
        email: '',
        estimateNumber: `EST-${Date.now().toString().slice(-4)}`,
        date: new Date().toISOString().split('T')[0],
      });
      setActiveTab('estimator');
    }
  };

  // Export JSON Backup
  const handleExportBackup = () => {
    const bundle = { overhead, profile, client, settings, items, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TradeEstimator-Backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.overhead) setOverhead(parsed.overhead);
        if (parsed.profile) setProfile(parsed.profile);
        if (parsed.client) setClient(parsed.client);
        if (parsed.settings) setSettings(parsed.settings);
        if (parsed.items) setItems(parsed.items);
        alert('Estimate project successfully restored from backup file!');
      } catch (err) {
        alert('Invalid JSON backup file provided.');
      }
    };
    reader.readAsText(file);
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-semibold tracking-wide">Starting TradeEstimator PRO...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header Bar */}
      <Header
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onSelectSample={handleSelectSample}
        onReset={handleResetWorkspace}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto p-1 bg-slate-200/60 dark:bg-slate-900/80 rounded-2xl border border-slate-300/40 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('overhead')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'overhead'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="h-4 w-4 shrink-0" />
              <span>
                <span className="inline sm:hidden">1. Burden</span>
                <span className="hidden sm:inline">1. Overhead Burden Rate</span>
              </span>
              <span className="text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950 font-mono text-indigo-600 dark:text-indigo-400">
                {formatCurrency(burdenRatePerHour)}/hr
              </span>
            </button>

            <button
              onClick={() => setActiveTab('estimator')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'estimator'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileSpreadsheet className="h-4 w-4 shrink-0" />
              <span>
                <span className="inline sm:hidden">2. Estimator</span>
                <span className="hidden sm:inline">2. Multi-Trade Direct Estimator</span>
              </span>
              <span className="text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 font-mono">
                {items.length} items
              </span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              <span>
                <span className="inline sm:hidden">3. Dashboard</span>
                <span className="hidden sm:inline">3. Executive Dashboard</span>
              </span>
              <span
                className={`text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full font-mono font-bold ${
                  calculationResult.isUnderbidding
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                }`}
              >
                {formatPercent(calculationResult.grossMarginPercent)}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('proposal')}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === 'proposal'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span>
                <span className="inline sm:hidden">4. Proposal</span>
                <span className="hidden sm:inline">4. Client Proposal & PDF</span>
              </span>
            </button>
          </div>

          {/* Quick status bar */}
          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider">
                Current Bid
              </span>
              <span className="font-mono font-extrabold text-slate-900 dark:text-white text-sm">
                {formatCurrency(calculationResult.contractPrice)}
              </span>
            </div>
            {calculationResult.isUnderbidding && (
              <span
                title="Under-bidding risk detected! Check dashboard."
                className="p-1.5 rounded-lg bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 animate-bounce"
              >
                <ShieldAlert className="h-4 w-4" />
              </span>
            )}
          </div>
        </div>

        {/* Tab Module Rendering */}
        {activeTab === 'overhead' && (
          <OverheadCalculator overhead={overhead} onChange={setOverhead} />
        )}

        {activeTab === 'estimator' && (
          <EstimatorTable
            items={items}
            settings={settings}
            overheadBurdenRate={burdenRatePerHour}
            onItemsChange={setItems}
            onSettingsChange={setSettings}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardGauges calc={calculationResult} pricingModel={settings.pricingModel} />
        )}

        {activeTab === 'proposal' && (
          <ClientProposalView
            profile={profile}
            client={client}
            items={items}
            settings={settings}
            calc={calculationResult}
            onUpdateClient={setClient}
            onUpdateSettings={setSettings}
          />
        )}
      </main>

      {/* Company Profile Modal */}
      <CompanyProfileModal
        isOpen={isProfileModalOpen}
        profile={profile}
        onClose={() => setIsProfileModalOpen(false)}
        onSave={(p) => setProfile(p)}
      />
    </div>
  );
}
