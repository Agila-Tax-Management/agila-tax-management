// src/lib/sss-contribution.ts
/**
 * SSS Contribution Calculator — Circular No. 2024-006
 * Effective January 2025
 *
 * Programs covered:
 *  - Regular Social Security (SS): 15% of MSC — ER 10%, EE 5%, capped at MSC ₱20,000
 *  - Mandatory Provident Fund (MPF): 15% of MPF MSC — ER 10%, EE 5%
 *      Kicks in when monthly compensation > ₱20,250, MPF MSC capped at ₱15,000
 *  - Employees' Compensation (EC): Employer-only
 *      ₱10 if total MSC < ₱15,000 | ₱30 if total MSC ≥ ₱15,000
 *
 * Deduction applied to payslip:
 *  payslip.sssDeduction = getSSSEmployeeDeduction(calculatedMonthlyRate, frequency)
 *
 * Employer cost (for client reporting):
 *  computeSSSContribution(calculatedMonthlyRate).erTotal
 */

export interface SSSContributionResult {
  /** Monthly Salary Credit used for Regular SS (max ₱20,000) */
  regularSSMSC: number;
  /** Monthly Salary Credit used for MPF (0–₱15,000) */
  mpfMSC: number;
  /** Total MSC = regularSSMSC + mpfMSC */
  totalMSC: number;

  // ─── Employee share ───────────────────────────────────────────────
  /** EE Regular SS = regularSSMSC × 5% */
  eeRegularSS: number;
  /** EE MPF = mpfMSC × 5% */
  eeMPF: number;
  /**
   * EE total monthly contribution.
   * → This is what goes into payslip.sssDeduction (after frequency split).
   */
  eeTotal: number;

  // ─── Employer share ───────────────────────────────────────────────
  /** ER Regular SS = regularSSMSC × 10% */
  erRegularSS: number;
  /** ER MPF = mpfMSC × 10% */
  erMPF: number;
  /** ER EC = ₱10 (MSC < ₱15,000) or ₱30 (MSC ≥ ₱15,000) */
  erEC: number;
  /** ER total monthly contribution */
  erTotal: number;

  /** Combined ER + EE grand total */
  grandTotal: number;
}

/**
 * Bracket lookup table from SSS Circular No. 2024-006 (January 2025).
 * Tuple format: [minComp, maxComp (inclusive), regularSSMSC, mpfMSC]
 *
 * – ₱500 compensation range per bracket
 * – Regular SS MSC capped at ₱20,000 (bracket 31 onward)
 * – MPF MSC starts at ₱500 from bracket 32 (compensation ≥ ₱20,250), max ₱15,000
 * – Last bracket is open-ended (₱34,750+)
 */
const SSS_BRACKETS: ReadonlyArray<readonly [number, number, number, number]> = [
  // [minComp,  maxComp,   regularSSMSC, mpfMSC]
  [0,           5249.99,   5000,  0    ],
  [5250,        5749.99,   5500,  0    ],
  [5750,        6249.99,   6000,  0    ],
  [6250,        6749.99,   6500,  0    ],
  [6750,        7249.99,   7000,  0    ],
  [7250,        7749.99,   7500,  0    ],
  [7750,        8249.99,   8000,  0    ],
  [8250,        8749.99,   8500,  0    ],
  [8750,        9249.99,   9000,  0    ],
  [9250,        9749.99,   9500,  0    ],
  [9750,        10249.99,  10000, 0    ],
  [10250,       10749.99,  10500, 0    ],
  [10750,       11249.99,  11000, 0    ],
  [11250,       11749.99,  11500, 0    ],
  [11750,       12249.99,  12000, 0    ],
  [12250,       12749.99,  12500, 0    ],
  [12750,       13249.99,  13000, 0    ],
  [13250,       13749.99,  13500, 0    ],
  [13750,       14249.99,  14000, 0    ],
  [14250,       14749.99,  14500, 0    ],
  [14750,       15249.99,  15000, 0    ], // EC switches to ₱30 here (MSC = 15,000)
  [15250,       15749.99,  15500, 0    ],
  [15750,       16249.99,  16000, 0    ],
  [16250,       16749.99,  16500, 0    ],
  [16750,       17249.99,  17000, 0    ],
  [17250,       17749.99,  17500, 0    ],
  [17750,       18249.99,  18000, 0    ],
  [18250,       18749.99,  18500, 0    ],
  [18750,       19249.99,  19000, 0    ],
  [19250,       19749.99,  19500, 0    ],
  [19750,       20249.99,  20000, 0    ], // Regular SS MSC caps at ₱20,000
  [20250,       20749.99,  20000, 500  ], // MPF kicks in from here
  [20750,       21249.99,  20000, 1000 ],
  [21250,       21749.99,  20000, 1500 ],
  [21750,       22249.99,  20000, 2000 ],
  [22250,       22749.99,  20000, 2500 ],
  [22750,       23249.99,  20000, 3000 ],
  [23250,       23749.99,  20000, 3500 ],
  [23750,       24249.99,  20000, 4000 ],
  [24250,       24749.99,  20000, 4500 ],
  [24750,       25249.99,  20000, 5000 ],
  [25250,       25749.99,  20000, 5500 ],
  [25750,       26249.99,  20000, 6000 ],
  [26250,       26749.99,  20000, 6500 ],
  [26750,       27249.99,  20000, 7000 ],
  [27250,       27749.99,  20000, 7500 ],
  [27750,       28249.99,  20000, 8000 ],
  [28250,       28749.99,  20000, 8500 ],
  [28750,       29249.99,  20000, 9000 ],
  [29250,       29749.99,  20000, 9500 ],
  [29750,       30249.99,  20000, 10000],
  [30250,       30749.99,  20000, 10500],
  [30750,       31249.99,  20000, 11000],
  [31250,       31749.99,  20000, 11500],
  [31750,       32249.99,  20000, 12000],
  [32250,       32749.99,  20000, 12500],
  [32750,       33249.99,  20000, 13000],
  [33250,       33749.99,  20000, 13500],
  [33750,       34249.99,  20000, 14000],
  [34250,       34749.99,  20000, 14500],
  [34750,       Infinity,  20000, 15000], // Capped at total MSC ₱35,000
];

