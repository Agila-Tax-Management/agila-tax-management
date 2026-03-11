import { INITIAL_CLIENTS } from './mock-clients';

// ── Types ────────────────────────────────────────────────

export type EmployeeStatus = 'Active' | 'On Leave' | 'Probationary' | 'Resigned';
export type Department = 'Sales' | 'Accounting' | 'Compliance' | 'Liaison' | 'Account Officer' | 'HR' | 'IT' | 'Admin';
export type LeaveType = 'Vacation' | 'Sick' | 'Emergency' | 'Maternity' | 'Paternity' | 'Bereavement';
export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
export type PerformanceRating = 'Outstanding' | 'Exceeds Expectations' | 'Meets Expectations' | 'Needs Improvement' | 'Unsatisfactory';
export type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Half Day' | 'On Leave';
export type PayrollStatus = 'Draft' | 'Processing' | 'Completed' | 'On Hold';
export type GovComplianceType = 'SSS' | 'PhilHealth' | 'Pag-IBIG' | 'BIR' | 'DOLE';
export type GovComplianceStatus = 'Compliant' | 'Pending' | 'Overdue' | 'Submitted';
export type HRRequestType = 'Certificate of Employment' | 'Leave Request' | 'Schedule Change' | 'Equipment Request' | 'Salary Dispute' | 'ID Replacement' | 'Others';
export type HRRequestStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export interface Employee {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  department: Department;
  position: string;
  status: EmployeeStatus;
  dateHired: string;
  avatar: string; // initials
  salary: number;
  sssNo: string;
  philHealthNo: string;
  pagIbigNo: string;
  tinNo: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  appliedDate: string;
  reviewedBy: string | null;
  reviewedDate: string | null;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  reviewPeriod: string;
  rating: PerformanceRating;
  reviewerId: string;
  reviewerName: string;
  goals: string[];
  strengths: string[];
  improvements: string[];
  comments: string;
  reviewDate: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  date: string;
  timeIn: string | null;
  timeOut: string | null;
  status: AttendanceStatus;
  hoursWorked: number;
  overtime: number;
  notes: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  payPeriod: string;
  basicPay: number;
  overtime: number;
  allowances: number;
  deductions: number;
  sssContribution: number;
  philHealthContribution: number;
  pagIbigContribution: number;
  withholdingTax: number;
  netPay: number;
  status: PayrollStatus;
  processedDate: string | null;
}

export interface GovComplianceRecord {
  id: string;
  type: GovComplianceType;
  description: string;
  deadline: string;
  status: GovComplianceStatus;
  affectedEmployees: number;
  filedDate: string | null;
  referenceNo: string | null;
  notes: string;
}

export interface HRRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  requestType: HRRequestType;
  subject: string;
  description: string;
  status: HRRequestStatus;
  priority: 'Low' | 'Medium' | 'High';
  submittedDate: string;
  resolvedDate: string | null;
  assignedTo: string | null;
}

// ── Mock Data ────────────────────────────────────────────

