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

// ─── Holiday Pay ──────────────────────────────────────────────────────────────

export interface TimesheetHolidayRow {
  date: Date;
  timeIn?: Date | null;
  timeOut?: Date | null;
  regularHours: string | number | { toString(): string };
  rdHours:      string | number | { toString(): string };
  shHours:      string | number | { toString(): string };
  shRdHours:    string | number | { toString(): string };
  rhHours:      string | number | { toString(): string };
  rhRdHours:    string | number | { toString(): string };
  dailyGrossPay: string | number | { toString(): string };
}

/**
 * DOLE-Compliant Holiday Pay Calculation (Philippine Labor Code Art. 94 + DOLE Rules)
 *
 * Regular Holidays (RA 9492, Labor Code Art. 94):
 *   Unworked → 100% of regular daily rate (mandated paid holiday)
 *   Worked   → 200% of regular daily rate
 *   Worked + rest day → 260% (200% × 130%)
 *
 * Special Non-Working Holidays:
 *   Unworked → 0 (no work, no pay)
 *   Worked   → 130% of regular daily rate
 *   Worked + rest day → 150%
 *
 * Pay type behaviour:
 *
 *   VARIABLE_PAY:
 *     basicPay counts only regular working days (regularHours > 0).
 *     holidayPay = (worked premium days' dailyGrossPay: rest days, special holidays,
 *                   regular holidays) + (unworked regular holidays × dailyRate)
 *     This makes the "Holiday Pay" line visible on every payslip where premium days exist.
 *
 *   FIXED_PAY:
 *     basicPay = full periodic salary, which already covers 1× (100%) for every day.
 *     holidayPay = additional premium earned by working on a premium day:
 *       Rest day                    rdHours   × (dailyRate/8) × 0.30  (+30%)
 *       Special holiday             shHours   × (dailyRate/8) × 0.30  (+30%)
 *       Special holiday + rest day  shRdHours × (dailyRate/8) × 0.50  (+50%)
 *       Regular holiday             rhHours   × (dailyRate/8) × 1.00  (+100%)
 *       Regular holiday + rest day  rhRdHours × (dailyRate/8) × 1.60  (+160% = 260% − 100%)
 *
 * @param timesheets  - Employee timesheet rows for the period
 * @param holidayMap  - Map of ISO date string → holiday type (REGULAR | SPECIAL_NON_WORKING | …)
 * @param payType     - "FIXED_PAY" | "VARIABLE_PAY"
 * @param dailyRate   - Employee's calculated daily rate (₱)
 * @param periodStart - Pay period start date (UTC midnight)
 * @param periodEnd   - Pay period end date (UTC midnight, inclusive)
 * @returns Holiday pay amount in ₱, rounded to 2 decimal places
 */
export function computeHolidayPay(
  timesheets: TimesheetHolidayRow[],
  holidayMap: Map<string, string>,
  payType: string,
  dailyRate: number,
  periodStart: Date,
  periodEnd: Date,
): number {
  const hourlyRate = dailyRate / 8;

  if (payType === 'VARIABLE_PAY') {
    // Sum dailyGrossPay for ALL worked premium days (rest days + any holiday type).
    // These rows have regularHours = 0 but a non-zero dailyGrossPay set by
    // computeTimesheetFields with the correct DOLE multiplier.
    let premiumWorkedPay = 0;
    const tsDateKeys = new Set<string>();
    for (const ts of timesheets) {
      const dateKey = ts.date.toISOString().slice(0, 10);
      tsDateKeys.add(dateKey);
      if (Number(ts.regularHours) === 0 && Number(ts.dailyGrossPay) > 0) {
        premiumWorkedPay += Number(ts.dailyGrossPay);
      }
    }

    // Add mandated pay for unworked regular holidays (Labor Code Art. 94).
    // Employees are entitled to 100% of their daily rate for each regular holiday
    // day in the period even if they did not render work.
    let unworkedRhCount = 0;
    const cursor = new Date(periodStart);
    while (cursor <= periodEnd) {
      const key = cursor.toISOString().slice(0, 10);
      if (holidayMap.get(key) === 'REGULAR' && !tsDateKeys.has(key)) {
        unworkedRhCount++;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return parseFloat((premiumWorkedPay + unworkedRhCount * dailyRate).toFixed(2));
  }

  // FIXED_PAY: sum the additional premium amounts for each worked premium hour.
  // basicPay already includes 1× (100%) for every day, so we only add the excess.
  let premium = 0;
  for (const ts of timesheets) {
    premium += Number(ts.rdHours)   * hourlyRate * 0.30; // rest day: +30%
    premium += Number(ts.shHours)   * hourlyRate * 0.30; // special holiday: +30%
    premium += Number(ts.shRdHours) * hourlyRate * 0.50; // special holiday + rest day: +50%
    premium += Number(ts.rhHours)   * hourlyRate * 1.00; // regular holiday: +100%
    premium += Number(ts.rhRdHours) * hourlyRate * 1.60; // regular holiday + rest day: +160%
  }
  return parseFloat(premium.toFixed(2));
}
