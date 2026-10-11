import {
  ProjectEstimator,
  ProjectEstimatorSchema,
  ValidatedCalculations,
  LineItem,
} from './schemas';

/**
 * Pure, fail-safe calculation engine backed by Zod runtime schemas
 */
export function calculateValidatedProject(rawPayload: unknown): ValidatedCalculations {
  // 1. Enforce strict schema guarantees (silently resolves NaN, clamping, and zero-divisions)
  const parsed: ProjectEstimator = ProjectEstimatorSchema.parse(rawPayload);

  const { overheadSettings, pricingStrategy, items, contingencyAmount, salesTaxPercentage } = parsed;

  // 2. Overhead Burden Rate Calculation
  // Net Billable Hours = (Crew * Hours/Wk * Weeks/Yr) * (1 - Downtime%)
  const grossAnnualHours = overheadSettings.crewSize * overheadSettings.hoursPerWeek * overheadSettings.weeksPerYear;
  const downtimeFactor = 1 - overheadSettings.downtimePercentage / 100;
  // Guaranteed > 0 due to max(99.9) clamp in Zod schema
  const netBillableHours = Math.max(1, grossAnnualHours * downtimeFactor);

  const overheadBurdenRate = overheadSettings.annualIndirectExpenses / netBillableHours;

  // 3. Line Items Processing via Discriminated Union
  let totalMaterialsCost = 0;
  let totalLaborCost = 0;
  let totalLaborHours = 0;
  let totalSubcontractorCost = 0;
  let totalEquipmentCost = 0;

  for (const item of items) {
    switch (item.category) {
      case 'material': {
        const wasteFactor = 1 + item.wastePercentage / 100;
        totalMaterialsCost += item.quantity * item.unitCost * wasteFactor;
        break;
      }
      case 'labor': {
        totalLaborCost += item.hours * item.directWageRate;
        totalLaborHours += item.hours;
        break;
      }
      case 'subcontractor': {
        totalSubcontractorCost += item.cost;
        break;
      }
      case 'equipment': {
        totalEquipmentCost += item.cost;
        break;
      }
    }
  }

  // 4. Overhead Allocation & Direct Cost
  const totalOverheadBurdenCost = totalLaborHours * overheadBurdenRate;
  const totalDirectCost =
    totalMaterialsCost + totalLaborCost + totalSubcontractorCost + totalEquipmentCost;

  // True Breakeven Cost = Direct Cost + Allocated Overhead
  const trueBreakevenCost = totalDirectCost + totalOverheadBurdenCost;

  // Base Cost to Markup or Margin (including contingency)
  const baseCost = trueBreakevenCost + contingencyAmount;

  // 5. Pricing Strategy (Markup vs Margin)
  let preTaxContractPrice = 0;
  if (pricingStrategy.mode === 'margin') {
    // Formula: Price = Base / (1 - Margin%)
    // Zod clamps margin to 99.9% max so denominator is always > 0
    const marginFactor = Math.max(0.001, 1 - pricingStrategy.valuePercentage / 100);
    preTaxContractPrice = baseCost / marginFactor;
  } else {
    // Formula: Price = Base * (1 + Markup%)
    preTaxContractPrice = baseCost * (1 + pricingStrategy.valuePercentage / 100);
  }

  // 6. Taxes and Contract Value
  const salesTaxAmount = preTaxContractPrice * (salesTaxPercentage / 100);
  const contractPrice = preTaxContractPrice + salesTaxAmount;

  // 7. Net Profit & Margins
  const netProfitDollar = preTaxContractPrice - trueBreakevenCost - contingencyAmount;
  const grossMarginPercent =
    preTaxContractPrice > 0 ? ((preTaxContractPrice - totalDirectCost) / preTaxContractPrice) * 100 : 0;
  const netMarginPercent =
    preTaxContractPrice > 0 ? (netProfitDollar / preTaxContractPrice) * 100 : 0;

  // 8. Underbidding Guard
  const isUnderbidding = grossMarginPercent < 20 || netProfitDollar <= 0;
  let underbiddingWarning = undefined;
  if (netProfitDollar <= 0) {
    underbiddingWarning = 'CRITICAL: Contract bid is below true breakeven cost!';
  } else if (grossMarginPercent < 15) {
    underbiddingWarning = 'DANGER: Gross margin is below 15%. Indirect overhead will consume profit.';
  } else if (grossMarginPercent < 20) {
    underbiddingWarning = 'CAUTION: Gross margin is below the recommended 20% trade threshold.';
  }

  return {
    overheadBurdenRate,
    totalDirectCost,
    totalMaterialsCost,
    totalLaborCost,
    totalLaborHours,
    totalOverheadBurdenCost,
    totalSubcontractorCost,
    totalEquipmentCost,
    trueBreakevenCost,
    contractPrice,
    salesTaxAmount,
    netProfitDollar,
    grossMarginPercent,
    netMarginPercent,
    isUnderbidding,
    underbiddingWarning,
  };
}
