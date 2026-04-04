// src/lib/timesheet-calc.ts

/**
 * Pure utility for computing all derived Timesheet fields from raw punch data.
 *
 * Called whenever a timesheet row has both timeIn and timeOut (clock-out action
 * or COA approval that sets a time resulting in a fully-punched row).
 *
 * Day type determines which DOLE hour buckets and pay multipliers apply:
 *
 *   REGULAR              → regularHours / regOtHours    (late/undertime deductions apply)
 *   REST_DAY             → rdHours / rdOtHours          (×1.30 base / ×1.69 OT)
 *   SPECIAL_HOLIDAY      → shHours / shOtHours          (×1.30 base / ×1.69 OT)
 *   SPECIAL_HOLIDAY_REST → shRdHours / shRdOtHours      (×1.50 base / ×1.95 OT)
 *   REGULAR_HOLIDAY      → rhHours / rhOtHours          (×2.00 base / ×2.60 OT)
 *   REGULAR_HOLIDAY_REST → rhRdHours / rhRdOtHours      (×2.60 base / ×3.38 OT)
 *
 * Note: SPECIAL_WORKING holidays are treated as REGULAR days (no premium).
 */

/**
 * Classifies a calendar day for DOLE pay rule selection.
 * Caller resolves holiday calendar + schedule rest-day status before passing here.
 */
export type DayType =
  | 'REGULAR'
  | 'REST_DAY'
  | 'SPECIAL_HOLIDAY'
  | 'SPECIAL_HOLIDAY_REST'
  | 'REGULAR_HOLIDAY'
  | 'REGULAR_HOLIDAY_REST';

export interface ScheduleDayInput {
  startTime: string;   // "HH:MM" e.g. "08:00"
  endTime: string;     // "HH:MM" e.g. "17:00"
  breakStart?: string | null;
  breakEnd?: string | null;
  isWorkingDay: boolean;
}

export interface CompensationInput {
  calculatedDailyRate: string | number;
  payType: string; // "FIXED_PAY" | "VARIABLE_PAY"
}

export interface TimesheetComputedFields {
  regularHours: number;
  lateMinutes: number;
  undertimeMinutes: number;
  regOtHours: number;
  // Rest-day / holiday hour buckets
  rdHours: number;
  rdOtHours: number;
  shHours: number;
  shOtHours: number;
  shRdHours: number;
  shRdOtHours: number;
  rhHours: number;
  rhOtHours: number;
  rhRdHours: number;
  rhRdOtHours: number;
  dailyGrossPay: number;
}

/** Parse "HH:MM" into total minutes since midnight. */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/**
 * Default fallback schedule: 08:00–17:00 with 60-minute lunch break.
 * Used when the employee has no work schedule configured.
 */
const DEFAULT_SCHEDULE: Required<ScheduleDayInput> = {
  startTime: "08:00",
  endTime: "17:00",
  breakStart: "12:00",
  breakEnd: "13:00",
  isWorkingDay: true,
};

/**
 * Compute all derived timesheet fields from raw punches + schedule + compensation.
 *
 * @param timeIn      - Employee's clock-in datetime
 * @param timeOut     - Employee's clock-out datetime
 * @param lunchStart  - Optional lunch start datetime
 * @param lunchEnd    - Optional lunch end datetime
 * @param scheduleDay - The WorkScheduleDay entry for this day, or null to use default
 * @param compensation - The employee's active EmployeeCompensation, or null for zero pay
 * @param dayType     - DOLE day classification (default: REGULAR)
 */
