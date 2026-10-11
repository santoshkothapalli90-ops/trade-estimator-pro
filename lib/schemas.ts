import { z } from 'zod';

// --- 1. UTILITY SCHEMAS FOR MATH SAFETY ---
// Ensures empty strings or alphabetic typos silently resolve to 0 instead of NaN
export const SafeNumber = z.coerce.number().finite().nonnegative().catch(0);

// Strictly prevents 100% margins or downtimes which trigger division-by-zero
export const SafePercentage = z.coerce.number().finite().min(0).max(99.9).catch(0);

// --- 2. OVERHEAD & CAPACITY SETTINGS ---
export const OverheadSettingsSchema = z.object({
  annualIndirectExpenses: SafeNumber,
  crewSize: z.coerce.number().int().min(1).catch(1),
  hoursPerWeek: z.coerce.number().finite().min(1).max(168).catch(40),
  weeksPerYear: z.coerce.number().finite().min(1).max(52).catch(50),
  // Capped at 99.9% to guarantee Net Billable Hours is never exactly 0
  downtimePercentage: SafePercentage.default(15),
});

export type OverheadSettings = z.infer<typeof OverheadSettingsSchema>;

// --- 3. PRICING STRATEGY ---
export const PricingStrategySchema = z.object({
  mode: z.enum(['margin', 'markup']).default('margin'),
  // Max margin clamped at 99.9% to prevent: Breakeven / (1 - 100/100) = Infinity
  valuePercentage: SafePercentage.default(25),
});

export type PricingStrategy = z.infer<typeof PricingStrategySchema>;

// --- 4. LINE ITEMS (DISCRIMINATED UNION) ---
const BaseItemSchema = z.object({
  id: z.string().default(() => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `item-${Date.now()}`)),
  name: z.string().min(1, 'Item name is required').catch('Unnamed Item'),
  trade: z.string().default('General'),
});

export const MaterialItemSchema = BaseItemSchema.extend({
  category: z.literal('material'),
  quantity: SafeNumber.default(1),
  unit: z.string().default('each'),
  unitCost: SafeNumber,
  wastePercentage: z.coerce.number().finite().min(0).max(1000).catch(0),
});

export const LaborItemSchema = BaseItemSchema.extend({
  category: z.literal('labor'),
  hours: SafeNumber,
  directWageRate: SafeNumber,
});

export const SubcontractorItemSchema = BaseItemSchema.extend({
  category: z.literal('subcontractor'),
  cost: SafeNumber,
});

export const EquipmentItemSchema = BaseItemSchema.extend({
  category: z.literal('equipment'),
  cost: SafeNumber,
});

export const LineItemSchema = z.discriminatedUnion('category', [
  MaterialItemSchema,
  LaborItemSchema,
  SubcontractorItemSchema,
  EquipmentItemSchema,
]);

export type LineItem = z.infer<typeof LineItemSchema>;
export type MaterialItem = z.infer<typeof MaterialItemSchema>;
export type LaborItem = z.infer<typeof LaborItemSchema>;
export type SubcontractorItem = z.infer<typeof SubcontractorItemSchema>;
export type EquipmentItem = z.infer<typeof EquipmentItemSchema>;

// --- 5. MASTER PROJECT PAYLOAD ---
export const ProjectEstimatorSchema = z.object({
  id: z.string().default(() => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `proj-${Date.now()}`)),
  projectName: z.string().min(1).catch('New Project'),
  contingencyAmount: SafeNumber.default(0),
  salesTaxPercentage: SafePercentage.default(0),
  overheadSettings: OverheadSettingsSchema,
  pricingStrategy: PricingStrategySchema,
  items: z.array(LineItemSchema).default([]),
});

export type ProjectEstimator = z.infer<typeof ProjectEstimatorSchema>;

// --- 6. CALCULATED OUTPUT SCHEMA ---
export interface ValidatedCalculations {
  overheadBurdenRate: number;
  totalDirectCost: number;
  totalMaterialsCost: number;
  totalLaborCost: number;
  totalLaborHours: number;
  totalOverheadBurdenCost: number;
  totalSubcontractorCost: number;
  totalEquipmentCost: number;
  trueBreakevenCost: number;
  contractPrice: number;
  salesTaxAmount: number;
  netProfitDollar: number;
  grossMarginPercent: number;
  netMarginPercent: number;
  isUnderbidding: boolean;
  underbiddingWarning?: string;
}
