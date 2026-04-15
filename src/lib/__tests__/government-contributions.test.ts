// src/lib/__tests__/government-contributions.test.ts
import { describe, it, expect } from '@jest/globals';
import {
  computePhilHealthContribution,
  getPhilHealthEmployeeDeduction,
  computePagibigContribution,
  getPagibigEmployeeDeduction,
  computeSSSContribution,
  getSSSEmployeeDeduction,
} from '../government-contributions';

/**
 * STEP-BY-STEP TESTING GUIDE
 * 
 * This file demonstrates how to write unit tests for business logic.
 * Follow the AAA pattern: Arrange → Act → Assert
 */

// ═══════════════════════════════════════════════════════════════════════════
// PhilHealth Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('PhilHealth Contributions', () => {
  describe('computePhilHealthContribution', () => {
    it('should compute PhilHealth at 5% rate (2.5% EE + 2.5% ER)', () => {
      // ARRANGE - Set up test data
      const monthlyBasicSalary = 20000;

      // ACT - Call the function
      const result = computePhilHealthContribution(monthlyBasicSalary);

      // ASSERT - Verify the result
      expect(result.monthlySalary).toBe(20000);
      expect(result.eeShare).toBe(500);  // 20000 × 2.5%
      expect(result.erShare).toBe(500);  // 20000 × 2.5%
      expect(result.total).toBe(1000);   // 20000 × 5%
    });

    it('should compute PhilHealth for minimum wage earner', () => {
      const monthlyBasicSalary = 13000; // ~₱570/day × 22.83 days

      const result = computePhilHealthContribution(monthlyBasicSalary);

      expect(result.eeShare).toBe(325);  // 13000 × 2.5%
      expect(result.erShare).toBe(325);
      expect(result.total).toBe(650);
    });

    it('should compute PhilHealth for high earner', () => {
      const monthlyBasicSalary = 80000;

      const result = computePhilHealthContribution(monthlyBasicSalary);

      expect(result.eeShare).toBe(2000);  // 80000 × 2.5%
      expect(result.erShare).toBe(2000);
      expect(result.total).toBe(4000);
    });

    it('should handle zero salary', () => {
      const result = computePhilHealthContribution(0);

      expect(result.eeShare).toBe(0);
      expect(result.erShare).toBe(0);
      expect(result.total).toBe(0);
    });

    it('should handle negative salary as zero', () => {
      const result = computePhilHealthContribution(-5000);

      expect(result.monthlySalary).toBe(0);
      expect(result.eeShare).toBe(0);
    });
  });

  describe('getPhilHealthEmployeeDeduction', () => {
    it('should return full EE share for ONCE_A_MONTH frequency', () => {
      const monthlyBasicSalary = 20000;

      const deduction = getPhilHealthEmployeeDeduction(monthlyBasicSalary, 'ONCE_A_MONTH');

      expect(deduction).toBe(500); // Full monthly share
    });

    it('should split EE share in half for TWICE_A_MONTH frequency', () => {
      const monthlyBasicSalary = 20000;

      const deduction = getPhilHealthEmployeeDeduction(monthlyBasicSalary, 'TWICE_A_MONTH');

      expect(deduction).toBe(250); // Half of monthly share
    });

    it('should split EE share by 4 for WEEKLY frequency', () => {
      const monthlyBasicSalary = 20000;

      const deduction = getPhilHealthEmployeeDeduction(monthlyBasicSalary, 'WEEKLY');

      expect(deduction).toBe(125); // Quarter of monthly share
    });

    it('should handle decimal results correctly', () => {
      const monthlyBasicSalary = 13000;

      const deductionTwiceAMonth = getPhilHealthEmployeeDeduction(monthlyBasicSalary, 'TWICE_A_MONTH');
      const deductionWeekly = getPhilHealthEmployeeDeduction(monthlyBasicSalary, 'WEEKLY');

      expect(deductionTwiceAMonth).toBe(162.5); // 325 / 2
      expect(deductionWeekly).toBe(81.25);      // 325 / 4
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Pag-IBIG Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Pag-IBIG Contributions', () => {
  describe('computePagibigContribution (REGULAR mode)', () => {
    it('should compute Pag-IBIG at 2% rate (2% EE + 2% ER)', () => {
      const monthlyCompensation = 20000;

      const result = computePagibigContribution(monthlyCompensation, 'REGULAR');

      expect(result.mode).toBe('REGULAR');
      expect(result.monthlyCompensation).toBe(20000);
      expect(result.eeShare).toBe(400);  // 20000 × 2%
      expect(result.erShare).toBe(400);  // 20000 × 2%
      expect(result.total).toBe(800);    // 20000 × 4%
    });

    it('should compute Pag-IBIG for minimum wage earner', () => {
      const monthlyCompensation = 13000;

      const result = computePagibigContribution(monthlyCompensation, 'REGULAR');

      expect(result.eeShare).toBe(260);  // 13000 × 2%
      expect(result.total).toBe(520);
    });

    it('should handle zero compensation in REGULAR mode', () => {
      const result = computePagibigContribution(0, 'REGULAR');

      expect(result.eeShare).toBe(0);
      expect(result.erShare).toBe(0);
    });
  });

  describe('computePagibigContribution (MINIMUM mode)', () => {
    it('should use flat ₱200 for MINIMUM mode', () => {
      const monthlyCompensation = 20000;

      const result = computePagibigContribution(monthlyCompensation, 'MINIMUM');

      expect(result.mode).toBe('MINIMUM');
      expect(result.eeShare).toBe(200);  // Flat ₱200
      expect(result.erShare).toBe(200);  // Flat ₱200
      expect(result.total).toBe(400);    // ₱200 + ₱200
    });

    it('should use flat ₱200 regardless of salary in MINIMUM mode', () => {
      const lowSalary = 5000;
      const highSalary = 100000;

      const lowResult = computePagibigContribution(lowSalary, 'MINIMUM');
      const highResult = computePagibigContribution(highSalary, 'MINIMUM');

      // Same contribution for both
      expect(lowResult.eeShare).toBe(200);
      expect(highResult.eeShare).toBe(200);
    });
  });

  describe('getPagibigEmployeeDeduction', () => {
    it('should return full EE share for ONCE_A_MONTH frequency (REGULAR)', () => {
      const monthlyCompensation = 20000;

      const deduction = getPagibigEmployeeDeduction(monthlyCompensation, 'REGULAR', 'ONCE_A_MONTH');

      expect(deduction).toBe(400); // Full monthly 2%
    });

    it('should split EE share in half for TWICE_A_MONTH frequency (REGULAR)', () => {
      const monthlyCompensation = 20000;

      const deduction = getPagibigEmployeeDeduction(monthlyCompensation, 'REGULAR', 'TWICE_A_MONTH');

      expect(deduction).toBe(200); // Half of monthly 2%
    });

    it('should split EE share by 4 for WEEKLY frequency (REGULAR)', () => {
      const monthlyCompensation = 20000;

      const deduction = getPagibigEmployeeDeduction(monthlyCompensation, 'REGULAR', 'WEEKLY');

      expect(deduction).toBe(100); // Quarter of monthly 2%
    });

    it('should return ₱200 for ONCE_A_MONTH frequency (MINIMUM)', () => {
      const monthlyCompensation = 20000;

      const deduction = getPagibigEmployeeDeduction(monthlyCompensation, 'MINIMUM', 'ONCE_A_MONTH');

      expect(deduction).toBe(200); // Flat ₱200
    });

    it('should split ₱200 in half for TWICE_A_MONTH frequency (MINIMUM)', () => {
      const monthlyCompensation = 20000;

      const deduction = getPagibigEmployeeDeduction(monthlyCompensation, 'MINIMUM', 'TWICE_A_MONTH');

      expect(deduction).toBe(100); // ₱200 / 2
    });

    it('should split ₱200 by 4 for WEEKLY frequency (MINIMUM)', () => {
      const monthlyCompensation = 20000;

      const deduction = getPagibigEmployeeDeduction(monthlyCompensation, 'MINIMUM', 'WEEKLY');

      expect(deduction).toBe(50); // ₱200 / 4
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// SSS Contributions Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('SSS Contributions', () => {
  describe('computeSSSContribution', () => {
    it('should compute SSS for salary ₱20,000 (on-bracket)', () => {
      const result = computeSSSContribution(20_000);

      expect(result.monthlySalaryCredit).toBe(20_000);
      expect(result.eeShare).toBe(900);    // 20,000 × 4.5%
      expect(result.erShare).toBe(1_900);  // 20,000 × 9.5%
      expect(result.ec).toBe(30);          // MSC ≥ 15,000
      expect(result.total).toBe(2_830);    // 900 + 1,900 + 30
    });

    it('should round up to next ₱500 bracket', () => {
      const result = computeSSSContribution(14_100);

      // Rounds up to 14,500
      expect(result.monthlySalaryCredit).toBe(14_500);
      expect(result.eeShare).toBe(652.5);  // 14,500 × 4.5%
      expect(result.erShare).toBe(1_377.5); // 14,500 × 9.5%
      expect(result.ec).toBe(10);          // MSC < 15,000
    });

    it('should use ₱10 EC for MSC ≤ ₱14,750', () => {
      const result = computeSSSContribution(14_500);

      expect(result.monthlySalaryCredit).toBe(14_500);
      expect(result.ec).toBe(10);
    });

    it('should use ₱30 EC for MSC ≥ ₱15,000', () => {
      const result = computeSSSContribution(15_000);

      expect(result.monthlySalaryCredit).toBe(15_000);
      expect(result.ec).toBe(30);
    });

    it('should floor salary below ₱3,250 to minimum bracket', () => {
      const result = computeSSSContribution(2_500);

      expect(result.monthlySalaryCredit).toBe(3_250);
      expect(result.eeShare).toBe(146.25);  // 3,250 × 4.5%
      expect(result.erShare).toBe(308.75);  // 3,250 × 9.5%
    });

    it('should cap salary above ₱30,000 to maximum bracket', () => {
      const result = computeSSSContribution(50_000);

      expect(result.monthlySalaryCredit).toBe(30_000);
      expect(result.eeShare).toBe(1_350);   // 30,000 × 4.5%
      expect(result.erShare).toBe(2_850);   // 30,000 × 9.5%
      expect(result.ec).toBe(30);
      expect(result.total).toBe(4_230);     // 1,350 + 2,850 + 30
    });

    it('should handle zero salary', () => {
      const result = computeSSSContribution(0);

      expect(result.monthlySalaryCredit).toBe(3_250); // Floor to minimum
      expect(result.eeShare).toBe(146.25);
    });

    it('should handle negative salary as zero', () => {
      const result = computeSSSContribution(-5_000);

      expect(result.monthlySalaryCredit).toBe(3_250); // Floor to minimum
    });
  });

  describe('getSSSEmployeeDeduction', () => {
    it('should return full EE share for ONCE_A_MONTH frequency', () => {
      const monthlySalary = 20_000;

      const deduction = getSSSEmployeeDeduction(monthlySalary, 'ONCE_A_MONTH');

      expect(deduction).toBe(900); // Full monthly share
    });

    it('should split EE share in half for TWICE_A_MONTH frequency', () => {
      const monthlySalary = 20_000;

      const deduction = getSSSEmployeeDeduction(monthlySalary, 'TWICE_A_MONTH');

      expect(deduction).toBe(450); // Half of monthly share
    });

    it('should split EE share by 4 for WEEKLY frequency', () => {
      const monthlySalary = 20_000;

      const deduction = getSSSEmployeeDeduction(monthlySalary, 'WEEKLY');

      expect(deduction).toBe(225); // Quarter of monthly share
    });

    it('should cap deduction at maximum bracket for high earners', () => {
      const highSalary = 100_000;

      const deduction = getSSSEmployeeDeduction(highSalary, 'TWICE_A_MONTH');

      // MSC capped at 30,000 → 1,350 / 2 = 675
      expect(deduction).toBe(675);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Combined Government Contributions Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Combined Government Contributions (All Three)', () => {
  it('should calculate total monthly deductions for standard employee', () => {
    const monthlyBasicSalary = 25_000;

    const philHealth = computePhilHealthContribution(monthlyBasicSalary);
    const sss = computeSSSContribution(monthlyBasicSalary);
    const pagibig = computePagibigContribution(monthlyBasicSalary, 'REGULAR');

    const totalEEDeduction = philHealth.eeShare + sss.eeShare + pagibig.eeShare;

    expect(philHealth.eeShare).toBe(625);     // 25,000 × 2.5%
    expect(sss.eeShare).toBe(1_125);          // 25,000 × 4.5%
    expect(pagibig.eeShare).toBe(500);        // 25,000 × 2%
    expect(totalEEDeduction).toBe(2_250);     // Total monthly deduction
  });

  it('should calculate total per-payslip deductions (TWICE_A_MONTH)', () => {
    const monthlyBasicSalary = 25_000;

    const philHealthPerPayslip = getPhilHealthEmployeeDeduction(monthlyBasicSalary, 'TWICE_A_MONTH');
    const sssPerPayslip = getSSSEmployeeDeduction(monthlyBasicSalary, 'TWICE_A_MONTH');
    const pagibigPerPayslip = getPagibigEmployeeDeduction(monthlyBasicSalary, 'REGULAR', 'TWICE_A_MONTH');

    const totalPerPayslip = philHealthPerPayslip + sssPerPayslip + pagibigPerPayslip;

    expect(philHealthPerPayslip).toBe(312.5);  // 625 / 2
    expect(sssPerPayslip).toBe(562.5);         // 1,125 / 2
    expect(pagibigPerPayslip).toBe(250);       // 500 / 2
    expect(totalPerPayslip).toBe(1_125);       // Total per payslip
  });

  it('should verify per-payslip × 2 equals monthly total', () => {
    const monthlyBasicSalary = 20_000;

    // Monthly totals
    const philHealthMonthly = computePhilHealthContribution(monthlyBasicSalary);
    const sssMonthly = computeSSSContribution(monthlyBasicSalary);
    const pagibigMonthly = computePagibigContribution(monthlyBasicSalary, 'REGULAR');

    // Per-payslip amounts
    const philHealthPerPayslip = getPhilHealthEmployeeDeduction(monthlyBasicSalary, 'TWICE_A_MONTH');
    const sssPerPayslip = getSSSEmployeeDeduction(monthlyBasicSalary, 'TWICE_A_MONTH');
    const pagibigPerPayslip = getPagibigEmployeeDeduction(monthlyBasicSalary, 'REGULAR', 'TWICE_A_MONTH');

    // Verify twice per-payslip equals monthly
    expect(philHealthPerPayslip * 2).toBe(philHealthMonthly.eeShare);
    expect(sssPerPayslip * 2).toBe(sssMonthly.eeShare);
    expect(pagibigPerPayslip * 2).toBe(pagibigMonthly.eeShare);
  });

  it('should handle high earner (above SSS cap)', () => {
    const monthlyBasicSalary = 100_000;

    const philHealth = computePhilHealthContribution(monthlyBasicSalary);
    const sss = computeSSSContribution(monthlyBasicSalary);
    const pagibig = computePagibigContribution(monthlyBasicSalary, 'REGULAR');

    expect(philHealth.eeShare).toBe(2_500);    // 100,000 × 2.5% (no cap)
    expect(sss.eeShare).toBe(1_350);           // Capped at 30,000 MSC
    expect(pagibig.eeShare).toBe(2_000);       // 100,000 × 2%

    const totalEEDeduction = philHealth.eeShare + sss.eeShare + pagibig.eeShare;
    expect(totalEEDeduction).toBe(5_850);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Edge Cases & Integration Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge Cases', () => {
  it('should handle very large salaries', () => {
    const veryHighSalary = 500000;

    const philHealth = computePhilHealthContribution(veryHighSalary);
    const pagibig = computePagibigContribution(veryHighSalary, 'REGULAR');
    const sss = computeSSSContribution(veryHighSalary);

    expect(philHealth.eeShare).toBe(12500);  // 500k × 2.5%
    expect(pagibig.eeShare).toBe(10000);     // 500k × 2%
    expect(sss.eeShare).toBe(1_350);         // Capped at 30k MSC
  });

  it('should handle fractional salaries correctly', () => {
    const salary = 13333.33; // Odd salary amount

    const philHealth = computePhilHealthContribution(salary);
    const pagibig = computePagibigContribution(salary, 'REGULAR');

    expect(philHealth.eeShare).toBeCloseTo(333.33, 2);  // 13333.33 × 2.5%
    expect(pagibig.eeShare).toBeCloseTo(266.67, 2);     // 13333.33 × 2%
  });
});

describe('Real-world Scenarios', () => {
  it('should calculate correct deductions for a standard employee paid twice a month', () => {
    const monthlyBasicSalary = 25000;

    // PhilHealth deduction per payslip
    const philHealthDeduction = getPhilHealthEmployeeDeduction(monthlyBasicSalary, 'TWICE_A_MONTH');
    
    // Pag-IBIG deduction per payslip (REGULAR mode)
    const pagibigDeduction = getPagibigEmployeeDeduction(monthlyBasicSalary, 'REGULAR', 'TWICE_A_MONTH');

    // Total government deductions per payslip
    const totalDeductionPerPayslip = philHealthDeduction + pagibigDeduction;

    expect(philHealthDeduction).toBe(312.5);  // (25000 × 2.5%) / 2
    expect(pagibigDeduction).toBe(250);       // (25000 × 2%) / 2
    expect(totalDeductionPerPayslip).toBe(562.5);
  });

  it('should calculate correct monthly totals when summing all payslips', () => {
    const monthlyBasicSalary = 25000;

    // Two payslips per month
    const philHealthPerPayslip = getPhilHealthEmployeeDeduction(monthlyBasicSalary, 'TWICE_A_MONTH');
    const pagibigPerPayslip = getPagibigEmployeeDeduction(monthlyBasicSalary, 'REGULAR', 'TWICE_A_MONTH');

    const monthlyPhilHealth = philHealthPerPayslip * 2;
    const monthlyPagibig = pagibigPerPayslip * 2;

    // Should equal the full monthly computation
    const fullPhilHealth = computePhilHealthContribution(monthlyBasicSalary);
    const fullPagibig = computePagibigContribution(monthlyBasicSalary, 'REGULAR');

    expect(monthlyPhilHealth).toBe(fullPhilHealth.eeShare);
    expect(monthlyPagibig).toBe(fullPagibig.eeShare);
  });

  it('should handle minimum wage earner with MINIMUM Pag-IBIG mode', () => {
    const monthlyBasicSalary = 13000;

    const philHealthDeduction = getPhilHealthEmployeeDeduction(monthlyBasicSalary, 'TWICE_A_MONTH');
    const pagibigDeduction = getPagibigEmployeeDeduction(monthlyBasicSalary, 'MINIMUM', 'TWICE_A_MONTH');

    expect(philHealthDeduction).toBe(162.5);  // (13000 × 2.5%) / 2
    expect(pagibigDeduction).toBe(100);       // ₱200 / 2
  });
});

/**
 * HOW TO RUN THESE TESTS:
 * 
 * 1. Run all tests:
 *    npm test
 * 
 * 2. Run only this file:
 *    npm test -- government-contributions.test.ts
 * 
 * 3. Run in watch mode:
 *    npm run test:watch
 * 
 * 4. Check coverage:
 *    npm run test:coverage
 * 
 * WHAT TO DO NEXT:
 * 
 * 1. Create similar test files for:
 *    - src/lib/__tests__/dole-overtime.test.ts
 *    - src/lib/__tests__/invoice-history.test.ts
 *    - src/app/api/clients/__tests__/route.test.ts
 * 
 * 2. Run tests before committing code:
 *    npm test
 * 
 * 3. Aim for 80%+ coverage on business-critical files
 */
