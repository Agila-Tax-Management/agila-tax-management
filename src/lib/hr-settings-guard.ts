// src/lib/hr-settings-guard.ts
/**
 * Post-processing helper: applies HrSetting rules to computed timesheet fields.
 *
 * Callers should run computeTimesheetFields() first, then pass the result here
 * along with employee-specific flags resolved from HrSetting relations.
 *
 * Rules applied:
 *  - strictOvertimeApproval: if true AND employee is NOT in autoOvertimeEmployees,
 *    zero all OT buckets. The approved OT from OvertimeRequest records should then
 *    be merged in by the caller after calling this function.
 *  - disableLateUndertimeGlobal: if true AND employee is NOT in exemptLateUndertimeEmployees,
 *    zero lateMinutes and undertimeMinutes, and recompute dailyGrossPay without deductions.
 */

import prisma from './db';
import type { TimesheetComputedFields } from './timesheet-calc';

export interface HrSettingGuardFlags {
  /** Whether strict OT approval is enabled company-wide */
  strictOvertimeApproval: boolean;
  /** Whether this specific employee bypasses strict OT (is in autoOvertimeEmployees list) */
  employeeHasAutoOt: boolean;
  /** Whether late/undertime deductions are globally disabled */
  disableLateUndertimeGlobal: boolean;
  /** Whether this specific employee is still deducted despite the global disable */
  employeeIsExemptFromDisable: boolean;
}

export function applyHrSettingGuards(
  computed: TimesheetComputedFields,
  flags: HrSettingGuardFlags,
  dailyRate: number,
  isVariable: boolean,
): TimesheetComputedFields {
  const result = { ...computed };

  // ── Apply late/undertime disable ──────────────────────────────────────────
  // If globally disabled AND the employee is NOT on the "still deducted" exception list
  const shouldDisableLateUndertime =
    flags.disableLateUndertimeGlobal && !flags.employeeIsExemptFromDisable;

  if (shouldDisableLateUndertime) {
    result.lateMinutes = 0;
    result.undertimeMinutes = 0;

    // Recompute dailyGrossPay without deductions for VARIABLE_PAY employees
    if (isVariable && dailyRate > 0) {
      result.dailyGrossPay = parseFloat(dailyRate.toFixed(2));
    }
  }

  // ── Apply strict OT approval ──────────────────────────────────────────────
  // If strict mode is on AND the employee does NOT have auto-OT bypass,
  // zero all OT buckets. Caller merges approved OT hours back in afterward.
  const shouldZeroOt = flags.strictOvertimeApproval && !flags.employeeHasAutoOt;

  if (shouldZeroOt) {
    result.regOtHours = 0;
    result.rdOtHours = 0;
    result.shOtHours = 0;
    result.shRdOtHours = 0;
    result.rhOtHours = 0;
    result.rhRdOtHours = 0;
  }

  return result;
}

// ─── Batch helpers (use for bulk import routes) ───────────────────────────────

export interface HrSettingCache {
  strictOvertimeApproval: boolean;
  disableLateUndertimeGlobal: boolean;
  autoOvertimeEmployeeIds: Set<number>;
  exemptLateUndertimeEmployeeIds: Set<number>;
}

/**
 * Loads the full HrSetting for a client once, including all M2M employee lists.
 * Use this at the top of a batch loop instead of resolveHrSettingFlags per row.
 */
export async function loadHrSettingCache(clientId: number): Promise<HrSettingCache> {
  const setting = await prisma.hrSetting.findUnique({
    where: { clientId },
    select: {
      strictOvertimeApproval: true,
      disableLateUndertimeGlobal: true,
      autoOvertimeEmployees: { select: { id: true } },
      exemptLateUndertimeEmployees: { select: { id: true } },
    },
  });

  if (!setting) {
    return {
      strictOvertimeApproval: true,
      disableLateUndertimeGlobal: true,
      autoOvertimeEmployeeIds: new Set(),
      exemptLateUndertimeEmployeeIds: new Set(),
    };
  }

  return {
    strictOvertimeApproval: setting.strictOvertimeApproval,
    disableLateUndertimeGlobal: setting.disableLateUndertimeGlobal,
    autoOvertimeEmployeeIds: new Set(setting.autoOvertimeEmployees.map((e) => e.id)),
    exemptLateUndertimeEmployeeIds: new Set(setting.exemptLateUndertimeEmployees.map((e) => e.id)),
  };
}

/** Derive per-employee guard flags from a pre-fetched cache (O(1) Set lookups). */
export function flagsFromCache(cache: HrSettingCache, employeeId: number): HrSettingGuardFlags {
  return {
    strictOvertimeApproval: cache.strictOvertimeApproval,
    employeeHasAutoOt: cache.autoOvertimeEmployeeIds.has(employeeId),
    disableLateUndertimeGlobal: cache.disableLateUndertimeGlobal,
    employeeIsExemptFromDisable: cache.exemptLateUndertimeEmployeeIds.has(employeeId),
  };
}

// ─── Single-employee helper ────────────────────────────────────────────────────

/**
 * Loads HrSetting rows needed for guard evaluation for a given client + employee.
 * Returns the 4 boolean flags. Pass result directly to applyHrSettingGuards().
 */
export async function resolveHrSettingFlags(
  clientId: number,
  employeeId: number,
): Promise<HrSettingGuardFlags> {
  const setting = await prisma.hrSetting.findUnique({
    where: { clientId },
    select: {
      strictOvertimeApproval: true,
      disableLateUndertimeGlobal: true,
      autoOvertimeEmployees: { where: { id: employeeId }, select: { id: true } },
      exemptLateUndertimeEmployees: { where: { id: employeeId }, select: { id: true } },
    },
  });

  if (!setting) {
    // No settings row → use schema defaults (strict OT on, late/undertime disable on)
    return {
      strictOvertimeApproval: true,
      employeeHasAutoOt: false,
      disableLateUndertimeGlobal: true,
      employeeIsExemptFromDisable: false,
    };
  }

  return {
    strictOvertimeApproval: setting.strictOvertimeApproval,
    employeeHasAutoOt: setting.autoOvertimeEmployees.length > 0,
    disableLateUndertimeGlobal: setting.disableLateUndertimeGlobal,
    employeeIsExemptFromDisable: setting.exemptLateUndertimeEmployees.length > 0,
  };
}