export const EMPLOYEES: Employee[] = [
  { id: 'emp-1', employeeNo: 'EMP-2024-001', firstName: 'Roberto', lastName: 'Villanueva', fullName: 'Roberto Villanueva', email: 'roberto.v@agila.ph', phone: '09171234567', department: 'Sales', position: 'Senior Sales Agent', status: 'Active', dateHired: '2023-01-15', avatar: 'RV', salary: 35000, sssNo: '33-1234567-8', philHealthNo: '01-234567890-1', pagIbigNo: '1234-5678-9012', tinNo: '123-456-789-000' },
  { id: 'emp-2', employeeNo: 'EMP-2024-002', firstName: 'Maria', lastName: 'Santos', fullName: 'Maria Santos', email: 'maria.s@agila.ph', phone: '09181234568', department: 'Accounting', position: 'Accountant', status: 'Active', dateHired: '2023-03-01', avatar: 'MS', salary: 32000, sssNo: '33-2345678-9', philHealthNo: '01-345678901-2', pagIbigNo: '2345-6789-0123', tinNo: '234-567-890-001' },
  { id: 'emp-3', employeeNo: 'EMP-2024-003', firstName: 'Juan', lastName: 'Dela Cruz', fullName: 'Juan Dela Cruz', email: 'juan.dc@agila.ph', phone: '09191234569', department: 'Compliance', position: 'Compliance Officer', status: 'Active', dateHired: '2023-02-15', avatar: 'JD', salary: 30000, sssNo: '33-3456789-0', philHealthNo: '01-456789012-3', pagIbigNo: '3456-7890-1234', tinNo: '345-678-901-002' },
  { id: 'emp-4', employeeNo: 'EMP-2024-004', firstName: 'Ana', lastName: 'Reyes', fullName: 'Ana Reyes', email: 'ana.r@agila.ph', phone: '09201234570', department: 'Liaison', position: 'Senior Liaison Officer', status: 'Active', dateHired: '2022-11-01', avatar: 'AR', salary: 28000, sssNo: '33-4567890-1', philHealthNo: '01-567890123-4', pagIbigNo: '4567-8901-2345', tinNo: '456-789-012-003' },
  { id: 'emp-5', employeeNo: 'EMP-2024-005', firstName: 'Carlos', lastName: 'Garcia', fullName: 'Carlos Garcia', email: 'carlos.g@agila.ph', phone: '09211234571', department: 'Account Officer', position: 'Account Officer', status: 'Active', dateHired: '2023-06-01', avatar: 'CG', salary: 33000, sssNo: '33-5678901-2', philHealthNo: '01-678901234-5', pagIbigNo: '5678-9012-3456', tinNo: '567-890-123-004' },
  { id: 'emp-6', employeeNo: 'EMP-2024-006', firstName: 'Patricia', lastName: 'Lim', fullName: 'Patricia Lim', email: 'patricia.l@agila.ph', phone: '09221234572', department: 'HR', position: 'HR Manager', status: 'Active', dateHired: '2022-06-15', avatar: 'PL', salary: 40000, sssNo: '33-6789012-3', philHealthNo: '01-789012345-6', pagIbigNo: '6789-0123-4567', tinNo: '678-901-234-005' },
  { id: 'emp-7', employeeNo: 'EMP-2024-007', firstName: 'Mark', lastName: 'Torres', fullName: 'Mark Torres', email: 'mark.t@agila.ph', phone: '09231234573', department: 'IT', position: 'IT Specialist', status: 'Active', dateHired: '2023-08-01', avatar: 'MT', salary: 38000, sssNo: '33-7890123-4', philHealthNo: '01-890123456-7', pagIbigNo: '7890-1234-5678', tinNo: '789-012-345-006' },
  { id: 'emp-8', employeeNo: 'EMP-2024-008', firstName: 'Elena', lastName: 'Fernandez', fullName: 'Elena Fernandez', email: 'elena.f@agila.ph', phone: '09241234574', department: 'Sales', position: 'Sales Agent', status: 'On Leave', dateHired: '2024-01-10', avatar: 'EF', salary: 25000, sssNo: '33-8901234-5', philHealthNo: '01-901234567-8', pagIbigNo: '8901-2345-6789', tinNo: '890-123-456-007' },
  { id: 'emp-9', employeeNo: 'EMP-2024-009', firstName: 'Diego', lastName: 'Aquino', fullName: 'Diego Aquino', email: 'diego.a@agila.ph', phone: '09251234575', department: 'Compliance', position: 'Jr. Compliance Officer', status: 'Probationary', dateHired: '2025-04-01', avatar: 'DA', salary: 22000, sssNo: '33-9012345-6', philHealthNo: '01-012345678-9', pagIbigNo: '9012-3456-7890', tinNo: '901-234-567-008' },
  { id: 'emp-10', employeeNo: 'EMP-2024-010', firstName: 'Isabel', lastName: 'Cruz', fullName: 'Isabel Cruz', email: 'isabel.c@agila.ph', phone: '09261234576', department: 'Accounting', position: 'Jr. Accountant', status: 'Active', dateHired: '2024-06-01', avatar: 'IC', salary: 24000, sssNo: '33-0123456-7', philHealthNo: '01-123456789-0', pagIbigNo: '0123-4567-8901', tinNo: '012-345-678-009' },
  { id: 'emp-11', employeeNo: 'EMP-2024-011', firstName: 'Ramon', lastName: 'Bautista', fullName: 'Ramon Bautista', email: 'ramon.b@agila.ph', phone: '09271234577', department: 'Admin', position: 'Office Administrator', status: 'Active', dateHired: '2022-03-01', avatar: 'RB', salary: 26000, sssNo: '33-1234567-0', philHealthNo: '01-234567890-0', pagIbigNo: '1234-5678-0012', tinNo: '123-456-000-010' },
  { id: 'emp-12', employeeNo: 'EMP-2024-012', firstName: 'Camille', lastName: 'Ramos', fullName: 'Camille Ramos', email: 'camille.r@agila.ph', phone: '09281234578', department: 'Liaison', position: 'Liaison Officer', status: 'Resigned', dateHired: '2023-05-01', avatar: 'CR', salary: 25000, sssNo: '33-2345678-0', philHealthNo: '01-345678901-0', pagIbigNo: '2345-6789-0012', tinNo: '234-567-000-011' },
];

