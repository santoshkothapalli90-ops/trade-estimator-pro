import {
  EstimateLineItem,
  OverheadState,
  ProjectSettings,
  ProjectCalculationResult,
} from './types';

/**
 * Safely parse and clamp any numeric input
 * Guarantees zero return on NaN, undefined, Infinity, or negative if clamped
 */
export function safeNumber(val: unknown, fallback = 0, min = 0): number {
  if (typeof val === 'number') {
    if (isNaN(val) || !isFinite(val)) return fallback;
    return val < min ? min : val;
  }
  if (typeof val === 'string') {
    const parsed = parseFloat(val.replace(/[^0-9.-]/g, ''));
    if (isNaN(parsed) || !isFinite(parsed)) return fallback;
    return parsed < min ? min : parsed;
  }
  return fallback;
}

/**
 * Format currency with commas and 2 decimal places
 */
export function formatCurrency(amount: number): string {
  const safe = safeNumber(amount, 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

/**
 * Format percentage with 1 decimal place
 */
export function formatPercent(rate: number): string {
  const safe = safeNumber(rate, 0);
  return `${safe.toFixed(1)}%`;
}

/**
 * Calculate the contractor's annual indirect overhead burden rate ($/billable hour)
 * Formula: Total Indirect Annual Expenses / Annual Billable Production Hours
 */
export function calculateOverheadBurdenRate(overhead: OverheadState): {
  totalAnnualExpenses: number;
  grossAnnualHours: number;
  netBillableHours: number;
  burdenRatePerHour: number;
} {
  try {
    const totalAnnualExpenses = overhead.expenses.reduce(
      (acc, item) => acc + safeNumber(item.amount, 0),
      0
    );

    const crewSize = safeNumber(overhead.activeCrewSize, 1, 1);
    const hoursPerWeek = safeNumber(overhead.hoursPerWeek, 40, 1);
    const weeksPerYear = safeNumber(overhead.weeksPerYear, 50, 1);
    const unbillablePct = Math.min(safeNumber(overhead.unbillablePercent, 15, 0), 90);

    const grossAnnualHours = crewSize * hoursPerWeek * weeksPerYear;
    const netBillableHours = Math.max(
      1,
      grossAnnualHours * (1 - unbillablePct / 100)
    );

    const burdenRatePerHour =
      netBillableHours > 0 ? totalAnnualExpenses / netBillableHours : 0;

    return {
      totalAnnualExpenses,
      grossAnnualHours,
      netBillableHours,
      burdenRatePerHour: safeNumber(burdenRatePerHour, 0),
    };
  } catch {
    return {
      totalAnnualExpenses: 0,
      grossAnnualHours: 2000,
      netBillableHours: 1700,
      burdenRatePerHour: 0,
    };
  }
}

/**
 * Calculate the line item direct cost
 * For materials: quantity * unitCost * (1 + wastePercent / 100)
 * For labor: quantity * unitCost (direct labor wage)
 * For subs/equipment: quantity * unitCost
 */
export function calculateLineItemCost(item: EstimateLineItem): number {
  try {
    const qty = safeNumber(item.quantity, 0);
    const unitCost = safeNumber(item.unitCost, 0);

    if (item.category === 'materials') {
      const waste = Math.max(0, safeNumber(item.wastePercent, 0)) / 100;
      return safeNumber(qty * unitCost * (1 + waste), 0);
    }

    return safeNumber(qty * unitCost, 0);
  } catch {
    return 0;
  }
}

/**
 * Master Project Calculation Engine
 * Reconciles direct costs, overhead burden, contingency, sales tax,
 * and contract price under Markup vs Margin models.
 */
export function calculateProjectEstimate(
  items: EstimateLineItem[],
  overhead: OverheadState,
  settings: ProjectSettings
): ProjectCalculationResult {
  try {
    let totalMaterialsCost = 0;
    let totalDirectLaborCost = 0;
    let totalLaborHours = 0;
    let totalSubcontractorCost = 0;
    let totalEquipmentCost = 0;

    for (const item of items) {
      const itemCost = calculateLineItemCost(item);

      switch (item.category) {
        case 'materials':
          totalMaterialsCost += itemCost;
          break;
        case 'labor':
          totalDirectLaborCost += itemCost;
          totalLaborHours += safeNumber(item.quantity, 0);
          break;
        case 'subs':
          totalSubcontractorCost += itemCost;
          break;
        case 'equipment':
          totalEquipmentCost += itemCost;
          break;
      }
    }

    // Overhead burden calculation
    const { burdenRatePerHour } = calculateOverheadBurdenRate(overhead);
    const totalOverheadBurdenCost = safeNumber(
      totalLaborHours * burdenRatePerHour,
      0
    );

    // Direct Job Cost (what leaves contractor's pocket for this specific job directly)
    const directJobCost = safeNumber(
      totalMaterialsCost +
        totalDirectLaborCost +
        totalSubcontractorCost +
        totalEquipmentCost,
      0
    );

    // True Breakeven Cost = Direct Job Cost + Allocated Business Overhead Burden
    const trueBreakevenCost = safeNumber(
      directJobCost + totalOverheadBurdenCost,
      0
    );

    // Contingency
    const contingencyPercent = Math.min(
      Math.max(0, safeNumber(settings.contingencyPercent, 0)),
      50
    );
    const contingencyAmount = safeNumber(
      trueBreakevenCost * (contingencyPercent / 100),
      0
    );

    const baseCostWithContingency = trueBreakevenCost + contingencyAmount;

    // Target Rate Calculation: Markup vs Margin
    const targetRate = Math.max(0, safeNumber(settings.targetRatePercent, 20));
    let preTaxContractPrice = 0;

    if (settings.pricingModel === 'margin') {
      // Margin Formula: Price = Cost / (1 - Margin%)
      // Bound margin below 95% to avoid divide-by-zero / vertical asymptotes
      const clampedMargin = Math.min(targetRate, 95);
      const marginFactor = 1 - clampedMargin / 100;
      preTaxContractPrice =
        marginFactor > 0.05
          ? baseCostWithContingency / marginFactor
          : baseCostWithContingency * 20;
    } else {
      // Markup Formula: Price = Cost * (1 + Markup%)
      preTaxContractPrice =
        baseCostWithContingency * (1 + targetRate / 100);
    }

    preTaxContractPrice = safeNumber(preTaxContractPrice, 0);

    // Sales Tax (applied to materials or preTax depending on state, simplified as subtotal tax)
    const salesTaxPercent = Math.max(0, safeNumber(settings.salesTaxPercent, 0));
    const salesTaxAmount = safeNumber(
      (totalMaterialsCost > 0 ? totalMaterialsCost : preTaxContractPrice) *
        (salesTaxPercent / 100),
      0
    );

    const contractPrice = safeNumber(preTaxContractPrice + salesTaxAmount, 0);

    // Financial Health Analysis
    const netProfitDollar = safeNumber(
      preTaxContractPrice - trueBreakevenCost - contingencyAmount,
      0
    );

    const grossMarginPercent =
      preTaxContractPrice > 0
        ? safeNumber(
            ((preTaxContractPrice - directJobCost) / preTaxContractPrice) * 100,
            0
          )
        : 0;

    const netMarginPercent =
      preTaxContractPrice > 0
        ? safeNumber((netProfitDollar / preTaxContractPrice) * 100, 0)
        : 0;

    // Under-bidding warning triggers:
    // If gross margin is under 20%, or net profit is negative/under 8%, warn the contractor!
    const isUnderbidding =
      grossMarginPercent < 20 || netMarginPercent < 8 || netProfitDollar <= 0;

    let underbiddingWarning = undefined;
    if (netProfitDollar <= 0) {
      underbiddingWarning =
        'CRITICAL: Bid is below breakeven cost! You will lose money on this project.';
    } else if (grossMarginPercent < 15) {
      underbiddingWarning =
        'DANGER: Gross margin is below 15%. Indirect overhead will likely consume all profit.';
    } else if (grossMarginPercent < 20) {
      underbiddingWarning =
        'CAUTION: Gross margin is below the recommended 20% trade threshold. Minimal buffer for delays.';
    }

    return {
      totalMaterialsCost,
      totalDirectLaborCost,
      totalLaborHours,
      overheadBurdenRatePerHour: burdenRatePerHour,
      totalOverheadBurdenCost,
      totalSubcontractorCost,
      totalEquipmentCost,
      directJobCost,
      trueBreakevenCost,
      contingencyAmount,
      subtotalBeforeTax: preTaxContractPrice,
      salesTaxAmount,
      contractPrice,
      netProfitDollar,
      grossMarginPercent,
      netMarginPercent,
      isUnderbidding,
      underbiddingWarning,
    };
  } catch (err) {
    console.error('Calculation engine error fallback:', err);
    return {
      totalMaterialsCost: 0,
      totalDirectLaborCost: 0,
      totalLaborHours: 0,
      overheadBurdenRatePerHour: 0,
      totalOverheadBurdenCost: 0,
      totalSubcontractorCost: 0,
      totalEquipmentCost: 0,
      directJobCost: 0,
      trueBreakevenCost: 0,
      contingencyAmount: 0,
      subtotalBeforeTax: 0,
      salesTaxAmount: 0,
      contractPrice: 0,
      netProfitDollar: 0,
      grossMarginPercent: 0,
      netMarginPercent: 0,
      isUnderbidding: false,
    };
  }
}