/**
 * Computes the full SSS contribution breakdown for a given monthly compensation.
 *
 * @param monthlyCompensation - Employee's total monthly compensation (calculatedMonthlyRate)
 * @returns SSSContributionResult with EE and ER breakdowns
 *
 * @example
 * const result = computeSSSContribution(14000);
 * // result.eeTotal  → 700  (EE deduction for the month)
 * // result.erTotal  → 1,410 (Employer cost, includes EC)
 */
export function computeSSSContribution(monthlyCompensation: number): SSSContributionResult {
  const comp = Math.max(0, monthlyCompensation);

  const bracket =
    SSS_BRACKETS.find(([min, max]) => comp >= min && comp <= max) ??
    SSS_BRACKETS[SSS_BRACKETS.length - 1]!;

  const [, , regularSSMSC, mpfMSC] = bracket;
  const totalMSC = regularSSMSC + mpfMSC;

  const eeRegularSS = regularSSMSC * 0.05;
  const eeMPF       = mpfMSC       * 0.05;
  const eeTotal     = eeRegularSS + eeMPF;

  const erRegularSS = regularSSMSC * 0.10;
  const erMPF       = mpfMSC       * 0.10;
  const erEC        = totalMSC >= 15000 ? 30 : 10;
  const erTotal     = erRegularSS + erMPF + erEC;

  const grandTotal  = erTotal + eeTotal;

  return {
    regularSSMSC,
    mpfMSC,
    totalMSC,
    eeRegularSS,
    eeMPF,
    eeTotal,
    erRegularSS,
    erMPF,
    erEC,
    erTotal,
    grandTotal,
  };
}

/**
 * Returns the per-payslip SSS deduction for an employee, split by pay frequency.
 *
 * Use this value for payslip.sssDeduction when compensation.deductSss is true.
 *
 * @param monthlyCompensation - Employee's calculatedMonthlyRate
 * @param frequency           - Employee's pay frequency from EmployeeCompensation
 * @returns Amount to deduct from the payslip
 *
 * @example
 * // Semi-monthly employee earning ₱14,000/month
 * getSSSEmployeeDeduction(14000, 'TWICE_A_MONTH'); // → 350
 *
 * // Monthly employee earning ₱22,000/month (MPF applies)
 * getSSSEmployeeDeduction(22000, 'ONCE_A_MONTH');  // → 1,100
 */
export function getSSSEmployeeDeduction(
  monthlyCompensation: number,
  frequency: 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY',
): number {
  const { eeTotal } = computeSSSContribution(monthlyCompensation);
  switch (frequency) {
    case 'ONCE_A_MONTH':  return eeTotal;
    case 'TWICE_A_MONTH': return eeTotal / 2;
    case 'WEEKLY':        return eeTotal / 4;
  }
}

/**
 * Returns the per-payslip SSS employer share, split by pay frequency.
 * Use this for reporting the client's cost per payslip.
 *
 * @param monthlyCompensation - Employee's calculatedMonthlyRate
 * @param frequency           - Employee's pay frequency from EmployeeCompensation
 * @returns Employer's SSS cost per payslip (erTotal split by frequency)
 */
export function getSSSEmployerShare(
  monthlyCompensation: number,
  frequency: 'ONCE_A_MONTH' | 'TWICE_A_MONTH' | 'WEEKLY',
): number {
  const { erTotal } = computeSSSContribution(monthlyCompensation);
  switch (frequency) {
    case 'ONCE_A_MONTH':  return erTotal;
    case 'TWICE_A_MONTH': return erTotal / 2;
    case 'WEEKLY':        return erTotal / 4;
  }
}