export function computeTimesheetFields(
  timeIn: Date,
  timeOut: Date,
  lunchStart: Date | null,
  lunchEnd: Date | null,
  scheduleDay: ScheduleDayInput | null,
  compensation: CompensationInput | null,
  dayType: DayType = 'REGULAR',
): TimesheetComputedFields {
  const sched = scheduleDay ?? DEFAULT_SCHEDULE;

  // ── Scheduled work minutes (excluding configured break) ──────────────────
  const schedStartMin = toMinutes(sched.startTime);
  const schedEndMin = toMinutes(sched.endTime);

  const breakStartMin =
    sched.breakStart ? toMinutes(sched.breakStart) :
    sched.breakEnd   ? toMinutes(sched.breakEnd) - 60 : null;
  const breakEndMin =
    sched.breakEnd   ? toMinutes(sched.breakEnd) :
    sched.breakStart ? toMinutes(sched.breakStart) + 60 : null;

  const configuredBreakMin =
    breakStartMin !== null && breakEndMin !== null
      ? Math.max(0, breakEndMin - breakStartMin)
      : 60; // default 60 min break assumed if schedule has no break configured

  const scheduledWorkMin = Math.max(0, schedEndMin - schedStartMin - configuredBreakMin);

  // ── Actual worked milliseconds ───────────────────────────────────────────
  // Use actual lunch punch duration when available; otherwise assume the configured
  // break was taken. This prevents break time from being counted as worked/OT hours
  // when no lunch punch is recorded (e.g. employee forgot to punch in/out for lunch).
  const effectiveLunchMs =
    lunchStart && lunchEnd
      ? Math.max(0, lunchEnd.getTime() - lunchStart.getTime())
      : configuredBreakMin * 60000;
  const workedMs = Math.max(0, timeOut.getTime() - timeIn.getTime() - effectiveLunchMs);
  const workedMin = workedMs / 60000;

  // ── Zero out all buckets; only the relevant ones get filled below ─────────
  let regularHours = 0;
  let lateMinutes = 0;
  let undertimeMinutes = 0;
  let regOtHours = 0;
  let rdHours = 0;
  let rdOtHours = 0;
  let shHours = 0;
  let shOtHours = 0;
  let shRdHours = 0;
  let shRdOtHours = 0;
  let rhHours = 0;
  let rhOtHours = 0;
  let rhRdHours = 0;
  let rhRdOtHours = 0;
  let dailyGrossPay = 0;

  const dailyRate = compensation ? Number(compensation.calculatedDailyRate) : 0;
  const isVariable = compensation?.payType === 'VARIABLE_PAY';

  if (dayType === 'REGULAR') {
    // ── Late / undertime (only on scheduled working days) ─────────────────
    // Times are stored as UTC (buildUtcDate: "HH:MM" → T${HH:MM}:00.000Z).
    const timeInMin = timeIn.getUTCHours() * 60 + timeIn.getUTCMinutes();
    lateMinutes = Math.max(0, timeInMin - schedStartMin);

    const timeOutMin = timeOut.getUTCHours() * 60 + timeOut.getUTCMinutes();
    undertimeMinutes = Math.max(0, schedEndMin - timeOutMin);

    // ── Regular vs reg OT hours ───────────────────────────────────────────
    regularHours = parseFloat((Math.min(workedMin, scheduledWorkMin) / 60).toFixed(2));
    regOtHours   = parseFloat((Math.max(0, workedMin - scheduledWorkMin) / 60).toFixed(2));

    // ── Daily gross pay ───────────────────────────────────────────────────
    if (compensation) {
      if (!isVariable) {
        // Fixed pay: full daily rate regardless of lateness/undertime.
        dailyGrossPay = dailyRate;
      } else {
        // Variable pay: deduct proportional late + undertime.
        const deductMin = lateMinutes + undertimeMinutes;
        const deductFraction = scheduledWorkMin > 0 ? deductMin / scheduledWorkMin : 0;
        dailyGrossPay = parseFloat(Math.max(0, dailyRate * (1 - deductFraction)).toFixed(2));
      }
    }
  } else {
    // ── Premium / holiday days: 8-hour threshold, no late/undertime ───────
    // DOLE base-pay multipliers for the first 8 hours:
    //   REST_DAY             → 1.30
    //   SPECIAL_HOLIDAY      → 1.30
    //   SPECIAL_HOLIDAY_REST → 1.50
    //   REGULAR_HOLIDAY      → 2.00
    //   REGULAR_HOLIDAY_REST → 2.60 (200% + 30% of 200%)
    const BASE_MULT: Record<DayType, number> = {
      REGULAR:              1.00,
      REST_DAY:             1.30,
      SPECIAL_HOLIDAY:      1.30,
      SPECIAL_HOLIDAY_REST: 1.50,
      REGULAR_HOLIDAY:      2.00,
      REGULAR_HOLIDAY_REST: 2.60,
    };
    // OT pay for premium days is computed externally via computeDoleOvertimePay()
    // using the rdOtHours / shOtHours / rhOtHours etc. buckets populated below.

    const stdMin = 8 * 60; // 8-hour standard on premium days
    const baseHours = parseFloat((Math.min(workedMin, stdMin) / 60).toFixed(2));
    const otHours   = parseFloat((Math.max(0, workedMin - stdMin) / 60).toFixed(2));

    switch (dayType) {
      case 'REST_DAY':             rdHours   = baseHours; rdOtHours   = otHours; break;
      case 'SPECIAL_HOLIDAY':      shHours   = baseHours; shOtHours   = otHours; break;
      case 'SPECIAL_HOLIDAY_REST': shRdHours = baseHours; shRdOtHours = otHours; break;
      case 'REGULAR_HOLIDAY':      rhHours   = baseHours; rhOtHours   = otHours; break;
      case 'REGULAR_HOLIDAY_REST': rhRdHours = baseHours; rhRdOtHours = otHours; break;
    }

    if (compensation) {
      // dailyGrossPay = prorated premium base pay for actual hours worked (up to 8).
      // Formula: (dailyRate / 8) × baseHours × BASE_MULT[dayType]
      // This correctly pays partial-day premiums — e.g. 4 hrs on a rest day (×1.30):
      //   (dailyRate / 8) × 4 × 1.30  instead of the full-day dailyRate × 1.30.
      // OT pay for premium days is aggregated separately via computeDoleOvertimePay.
      dailyGrossPay = parseFloat(((dailyRate / 8) * baseHours * BASE_MULT[dayType]).toFixed(2));
    }
  }

  return {
    regularHours,
    lateMinutes,
    undertimeMinutes,
    regOtHours,
    rdHours, rdOtHours,
    shHours, shOtHours,
    shRdHours, shRdOtHours,
    rhHours, rhOtHours,
    rhRdHours, rhRdOtHours,
    dailyGrossPay,
  };
}