export const LEAVE_REQUESTS: LeaveRequest[] = [
  { id: 'leave-1', employeeId: 'emp-8', employeeName: 'Elena Fernandez', department: 'Sales', leaveType: 'Vacation', startDate: '2025-06-20', endDate: '2025-06-25', totalDays: 4, reason: 'Family vacation to Boracay', status: 'Approved', appliedDate: '2025-06-10', reviewedBy: 'Patricia Lim', reviewedDate: '2025-06-11' },
  { id: 'leave-2', employeeId: 'emp-3', employeeName: 'Juan Dela Cruz', department: 'Compliance', leaveType: 'Sick', startDate: '2025-06-18', endDate: '2025-06-19', totalDays: 2, reason: 'Flu and fever', status: 'Approved', appliedDate: '2025-06-18', reviewedBy: 'Patricia Lim', reviewedDate: '2025-06-18' },
  { id: 'leave-3', employeeId: 'emp-1', employeeName: 'Roberto Villanueva', department: 'Sales', leaveType: 'Emergency', startDate: '2025-06-25', endDate: '2025-06-25', totalDays: 1, reason: 'Family emergency', status: 'Pending', appliedDate: '2025-06-24', reviewedBy: null, reviewedDate: null },
  { id: 'leave-4', employeeId: 'emp-5', employeeName: 'Carlos Garcia', department: 'Account Officer', leaveType: 'Vacation', startDate: '2025-07-01', endDate: '2025-07-05', totalDays: 5, reason: 'Personal trip to Cebu', status: 'Pending', appliedDate: '2025-06-20', reviewedBy: null, reviewedDate: null },
  { id: 'leave-5', employeeId: 'emp-10', employeeName: 'Isabel Cruz', department: 'Accounting', leaveType: 'Sick', startDate: '2025-06-15', endDate: '2025-06-15', totalDays: 1, reason: 'Dental appointment', status: 'Approved', appliedDate: '2025-06-14', reviewedBy: 'Patricia Lim', reviewedDate: '2025-06-14' },
  { id: 'leave-6', employeeId: 'emp-4', employeeName: 'Ana Reyes', department: 'Liaison', leaveType: 'Maternity', startDate: '2025-07-15', endDate: '2025-10-15', totalDays: 65, reason: 'Maternity leave', status: 'Pending', appliedDate: '2025-06-22', reviewedBy: null, reviewedDate: null },
  { id: 'leave-7', employeeId: 'emp-7', employeeName: 'Mark Torres', department: 'IT', leaveType: 'Vacation', startDate: '2025-06-12', endDate: '2025-06-13', totalDays: 2, reason: 'Rest day', status: 'Rejected', appliedDate: '2025-06-10', reviewedBy: 'Patricia Lim', reviewedDate: '2025-06-11' },
  { id: 'leave-8', employeeId: 'emp-11', employeeName: 'Ramon Bautista', department: 'Admin', leaveType: 'Bereavement', startDate: '2025-06-05', endDate: '2025-06-07', totalDays: 3, reason: 'Death of relative', status: 'Approved', appliedDate: '2025-06-05', reviewedBy: 'Patricia Lim', reviewedDate: '2025-06-05' },
];

