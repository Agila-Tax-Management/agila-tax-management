// src/lib/__tests__/dole-overtime.test.ts
import { describe, it, expect } from '@jest/globals';
import {
  DOLE_OT_MULTIPLIERS,
  computeDoleOvertimePay,
  sumOtHours,
  type TimesheetOtRow,
} from '../dole-overtime';

/**
 * HIGH PRIORITY TEST: DOLE-Compliant Overtime Pay Calculation
 * 
 * Critical for payroll accuracy — errors affect employee compensation.
 * Philippine Labor Code compliance required.
 */

// ═══════════════════════════════════════════════════════════════════════════
// Multiplier Constants Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('DOLE OT Multipliers', () => {
  it('should have correct multiplier values per Labor Code', () => {
    expect(DOLE_OT_MULTIPLIERS.regOt).toBe(1.25);   // Regular OT
    expect(DOLE_OT_MULTIPLIERS.rdOt).toBe(1.69);    // Rest day OT
    expect(DOLE_OT_MULTIPLIERS.shOt).toBe(1.69);    // Special holiday OT
    expect(DOLE_OT_MULTIPLIERS.shRdOt).toBe(1.95);  // Special holiday + rest day OT
    expect(DOLE_OT_MULTIPLIERS.rhOt).toBe(2.60);    // Regular holiday OT
    expect(DOLE_OT_MULTIPLIERS.rhRdOt).toBe(3.38);  // Regular holiday + rest day OT
  });

  it('should have multipliers in ascending order by severity', () => {
    const _multipliers = [
      DOLE_OT_MULTIPLIERS.regOt,
      DOLE_OT_MULTIPLIERS.rdOt,
      DOLE_OT_MULTIPLIERS.shOt,
      DOLE_OT_MULTIPLIERS.shRdOt,
      DOLE_OT_MULTIPLIERS.rhOt,
      DOLE_OT_MULTIPLIERS.rhRdOt,
    ];

    expect(DOLE_OT_MULTIPLIERS.regOt).toBeLessThan(DOLE_OT_MULTIPLIERS.rdOt);
    expect(DOLE_OT_MULTIPLIERS.rdOt).toBeLessThan(DOLE_OT_MULTIPLIERS.shRdOt);
    expect(DOLE_OT_MULTIPLIERS.shRdOt).toBeLessThan(DOLE_OT_MULTIPLIERS.rhOt);
    expect(DOLE_OT_MULTIPLIERS.rhOt).toBeLessThan(DOLE_OT_MULTIPLIERS.rhRdOt);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// computeDoleOvertimePay Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('computeDoleOvertimePay', () => {
  const dailyRate = 800; // ₱800/day
  const _hourlyRate = 100; // ₱800 / 8 hours

  describe('Single OT Type', () => {
    it('should compute regular OT pay correctly', () => {
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 2,
          rdOtHours: 0,
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 0,
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);

      // 2 hours × ₱100 × 1.25 = ₱250
      expect(result).toBe(250);
    });

    it('should compute rest day OT pay correctly', () => {
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 0,
          rdOtHours: 3,
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 0,
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);

      // 3 hours × ₱100 × 1.69 = ₱507
      expect(result).toBe(507);
    });

    it('should compute special holiday OT pay correctly', () => {
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 0,
          rdOtHours: 0,
          shOtHours: 4,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 0,
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);

      // 4 hours × ₱100 × 1.69 = ₱676
      expect(result).toBe(676);
    });

    it('should compute special holiday + rest day OT pay correctly', () => {
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 0,
          rdOtHours: 0,
          shOtHours: 0,
          shRdOtHours: 2,
          rhOtHours: 0,
          rhRdOtHours: 0,
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);

      // 2 hours × ₱100 × 1.95 = ₱390
      expect(result).toBe(390);
    });

    it('should compute regular holiday OT pay correctly', () => {
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 0,
          rdOtHours: 0,
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 3,
          rhRdOtHours: 0,
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);

      // 3 hours × ₱100 × 2.60 = ₱780
      expect(result).toBe(780);
    });

    it('should compute regular holiday + rest day OT pay correctly (highest multiplier)', () => {
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 0,
          rdOtHours: 0,
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 2,
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);

      // 2 hours × ₱100 × 3.38 = ₱676
      expect(result).toBe(676);
    });
  });

  describe('Multiple OT Types (Realistic Scenarios)', () => {
    it('should sum multiple OT types correctly', () => {
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 2,    // ₱250
          rdOtHours: 1,     // ₱169
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 0,
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);

      // ₱250 + ₱169 = ₱419
      expect(result).toBe(419);
    });

    it('should handle all OT types in one row', () => {
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 1,
          rdOtHours: 1,
          shOtHours: 1,
          shRdOtHours: 1,
          rhOtHours: 1,
          rhRdOtHours: 1,
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);

      // 1×100×1.25 + 1×100×1.69 + 1×100×1.69 + 1×100×1.95 + 1×100×2.60 + 1×100×3.38
      // = 125 + 169 + 169 + 195 + 260 + 338 = 1256
      expect(result).toBe(1256);
    });

    it('should sum across multiple rows', () => {
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 2,
          rdOtHours: 0,
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 0,
        },
        {
          regOtHours: 1,
          rdOtHours: 0,
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 0,
        },
        {
          regOtHours: 0,
          rdOtHours: 2,
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 0,
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);

      // Row 1: 2×100×1.25 = 250
      // Row 2: 1×100×1.25 = 125
      // Row 3: 2×100×1.69 = 338
      // Total: 713
      expect(result).toBe(713);
    });
  });

  describe('Edge Cases', () => {
    it('should return 0 for no overtime hours', () => {
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 0,
          rdOtHours: 0,
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 0,
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);
      expect(result).toBe(0);
    });

    it('should return 0 for empty rows array', () => {
      const result = computeDoleOvertimePay([], dailyRate);
      expect(result).toBe(0);
    });

    it('should handle string values (database-typical)', () => {
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: '2',  // String
          rdOtHours: '1',   // String
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 0,
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);

      // Should convert strings to numbers correctly
      // 2×100×1.25 + 1×100×1.69 = 250 + 169 = 419
      expect(result).toBe(419);
    });

    it('should handle decimal hours correctly', () => {
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 1.5,  // 1.5 hours
          rdOtHours: 0,
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 0,
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);

      // 1.5 × 100 × 1.25 = 187.5
      expect(result).toBe(187.5);
    });

    it('should round to 2 decimal places', () => {
      const dailyRateOdd = 777; // Creates fractional hourly rate
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 1,
          rdOtHours: 0,
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 0,
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRateOdd);

      // 1 × (777/8) × 1.25 = 1 × 97.125 × 1.25 = 121.40625 → 121.41
      expect(result).toBe(121.41);
    });

    it('should handle zero daily rate', () => {
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 2,
          rdOtHours: 0,
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 0,
        },
      ];

      const result = computeDoleOvertimePay(rows, 0);
      expect(result).toBe(0);
    });
  });

  describe('Real-world Payroll Scenarios', () => {
    it('should calculate typical week with 2 hours regular OT', () => {
      const dailyRate = 600;
      const rows: TimesheetOtRow[] = [
        { regOtHours: 0, rdOtHours: 0, shOtHours: 0, shRdOtHours: 0, rhOtHours: 0, rhRdOtHours: 0 }, // Mon
        { regOtHours: 1, rdOtHours: 0, shOtHours: 0, shRdOtHours: 0, rhOtHours: 0, rhRdOtHours: 0 }, // Tue
        { regOtHours: 0, rdOtHours: 0, shOtHours: 0, shRdOtHours: 0, rhOtHours: 0, rhRdOtHours: 0 }, // Wed
        { regOtHours: 1, rdOtHours: 0, shOtHours: 0, shRdOtHours: 0, rhOtHours: 0, rhRdOtHours: 0 }, // Thu
        { regOtHours: 0, rdOtHours: 0, shOtHours: 0, shRdOtHours: 0, rhOtHours: 0, rhRdOtHours: 0 }, // Fri
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);

      // 2 hours × (600/8) × 1.25 = 2 × 75 × 1.25 = 187.5
      expect(result).toBe(187.5);
    });

    it('should calculate minimum wage worker with rest day OT', () => {
      const dailyRate = 610; // Metro Manila minimum wage 2024
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 0,
          rdOtHours: 4, // Rest day OT (Sunday)
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 0,
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);

      // 4 hours × (610/8) × 1.69 = 4 × 76.25 × 1.69 = 515.45
      expect(result).toBe(515.45);
    });

    it('should calculate holiday + rest day OT (most expensive)', () => {
      const dailyRate = 700;
      const rows: TimesheetOtRow[] = [
        {
          regOtHours: 0,
          rdOtHours: 0,
          shOtHours: 0,
          shRdOtHours: 0,
          rhOtHours: 0,
          rhRdOtHours: 3, // Christmas Day on a Sunday
        },
      ];

      const result = computeDoleOvertimePay(rows, dailyRate);

      // 3 hours × (700/8) × 3.38 = 3 × 87.5 × 3.38 = 887.25
      expect(result).toBe(887.25);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// sumOtHours Tests
// ═══════════════════════════════════════════════════════════════════════════

describe('sumOtHours', () => {
  it('should sum all OT hours across all types', () => {
    const rows: TimesheetOtRow[] = [
      {
        regOtHours: 2,
        rdOtHours: 1,
        shOtHours: 0,
        shRdOtHours: 0,
        rhOtHours: 0,
        rhRdOtHours: 0,
      },
    ];

    const result = sumOtHours(rows);
    expect(result).toBe(3); // 2 + 1
  });

  it('should sum all OT types in one row', () => {
    const rows: TimesheetOtRow[] = [
      {
        regOtHours: 1,
        rdOtHours: 1,
        shOtHours: 1,
        shRdOtHours: 1,
        rhOtHours: 1,
        rhRdOtHours: 1,
      },
    ];

    const result = sumOtHours(rows);
    expect(result).toBe(6);
  });

  it('should sum across multiple rows', () => {
    const rows: TimesheetOtRow[] = [
      { regOtHours: 2, rdOtHours: 0, shOtHours: 0, shRdOtHours: 0, rhOtHours: 0, rhRdOtHours: 0 },
      { regOtHours: 1, rdOtHours: 1, shOtHours: 0, shRdOtHours: 0, rhOtHours: 0, rhRdOtHours: 0 },
      { regOtHours: 0, rdOtHours: 0, shOtHours: 2, shRdOtHours: 0, rhOtHours: 0, rhRdOtHours: 0 },
    ];

    const result = sumOtHours(rows);
    expect(result).toBe(6); // 2 + 1 + 1 + 2
  });

  it('should return 0 for no OT hours', () => {
    const rows: TimesheetOtRow[] = [
      {
        regOtHours: 0,
        rdOtHours: 0,
        shOtHours: 0,
        shRdOtHours: 0,
        rhOtHours: 0,
        rhRdOtHours: 0,
      },
    ];

    const result = sumOtHours(rows);
    expect(result).toBe(0);
  });

  it('should return 0 for empty rows array', () => {
    const result = sumOtHours([]);
    expect(result).toBe(0);
  });

  it('should handle string values', () => {
    const rows: TimesheetOtRow[] = [
      {
        regOtHours: '2',
        rdOtHours: '1',
        shOtHours: '0.5',
        shRdOtHours: 0,
        rhOtHours: 0,
        rhRdOtHours: 0,
      },
    ];

    const result = sumOtHours(rows);
    expect(result).toBe(3.5); // 2 + 1 + 0.5
  });

  it('should handle decimal hours', () => {
    const rows: TimesheetOtRow[] = [
      {
        regOtHours: 1.5,
        rdOtHours: 0.5,
        shOtHours: 0,
        shRdOtHours: 0,
        rhOtHours: 0,
        rhRdOtHours: 0,
      },
    ];

    const result = sumOtHours(rows);
    expect(result).toBe(2);
  });
});

/**
 * COVERAGE SUMMARY:
 * ✅ All DOLE OT multipliers tested
 * ✅ All 6 OT types tested individually
 * ✅ Combined OT types tested
 * ✅ Multiple rows tested
 * ✅ Edge cases (zero, empty, strings, decimals)
 * ✅ Real-world payroll scenarios
 * ✅ sumOtHours function tested
 * 
 * NEXT STEPS:
 * - Integrate with payroll generation
 * - Test with actual timesheet data
 * - Validate against DOLE regulations
 */
