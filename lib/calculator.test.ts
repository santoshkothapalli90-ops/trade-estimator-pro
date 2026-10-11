import {
  calculateOverheadBurdenRate,
  calculateLineItemCost,
  calculateProjectEstimate,
  safeNumber,
  formatCurrency,
  formatPercent,
} from './calculator';
import { OverheadState, EstimateLineItem, ProjectSettings } from './types';

function runSelfTests() {
  console.log('--- Starting TradeEstimator Engine Verification ---');

  // Test 1: Overhead Burden Rate Formula
  const mockOverhead: OverheadState = {
    expenses: [
      { id: '1', name: 'Rent', amount: 24000 },
      { id: '2', name: 'Insurance', amount: 16000 },
    ],
    activeCrewSize: 2,
    hoursPerWeek: 40,
    weeksPerYear: 50,
    unbillablePercent: 20, // 20% unbillable
  };
  // Gross hours = 2 * 40 * 50 = 4,000 hrs.
  // Net billable = 4,000 * 0.8 = 3,200 hrs.
  // Expenses = $40,000.
  // Burden Rate = 40,000 / 3,200 = $12.50/hr.
  const overheadResult = calculateOverheadBurdenRate(mockOverhead);
  if (Math.abs(overheadResult.burdenRatePerHour - 12.5) > 0.001) {
    throw new Error(`Test 1 Failed: Expected 12.50, got ${overheadResult.burdenRatePerHour}`);
  }
  console.log('✓ Test 1 Passed: Overhead Burden Rate = $12.50/hr');

  // Test 2: Material Waste Factor
  const mockMaterial: EstimateLineItem = {
    id: 'mat-1',
    category: 'materials',
    trade: 'Tile',
    description: 'Floor Tile',
    quantity: 100,
    unit: 'sqft',
    unitCost: 10,
    wastePercent: 15,
  };
  // Cost = 100 * 10 * 1.15 = $1,150.
  const matCost = calculateLineItemCost(mockMaterial);
  if (Math.abs(matCost - 1150) > 0.001) {
    throw new Error(`Test 2 Failed: Expected 1150, got ${matCost}`);
  }
  console.log('✓ Test 2 Passed: Material Waste Factor Calculation ($1,150.00)');

  // Test 3: Markup vs Gross Margin Mathematical Consistency
  // Cost = $1,000.
  // 25% Markup -> Price = $1,000 * 1.25 = $1,250. Gross Margin = ($1,250 - $1,000)/$1,250 = 20.0%.
  const mockLabor: EstimateLineItem = {
    id: 'lab-1',
    category: 'labor',
    trade: 'Demo',
    description: 'Demo',
    quantity: 20, // 20 hrs * $50 = $1,000 direct labor
    unit: 'hrs',
    unitCost: 50,
    wastePercent: 0,
  };
  // With $12.50 burden rate: Burden Cost = 20 * 12.5 = $250.
  // Total Direct Job Cost = $1,000. Breakeven = $1,250.
  const markupSettings: ProjectSettings = {
    pricingModel: 'markup',
    targetRatePercent: 20, // 20% Markup on Breakeven ($1,250 * 1.20 = $1,500)
    contingencyPercent: 0,
    salesTaxPercent: 0,
    clientNotes: '',
    paymentTerms: '',
    validDays: 30,
  };
  const estMarkup = calculateProjectEstimate([mockLabor], mockOverhead, markupSettings);
  if (Math.abs(estMarkup.contractPrice - 1500) > 0.01) {
    throw new Error(`Test 3 Failed: Expected $1,500, got ${estMarkup.contractPrice}`);
  }
  console.log('✓ Test 3 Passed: Markup formula verified ($1,500.00)');

  // Test 4: Under-bidding Guard Trigger
  const thinMarginSettings: ProjectSettings = {
    pricingModel: 'markup',
    targetRatePercent: 1, // Only 1% markup
    contingencyPercent: 0,
    salesTaxPercent: 0,
    clientNotes: '',
    paymentTerms: '',
    validDays: 30,
  };
  const estThin = calculateProjectEstimate([mockLabor], mockOverhead, thinMarginSettings);
  if (!estThin.isUnderbidding) {
    throw new Error('Test 4 Failed: Expected isUnderbidding to be true for thin margin');
  }
  console.log('✓ Test 4 Passed: Under-bidding safety guard triggered appropriately');

  // Test 5: NaN & Infinite safe guards
  if (safeNumber(NaN, 42) !== 42 || safeNumber(Infinity, 99) !== 99 || safeNumber('bad-string', 0) !== 0) {
    throw new Error('Test 5 Failed: safeNumber did not handle corrupt values');
  }
  console.log('✓ Test 5 Passed: NaN and Infinity safety boundaries robust');

  console.log('ALL FINANCIAL ENGINE TESTS PASSED SUCCESSFULLY!');
}

runSelfTests();