export const PERFORMANCE_REVIEWS: PerformanceReview[] = [
  { id: 'perf-1', employeeId: 'emp-1', employeeName: 'Roberto Villanueva', department: 'Sales', reviewPeriod: 'Q1 2025', rating: 'Exceeds Expectations', reviewerId: 'emp-6', reviewerName: 'Patricia Lim', goals: ['Close 15 deals per quarter', 'Maintain 95% client satisfaction'], strengths: ['Excellent negotiation skills', 'Strong client relationships'], improvements: ['Documentation timeliness'], comments: 'Roberto consistently exceeds targets and maintains excellent client relationships.', reviewDate: '2025-04-15' },
  { id: 'perf-2', employeeId: 'emp-2', employeeName: 'Maria Santos', department: 'Accounting', reviewPeriod: 'Q1 2025', rating: 'Meets Expectations', reviewerId: 'emp-6', reviewerName: 'Patricia Lim', goals: ['Process invoices within 3 days', 'Zero billing errors'], strengths: ['Attention to detail', 'Organized workflow'], improvements: ['Cross-team communication', 'Proactive reporting'], comments: 'Maria meets all expectations and is reliable in her work.', reviewDate: '2025-04-15' },
  { id: 'perf-3', employeeId: 'emp-3', employeeName: 'Juan Dela Cruz', department: 'Compliance', reviewPeriod: 'Q1 2025', rating: 'Outstanding', reviewerId: 'emp-6', reviewerName: 'Patricia Lim', goals: ['100% compliance rate', 'Automate compliance tracking'], strengths: ['Regulatory expertise', 'Proactive issue identification'], improvements: ['Delegation skills'], comments: 'Juan is an exceptional compliance officer with deep regulatory knowledge.', reviewDate: '2025-04-15' },
  { id: 'perf-4', employeeId: 'emp-4', employeeName: 'Ana Reyes', department: 'Liaison', reviewPeriod: 'Q1 2025', rating: 'Meets Expectations', reviewerId: 'emp-6', reviewerName: 'Patricia Lim', goals: ['Reduce processing time by 10%', 'Handle 20 cases per month'], strengths: ['Government agency connections', 'Time management'], improvements: ['Digital tools adoption'], comments: 'Ana is a steady performer with strong government connections.', reviewDate: '2025-04-16' },
  { id: 'perf-5', employeeId: 'emp-5', employeeName: 'Carlos Garcia', department: 'Account Officer', reviewPeriod: 'Q1 2025', rating: 'Exceeds Expectations', reviewerId: 'emp-6', reviewerName: 'Patricia Lim', goals: ['Manage 15 active accounts', 'Achieve 90% task completion rate'], strengths: ['Client management', 'Problem solving'], improvements: ['Reporting consistency'], comments: 'Carlos demonstrates strong initiative in managing client accounts.', reviewDate: '2025-04-16' },
  { id: 'perf-6', employeeId: 'emp-9', employeeName: 'Diego Aquino', department: 'Compliance', reviewPeriod: 'Q1 2025', rating: 'Needs Improvement', reviewerId: 'emp-3', reviewerName: 'Juan Dela Cruz', goals: ['Learn BIR filing process', 'Shadow 10 compliance cases'], strengths: ['Eagerness to learn', 'Good attitude'], improvements: ['Technical knowledge', 'Independent work', 'Speed of execution'], comments: 'Diego is still learning the ropes and needs more hands-on training.', reviewDate: '2025-04-17' },
  { id: 'perf-7', employeeId: 'emp-7', employeeName: 'Mark Torres', department: 'IT', reviewPeriod: 'Q1 2025', rating: 'Meets Expectations', reviewerId: 'emp-6', reviewerName: 'Patricia Lim', goals: ['Maintain 99.9% uptime', 'Complete 3 system improvements'], strengths: ['Technical skills', 'Quick troubleshooting'], improvements: ['Documentation', 'User training'], comments: 'Mark maintains systems well and resolves issues promptly.', reviewDate: '2025-04-17' },
];

