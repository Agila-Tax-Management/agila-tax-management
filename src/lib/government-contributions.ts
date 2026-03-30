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

// ─── SSS / Social Security System ─────────────────────────────────────────────
/**
 * SSS Contribution Schedule (2024)
 * Source: SSS Circular 2023-003 (effective January 2024)
 *
 * Rate structure:
 *   Employee share: 4.5% of Monthly Salary Credit (MSC)
 *   Employer share: 9.5% of MSC
 *   EC (Employees' Compensation): ₱10 if MSC ≤ ₱14,750, ₱30 if MSC ≥ ₱15,000 — employer only
 *   MSC brackets: ₱3,250 – ₱30,000 in increments of ₱500
 *
 * ⚠ Update constants below when SSS releases a new circular.
 */

const SSS_EE_RATE = 0.045;
const SSS_ER_RATE = 0.095;
const SSS_MIN_MSC = 3_250;
const SSS_MAX_MSC = 30_000;
const SSS_MSC_STEP = 500;

export interface SSSContributionResult {
  /** Monthly Salary Credit used for computation */
  monthlySalaryCredit: number;
  /** Employee share = MSC × 4.5% */
  eeShare: number;
  /** Employer share = MSC × 9.5% (excluding EC) */
  erShare: number;
  /** Employees' Compensation — employer only (₱10 or ₱30) */
  ec: number;
  /** Total = EE + ER + EC */
  total: number;
}

/**
 * Returns the Monthly Salary Credit (MSC) bracket for a given monthly salary.
 * MSC brackets run from ₱3,250 to ₱30,000 in steps of ₱500.
 * Salaries below ₱3,250 are floored to the minimum bracket; above ₱30,000 are capped.
 *
 * @example getSSSMonthlySalaryCredit(14_500) // → 14_500
 * @example getSSSMonthlySalaryCredit(3_100)  // → 3_250 (floor to minimum)
 * @example getSSSMonthlySalaryCredit(35_000) // → 30_000 (cap at maximum)
 */
function getSSSMonthlySalaryCredit(monthlySalary: number): number {
  if (monthlySalary <= SSS_MIN_MSC) return SSS_MIN_MSC;
  if (monthlySalary >= SSS_MAX_MSC) return SSS_MAX_MSC;
  // Round up to the next ₱500 bracket
  return Math.ceil(monthlySalary / SSS_MSC_STEP) * SSS_MSC_STEP;
}

/**
 * Computes the full SSS contribution breakdown for a given monthly salary.
 *
 * @param monthlySalary - Employee's calculatedMonthlyRate
 * @returns SSSContributionResult
 *
 * @example
 * computeSSSContribution(20_000);
 * // → { monthlySalaryCredit: 20_000, eeShare: 900, erShare: 1_900, ec: 30, total: 2_830 }
 */
export function computeSSSContribution(monthlySalary: number): SSSContributionResult {
  const msc = getSSSMonthlySalaryCredit(Math.max(0, monthlySalary));
  const eeShare = Math.round(msc * SSS_EE_RATE * 100) / 100;
  const erShare = Math.round(msc * SSS_ER_RATE * 100) / 100;
  const ec = msc >= 15_000 ? 30 : 10;
  return {
    monthlySalaryCredit: msc,
    eeShare,
    erShare,
    ec,
    total: eeShare + erShare + ec,
  };
}

/**
 * Returns the per-payslip SSS deduction for an employee, split by pay frequency.
 * Use this value for payslip.sssDeduction when compensation.deductSss is true.
 *
 * @param monthlySalary - Employee's calculatedMonthlyRate
 * @param frequency     - Employee's pay frequency from EmployeeCompensation
 * @returns Amount to deduct from the payslip
 *
 * @example
 * getSSSEmployeeDeduction(20_000, 'TWICE_A_MONTH'); // → 450
 * getSSSEmployeeDeduction(20_000, 'ONCE_A_MONTH');  // → 900
 */
export function getSSSEmployeeDeduction(
  monthlySalary: number,
  frequency: 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY',
): number {
  const { eeShare } = computeSSSContribution(monthlySalary);
  switch (frequency) {
    case 'ONCE_A_MONTH':  return eeShare;
    case 'TWICE_A_MONTH': return eeShare / 2;
    case 'WEEKLY':        return eeShare / 4;
  }
}
