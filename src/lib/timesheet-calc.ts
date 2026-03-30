// src/lib/timesheet-calc.ts

/**
 * Pure utility for computing all derived Timesheet fields from raw punch data.
 *
 * Called whenever a timesheet row has both timeIn and timeOut (clock-out action
 * or COA approval that sets a time resulting in a fully-punched row).
 *
 * Scope: regular / OT hours and daily gross pay only.
 * Holiday and rest-day multipliers (rdHours, shHours, rhHours, etc.) require
 * the Holiday calendar and ScheduleOverride lookups — those remain 0 until
 * that feature is implemented.
 */

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
 * @param timeIn    - Employee's clock-in datetime
 * @param timeOut   - Employee's clock-out datetime
 * @param lunchStart - Optional lunch start datetime
 * @param lunchEnd   - Optional lunch end datetime
 * @param scheduleDay - The WorkScheduleDay entry for this day, or null to use default
 * @param compensation - The employee's active EmployeeCompensation, or null for zero pay
 */
export function computeTimesheetFields(
  timeIn: Date,
  timeOut: Date,
  lunchStart: Date | null,
  lunchEnd: Date | null,
  scheduleDay: ScheduleDayInput | null,
  compensation: CompensationInput | null,
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

  // ── Late minutes ─────────────────────────────────────────────────────────
  // Convert timeIn to minutes-since-midnight in LOCAL time (the employee's timezone).
  const timeInMin = timeIn.getHours() * 60 + timeIn.getMinutes();
  const lateMinutes = Math.max(0, timeInMin - schedStartMin);

  // ── Undertime minutes ────────────────────────────────────────────────────
  const timeOutMin = timeOut.getHours() * 60 + timeOut.getMinutes();
  const undertimeMinutes = Math.max(0, schedEndMin - timeOutMin);

  // ── Regular vs OT hours ──────────────────────────────────────────────────
  const regularHours = parseFloat(
    (Math.min(workedMin, scheduledWorkMin) / 60).toFixed(2),
  );
  const regOtHours = parseFloat(
    (Math.max(0, workedMin - scheduledWorkMin) / 60).toFixed(2),
  );

  // ── Daily gross pay ───────────────────────────────────────────────────────
  let dailyGrossPay = 0;
  if (compensation) {
    const dailyRate = Number(compensation.calculatedDailyRate);

    if (compensation.payType === "FIXED_PAY") {
      // Fixed pay: employee earns the full daily rate regardless of lateness/undertime.
      // Deductions for attendance violations are handled at payroll generation level.
      dailyGrossPay = dailyRate;
    } else {
      // Variable pay: deduct proportional late + undertime
      const deductMin = lateMinutes + undertimeMinutes;
      const deductFraction = scheduledWorkMin > 0 ? deductMin / scheduledWorkMin : 0;
      dailyGrossPay = parseFloat(
        Math.max(0, dailyRate * (1 - deductFraction)).toFixed(2),
      );
    }
  }

  return {
    regularHours,
    lateMinutes,
    undertimeMinutes,
    regOtHours,
    dailyGrossPay,
  };
}