export const ATTENDANCE_RECORDS: AttendanceRecord[] = [
  // Week of June 23-27, 2025 (simulating timesheet data)
  { id: 'att-1', employeeId: 'emp-1', employeeName: 'Roberto Villanueva', department: 'Sales', date: '2025-06-23', timeIn: '08:02', timeOut: '17:05', status: 'Present', hoursWorked: 9, overtime: 0, notes: '' },
  { id: 'att-2', employeeId: 'emp-2', employeeName: 'Maria Santos', department: 'Accounting', date: '2025-06-23', timeIn: '07:55', timeOut: '17:00', status: 'Present', hoursWorked: 9, overtime: 0, notes: '' },
  { id: 'att-3', employeeId: 'emp-3', employeeName: 'Juan Dela Cruz', department: 'Compliance', date: '2025-06-23', timeIn: '08:35', timeOut: '17:10', status: 'Late', hoursWorked: 8.5, overtime: 0, notes: 'Traffic delay' },
  { id: 'att-4', employeeId: 'emp-4', employeeName: 'Ana Reyes', department: 'Liaison', date: '2025-06-23', timeIn: '08:00', timeOut: '18:30', status: 'Present', hoursWorked: 10.5, overtime: 1.5, notes: 'Filed overtime for BIR deadline' },
  { id: 'att-5', employeeId: 'emp-5', employeeName: 'Carlos Garcia', department: 'Account Officer', date: '2025-06-23', timeIn: '08:00', timeOut: '17:00', status: 'Present', hoursWorked: 9, overtime: 0, notes: '' },
  { id: 'att-6', employeeId: 'emp-6', employeeName: 'Patricia Lim', department: 'HR', date: '2025-06-23', timeIn: '07:50', timeOut: '17:30', status: 'Present', hoursWorked: 9.5, overtime: 0.5, notes: '' },
  { id: 'att-7', employeeId: 'emp-7', employeeName: 'Mark Torres', department: 'IT', date: '2025-06-23', timeIn: null, timeOut: null, status: 'Absent', hoursWorked: 0, overtime: 0, notes: 'No timesheet entry — absent without notice' },
  { id: 'att-8', employeeId: 'emp-8', employeeName: 'Elena Fernandez', department: 'Sales', date: '2025-06-23', timeIn: null, timeOut: null, status: 'On Leave', hoursWorked: 0, overtime: 0, notes: 'Vacation leave' },
  { id: 'att-9', employeeId: 'emp-9', employeeName: 'Diego Aquino', department: 'Compliance', date: '2025-06-23', timeIn: '08:10', timeOut: '12:00', status: 'Half Day', hoursWorked: 4, overtime: 0, notes: 'Afternoon off — personal errand' },
  { id: 'att-10', employeeId: 'emp-10', employeeName: 'Isabel Cruz', department: 'Accounting', date: '2025-06-23', timeIn: '08:00', timeOut: '17:00', status: 'Present', hoursWorked: 9, overtime: 0, notes: '' },
  { id: 'att-11', employeeId: 'emp-11', employeeName: 'Ramon Bautista', department: 'Admin', date: '2025-06-23', timeIn: '08:45', timeOut: '17:00', status: 'Late', hoursWorked: 8.25, overtime: 0, notes: 'Late arrival — traffic' },
  // June 24
  { id: 'att-12', employeeId: 'emp-1', employeeName: 'Roberto Villanueva', department: 'Sales', date: '2025-06-24', timeIn: '08:00', timeOut: '17:00', status: 'Present', hoursWorked: 9, overtime: 0, notes: '' },
  { id: 'att-13', employeeId: 'emp-2', employeeName: 'Maria Santos', department: 'Accounting', date: '2025-06-24', timeIn: '07:58', timeOut: '17:15', status: 'Present', hoursWorked: 9.25, overtime: 0, notes: '' },
  { id: 'att-14', employeeId: 'emp-3', employeeName: 'Juan Dela Cruz', department: 'Compliance', date: '2025-06-24', timeIn: '08:00', timeOut: '17:00', status: 'Present', hoursWorked: 9, overtime: 0, notes: '' },
  { id: 'att-15', employeeId: 'emp-5', employeeName: 'Carlos Garcia', department: 'Account Officer', date: '2025-06-24', timeIn: '08:05', timeOut: '19:00', status: 'Present', hoursWorked: 11, overtime: 2, notes: 'Client deadline' },
  { id: 'att-16', employeeId: 'emp-6', employeeName: 'Patricia Lim', department: 'HR', date: '2025-06-24', timeIn: '08:00', timeOut: '17:00', status: 'Present', hoursWorked: 9, overtime: 0, notes: '' },
  { id: 'att-17', employeeId: 'emp-7', employeeName: 'Mark Torres', department: 'IT', date: '2025-06-24', timeIn: '08:30', timeOut: '17:30', status: 'Late', hoursWorked: 9, overtime: 0, notes: 'Late — alarm issue' },
  { id: 'att-18', employeeId: 'emp-10', employeeName: 'Isabel Cruz', department: 'Accounting', date: '2025-06-24', timeIn: '08:00', timeOut: '17:00', status: 'Present', hoursWorked: 9, overtime: 0, notes: '' },
];

