'use client';

import React from 'react';
import { HardHat, Moon, Sun, RotateCcw, FolderDown, FileUp, Sparkles, Building2 } from 'lucide-react';

interface HeaderProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onSelectSample: (key: string) => void;
  onReset: () => void;
  onOpenProfile: () => void;
  onExportBackup: () => void;
  onImportBackup: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  darkMode,
  onToggleDarkMode,
  onSelectSample,
  onReset,
  onOpenProfile,
  onExportBackup,
  onImportBackup,
}) => {
  const [isPresetOpen, setIsPresetOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsPresetOpen(false);
      }
    };
    if (isPresetOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPresetOpen]);
  return (
    <header className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors bg-white/90 border-slate-200 dark:bg-slate-900/90 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <HardHat className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                TradeEstimator <span className="text-indigo-600 dark:text-indigo-400">PRO</span>
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                PWA Active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              Contractor Overhead Burden & Bid Margin Protection
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Preset Selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsPresetOpen(!isPresetOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-950/70 dark:text-indigo-300 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 transition"
              title="Load pre-built realistic trade scenarios"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-500" />
              <span className="hidden md:inline">Sample Projects</span>
              <span className="md:hidden">Demos</span>
            </button>
            {isPresetOpen && (
              <div className="absolute right-0 mt-1 w-56 p-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 block transition z-50">
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Contractor Demo
                </div>
              <button
                onClick={() => {
                  onSelectSample('remodel');
                  setIsPresetOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700 font-medium text-slate-800 dark:text-slate-200 flex flex-col"
              >
                <span>🚿 Master Bath Luxury Remodel</span>
                <span className="text-[10px] text-slate-500">Demo full tile & sub trades</span>
              </button>
              <button
                onClick={() => {
                  onSelectSample('electrical');
                  setIsPresetOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700 font-medium text-slate-800 dark:text-slate-200 flex flex-col"
              >
                <span>⚡ 200A Panel & EV Charger</span>
                <span className="text-[10px] text-slate-500">Service upgrade & city permit</span>
              </button>
              <button
                onClick={() => {
                  onSelectSample('painting');
                  setIsPresetOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-indigo-50 dark:hover:bg-slate-700 font-medium text-slate-800 dark:text-slate-200 flex flex-col"
              >
                <span>🎨 Interior & Cabinet Painting</span>
                <span className="text-[10px] text-slate-500">High-volume production labor</span>
              </button>
            </div>
            )}
          </div>

          {/* Company Profile Button */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
            title="Edit company branding and license"
          >
            <Building2 className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden lg:inline">Company Profile</span>
          </button>

          {/* Backup Data Export */}
          <button
            onClick={onExportBackup}
            className="p-2 text-xs rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Download JSON Backup"
          >
            <FolderDown className="h-4 w-4" />
          </button>

          {/* Import JSON label */}
          <label
            className="p-2 text-xs rounded-lg text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Import JSON Backup"
          >
            <FileUp className="h-4 w-4" />
            <input
              type="file"
              accept=".json"
              onChange={onImportBackup}
              className="hidden"
            />
          </label>

          {/* Reset Workspace */}
          <button
            onClick={onReset}
            className="p-2 text-xs rounded-lg text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Reset to default blank project"
          >
            <RotateCcw className="h-4 w-4" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
