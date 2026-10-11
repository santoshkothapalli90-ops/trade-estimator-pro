import { calculateValidatedProject } from './validatedCalculator';
import { ProjectEstimator } from './schemas';

function testZodEngine() {
  console.log('--- Testing Zod-Powered Mathematical Engine ---');

  // Test Case 1: Corrupted / Malformed input should self-heal without NaN
  const dirtyPayload: any = {
    id: 'test-123',
    projectName: 'Bathroom Remodel',
    contingencyAmount: 'invalid-string', // should catch to 0
    salesTaxPercentage: '8.25',
    overheadSettings: {
      annualIndirectExpenses: '60000', // string to number
      crewSize: 3,
      hoursPerWeek: 40,
      weeksPerYear: 50,
      downtimePercentage: 15,
    },
    pricingStrategy: {
      mode: 'margin',
      valuePercentage: 30, // 30% margin
    },
    items: [
      {
        id: 'item-1',
        name: 'Tile Flooring',
        category: 'material',
        quantity: '200',
        unitCost: '5.50',
        wastePercentage: '10',
      },
      {
        id: 'item-2',
        name: 'Tile Setter',
        category: 'labor',
        hours: 24,
        directWageRate: 45,
      },
    ],
  };

  const result = calculateValidatedProject(dirtyPayload);

  console.log('Overhead Burden Rate:', result.overheadBurdenRate.toFixed(2), '$/hr');
  console.log('Total Direct Cost:', result.totalDirectCost.toFixed(2));
  console.log('Total Materials Cost:', result.totalMaterialsCost.toFixed(2));
  console.log('True Breakeven Cost:', result.trueBreakevenCost.toFixed(2));
  console.log('Contract Price:', result.contractPrice.toFixed(2));
  console.log('Gross Margin %:', result.grossMarginPercent.toFixed(1) + '%');
  console.log('Net Profit $:', result.netProfitDollar.toFixed(2));

  // Assertions
  if (isNaN(result.contractPrice) || !isFinite(result.contractPrice)) {
    throw new Error('Test Failed: Contract price is NaN or Infinite!');
  }
  if (result.totalMaterialsCost !== 200 * 5.5 * 1.1) {
    throw new Error('Test Failed: Material waste math mismatch');
  }

  // Test Case 2: Extreme 100% Margin Clamp (Division by Zero check)
  const zeroDivPayload: any = {
    ...dirtyPayload,
    pricingStrategy: {
      mode: 'margin',
      valuePercentage: 100, // Should clamp to 99.9% via SafePercentage
    },
  };

  const zeroDivResult = calculateValidatedProject(zeroDivPayload);
  if (isNaN(zeroDivResult.contractPrice) || !isFinite(zeroDivResult.contractPrice)) {
    throw new Error('Test Failed: 100% margin caused Division-by-Zero!');
  }
  console.log('✓ Division-by-zero protection verified successfully (clamped gracefully)');

  console.log('--- ALL ZOD VALIDATION TESTS PASSED! ---');
}

testZodEngine();
