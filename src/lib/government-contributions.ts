// src/lib/government-contributions.ts
/**
 * Government Contributions Calculator — Philippines
 *
 * Covers:
 *  - PhilHealth (Republic Act 11223): 5% of monthly basic salary, split 2.5% EE / 2.5% ER
 *  - Pag-IBIG / HDMF: Two contribution modes:
 *      REGULAR — 2% of monthly compensation (EE) + 2% (ER)
 *      MINIMUM — Flat ₱200/month (EE) + ₱200/month (ER)
 *
 * Usage in payslip generation:
 *  payslip.philhealthDeduction = getPhilHealthEmployeeDeduction(calculatedMonthlyRate, frequency)
 *  payslip.pagibigDeduction    = getPagibigEmployeeDeduction(calculatedMonthlyRate, pagibigType, frequency)
 */

// ─── PhilHealth ────────────────────────────────────────────────────────────────

export interface PhilHealthContributionResult {
  /** Monthly basic salary used for computation */
  monthlySalary: number;
  /** EE share = monthlySalary × 2.5% */
  eeShare: number;
  /** ER share = monthlySalary × 2.5% */
  erShare: number;
  /** Total = EE + ER (5% of monthly salary) */
  total: number;
}

/**
 * Computes the full PhilHealth contribution for a given monthly basic salary.
 * Rate: 5% total — 2.5% EE / 2.5% ER (no salary ceiling applied here; apply at call site if needed).
 *
 * @param monthlyBasicSalary - Employee's calculatedMonthlyRate
 * @returns PhilHealthContributionResult
 *
 * @example
 * computePhilHealthContribution(20000);
 * // → { monthlySalary: 20000, eeShare: 500, erShare: 500, total: 1000 }
 */
export function computePhilHealthContribution(monthlyBasicSalary: number): PhilHealthContributionResult {
  const salary = Math.max(0, monthlyBasicSalary);
  const eeShare = salary * 0.025;
  const erShare = salary * 0.025;
  return {
    monthlySalary: salary,
    eeShare,
    erShare,
    total: eeShare + erShare,
  };
}

/**
 * Returns the per-payslip PhilHealth deduction for an employee, split by pay frequency.
 * Use this value for payslip.philhealthDeduction when compensation.deductPhilhealth is true.
 *
 * @param monthlyBasicSalary - Employee's calculatedMonthlyRate
 * @param frequency          - Employee's pay frequency from EmployeeCompensation
 * @returns Amount to deduct from the payslip
 *
 * @example
 * getPhilHealthEmployeeDeduction(20000, 'TWICE_A_MONTH'); // → 250
 * getPhilHealthEmployeeDeduction(20000, 'ONCE_A_MONTH');  // → 500
 */
export function getPhilHealthEmployeeDeduction(
  monthlyBasicSalary: number,
  frequency: 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY',
): number {
  const { eeShare } = computePhilHealthContribution(monthlyBasicSalary);
  switch (frequency) {
    case 'ONCE_A_MONTH':  return eeShare;
    case 'TWICE_A_MONTH': return eeShare / 2;
    case 'WEEKLY':        return eeShare / 4;
  }
}

// ─── Pag-IBIG / HDMF ──────────────────────────────────────────────────────────

/** Contribution mode for Pag-IBIG — mirrors PagibigContributionType enum in Prisma */
export type PagibigMode = 'REGULAR' | 'MINIMUM';

export interface PagibigContributionResult {
  /** Contribution mode used */
  mode: PagibigMode;
  /** Monthly compensation used for REGULAR computation */
  monthlyCompensation: number;
  /**
   * EE monthly contribution:
   *  - REGULAR: monthlyCompensation × 2%
   *  - MINIMUM: ₱200 flat
   */
  eeShare: number;
  /**
   * ER monthly contribution (mirrors EE):
   *  - REGULAR: monthlyCompensation × 2%
   *  - MINIMUM: ₱200 flat
   */
  erShare: number;
  /** Total = EE + ER */
  total: number;
}

/**
 * Computes the full Pag-IBIG contribution breakdown.
 *
 * @param monthlyCompensation - Employee's calculatedMonthlyRate
 * @param mode                - 'REGULAR' (2%) or 'MINIMUM' (₱200 flat)
 * @returns PagibigContributionResult
 *
 * @example
 * computePagibigContribution(15000, 'REGULAR'); // → { eeShare: 300, erShare: 300, total: 600 }
 * computePagibigContribution(15000, 'MINIMUM'); // → { eeShare: 200, erShare: 200, total: 400 }
 */
export function computePagibigContribution(
  monthlyCompensation: number,
  mode: PagibigMode,
): PagibigContributionResult {
  const comp = Math.max(0, monthlyCompensation);
  let eeShare: number;
  let erShare: number;

  if (mode === 'MINIMUM') {
    eeShare = 200;
    erShare = 200;
  } else {
    eeShare = comp * 0.02;
    erShare = comp * 0.02;
  }

  return {
    mode,
    monthlyCompensation: comp,
    eeShare,
    erShare,
    total: eeShare + erShare,
  };
}

/**
 * Returns the per-payslip Pag-IBIG deduction for an employee, split by pay frequency.
 * Use this value for payslip.pagibigDeduction when compensation.deductPagibig is true.
 *
 * @param monthlyCompensation - Employee's calculatedMonthlyRate
 * @param mode                - 'REGULAR' (2%) or 'MINIMUM' (₱200 flat)
 * @param frequency           - Employee's pay frequency from EmployeeCompensation
 * @returns Amount to deduct from the payslip
 *
 * @example
 * getPagibigEmployeeDeduction(15000, 'REGULAR', 'TWICE_A_MONTH'); // → 150
 * getPagibigEmployeeDeduction(15000, 'MINIMUM', 'TWICE_A_MONTH'); // → 100
 */
export function getPagibigEmployeeDeduction(
  monthlyCompensation: number,
  mode: PagibigMode,
  frequency: 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY',
): number {
  const { eeShare } = computePagibigContribution(monthlyCompensation, mode);
  switch (frequency) {
    case 'ONCE_A_MONTH':  return eeShare;
    case 'TWICE_A_MONTH': return eeShare / 2;
    case 'WEEKLY':        return eeShare / 4;
  }
}
