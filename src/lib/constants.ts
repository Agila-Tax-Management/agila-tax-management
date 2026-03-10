export const ROLE_PERMISSIONS: Record<string, string[]> = {
  Admin:    ['*'],
  HR:       ['timesheet', 'payslips', 'hr-apps', 'teams', 'compliance', 'liaison', 'asp', 'pcf'],
  Employee: ['timesheet', 'payslips', 'hr-apps'],
};