export const PAYROLL_RECORDS: PayrollRecord[] = [
  { id: 'pay-1', employeeId: 'emp-1', employeeName: 'Roberto Villanueva', department: 'Sales', payPeriod: 'June 1-15, 2025', basicPay: 17500, overtime: 0, allowances: 2000, deductions: 0, sssContribution: 900, philHealthContribution: 500, pagIbigContribution: 200, withholdingTax: 1500, netPay: 16400, status: 'Completed', processedDate: '2025-06-15' },
  { id: 'pay-2', employeeId: 'emp-2', employeeName: 'Maria Santos', department: 'Accounting', payPeriod: 'June 1-15, 2025', basicPay: 16000, overtime: 0, allowances: 1500, deductions: 0, sssContribution: 800, philHealthContribution: 450, pagIbigContribution: 200, withholdingTax: 1200, netPay: 14850, status: 'Completed', processedDate: '2025-06-15' },
  { id: 'pay-3', employeeId: 'emp-3', employeeName: 'Juan Dela Cruz', department: 'Compliance', payPeriod: 'June 1-15, 2025', basicPay: 15000, overtime: 500, allowances: 1500, deductions: 0, sssContribution: 750, philHealthContribution: 425, pagIbigContribution: 200, withholdingTax: 1100, netPay: 14525, status: 'Completed', processedDate: '2025-06-15' },
  { id: 'pay-4', employeeId: 'emp-4', employeeName: 'Ana Reyes', department: 'Liaison', payPeriod: 'June 1-15, 2025', basicPay: 14000, overtime: 1500, allowances: 1000, deductions: 0, sssContribution: 700, philHealthContribution: 400, pagIbigContribution: 200, withholdingTax: 950, netPay: 14250, status: 'Completed', processedDate: '2025-06-15' },
  { id: 'pay-5', employeeId: 'emp-5', employeeName: 'Carlos Garcia', department: 'Account Officer', payPeriod: 'June 1-15, 2025', basicPay: 16500, overtime: 0, allowances: 1500, deductions: 500, sssContribution: 850, philHealthContribution: 475, pagIbigContribution: 200, withholdingTax: 1300, netPay: 14675, status: 'Completed', processedDate: '2025-06-15' },
  { id: 'pay-6', employeeId: 'emp-6', employeeName: 'Patricia Lim', department: 'HR', payPeriod: 'June 1-15, 2025', basicPay: 20000, overtime: 0, allowances: 2500, deductions: 0, sssContribution: 1000, philHealthContribution: 550, pagIbigContribution: 200, withholdingTax: 2000, netPay: 18750, status: 'Completed', processedDate: '2025-06-15' },
  // June 16-30 payroll (current — in processing)
  { id: 'pay-7', employeeId: 'emp-1', employeeName: 'Roberto Villanueva', department: 'Sales', payPeriod: 'June 16-30, 2025', basicPay: 17500, overtime: 0, allowances: 2000, deductions: 0, sssContribution: 900, philHealthContribution: 500, pagIbigContribution: 200, withholdingTax: 1500, netPay: 16400, status: 'Processing', processedDate: null },
  { id: 'pay-8', employeeId: 'emp-2', employeeName: 'Maria Santos', department: 'Accounting', payPeriod: 'June 16-30, 2025', basicPay: 16000, overtime: 0, allowances: 1500, deductions: 0, sssContribution: 800, philHealthContribution: 450, pagIbigContribution: 200, withholdingTax: 1200, netPay: 14850, status: 'Processing', processedDate: null },
  { id: 'pay-9', employeeId: 'emp-3', employeeName: 'Juan Dela Cruz', department: 'Compliance', payPeriod: 'June 16-30, 2025', basicPay: 15000, overtime: 0, allowances: 1500, deductions: 0, sssContribution: 750, philHealthContribution: 425, pagIbigContribution: 200, withholdingTax: 1100, netPay: 14025, status: 'Draft', processedDate: null },
  { id: 'pay-10', employeeId: 'emp-4', employeeName: 'Ana Reyes', department: 'Liaison', payPeriod: 'June 16-30, 2025', basicPay: 14000, overtime: 2000, allowances: 1000, deductions: 0, sssContribution: 700, philHealthContribution: 400, pagIbigContribution: 200, withholdingTax: 950, netPay: 14750, status: 'Draft', processedDate: null },
  { id: 'pay-11', employeeId: 'emp-5', employeeName: 'Carlos Garcia', department: 'Account Officer', payPeriod: 'June 16-30, 2025', basicPay: 16500, overtime: 2000, allowances: 1500, deductions: 0, sssContribution: 850, philHealthContribution: 475, pagIbigContribution: 200, withholdingTax: 1300, netPay: 17175, status: 'On Hold', processedDate: null },
  { id: 'pay-12', employeeId: 'emp-6', employeeName: 'Patricia Lim', department: 'HR', payPeriod: 'June 16-30, 2025', basicPay: 20000, overtime: 500, allowances: 2500, deductions: 0, sssContribution: 1000, philHealthContribution: 550, pagIbigContribution: 200, withholdingTax: 2000, netPay: 19250, status: 'Processing', processedDate: null },
];

