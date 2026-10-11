export interface OverheadCategory {
  id: string;
  name: string;
  amount: number;
}

export interface OverheadState {
  expenses: OverheadCategory[];
  activeCrewSize: number;
  hoursPerWeek: number;
  weeksPerYear: number;
  unbillablePercent: number; // e.g. 15% downtime/travel/admin
}

export type LineItemCategory = 'materials' | 'labor' | 'subs' | 'equipment';

export interface EstimateLineItem {
  id: string;
  category: LineItemCategory;
  trade: string; // e.g. Remodel, Electrical, Painting, Plumbing, Carpentry
  description: string;
  quantity: number;
  unit: string; // hrs, sqft, lin ft, each, lump sum
  unitCost: number;
  wastePercent: number; // for materials: 0 - 50%
  subcontractorMarkupIncluded?: boolean;
}

export type PricingModel = 'markup' | 'margin';

export interface ProjectSettings {
  pricingModel: PricingModel; // 'markup' vs 'margin'
  targetRatePercent: number; // markup % or margin %
  contingencyPercent: number; // 0 - 20%
  salesTaxPercent: number; // e.g. 6% or 0%
  clientNotes: string;
  paymentTerms: string;
  validDays: number;
}

export interface ContractorProfile {
  companyName: string;
  tagline: string;
  ownerName: string;
  phone: string;
  email: string;
  website: string;
  licenseNumber: string;
  insuranceInfo: string;
  address: string;
}

export interface ClientInfo {
  name: string;
  projectTitle: string;
  address: string;
  phone: string;
  email: string;
  estimateNumber: string;
  date: string;
}

export interface ProjectCalculationResult {
  totalMaterialsCost: number;
  totalDirectLaborCost: number;
  totalLaborHours: number;
  overheadBurdenRatePerHour: number;
  totalOverheadBurdenCost: number;
  totalSubcontractorCost: number;
  totalEquipmentCost: number;
  
  directJobCost: number;
  trueBreakevenCost: number; // Direct Costs + Overhead Burden
  contingencyAmount: number;
  subtotalBeforeTax: number;
  salesTaxAmount: number;
  contractPrice: number; // Final bid value for client
  
  netProfitDollar: number; // Contract Price - trueBreakevenCost - salesTax
  grossMarginPercent: number; // (Contract Price - Direct Cost) / Contract Price
  netMarginPercent: number; // Net Profit / Contract Price
  isUnderbidding: boolean;
  underbiddingWarning?: string;
}
