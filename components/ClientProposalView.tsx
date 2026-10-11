'use client';

import React, { useRef, useState } from 'react';
import {
  ContractorProfile,
  ClientInfo,
  EstimateLineItem,
  ProjectSettings,
  ProjectCalculationResult,
} from '../lib/types';
import { formatCurrency } from '../lib/calculator';
import {
  Download,
  FileCheck2,
  Printer,
  ShieldCheck,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye,
  Loader2,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';

interface ClientProposalViewProps {
  profile: ContractorProfile;
  client: ClientInfo;
  items: EstimateLineItem[];
  settings: ProjectSettings;
  calc: ProjectCalculationResult;
  onUpdateClient: (client: ClientInfo) => void;
  onUpdateSettings: (settings: ProjectSettings) => void;
}

export const ClientProposalView: React.FC<ClientProposalViewProps> = ({
  profile,
  client,
  items,
  settings,
  calc,
  onUpdateClient,
  onUpdateSettings,
}) => {
  const proposalRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Group line items by trade for a neat, professional client scope presentation
  const tradesMap = items.reduce<Record<string, EstimateLineItem[]>>((acc, item) => {
    const tradeName = item.trade || 'General Construction';
    if (!acc[tradeName]) acc[tradeName] = [];
    acc[tradeName].push(item);
    return acc;
  }, {});

  const handleDownloadPdf = async () => {
    if (!proposalRef.current) return;
    setIsExporting(true);

    try {
      const element = proposalRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate scaled image dimensions
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight <= pageHeight) {
        // Fits comfortably on a single A4 page
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        // Multi-page slicing to prevent shrinking and distortion on large proposals
        let remainingHeight = imgHeight;
        let position = 0;

        while (remainingHeight > 0) {
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          const sliceHeight = (pageHeight * canvas.width) / imgWidth;
          pageCanvas.height = Math.min(canvas.height - position, sliceHeight);

          const ctx = pageCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              canvas,
              0,
              position,
              canvas.width,
              pageCanvas.height,
              0,
              0,
              canvas.width,
              pageCanvas.height
            );

            const pageImgData = pageCanvas.toDataURL('image/png');
            const pageSlicePdfHeight = (pageCanvas.height * imgWidth) / canvas.width;

            pdf.addImage(pageImgData, 'PNG', 0, 0, imgWidth, pageSlicePdfHeight);
          }

          remainingHeight -= pageHeight;
          position += sliceHeight;

          if (remainingHeight > 0) {
            pdf.addPage();
          }
        }
      }

      pdf.save(
        `Proposal-${client.estimateNumber || 'Draft'}-${client.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`
      );
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('PDF generation encountered an error. Please try again or use Print to PDF.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Client-Safe Info Callout */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              <ShieldCheck className="h-3.5 w-3.5" />
              Client-Safe Proposal Shield Active
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Internal hourly wages, direct material costs, overhead burden rates, and profit markup percentages
            are <strong>completely hidden</strong> from this view and the exported PDF.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition flex items-center gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" />
            <span>Print View</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 transition flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Exporting PDF...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download Client PDF Proposal</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editable Client & Terms Metadata */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-3">
          Proposal Client Details & Custom Terms
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
          <div className="lg:col-span-2">
            <label className="block text-[11px] text-slate-500 mb-1">Client Full Name</label>
            <input
              type="text"
              value={client.name}
              onChange={(e) => onUpdateClient({ ...client, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-[11px] text-slate-500 mb-1">Project Title</label>
            <input
              type="text"
              value={client.projectTitle}
              onChange={(e) => onUpdateClient({ ...client, projectTitle: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-[11px] text-slate-500 mb-1">Job Site Address</label>
            <input
              type="text"
              value={client.address}
              onChange={(e) => onUpdateClient({ ...client, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-[11px] text-slate-500 mb-1">Estimate #</label>
            <input
              type="text"
              value={client.estimateNumber}
              onChange={(e) => onUpdateClient({ ...client, estimateNumber: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-[11px] text-slate-500 mb-1">Client Phone</label>
            <input
              type="text"
              value={client.phone}
              onChange={(e) => onUpdateClient({ ...client, phone: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
          <div className="lg:col-span-2">
            <label className="block text-[11px] text-slate-500 mb-1">Client Email</label>
            <input
              type="email"
              value={client.email}
              onChange={(e) => onUpdateClient({ ...client, email: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Printable / Renderable PDF Container */}
      <div className="overflow-x-auto pb-4">
        <div
          ref={proposalRef}
          className="w-[800px] mx-auto bg-white text-slate-900 p-10 shadow-2xl rounded-2xl border border-slate-200"
          style={{ minHeight: '1050px' }}
        >
          {/* Proposal Header */}
          <div className="border-b-2 border-indigo-600 pb-6 mb-8 flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">
                  ▲
                </div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">
                  {profile.companyName || 'Contractor Services LLC'}
                </h1>
              </div>
              <p className="text-xs text-indigo-700 font-medium">
                {profile.tagline || 'Residential Construction & Specialty Trades'}
              </p>
              <div className="pt-2 text-[11px] text-slate-500 space-y-0.5">
                <p>{profile.address}</p>
                <p>Phone: {profile.phone} | Email: {profile.email}</p>
                <p className="font-semibold text-slate-700">License: {profile.licenseNumber}</p>
              </div>
            </div>

            <div className="text-right space-y-1">
              <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-800 text-xs font-black uppercase tracking-widest rounded">
                Official Proposal
              </span>
              <div className="mt-2 text-xs text-slate-500 font-mono">
                <p>Estimate: <span className="font-bold text-slate-900">{client.estimateNumber || 'EST-2026-001'}</span></p>
                <p>Date: <span className="text-slate-700">{client.date || 'October 15, 2026'}</span></p>
                <p>Valid For: <span className="text-slate-700">{settings.validDays || 30} Days</span></p>
              </div>
            </div>
          </div>

          {/* Client & Project Header Info */}
          <div className="grid grid-cols-2 gap-8 p-4 bg-slate-50 rounded-xl border border-slate-200/80 mb-8 text-xs">
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
                PREPARED FOR CLIENT:
              </span>
              <p className="text-sm font-bold text-slate-900">{client.name}</p>
              <p className="text-slate-600 mt-0.5">{client.address}</p>
              <p className="text-slate-500 mt-0.5">{client.phone} | {client.email}</p>
            </div>
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block mb-1">
                PROJECT SPECIFICATION:
              </span>
              <p className="text-sm font-bold text-indigo-900">{client.projectTitle}</p>
              <p className="text-slate-600 mt-0.5">Insurance: {profile.insuranceInfo}</p>
            </div>
          </div>

          {/* Itemized Scope of Work by Trade */}
          <div className="mb-8 space-y-6">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 border-b pb-2">
              Itemized Scope of Deliverables & Materials
            </h2>

            {Object.keys(tradesMap).map((tradeName) => (
              <div key={tradeName} className="space-y-2">
                <div className="bg-slate-100 px-3 py-1.5 rounded-lg flex justify-between items-center text-xs font-bold text-slate-800">
                  <span>{tradeName} Phase</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    {tradesMap[tradeName].length} scope deliverables
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {tradesMap[tradeName].map((item, idx) => (
                    <div key={item.id} className="py-2.5 px-3 flex justify-between items-start text-xs">
                      <div className="flex-1 pr-4">
                        <span className="font-medium text-slate-900 block">
                          {idx + 1}. {item.description}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Classification: {item.category === 'materials' ? 'Premium Materials & Supplies' : item.category === 'labor' ? 'Skilled Trade Craftsmanship' : item.category === 'subs' ? 'Specialty Certified Subcontractor' : 'Job Site Equipment & Disposal'}
                        </span>
                      </div>
                      <div className="text-right text-[11px] font-mono text-slate-600 whitespace-nowrap">
                        {item.quantity} {item.unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Special Client Notes */}
          {settings.clientNotes && (
            <div className="mb-6 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-xs">
              <span className="font-bold text-indigo-950 block mb-1 uppercase tracking-wider text-[10px]">
                Contractor Notes & Specifications:
              </span>
              <p className="text-slate-700 leading-relaxed">{settings.clientNotes}</p>
            </div>
          )}

          {/* Proposal Financial Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Trade Deliverables):</span>
                <span className="font-mono font-semibold">{formatCurrency(calc.subtotalBeforeTax)}</span>
              </div>
              {calc.salesTaxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Estimated Applicable Tax ({settings.salesTaxPercent}%):</span>
                  <span className="font-mono font-semibold">{formatCurrency(calc.salesTaxAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-300">
                <span>Total Contract Proposal:</span>
                <span className="font-mono text-indigo-700 text-base">{formatCurrency(calc.contractPrice)}</span>
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="mb-8 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
            <span className="font-bold text-slate-900 block text-[10px] uppercase tracking-wider">
              Payment Schedule & Terms:
            </span>
            <p className="text-slate-600">
              {settings.paymentTerms || '30% deposit upon contract acceptance, 40% midway through installation, 30% upon final inspection & project walkthrough.'}
            </p>
          </div>

          {/* Acceptance Signature Lines */}
          <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-12 text-xs">
            <div>
              <p className="text-slate-500 mb-8">Authorized Contractor Signature:</p>
              <div className="border-b border-slate-400 pb-1">
                <span className="font-semibold text-slate-800">{profile.ownerName}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Date: ________________________</p>
            </div>
            <div>
              <p className="text-slate-500 mb-8">Client Acceptance & Authorization:</p>
              <div className="border-b border-slate-400 pb-1">
                <span className="font-semibold text-slate-800">{client.name}</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Date: ________________________</p>
            </div>
          </div>

          {/* Footer notice */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400">
            Generated via TradeEstimator PRO • All rights reserved • Licensed Contractor
          </div>
        </div>
      </div>
    </div>
  );
};