export const GOV_COMPLIANCE_RECORDS: GovComplianceRecord[] = [
  { id: 'gov-1', type: 'SSS', description: 'Monthly SSS R-3 & R-5 filing', deadline: '2025-07-10', status: 'Pending', affectedEmployees: 11, filedDate: null, referenceNo: null, notes: 'Monthly contribution report for June 2025' },
  { id: 'gov-2', type: 'PhilHealth', description: 'Monthly PhilHealth RF-1 remittance', deadline: '2025-07-10', status: 'Pending', affectedEmployees: 11, filedDate: null, referenceNo: null, notes: 'Premium contribution for June 2025' },
  { id: 'gov-3', type: 'Pag-IBIG', description: 'Monthly Pag-IBIG MCR & STLR filing', deadline: '2025-07-10', status: 'Pending', affectedEmployees: 11, filedDate: null, referenceNo: null, notes: 'Member contribution for June 2025' },
  { id: 'gov-4', type: 'BIR', description: 'Monthly Withholding Tax (Form 1601-C)', deadline: '2025-07-10', status: 'Pending', affectedEmployees: 11, filedDate: null, referenceNo: null, notes: 'Compensation withholding tax for June 2025' },
  { id: 'gov-5', type: 'SSS', description: 'SSS R-3 & R-5 for May 2025', deadline: '2025-06-10', status: 'Compliant', affectedEmployees: 11, filedDate: '2025-06-08', referenceNo: 'SSS-2025-05-001', notes: 'Filed on time' },
  { id: 'gov-6', type: 'PhilHealth', description: 'PhilHealth RF-1 for May 2025', deadline: '2025-06-10', status: 'Compliant', affectedEmployees: 11, filedDate: '2025-06-09', referenceNo: 'PH-2025-05-001', notes: 'Filed on time' },
  { id: 'gov-7', type: 'Pag-IBIG', description: 'Pag-IBIG MCR for May 2025', deadline: '2025-06-10', status: 'Compliant', affectedEmployees: 11, filedDate: '2025-06-07', referenceNo: 'PI-2025-05-001', notes: 'Filed on time' },
  { id: 'gov-8', type: 'BIR', description: 'BIR 1601-C for May 2025', deadline: '2025-06-10', status: 'Compliant', affectedEmployees: 11, filedDate: '2025-06-09', referenceNo: 'BIR-2025-05-001', notes: 'Filed on time' },
  { id: 'gov-9', type: 'BIR', description: 'Annual Alpha List (Form 1604-CF)', deadline: '2025-01-31', status: 'Compliant', affectedEmployees: 11, filedDate: '2025-01-28', referenceNo: 'BIR-2024-ALPHA-001', notes: 'Annual filing for CY 2024' },
  { id: 'gov-10', type: 'DOLE', description: 'DOLE Annual Employment Report', deadline: '2025-01-31', status: 'Compliant', affectedEmployees: 11, filedDate: '2025-01-25', referenceNo: 'DOLE-2024-AER-001', notes: 'CY 2024 report filed' },
  { id: 'gov-11', type: 'SSS', description: 'SSS R-3 & R-5 for April 2025', deadline: '2025-05-10', status: 'Overdue', affectedEmployees: 11, filedDate: null, referenceNo: null, notes: 'Missed deadline — penalty may apply' },
  { id: 'gov-12', type: 'DOLE', description: 'Workplace safety compliance inspection', deadline: '2025-07-31', status: 'Pending', affectedEmployees: 11, filedDate: null, referenceNo: null, notes: 'Annual workplace inspection scheduled' },
];

