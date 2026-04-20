// src/lib/dole-overtime.ts

/**
 * DOLE-Compliant Overtime Pay Calculation (Labor Code of the Philippines)
 *
 * All multipliers are applied to: baseHourlyRate = dailyRate / 8
 *
 * Rule 1 – Regular working day OT:
 *   baseHourlyRate × 125% = × 1.25
 *
 * Rule 2 – Special non-working holiday OR scheduled rest day OT:
 *   baseHourlyRate × 130% (day rate) × 130% (OT premium) = × 1.69
 *
 * Rule 3 – Special non-working holiday that also falls on rest day OT:
 *   baseHourlyRate × 150% (day rate) × 130% (OT premium) = × 1.95
 *
 * Rule 4 – Regular holiday OT:
 *   baseHourlyRate × 200% (day rate) × 130% (OT premium) = × 2.60
 *
 * Rule 5 – Regular holiday that also falls on rest day OT:
 *   baseHourlyRate × 200% × 130% (day rate) × 130% (OT premium) = × 3.38
 */

export const DOLE_OT_MULTIPLIERS = {
  regOt:  1.25, // Regular working day OT (Rule 1)
  rdOt:   1.69, // Rest day OT (Rule 2)
  shOt:   1.69, // Special non-working holiday OT (Rule 2)
  shRdOt: 1.95, // Special non-working holiday + rest day OT (Rule 3)
  rhOt:   2.60, // Regular holiday OT (Rule 4)
  rhRdOt: 3.38, // Regular holiday + rest day OT (Rule 5)
} as const;

export interface TimesheetOtRow {
  regOtHours:  string | number | { toString(): string };
  rdOtHours:   string | number | { toString(): string };
  shOtHours:   string | number | { toString(): string };
  shRdOtHours: string | number | { toString(): string };
  rhOtHours:   string | number | { toString(): string };
  rhRdOtHours: string | number | { toString(): string };
}

/**
 * Computes total DOLE-compliant overtime pay from a set of timesheet rows.
 *
 * @param rows      - Timesheet records with all six OT-hour columns
 * @param dailyRate - Employee's calculatedDailyRate (₱)
 * @returns         - Total OT pay in ₱, rounded to 2 decimal places
 */
export function computeDoleOvertimePay(
  rows: TimesheetOtRow[],
  dailyRate: number,
): number {
  const hourlyRate = dailyRate / 8;
  let total = 0;

  for (const row of rows) {
    total +=
      Number(row.regOtHours)  * DOLE_OT_MULTIPLIERS.regOt  * hourlyRate +
      Number(row.rdOtHours)   * DOLE_OT_MULTIPLIERS.rdOt   * hourlyRate +
      Number(row.shOtHours)   * DOLE_OT_MULTIPLIERS.shOt   * hourlyRate +
      Number(row.shRdOtHours) * DOLE_OT_MULTIPLIERS.shRdOt * hourlyRate +
      Number(row.rhOtHours)   * DOLE_OT_MULTIPLIERS.rhOt   * hourlyRate +
      Number(row.rhRdOtHours) * DOLE_OT_MULTIPLIERS.rhRdOt * hourlyRate;
  }

  return parseFloat(total.toFixed(2));
}

/**
 * Returns the sum of all OT hours across all types from a set of timesheet rows.
 * Useful for populating the payslip's frozen `totalOvertimeHours` summary field.
 */
export function sumOtHours(rows: TimesheetOtRow[]): number {
  return rows.reduce(
    (s, r) =>
      s +
      Number(r.regOtHours) +
      Number(r.rdOtHours) +
      Number(r.shOtHours) +
      Number(r.shRdOtHours) +
      Number(r.rhOtHours) +
      Number(r.rhRdOtHours),
    0,
  );
}