export const HR_REQUESTS: HRRequest[] = [
  { id: 'req-1', employeeId: 'emp-1', employeeName: 'Roberto Villanueva', department: 'Sales', requestType: 'Certificate of Employment', subject: 'COE for bank loan application', description: 'Need COE with salary for housing loan application at BDO. Please include current position and tenure.', status: 'In Progress', priority: 'High', submittedDate: '2025-06-22', resolvedDate: null, assignedTo: 'Patricia Lim' },
  { id: 'req-2', employeeId: 'emp-4', employeeName: 'Ana Reyes', department: 'Liaison', requestType: 'Schedule Change', subject: 'Request flexi-time during pregnancy', description: 'Requesting to shift schedule from 8AM-5PM to 9AM-6PM starting July due to prenatal checkups in the morning.', status: 'Open', priority: 'Medium', submittedDate: '2025-06-23', resolvedDate: null, assignedTo: null },
  { id: 'req-3', employeeId: 'emp-7', employeeName: 'Mark Torres', department: 'IT', requestType: 'Equipment Request', subject: 'Replacement laptop — current unit overheating', description: 'My current laptop (ThinkPad T480) is overheating and shutting down during builds. Requesting a replacement unit.', status: 'Open', priority: 'High', submittedDate: '2025-06-24', resolvedDate: null, assignedTo: null },
  { id: 'req-4', employeeId: 'emp-10', employeeName: 'Isabel Cruz', department: 'Accounting', requestType: 'ID Replacement', subject: 'Lost company ID', description: 'I lost my company ID last week. Requesting a replacement ID card.', status: 'In Progress', priority: 'Low', submittedDate: '2025-06-20', resolvedDate: null, assignedTo: 'Patricia Lim' },
  { id: 'req-5', employeeId: 'emp-5', employeeName: 'Carlos Garcia', department: 'Account Officer', requestType: 'Salary Dispute', subject: 'Overtime not reflected in June 1-15 payslip', description: 'I worked 4 hours overtime on June 10 but it was not reflected in my June 1-15 payslip. Please check timesheet records.', status: 'Open', priority: 'High', submittedDate: '2025-06-21', resolvedDate: null, assignedTo: null },
  { id: 'req-6', employeeId: 'emp-2', employeeName: 'Maria Santos', department: 'Accounting', requestType: 'Certificate of Employment', subject: 'COE for visa application', description: 'Need COE for Japan tourist visa application. Please include employment dates.', status: 'Resolved', priority: 'Medium', submittedDate: '2025-06-10', resolvedDate: '2025-06-12', assignedTo: 'Patricia Lim' },
  { id: 'req-7', employeeId: 'emp-11', employeeName: 'Ramon Bautista', department: 'Admin', requestType: 'Others', subject: 'Parking slot assignment request', description: 'Requesting a dedicated parking slot as I drive to work daily. Current lot is first-come-first-served and often full.', status: 'Closed', priority: 'Low', submittedDate: '2025-06-05', resolvedDate: '2025-06-08', assignedTo: 'Patricia Lim' },
  { id: 'req-8', employeeId: 'emp-9', employeeName: 'Diego Aquino', department: 'Compliance', requestType: 'Leave Request', subject: 'Advance leave credit request', description: 'As a probationary employee, I have no leave credits yet. Requesting advance leave of 2 days for a family event in July.', status: 'Open', priority: 'Medium', submittedDate: '2025-06-25', resolvedDate: null, assignedTo: null },
];

// ── Helper functions ─────────────────────────────────────

export function getEmployeeById(id: string): Employee | undefined {
  return EMPLOYEES.find(e => e.id === id);
}

export function getActiveEmployees(): Employee[] {
  return EMPLOYEES.filter(e => e.status === 'Active' || e.status === 'Probationary' || e.status === 'On Leave');
}

export function getPendingLeaves(): LeaveRequest[] {
  return LEAVE_REQUESTS.filter(l => l.status === 'Pending');
}

export function getOpenRequests(): HRRequest[] {
  return HR_REQUESTS.filter(r => r.status === 'Open' || r.status === 'In Progress');
}

export function getPendingCompliance(): GovComplianceRecord[] {
  return GOV_COMPLIANCE_RECORDS.filter(g => g.status === 'Pending' || g.status === 'Overdue');
}
