// prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import type { AppPortal, PortalRole } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

/* ─── Portal App definitions ──────────────────────────────────────── */

const PORTAL_APPS = [
  { name: "SALES" as const,                label: "Sales Portal" },
  { name: "COMPLIANCE" as const,           label: "Compliance Portal" },
  { name: "LIAISON" as const,              label: "Liaison Portal" },
  { name: "ACCOUNTING" as const,           label: "ACF Portal" },
  { name: "OPERATIONS_MANAGEMENT" as const, label: "Operations Management Portal" },
  { name: "HR" as const,                   label: "HR Portal" },
  { name: "TASK_MANAGEMENT" as const,      label: "Task Management Portal" },
  { name: "CLIENT_RELATIONS" as const,     label: "Client Relations Portal" },
];

/* ─── Employee Level definitions (position 1 = highest) ─────────── */

const EMPLOYEE_LEVELS = [
  { name: "Executive",  position: 1, description: "C-suite and executive leadership" },
  { name: "Director",   position: 2, description: "Department directors" },
  { name: "Manager",    position: 3, description: "Team and function managers" },
  { name: "Supervisor", position: 4, description: "Front-line supervisors" },
  { name: "Lead",       position: 5, description: "Technical or team leads" },
  { name: "Senior",     position: 6, description: "Senior individual contributors" },
  { name: "Mid",        position: 7, description: "Mid-level individual contributors" },
  { name: "Junior",     position: 8, description: "Junior individual contributors" },
  { name: "Staff",      position: 9, description: "Entry-level staff" },
];

/* ─── Standalone Department + Position definitions ───────────────────
 *
 *  These departments are seeded independently of the INTERNAL_USERS loop
 *  so they exist in the system even before employees are assigned to them.
 *
 * ─────────────────────────────────────────────────────────────────── */

const STANDALONE_DEPARTMENTS = [
  {
    name: "Operations",
    description: "Day-to-day business operations and process management",
    positions: [
      { title: "Operations Manager",           description: "Oversees daily operations and business processes" },
      { title: "Operations Supervisor",        description: "Supervises operational tasks and team workflows" },
    ],
  },
  {
    name: "Client Relations",
    description: "Client relationship management and account servicing",
    positions: [
      { title: "Client Relations Officer",     description: "Manages client accounts and relationship activities" },
      { title: "Client Relations Supervisor",  description: "Supervises the client relations team" },
    ],
  },
  {
    name: "Liaison",
    description: "Field operations and government agency liaison work",
    positions: [
      { title: "Liaison Officer",              description: "Handles field tasks and government agency submissions" },
      { title: "Liaison Supervisor",           description: "Supervises field liaison activities and scheduling" },
    ],
  },
  {
    name: "Compliance",
    description: "Tax compliance monitoring and regulatory filings",
    positions: [
      { title: "Compliance Officer",           description: "Monitors and manages client tax compliance tasks" },
      { title: "Tax Compliance Specialist",    description: "Handles detailed tax compliance and filing requirements" },
      { title: "Compliance Supervisor",        description: "Supervises compliance team and review processes" },
    ],
  },
  {
    name: "IT",
    description: "Information technology infrastructure and technical support",
    positions: [
      { title: "IT Specialist",                description: "Manages system infrastructure and technical support" },
      { title: "IT Manager",                   description: "Oversees IT operations, security, and development" },
    ],
  },
];

/* ─── Internal user definitions ──────────────────────────────────────
 *
 *  ALL internal users (SUPER_ADMIN, ADMIN, EMPLOYEE) are employees of
 *  Agila Tax Management Services (companyCode: 'atms'). Every seeded
 *  employee must have an EmployeeEmployment record with clientId pointing
 *  to the ATMS client — this is what grants them access to the portal.
 *
 * ─────────────────────────────────────────────────────────────────── */

interface InternalUserSeed {
  employeeNo: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";
  gender: string;
  birthDate: Date;
  phone: string;

  // Updated to match the new split address schema
  currentCity: string;
  currentProvince: string;

  department: string;
  departmentDescription: string;
  positionTitle: string;
  positionDescription: string;
  /** Name matching an EmployeeLevel record (e.g. "Executive", "Junior"). */
  employeeLevel: string;
  hireDate: Date;
  /** Portal access granted only for EMPLOYEE role (SUPER_ADMIN/ADMIN get access by role). */
  appAccess?: Partial<Record<AppPortal, PortalRole>>;
}

const INTERNAL_USERS: InternalUserSeed[] = [
  {
    employeeNo: "EMP-00001",
    firstName: "Super",
    lastName: "Admin",
    email: "admin@agila.com",
    password: "agilapassword",
    role: "SUPER_ADMIN",
    gender: "Male",
    birthDate: new Date("1990-01-01"),
    phone: "09170000000",
    currentCity: "Cebu City",
    currentProvince: "Cebu",
    department: "Administration",
    departmentDescription: "Executive administration and system management",
    positionTitle: "System Administrator",
    positionDescription: "Full system access and management",
    employeeLevel: "Executive",
    hireDate: new Date("2023-01-01"),
  },
  {
    employeeNo: "EMP-00002",
    firstName: "Admin",
    lastName: "User",
    email: "manager@agila.com",
    password: "agilapassword",
    role: "ADMIN",
    gender: "Female",
    birthDate: new Date("1992-06-15"),
    phone: "09180000000",
    currentCity: "Cebu City",
    currentProvince: "Cebu",
    department: "Human Resources",
    departmentDescription: "HR operations and employee management",
    positionTitle: "HR Manager",
    positionDescription: "Manages employee relations and compliance",
    employeeLevel: "Manager",
    hireDate: new Date("2023-03-01"),
  },
  {
    employeeNo: "EMP-00003",
    firstName: "Juan",
    lastName: "Dela Cruz",
    email: "employee@agila.com",
    password: "agilapassword",
    role: "EMPLOYEE",
    gender: "Male",
    birthDate: new Date("1998-09-20"),
    phone: "09190000000",
    currentCity: "Mandaue City",
    currentProvince: "Cebu",
    department: "Accounting",
    departmentDescription: "Bookkeeping, payroll, and financial reporting",
    positionTitle: "Accountant",
    positionDescription: "Handles client accounting and tax filings",
    employeeLevel: "Junior",
    hireDate: new Date("2024-01-15"),
    appAccess: {
      COMPLIANCE: "ADMIN",
      ACCOUNTING: "USER",
      OPERATIONS_MANAGEMENT: "VIEWER",
    },
  },
  {
    employeeNo: "EMP-00004",
    firstName: "Lia",
    lastName: "Santiago",
    email: "liaison@agila.com",
    password: "agilapassword",
    role: "EMPLOYEE",
    gender: "Female",
    birthDate: new Date("1996-04-18"),
    phone: "09210000000",
    currentCity: "Cebu City",
    currentProvince: "Cebu",
    department: "Liaison",
    departmentDescription: "Field operations and government agency liaison work",
    positionTitle: "Liaison Officer",
    positionDescription: "Handles field tasks and government agency submissions",
    employeeLevel: "Mid",
    hireDate: new Date("2024-06-01"),
    appAccess: {
      LIAISON: "ADMIN",
    },
  },
];

/* ─── Client company definitions ────────────────────────────────────
 *
 *  Real external clients managed by ATMS. These are separate from the
 *  internal ATMS company record. Client users are assigned to these.
 *
 * ─────────────────────────────────────────────────────────────────── */

interface ClientSeed {
  companyCode: string;
  clientNo: string;
  businessName: string;
  portalName: string;
  businessEntity: "SOLE_PROPRIETORSHIP" | "CORPORATION" | "PARTNERSHIP" | "INDIVIDUAL" | "COOPERATIVE";
  branchType: "MAIN" | "BRANCH";
  // Tax defaults for seeding
  tin: string;
  rdoCode: string;
  registeredAddress: string;
  zipCode: string;
}

const CLIENT_COMPANIES: ClientSeed[] = [
  {
    companyCode: "comp-001",
    clientNo: "2024-0001",
    businessName: "Santos General Merchandise",
    portalName: "Santos General Merchandise",
    businessEntity: "SOLE_PROPRIETORSHIP",
    branchType: "MAIN",
    tin: "987-654-321-000",
    rdoCode: "082",
    registeredAddress: "Fuente Osmena, Cebu City",
    zipCode: "6000",
  },
];

/* ─── Client user definitions ────────────────────────────────────────
 *
 *  External client portal users linked to a specific Client record.
 *  Credentials are stored in ClientAccount (hashed) — never on ClientUser.
 *
 * ─────────────────────────────────────────────────────────────────── */

interface ClientUserSeed {
  name: string;
  email: string;
  password: string;
  /** companyCode of the Client this user belongs to */
  companyCode: string;
  /** Role within the client — defaults to OWNER for the primary contact */
  role?: "OWNER" | "ADMIN" | "EMPLOYEE" | "VIEWER";
  /** When provided, an Employee profile is created and linked via clientUserId */
  employee?: {
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: string;
    birthDate: Date;
    phone: string;
    currentCity: string;
    currentProvince: string;
    positionTitle: string;
    hireDate: Date;
  };
}

const CLIENT_USERS: ClientUserSeed[] = [
  {
    name: "Maria Santos",
    email: "client@agila.com",
    password: "clientpassword",
    companyCode: "comp-001",
    role: "OWNER",
    employee: {
      firstName: "Maria",
      lastName: "Santos",
      gender: "Female",
      birthDate: new Date("1985-03-22"),
      phone: "09270000000",
      currentCity: "Cebu City",
      currentProvince: "Cebu",
      positionTitle: "Business Owner",
      hireDate: new Date("2024-01-01"),
    },
  },
];

async function seedClientUser(
  seed: ClientUserSeed,
  clientId: number,
): Promise<void> {
  const hashedPassword = await hashPassword(seed.password);

  // 1. Upsert ClientUser
  const clientUser = await prisma.clientUser.upsert({
    where: { email: seed.email },
    update: {
      name: seed.name,
      active: true,
      emailVerified: true,
      clientId,
    },
    create: {
      name: seed.name,
      email: seed.email,
      active: true,
      emailVerified: true,
      clientId,
    },
  });

  // 2. Upsert ClientUserAssignment with role
  await prisma.clientUserAssignment.upsert({
    where: { clientUserId_clientId: { clientUserId: clientUser.id, clientId } },
    update: { role: seed.role ?? "OWNER" },
    create: { clientUserId: clientUser.id, clientId, role: seed.role ?? "OWNER" },
  });

  // 3. Optionally create Employee profile linked via clientUserId
  if (seed.employee) {
    const emp = seed.employee;
    const existingEmployee = await prisma.employee.findUnique({
      where: { clientUserId: clientUser.id },
    });
    let employeeId: number;
    if (existingEmployee) {
      employeeId = existingEmployee.id;
    } else {
      const employee = await prisma.employee.create({
        data: {
          clientUserId: clientUser.id,
          firstName: emp.firstName,
          middleName: emp.middleName,
          lastName: emp.lastName,
          gender: emp.gender,
          birthDate: emp.birthDate,
          phone: emp.phone,
          // Mapped to the new address fields
          currentCity: emp.currentCity,
          currentProvince: emp.currentProvince,
          active: true,
        },
      });
      employeeId = employee.id;
    }

    // Upsert placeholder government IDs
    await prisma.employeeGovernmentIds.upsert({
      where: { employeeId },
      update: {},
      create: {
        employeeId,
        sss: "00-0000000-0",
        pagibig: "0000-0000-0000",
        philhealth: "00-000000000-0",
        tin: "000-000-000-000",
      },
    });

    // Upsert EmployeeEmployment → the client they belong to
    const existingEmployment = await prisma.employeeEmployment.findFirst({
      where: { employeeId, clientId, employmentStatus: "ACTIVE" },
    });
    if (!existingEmployment) {
      // Upsert a default department for this client
      const dept = await prisma.department.upsert({
        where: { clientId_name: { clientId, name: "Management" } },
        update: {},
        create: { clientId, name: "Management", description: "Business management" },
      });
      // Find or create position
      let position = await prisma.position.findFirst({
        where: { departmentId: dept.id, title: emp.positionTitle },
      });
      if (!position) {
        position = await prisma.position.create({
          data: { title: emp.positionTitle, departmentId: dept.id },
        });
      }
      await prisma.employeeEmployment.create({
        data: {
          employeeId,
          clientId,
          departmentId: dept.id,
          positionId: position.id,
          employmentType: "REGULAR",
          employmentStatus: "ACTIVE",
          hireDate: emp.hireDate,
        },
      });
    }
  }

  // 4. Upsert ClientAccount (BetterAuth credential)
  const existingAccount = await prisma.clientAccount.findFirst({
    where: { userId: clientUser.id, providerId: "credential" },
  });
  if (existingAccount) {
    await prisma.clientAccount.update({
      where: { id: existingAccount.id },
      data: { password: hashedPassword },
    });
  } else {
    await prisma.clientAccount.create({
      data: {
        id: `credential:${clientUser.id}`,
        accountId: clientUser.id,
        providerId: "credential",
        userId: clientUser.id,
        password: hashedPassword,
      },
    });
  }

  console.log(
    `  ✓ [CLIENT/${seed.role ?? "OWNER"}] ${seed.name} (${seed.email}) — linked to client #${clientId}`,
  );
}

/**
 * Seeds a single internal user (User + BetterAuth Account + Employee +
 * Government IDs + EmployeeEmployment linked to the ATMS client).
 */
async function seedInternalUser(
  seed: InternalUserSeed,
  agilaClientId: number,
  departmentId: number,
  positionId: number,
  employeeLevelId: number | null,
): Promise<void> {
  const hashedPassword = await hashPassword(seed.password);

  // 1. Upsert User
  const user = await prisma.user.upsert({
    where: { email: seed.email },
    update: {
      name: `${seed.firstName} ${seed.lastName}`,
      role: seed.role,
      active: true,
      emailVerified: true,
    },
    create: {
      name: `${seed.firstName} ${seed.lastName}`,
      email: seed.email,
      role: seed.role,
      active: true,
      emailVerified: true,
    },
  });

  // 2. Upsert BetterAuth credential account
  const existingAccount = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
  });
  if (existingAccount) {
    await prisma.account.update({
      where: { id: existingAccount.id },
      data: { password: hashedPassword },
    });
  } else {
    await prisma.account.create({
      data: {
        id: `credential:${user.id}`,
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });
  }

  // 3. Upsert Employee record
  const existingEmployee = await prisma.employee.findUnique({
    where: { userId: user.id },
  });
  let employeeId: number;
  if (existingEmployee) {
    employeeId = existingEmployee.id;
  } else {
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        firstName: seed.firstName,
        lastName: seed.lastName,
        employeeNo: seed.employeeNo,
        email: seed.email,
        birthDate: seed.birthDate,
        gender: seed.gender,
        phone: seed.phone,
        currentCity: seed.currentCity,
        currentProvince: seed.currentProvince,
        active: true,
      },
    });
    employeeId = employee.id;
  }

  // 4. Upsert Government IDs (placeholder values)
  await prisma.employeeGovernmentIds.upsert({
    where: { employeeId },
    update: {},
    create: {
      employeeId,
      sss: "00-0000000-0",
      pagibig: "0000-0000-0000",
      philhealth: "00-000000000-0",
      tin: "000-000-000-000",
    },
  });

  // 5. Upsert EmployeeEmployment → ATMS client (ensures internal user is linked)
  const existingEmployment = await prisma.employeeEmployment.findFirst({
    where: { employeeId, clientId: agilaClientId, employmentStatus: "ACTIVE" },
  });
  if (!existingEmployment) {
    await prisma.employeeEmployment.create({
      data: {
        employeeId,
        clientId: agilaClientId,
        departmentId,
        positionId,
        employmentType: "REGULAR",
        employmentStatus: "ACTIVE",
        employeeLevelId: employeeLevelId ?? undefined,
        hireDate: seed.hireDate,
        regularizationDate: seed.hireDate,
      },
    });
  }

  // 6. Seed EmployeeAppAccess for EMPLOYEE role users
  if (seed.role === "EMPLOYEE" && seed.appAccess) {
    const apps = await prisma.app.findMany();
    for (const [portalName, role] of Object.entries(seed.appAccess)) {
      const app = apps.find((a) => a.name === portalName);
      if (!app) continue;
      await prisma.employeeAppAccess.upsert({
        where: { employeeId_appId: { employeeId, appId: app.id } },
        update: { role },
        create: { employeeId, appId: app.id, role },
      });
    }
  }

  console.log(
    `  ✓ [${seed.role}] ${seed.firstName} ${seed.lastName} (${seed.email}) — linked to ATMS`,
  );
}

/* ─── Government Offices ────────────────────────────────────────── */

const GOVERNMENT_OFFICES = [
  { code: "BIR",       name: "Bureau of Internal Revenue",                description: "National tax collection authority" },
  { code: "SEC",       name: "Securities and Exchange Commission",         description: "Corporate registration and regulation" },
  { code: "DTI",       name: "Department of Trade and Industry",           description: "Sole proprietorship registration and trade" },
  { code: "SSS",       name: "Social Security System",                     description: "Social insurance for private sector employees" },
  { code: "PHILHEALTH",name: "Philippine Health Insurance Corporation",    description: "National health insurance program" },
  { code: "PAGIBIG",   name: "Pag-IBIG Fund (HDMF)",                      description: "National savings and housing fund" },
  { code: "MAYOR",     name: "Local Government Unit / Mayor's Office",     description: "Business permit and licensing" },
  { code: "CDA",       name: "Cooperative Development Authority",          description: "Cooperative registration and regulation" },
  { code: "DOLE",      name: "Department of Labor and Employment",         description: "Labor standards and employment regulation" },
  { code: "DICT",      name: "Department of Information and Communications Technology", description: "ICT registration and digital services" },
];

/* ─── Cities ─────────────────────────────────────────────────────── */

const CITIES = [
  { name: "Cebu City",        province: "Cebu",  region: "Region VII – Central Visayas", zipCode: "6000" },
  { name: "Mandaue City",     province: "Cebu",  region: "Region VII – Central Visayas", zipCode: "6014" },
  { name: "Lapu-Lapu City",   province: "Cebu",  region: "Region VII – Central Visayas", zipCode: "6015" },
];

/* ─── Department Task Statuses ────────────────────────────────────── */

type TaskStatusSeed = {
  name: string;
  color: string;
  statusOrder: number;
  isEntryStep: boolean;
  isExitStep: boolean;
};

const DEFAULT_TASK_STATUSES: TaskStatusSeed[] = [
  { name: "Open",        color: "#6366f1", statusOrder: 1, isEntryStep: true,  isExitStep: false },
  { name: "In Progress", color: "#f59e0b", statusOrder: 2, isEntryStep: false, isExitStep: false },
  { name: "For Review",  color: "#0ea5e9", statusOrder: 3, isEntryStep: false, isExitStep: false },
  { name: "Done",        color: "#22c55e", statusOrder: 4, isEntryStep: false, isExitStep: true  },
];

const DEPT_TASK_STATUSES: Record<string, TaskStatusSeed[]> = {
  Compliance: [
    { name: "Open",            color: "#6366f1", statusOrder: 1, isEntryStep: true,  isExitStep: false },
    { name: "Gathering Docs",  color: "#f59e0b", statusOrder: 2, isEntryStep: false, isExitStep: false },
    { name: "In Progress",     color: "#f97316", statusOrder: 3, isEntryStep: false, isExitStep: false },
    { name: "For Review",      color: "#0ea5e9", statusOrder: 4, isEntryStep: false, isExitStep: false },
    { name: "Client Approval", color: "#8b5cf6", statusOrder: 5, isEntryStep: false, isExitStep: false },
    { name: "Submitted",       color: "#22c55e", statusOrder: 6, isEntryStep: false, isExitStep: true  },
  ],
  Liaison: [
    { name: "Open",           color: "#6366f1", statusOrder: 1, isEntryStep: true,  isExitStep: false },
    { name: "Scheduled",      color: "#f59e0b", statusOrder: 2, isEntryStep: false, isExitStep: false },
    { name: "In Progress",    color: "#f97316", statusOrder: 3, isEntryStep: false, isExitStep: false },
    { name: "Docs Submitted", color: "#0ea5e9", statusOrder: 4, isEntryStep: false, isExitStep: false },
    { name: "Done",           color: "#22c55e", statusOrder: 5, isEntryStep: false, isExitStep: true  },
  ],
};

/* ─── Task Templates ──────────────────────────────────────────────── */

interface TaskTemplateSeed {
  name: string;
  description?: string;
  deptName: string;
  daysDue?: number;
  subtasks: Array<{
    name: string;
    description?: string;
    subtaskOrder: number;
    priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    daysDue?: number;
  }>;
}

const TASK_TEMPLATES: TaskTemplateSeed[] = [
  {
    name: "BIR 2550M – Monthly VAT Return",
    description: "Monthly preparation and filing of BIR Form 2550M (Monthly Value-Added Tax Declaration).",
    deptName: "Compliance",
    daysDue: 20,
    subtasks: [
      { name: "Gather sales and purchase invoices", description: "Collect all official receipts and sales invoices for the reporting month.", subtaskOrder: 1, priority: "HIGH",   daysDue: 3  },
      { name: "Compute input and output VAT",       description: "Reconcile input VAT on purchases and output VAT on sales.", subtaskOrder: 2, priority: "HIGH",   daysDue: 5  },
      { name: "Prepare BIR Form 2550M",             description: "Fill out the monthly VAT declaration form with verified figures.", subtaskOrder: 3, priority: "HIGH",   daysDue: 7  },
      { name: "Supervisor review",                  description: "Senior accountant reviews the filled form before filing.", subtaskOrder: 4, priority: "NORMAL", daysDue: 10 },
      { name: "E-file via eBIR Forms / eFPS",       description: "Submit the validated form through eBIR Forms or eFPS portal.", subtaskOrder: 5, priority: "URGENT", daysDue: 20 },
      { name: "Pay corresponding VAT due",          description: "Process payment through AAB or online banking and secure payment confirmation.", subtaskOrder: 6, priority: "URGENT", daysDue: 20 },
      { name: "Archive confirmation and receipt",   description: "Save eFiling confirmation and payment receipt in client records.", subtaskOrder: 7, priority: "NORMAL", daysDue: 21 },
    ],
  },
  {
    name: "Mayor's Permit Renewal",
    description: "Annual renewal of the Local Government Unit (LGU) Business Permit / Mayor's Permit.",
    deptName: "Liaison",
    daysDue: 15,
    subtasks: [
      { name: "Gather renewal requirements",     description: "Collect previous year's permit, barangay clearance, and supporting documents required by the LGU.", subtaskOrder: 1, priority: "HIGH",   daysDue: 2  },
      { name: "Secure barangay clearance",       description: "Obtain updated Barangay Business Clearance from the client's barangay hall.", subtaskOrder: 2, priority: "HIGH",   daysDue: 5  },
      { name: "Submit application to City Hall", description: "File renewal application with all required documents at the BPLO.", subtaskOrder: 3, priority: "URGENT", daysDue: 8  },
      { name: "Pay renewal fees",                description: "Pay all assessed fees including business tax, regulatory fees, and miscellaneous charges.", subtaskOrder: 4, priority: "URGENT", daysDue: 8  },
      { name: "Claim renewed Mayor's Permit",    description: "Pick up the renewed Mayor's Permit / Business Permit certificate from the BPLO.", subtaskOrder: 5, priority: "NORMAL", daysDue: 14 },
      { name: "File and deliver to client",      description: "Scan the permit, archive in client records, and deliver the original to the client.", subtaskOrder: 6, priority: "NORMAL", daysDue: 15 },
    ],
  },
];

/* ─── Service Inclusions ──────────────────────────────────────────── */

const SERVICE_INCLUSIONS = [
  { name: "BIR Monthly VAT Filing (2550M)",   category: "Tax Filing",   description: "Monthly filing of BIR Form 2550M VAT declaration" },
  { name: "BIR Quarterly Income Tax (1701Q)", category: "Tax Filing",   description: "Quarterly filing of BIR Form 1701Q income tax return" },
  { name: "BIR Withholding Tax (1601C)",      category: "Tax Filing",   description: "Monthly filing of BIR Form 1601C expanded withholding tax" },
  { name: "Bookkeeping",                      category: "Accounting",   description: "Monthly recording and reconciliation of financial transactions" },
  { name: "Payroll Processing",               category: "Payroll",      description: "Computation and preparation of employee payroll" },
  { name: "Government Remittances",           category: "Compliance",   description: "Monthly SSS, PhilHealth, and Pag-IBIG contribution remittances" },
  { name: "BIR TIN Registration",             category: "Registration", description: "TIN application and Certificate of Registration processing" },
  { name: "Business Permit Renewal",          category: "Licensing",    description: "Annual Mayor's Permit / LGU Business Permit renewal" },
];

/* ─── Work Schedules ─────────────────────────────────────────────── */

const WORK_SCHEDULES = [
  {
    name: "Standard Office Hours",
    timezone: "Asia/Manila",
    // dayOfWeek: 0 = Sunday … 6 = Saturday
    days: [
      { dayOfWeek: 0, isWorkingDay: false, startTime: "08:00", endTime: "17:00", breakStart: null, breakEnd: null },
      { dayOfWeek: 1, isWorkingDay: true,  startTime: "08:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00" },
      { dayOfWeek: 2, isWorkingDay: true,  startTime: "08:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00" },
      { dayOfWeek: 3, isWorkingDay: true,  startTime: "08:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00" },
      { dayOfWeek: 4, isWorkingDay: true,  startTime: "08:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00" },
      { dayOfWeek: 5, isWorkingDay: true,  startTime: "08:00", endTime: "17:00", breakStart: "12:00", breakEnd: "13:00" },
      { dayOfWeek: 6, isWorkingDay: false, startTime: "08:00", endTime: "17:00", breakStart: null, breakEnd: null },
    ],
  },
];

/* ─── Payroll Schedules ───────────────────────────────────────────── */

const PAYROLL_SCHEDULE_SEEDS = [
  {
    name: "Semi-Monthly (1st–15th / 16th–EOM)",
    frequency: "TWICE_A_MONTH" as const,
    firstPeriodStartDay: 1,
    firstPeriodEndDay: 15,
    firstPayoutDay: 20,
    secondPeriodStartDay: 16,
    secondPeriodEndDay: 31, // Use 31 to represent End-of-Month
    secondPayoutDay: 5,
    isActive: true,
  },
];

/* ─── Leave Types ─────────────────────────────────────────────────── */

const LEAVE_TYPE_SEEDS = [
  {
    name: "Service Incentive Leave",
    isPaid: true,
    defaultDays: 5,
    carryOverLimit: 5,
    resetMonth: 1,
    resetDay: 1,
  },
];

async function main(): Promise<void> {
  // ── 1. Seed Company (Agila — the internal company) ───────────────
  const atmsClient = await prisma.client.upsert({
    where: { companyCode: "ATMS-001" },
    update: {
      active: true,
      businessName: "Agila Tax Management Services",
      portalName: "Agila Tax Management Services",
      businessEntity: "SOLE_PROPRIETORSHIP",
      branchType: "MAIN",
    },
    create: {
      companyCode: "ATMS-001",
      clientNo: "2023-1001",
      active: true,
      businessEntity: "SOLE_PROPRIETORSHIP",
      businessName: "Agila Tax Management Services",
      portalName: "Agila Tax Management Services",
      branchType: "MAIN",
    },
  });

  // Seed the normalized 1-to-1 tax models for ATMS
  await prisma.birInformation.upsert({
      where: { clientId: atmsClient.id },
      update: {},
      create: {
          clientId: atmsClient.id,
          tin: "123-456-789-000",
          rdoCode: "082",
          registeredAddress: "Cebu City, Philippines",
          zipCode: "6000"
      }
  });

  await prisma.businessOperations.upsert({
      where: { clientId: atmsClient.id },
      update: {},
      create: {
          clientId: atmsClient.id,
          tradeName: "Agila Tax Management Services",
          placeType: "RENTED"
      }
  });

  console.log("  ✓ Company (Agila Tax Management Services) seeded with BIR Profile");

  // ── 2. Seed Portal Apps ──────────────────────────────────────────
  for (const app of PORTAL_APPS) {
    await prisma.app.upsert({
      where: { name: app.name },
      update: { label: app.label },
      create: { name: app.name, label: app.label },
    });
  }
  console.log(`  ✓ ${PORTAL_APPS.length} portal apps seeded`);

  // ── 4. Seed Employee Levels (scoped to ATMS client) ───────────────
  for (const level of EMPLOYEE_LEVELS) {
    await prisma.employeeLevel.upsert({
      where: { clientId_name: { clientId: atmsClient.id, name: level.name } },
      update: { position: level.position, description: level.description },
      create: { clientId: atmsClient.id, ...level },
    });
  }
  const allLevels = await prisma.employeeLevel.findMany({
    where: { clientId: atmsClient.id },
  });
  const levelsByName = new Map(allLevels.map((l) => [l.name, l.id]));
  console.log(`  ✓ ${EMPLOYEE_LEVELS.length} employee levels seeded (ATMS client)`);

  // ── 5a. Seed Standalone Departments & Positions ─────────────────
  //  These departments are seeded before internal users so they exist
  //  in the system regardless of which employees are currently seeded.

  let standaloneDeptCount = 0;
  let standalonePositionCount = 0;
  for (const dept of STANDALONE_DEPARTMENTS) {
    const deptRecord = await prisma.department.upsert({
      where: { clientId_name: { clientId: atmsClient.id, name: dept.name } },
      update: { description: dept.description },
      create: { clientId: atmsClient.id, name: dept.name, description: dept.description },
    });
    standaloneDeptCount++;
    for (const pos of dept.positions) {
      const existing = await prisma.position.findFirst({
        where: { departmentId: deptRecord.id, title: pos.title },
      });
      if (!existing) {
        await prisma.position.create({
          data: { title: pos.title, description: pos.description, departmentId: deptRecord.id },
        });
      }
      standalonePositionCount++;
    }
  }
  console.log(`  ✓ ${standaloneDeptCount} standalone departments and ${standalonePositionCount} positions seeded`);

  // ── 5b. Seed Departments, Positions & Internal Users ─────────────
  //  Each internal user's department is upserted before creating the user
  //  so that we can pass the correct departmentId, positionId, and levelId.

  console.log("\n  Seeding internal users (all linked to ATMS client):\n");

  for (const seed of INTERNAL_USERS) {
    const dept = await prisma.department.upsert({
      where: {
        clientId_name: { clientId: atmsClient.id, name: seed.department },
      },
      update: {},
      create: {
        clientId: atmsClient.id,
        name: seed.department,
        description: seed.departmentDescription,
      },
    });

    // Find existing position by title + department, or create it
    let position = await prisma.position.findFirst({
      where: { departmentId: dept.id, title: seed.positionTitle },
    });
    if (!position) {
      position = await prisma.position.create({
        data: {
          title: seed.positionTitle,
          description: seed.positionDescription,
          departmentId: dept.id,
        },
      });
    }

    const employeeLevelId = levelsByName.get(seed.employeeLevel) ?? null;
    await seedInternalUser(seed, atmsClient.id, dept.id, position.id, employeeLevelId);
  }

  console.log("\n  Internal user credentials:");
  console.log("  ─────────────────────────────────────────────────────");
  for (const u of INTERNAL_USERS) {
    console.log(`  [${u.role.padEnd(11)}]  ${u.email.padEnd(28)}  ${u.password}`);
  }
  console.log("  ─────────────────────────────────────────────────────\n");

  // ── 6. Seed External Client Companies ─────────────────────────────
  for (const c of CLIENT_COMPANIES) {
    const externalClient = await prisma.client.upsert({
      where: { companyCode: c.companyCode },
      update: {
        active: true,
        businessName: c.businessName,
        portalName: c.portalName,
        businessEntity: c.businessEntity,
        branchType: c.branchType,
      },
      create: {
        companyCode: c.companyCode,
        clientNo: c.clientNo,
        active: true,
        businessEntity: c.businessEntity,
        businessName: c.businessName,
        portalName: c.portalName,
        branchType: c.branchType,
      },
    });

    // Seed the external client's normalized tax models
    await prisma.birInformation.upsert({
        where: { clientId: externalClient.id },
        update: {},
        create: {
            clientId: externalClient.id,
            tin: c.tin,
            rdoCode: c.rdoCode,
            registeredAddress: c.registeredAddress,
            zipCode: c.zipCode
        }
    });
  }
  console.log(`  ✓ ${CLIENT_COMPANIES.length} client company/companies seeded`);

  // ── 7. Seed Client Users ─────────────────────────────────────────

  console.log("  Seeding client portal users:\n");

  for (const seed of CLIENT_USERS) {
    const client = await prisma.client.findUnique({
      where: { companyCode: seed.companyCode },
    });
    if (!client) {
      console.warn(`  ⚠ Client with companyCode "${seed.companyCode}" not found — skipping ${seed.email}`);
      continue;
    }
    await seedClientUser(seed, client.id);
  }

  console.log("\n  Client portal credentials:");
  console.log("  ─────────────────────────────────────────────────────");
  for (const u of CLIENT_USERS) {
    console.log(`  [CLIENT     ]  ${u.email.padEnd(28)}  ${u.password}`);
  }
  console.log("  ─────────────────────────────────────────────────────\n");

  // ── 8. Seed Government Offices & Cities ───────────────────────────
  for (const office of GOVERNMENT_OFFICES) {
    await prisma.governmentOffice.upsert({
      where: { code: office.code },
      update: { name: office.name, description: office.description, isActive: true },
      create: { ...office, isActive: true },
    });
  }

  for (const city of CITIES) {
    await prisma.city.upsert({
      where: { name: city.name },
      update: { province: city.province, region: city.region, zipCode: city.zipCode },
      create: city,
    });
  }
  console.log(`  ✓ Reference tables (Gov Offices, Cities) seeded`);

  // ── 9. Seed Lead Pipeline Statuses ────────────────────────────────
  const LEAD_STATUSES = [
    { name: "New",                  color: "#3b82f6", sequence: 1,  isDefault: true,  isOnboarding: false, isConverted: false },
    { name: "Contacted",            color: "#0ea5e9", sequence: 2,  isDefault: false, isOnboarding: false, isConverted: false },
    { name: "Qualified",            color: "#10b981", sequence: 3,  isDefault: false, isOnboarding: false, isConverted: false },
    { name: "Proposal",             color: "#f59e0b", sequence: 4,  isDefault: false, isOnboarding: false, isConverted: false },
    { name: "Negotiation",          color: "#f97316", sequence: 5,  isDefault: false, isOnboarding: false, isConverted: false },
    { name: "Closed Won",           color: "#16a34a", sequence: 6,  isDefault: false, isOnboarding: false, isConverted: false },
    { name: "Account Creation",     color: "#8b5cf6", sequence: 7,  isDefault: false, isOnboarding: true,  isConverted: false },
    { name: "Contract Signing",     color: "#6366f1", sequence: 8,  isDefault: false, isOnboarding: true,  isConverted: false },
    { name: "Waiting for Payment",  color: "#eab308", sequence: 9,  isDefault: false, isOnboarding: true,  isConverted: false },
    { name: "Job Order",            color: "#f97316", sequence: 10, isDefault: false, isOnboarding: true,  isConverted: false },
    { name: "Turn Over",            color: "#0d9488", sequence: 11, isDefault: false, isOnboarding: false, isConverted: true  },
    { name: "Lost",                 color: "#ef4444", sequence: 12, isDefault: false, isOnboarding: false, isConverted: false },
  ];

  for (const status of LEAD_STATUSES) {
    const existing = await prisma.leadStatus.findFirst({ where: { name: status.name } });
    if (existing) {
      await prisma.leadStatus.update({
        where: { id: existing.id },
        data: { color: status.color, sequence: status.sequence, isDefault: status.isDefault, isOnboarding: status.isOnboarding, isConverted: status.isConverted },
      });
    } else {
      await prisma.leadStatus.create({ data: status });
    }
  }
  console.log(`  ✓ ${LEAD_STATUSES.length} lead pipeline statuses seeded`);

  // ── 10.5. Seed Department Task Statuses ──────────────────────────
  const allDepts = await prisma.department.findMany({
    where: { clientId: atmsClient.id },
    select: { id: true, name: true },
  });

  let statusCreatedCount = 0;
  for (const dept of allDepts) {
    const statuses = DEPT_TASK_STATUSES[dept.name] ?? DEFAULT_TASK_STATUSES;
    for (const s of statuses) {
      await prisma.departmentTaskStatus.upsert({
        where: { departmentId_name: { departmentId: dept.id, name: s.name } },
        update: { color: s.color, statusOrder: s.statusOrder, isEntryStep: s.isEntryStep, isExitStep: s.isExitStep },
        create: { departmentId: dept.id, ...s },
      });
      statusCreatedCount++;
    }
  }
  console.log(`  ✓ Department task statuses seeded (${statusCreatedCount} across ${allDepts.length} departments)`);

  // ── 10.6. Seed Task Templates & Subtasks ─────────────────────────
  let templateCount = 0;
  for (const tmpl of TASK_TEMPLATES) {
    const dept = allDepts.find((d) => d.name === tmpl.deptName);
    if (!dept) continue;

    let template = await prisma.taskTemplate.findFirst({
      where: { name: tmpl.name },
    });

    if (!template) {
      template = await prisma.taskTemplate.create({
        data: {
          name: tmpl.name,
          description: tmpl.description,
          daysDue: tmpl.daysDue,
        },
      });
      templateCount++;
    } else {
      await prisma.taskTemplate.update({
        where: { id: template.id },
        data: { description: tmpl.description, daysDue: tmpl.daysDue },
      });
    }

    // Upsert the department route for this template
    let route = await prisma.taskTemplateRoute.findUnique({
      where: { templateId_departmentId: { templateId: template.id, departmentId: dept.id } },
    });
    if (!route) {
      route = await prisma.taskTemplateRoute.create({
        data: {
          templateId: template.id,
          departmentId: dept.id,
          routeOrder: 1,
          daysDue: tmpl.daysDue,
        },
      });
    }

    for (const sub of tmpl.subtasks) {
      const existingSub = await prisma.taskTemplateSubtask.findFirst({
        where: { routeId: route.id, name: sub.name },
      });
      if (!existingSub) {
        await prisma.taskTemplateSubtask.create({
          data: { routeId: route.id, ...sub },
        });
      } else {
        await prisma.taskTemplateSubtask.update({
          where: { id: existingSub.id },
          data: { subtaskOrder: sub.subtaskOrder, priority: sub.priority, daysDue: sub.daysDue },
        });
      }
    }
  }
  console.log(`  ✓ ${templateCount} task templates seeded with subtasks`);

  // ── 10.7. Seed Service Inclusions, Service Plan & One-Time Service ─
  for (const inc of SERVICE_INCLUSIONS) {
    await prisma.serviceInclusion.upsert({
      where: { name: inc.name },
      update: { category: inc.category, description: inc.description },
      create: inc,
    });
  }
  console.log(`  ✓ ${SERVICE_INCLUSIONS.length} service inclusions seeded`);

  const birOffice      = await prisma.governmentOffice.findUnique({ where: { code: "BIR" } });
  const mayorOffice    = await prisma.governmentOffice.findUnique({ where: { code: "MAYOR" } });
  const cebuCity       = await prisma.city.findUnique({ where: { name: "Cebu City" } });

  const vatTemplate    = await prisma.taskTemplate.findFirst({ where: { name: "BIR 2550M – Monthly VAT Return" } });
  const tinTemplate    = await prisma.taskTemplate.findFirst({ where: { name: "BIR TIN Registration – New Business" } });
  const permitTemplate = await prisma.taskTemplate.findFirst({ where: { name: "Mayor's Permit Renewal" } });

  // ── 1. RECURRING COMPLIANCE SERVICE: Expanded Withholding Tax & VAT
  const ewtService = await prisma.service.upsert({
    where: { code: "TAX-EWT-MO" },
    update: {},
    create: {
      code: "TAX-EWT-MO",
      name: "Expanded Withholding Tax & VAT Filing",
      description: "Monthly preparation and filing of EWT (1601-C/0619-E) and VAT (2550M) returns. Includes automated maker-checker workflows.",
      billingType: "RECURRING",
      frequency: "MONTHLY",
      serviceRate: 3500,
      isVatable: true,
      status: "ACTIVE",
      taskTemplates: vatTemplate ? { create: [{ taskTemplateId: vatTemplate.id }] } : undefined,
      governmentOffices: birOffice ? { connect: [{ id: birOffice.id }] } : undefined,
      cities: cebuCity ? { connect: [{ id: cebuCity.id }] } : undefined,
      inclusions: {
        connect: [
          { name: "BIR Monthly VAT Filing (2550M)" },
          { name: "BIR Withholding Tax (1601C)" },
        ],
      },
    },
  });
  console.log("  ✓ Recurring Service 'Expanded Withholding Tax & VAT' seeded");

  // ── 2. ONE-TIME SERVICE: BIR TIN Registration
  const birRegService = await prisma.service.upsert({
    where: { code: "REG-BIR-NEW" },
    update: {},
    create: {
      code: "REG-BIR-NEW",
      name: "BIR TIN Registration (New Business)",
      description: "End-to-end processing of BIR TIN application and Certificate of Registration (COR) for newly registered businesses.",
      billingType: "ONE_TIME",
      frequency: "NONE",
      serviceRate: 1500,
      isVatable: true,
      status: "ACTIVE",
      taskTemplates: tinTemplate ? { create: [{ taskTemplateId: tinTemplate.id }] } : undefined,
      governmentOffices: birOffice ? { connect: [{ id: birOffice.id }] } : undefined,
      cities: cebuCity ? { connect: [{ id: cebuCity.id }] } : undefined,
      inclusions: { connect: [{ name: "BIR TIN Registration" }] },
    },
  });
  console.log("  ✓ One-time service 'BIR TIN Registration' seeded");

  // ── 3. ONE-TIME SERVICE: Mayor's Permit Renewal
  await prisma.service.upsert({
    where: { code: "REG-LGU-REN" },
    update: {},
    create: {
      code: "REG-LGU-REN",
      name: "Mayor's Permit Renewal",
      description: "Annual renewal of the LGU Business Permit / Mayor's Permit.",
      billingType: "ONE_TIME",
      frequency: "NONE",
      serviceRate: 1200,
      isVatable: true,
      status: "ACTIVE",
      taskTemplates: permitTemplate ? { create: [{ taskTemplateId: permitTemplate.id }] } : undefined,
      governmentOffices: mayorOffice ? { connect: [{ id: mayorOffice.id }] } : undefined,
      cities: cebuCity ? { connect: [{ id: cebuCity.id }] } : undefined,
      inclusions: { connect: [{ name: "Business Permit Renewal" }] },
    },
  });
  console.log("  ✓ One-time service 'Mayor's Permit Renewal' seeded");

  // ── 4. SERVICE PACKAGE: Business Starter Kit (Bundle)
  await prisma.servicePackage.upsert({
    where: { code: "PKG-STARTER" },
    update: {},
    create: {
      code: "PKG-STARTER",
      name: "Business Starter Kit",
      description: "Complete compliance setup for new businesses: BIR Registration + 1st Month EWT/VAT Filing.",
      packageRate: 4500,
      isVatable: true,
      status: "ACTIVE",
      items: {
        create: [
          { serviceId: birRegService.id, quantity: 1, overrideRate: 1500 },
          { serviceId: ewtService.id,    quantity: 1, overrideRate: 3000 },
        ],
      },
    },
  });
  console.log("  ✓ Service Package 'Business Starter Kit' seeded");

  // ── 10.8. Seed Sample Leads (Pipeline Demo) ──────────────────────
  {
    const ewtSvc    = await prisma.service.findUnique({ where: { code: "TAX-EWT-MO" } });
    const birRegSvc = await prisma.service.findUnique({ where: { code: "REG-BIR-NEW" } });
    const sAdmin    = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });

    const [
      statusNew, statusProposal, statusNegotiation,
      statusContractSigning, statusWaitingPayment, statusAccountCreation,
    ] = await Promise.all([
      prisma.leadStatus.findFirst({ where: { name: "New" } }),
      prisma.leadStatus.findFirst({ where: { name: "Proposal" } }),
      prisma.leadStatus.findFirst({ where: { name: "Negotiation" } }),
      prisma.leadStatus.findFirst({ where: { name: "Contract Signing" } }),
      prisma.leadStatus.findFirst({ where: { name: "Waiting for Payment" } }),
      prisma.leadStatus.findFirst({ where: { name: "Account Creation" } }),
    ]);

    if (
      !ewtSvc || !birRegSvc ||
      !statusNew || !statusProposal || !statusNegotiation ||
      !statusContractSigning || !statusWaitingPayment || !statusAccountCreation
    ) {
      console.warn("  ⚠ Skipping sample leads — required statuses or services not found");
    } else {
      let leadCount = 0;

      // ── Lead 1: Roberto Villanueva — bare lead (New) ──────────────
      const exists1 = await prisma.lead.findFirst({ where: { firstName: "Roberto", lastName: "Villanueva" } });
      if (!exists1) {
        await prisma.lead.create({
          data: {
            firstName: "Roberto",
            lastName: "Villanueva",
            contactNumber: "09171234567",
            businessType: "Sole Proprietorship",
            leadSource: "Walk-in",
            statusId: statusNew.id,
          },
        });
        leadCount++;
      }

      // ── Lead 2: Patricia Lim — draft quote (Proposal) ─────────────
      let lead2 = await prisma.lead.findFirst({ where: { firstName: "Patricia", lastName: "Lim" } });
      if (!lead2) {
        lead2 = await prisma.lead.create({
          data: {
            firstName: "Patricia",
            lastName: "Lim",
            contactNumber: "09189876543",
            businessType: "Corporation",
            leadSource: "Referral",
            statusId: statusProposal.id,
          },
        });
        leadCount++;
      }
      const existsQ1 = await prisma.quote.findFirst({ where: { quoteNumber: "QT-2026-0001" } });
      if (!existsQ1) {
        await prisma.quote.create({
          data: {
            quoteNumber: "QT-2026-0001",
            leadId: lead2.id,
            status: "DRAFT",
            subTotal: 3500,
            totalDiscount: 0,
            grandTotal: 3920,
            lineItems: {
              create: [{ serviceId: ewtSvc.id, quantity: 1, negotiatedRate: 3500, isVatable: true }],
            },
          },
        });
      }

      // ── Lead 3: Miguel Santos — negotiating quote (Negotiation) ───
      let lead3 = await prisma.lead.findFirst({ where: { firstName: "Miguel", lastName: "Santos" } });
      if (!lead3) {
        lead3 = await prisma.lead.create({
          data: {
            firstName: "Miguel",
            lastName: "Santos",
            contactNumber: "09207654321",
            businessType: "Sole Proprietorship",
            leadSource: "Facebook",
            statusId: statusNegotiation.id,
          },
        });
        leadCount++;
      }
      const existsQ2 = await prisma.quote.findFirst({ where: { quoteNumber: "QT-2026-0002" } });
      if (!existsQ2) {
        await prisma.quote.create({
          data: {
            quoteNumber: "QT-2026-0002",
            leadId: lead3.id,
            status: "NEGOTIATING",
            subTotal: 4500,
            totalDiscount: 0,
            grandTotal: 5040,
            lineItems: {
              create: [
                { serviceId: birRegSvc.id, quantity: 1, negotiatedRate: 1500, isVatable: true },
                { serviceId: ewtSvc.id,    quantity: 1, negotiatedRate: 3000, isVatable: true },
              ],
            },
          },
        });
      }

      // ── Lead 4: Grace Reyes — accepted quote + TSA pending (Contract Signing) ──
      let lead4 = await prisma.lead.findFirst({ where: { firstName: "Grace", lastName: "Reyes" } });
      if (!lead4) {
        lead4 = await prisma.lead.create({
          data: {
            firstName: "Grace",
            lastName: "Reyes",
            contactNumber: "09351234567",
            businessType: "Professional",
            leadSource: "Referral",
            statusId: statusContractSigning.id,
          },
        });
        leadCount++;
      }
      let quote4 = await prisma.quote.findFirst({ where: { quoteNumber: "QT-2026-0003" } });
      if (!quote4) {
        quote4 = await prisma.quote.create({
          data: {
            quoteNumber: "QT-2026-0003",
            leadId: lead4.id,
            status: "ACCEPTED",
            subTotal: 5000,
            totalDiscount: 0,
            grandTotal: 5600,
            lineItems: {
              create: [
                { serviceId: ewtSvc.id,    quantity: 1, negotiatedRate: 3500, isVatable: true },
                { serviceId: birRegSvc.id, quantity: 1, negotiatedRate: 1500, isVatable: true },
              ],
            },
          },
        });
      }
      const existsTSA1 = await prisma.tsaContract.findFirst({ where: { referenceNumber: "TSA-2026-0001" } });
      if (!existsTSA1) {
        await prisma.tsaContract.create({
          data: {
            referenceNumber: "TSA-2026-0001",
            leadId: lead4.id,
            quoteId: quote4.id,
            status: "PENDING_APPROVAL",
            documentDate: new Date("2026-04-01"),
            businessName: "Reyes Consulting Services",
            authorizedRep: "Grace T. Reyes",
            isBusinessRegistered: true,
            preparedById: sAdmin?.id,
          },
        });
      }

      // ── Lead 5: Danilo Cruz — signed TSA + unpaid invoice (Waiting for Payment) ──
      let lead5 = await prisma.lead.findFirst({ where: { firstName: "Danilo", lastName: "Cruz" } });
      if (!lead5) {
        lead5 = await prisma.lead.create({
          data: {
            firstName: "Danilo",
            lastName: "Cruz",
            contactNumber: "09178885566",
            businessType: "Sole Proprietorship",
            leadSource: "Walk-in",
            statusId: statusWaitingPayment.id,
            isSignedTSA: true,
            isCreatedInvoice: true,
          },
        });
        leadCount++;
      }
      let quote5 = await prisma.quote.findFirst({ where: { quoteNumber: "QT-2026-0004" } });
      if (!quote5) {
        quote5 = await prisma.quote.create({
          data: {
            quoteNumber: "QT-2026-0004",
            leadId: lead5.id,
            status: "ACCEPTED",
            subTotal: 3500,
            totalDiscount: 0,
            grandTotal: 3920,
            lineItems: {
              create: [{ serviceId: ewtSvc.id, quantity: 1, negotiatedRate: 3500, isVatable: true }],
            },
          },
        });
      }
      const existsTSA2 = await prisma.tsaContract.findFirst({ where: { referenceNumber: "TSA-2026-0002" } });
      if (!existsTSA2) {
        await prisma.tsaContract.create({
          data: {
            referenceNumber: "TSA-2026-0002",
            leadId: lead5.id,
            quoteId: quote5.id,
            status: "SIGNED",
            documentDate: new Date("2026-04-02"),
            businessName: "Cruz General Services",
            authorizedRep: "Danilo P. Cruz",
            isBusinessRegistered: false,
            preparedById: sAdmin?.id,
            actualApproverId: sAdmin?.id,
            clientSignedAt: new Date("2026-04-03"),
          },
        });
      }
      const existsINV1 = await prisma.invoice.findFirst({ where: { invoiceNumber: "INV-2026-0001" } });
      if (!existsINV1) {
        await prisma.invoice.create({
          data: {
            invoiceNumber: "INV-2026-0001",
            leadId: lead5.id,
            status: "UNPAID",
            dueDate: new Date("2026-04-18"),
            subTotal: 3500,
            taxAmount: 420,
            discountAmount: 0,
            totalAmount: 3920,
            balanceDue: 3920,
            terms: "Net 14",
            items: {
              create: [{
                description: "Expanded Withholding Tax & VAT Filing",
                quantity: 1,
                unitPrice: 3500,
                total: 3500,
                isVatable: true,
              }],
            },
          },
        });
      }

      // ── Lead 6: Elena Fernandez — paid invoice + onboarding (Account Creation) ──
      let lead6 = await prisma.lead.findFirst({ where: { firstName: "Elena", lastName: "Fernandez" } });
      if (!lead6) {
        lead6 = await prisma.lead.create({
          data: {
            firstName: "Elena",
            lastName: "Fernandez",
            contactNumber: "09199998877",
            businessType: "Corporation",
            leadSource: "Referral",
            statusId: statusAccountCreation.id,
            isSignedTSA: true,
            isCreatedInvoice: true,
            isAccountCreated: true,
          },
        });
        leadCount++;
      }
      let quote6 = await prisma.quote.findFirst({ where: { quoteNumber: "QT-2026-0005" } });
      if (!quote6) {
        quote6 = await prisma.quote.create({
          data: {
            quoteNumber: "QT-2026-0005",
            leadId: lead6.id,
            status: "ACCEPTED",
            subTotal: 5000,
            totalDiscount: 0,
            grandTotal: 5600,
            lineItems: {
              create: [
                { serviceId: birRegSvc.id, quantity: 1, negotiatedRate: 1500, isVatable: true },
                { serviceId: ewtSvc.id,    quantity: 1, negotiatedRate: 3500, isVatable: true },
              ],
            },
          },
        });
      }
      const existsTSA3 = await prisma.tsaContract.findFirst({ where: { referenceNumber: "TSA-2026-0003" } });
      if (!existsTSA3) {
        await prisma.tsaContract.create({
          data: {
            referenceNumber: "TSA-2026-0003",
            leadId: lead6.id,
            quoteId: quote6.id,
            status: "SIGNED",
            documentDate: new Date("2026-04-03"),
            businessName: "Fernandez Accounting Services",
            authorizedRep: "Elena M. Fernandez",
            isBusinessRegistered: true,
            preparedById: sAdmin?.id,
            actualApproverId: sAdmin?.id,
            clientSignedAt: new Date("2026-04-04"),
          },
        });
      }
      const existsINV2 = await prisma.invoice.findFirst({ where: { invoiceNumber: "INV-2026-0002" } });
      if (!existsINV2) {
        await prisma.invoice.create({
          data: {
            invoiceNumber: "INV-2026-0002",
            leadId: lead6.id,
            status: "PAID",
            dueDate: new Date("2026-04-10"),
            subTotal: 5000,
            taxAmount: 600,
            discountAmount: 0,
            totalAmount: 5600,
            balanceDue: 0,
            terms: "Net 7",
            items: {
              create: [
                { description: "BIR TIN Registration (New Business)",          quantity: 1, unitPrice: 1500, total: 1500, isVatable: true },
                { description: "Expanded Withholding Tax & VAT Filing", quantity: 1, unitPrice: 3500, total: 3500, isVatable: true },
              ],
            },
          },
        });
      }

      console.log(`  ✓ ${leadCount} sample lead(s) seeded (pipeline demo)`);
    }
  }

  // ── 11. Seed Sample Tasks ─────────────────────────────────────────
  const superAdminUser = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
  const superAdminEmployee = superAdminUser
    ? await prisma.employee.findFirst({ where: { userId: superAdminUser.id } })
    : null;

  const DEPT_TASK_SEEDS: Array<{
    deptName: string;
    tasks: Array<{ name: string; description: string; priority: "LOW" | "NORMAL" | "HIGH" | "URGENT"; daysFromNow: number }>;
  }> = [
    {
      deptName: "Compliance",
      tasks: [
        { name: "BIR 2550M VAT Filing – March 2026", description: "File monthly VAT return (BIR Form 2550M) for March 2026. Deadline is 20th day of the following month.", priority: "HIGH", daysFromNow: 26 },
        { name: "BIR 1701Q Q1 2026 Filing", description: "Prepare and file the BIR 1701Q quarterly income tax return for Q1 2026. Reconcile books with CAS before submission.", priority: "URGENT", daysFromNow: 21 },
      ],
    },
    {
      deptName: "Liaison",
      tasks: [
        { name: "Mayor's Permit Renewal – Cebu City LGU", description: "Follow up on Mayor's Permit renewal at City Hall. Bring OR from initial payment and all supporting documents.", priority: "URGENT", daysFromNow: 4 },
        { name: "BIR TIN Registration – New Client Onboarding", description: "Process TIN registration for newly onboarded client. Prepare all required BIR documents before submission to the RDO.", priority: "HIGH", daysFromNow: 5 },
      ],
    },
  ];

  let taskCount = 0;
  const now = new Date();

  for (const group of DEPT_TASK_SEEDS) {
    const dept = await prisma.department.findFirst({
      where: { clientId: atmsClient.id, name: group.deptName },
    });
    if (!dept) continue;

    const entryStatus = await prisma.departmentTaskStatus.findFirst({
      where: { departmentId: dept.id, isEntryStep: true },
      orderBy: { statusOrder: "asc" },
    });

    for (const t of group.tasks) {
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + t.daysFromNow);

      const existing = await prisma.task.findFirst({
        where: { name: t.name, departmentId: dept.id },
      });
      if (existing) continue;

      const task = await prisma.task.create({
        data: {
          name: t.name,
          description: t.description,
          priority: t.priority,
          departmentId: dept.id,
          statusId: entryStatus?.id ?? null,
          assignedToId: superAdminEmployee?.id ?? null,
          dueDate,
        },
      });

      if (superAdminUser) {
        await prisma.taskHistory.create({
          data: {
            taskId: task.id,
            actorId: superAdminUser.id,
            changeType: "CREATED",
            newValue: t.name,
          },
        });
      }

      taskCount++;
    }
  }
  console.log(`  ✓ ${taskCount} sample tasks seeded across departments`);

  // ── 12. Seed Work Schedule ─────────────────────────────────────────
  for (const ws of WORK_SCHEDULES) {
    const existing = await prisma.workSchedule.findFirst({
      where: { clientId: atmsClient.id, name: ws.name },
    });
    if (!existing) {
      await prisma.workSchedule.create({
        data: {
          clientId: atmsClient.id,
          name: ws.name,
          timezone: ws.timezone,
          days: {
            create: ws.days.map((d) => ({
              dayOfWeek: d.dayOfWeek,
              isWorkingDay: d.isWorkingDay,
              startTime: d.startTime,
              endTime: d.endTime,
              breakStart: d.breakStart ?? undefined,
              breakEnd: d.breakEnd ?? undefined,
            })),
          },
        },
      });
      console.log(`  ✓ Work schedule '${ws.name}' seeded`);
    } else {
      console.log(`  · Work schedule '${ws.name}' already exists — skipped`);
    }
  }

  // ── 13. Seed Payroll Schedule ──────────────────────────────────────
  for (const ps of PAYROLL_SCHEDULE_SEEDS) {
    const existing = await prisma.payrollSchedule.findFirst({
      where: { clientId: atmsClient.id, name: ps.name },
    });
    if (!existing) {
      await prisma.payrollSchedule.create({
        data: { clientId: atmsClient.id, ...ps },
      });
      console.log(`  ✓ Payroll schedule '${ps.name}' seeded`);
    } else {
      console.log(`  · Payroll schedule '${ps.name}' already exists — skipped`);
    }
  }

  // ── 14. Seed Leave Types ───────────────────────────────────────────
  for (const lt of LEAVE_TYPE_SEEDS) {
    await prisma.leaveType.upsert({
      where: { clientId_name: { clientId: atmsClient.id, name: lt.name } },
      update: { isPaid: lt.isPaid, defaultDays: lt.defaultDays, carryOverLimit: lt.carryOverLimit, resetMonth: lt.resetMonth, resetDay: lt.resetDay },
      create: { clientId: atmsClient.id, ...lt },
    });
  }
  console.log(`  ✓ ${LEAVE_TYPE_SEEDS.length} leave type(s) seeded`);

  // ── 15. Seed 2026 Philippine + Cebu Local Holidays ────────────────
  const HOLIDAY_SEEDS = [
    // ── Regular Holidays (Art. 94, Labor Code) ──
    { name: "New Year's Day",        date: new Date('2026-01-01'), type: 'REGULAR' as const },
    { name: 'Araw ng Kagitingan',    date: new Date('2026-04-09'), type: 'REGULAR' as const },
    { name: 'Maundy Thursday',       date: new Date('2026-04-02'), type: 'REGULAR' as const },
    { name: 'Good Friday',           date: new Date('2026-04-03'), type: 'REGULAR' as const },
    { name: 'Labor Day',             date: new Date('2026-05-01'), type: 'REGULAR' as const },
    { name: 'Independence Day',      date: new Date('2026-06-12'), type: 'REGULAR' as const },
    { name: 'National Heroes Day',   date: new Date('2026-08-31'), type: 'REGULAR' as const },
    { name: 'Bonifacio Day',         date: new Date('2026-11-30'), type: 'REGULAR' as const },
    { name: 'Christmas Day',         date: new Date('2026-12-25'), type: 'REGULAR' as const },
    { name: 'Rizal Day',             date: new Date('2026-12-30'), type: 'REGULAR' as const },
    // ── Special Non-Working Holidays ──
    { name: 'Chinese New Year',               date: new Date('2026-02-17'), type: 'SPECIAL_NON_WORKING' as const },
    { name: 'EDSA People Power Anniversary',  date: new Date('2026-02-25'), type: 'SPECIAL_NON_WORKING' as const },
    { name: 'Black Saturday',                 date: new Date('2026-04-04'), type: 'SPECIAL_NON_WORKING' as const },
    { name: 'Ninoy Aquino Day',               date: new Date('2026-08-21'), type: 'SPECIAL_NON_WORKING' as const },
    { name: "All Saints' Day",                date: new Date('2026-11-01'), type: 'SPECIAL_NON_WORKING' as const },
    { name: "All Souls' Day",                 date: new Date('2026-11-02'), type: 'SPECIAL_NON_WORKING' as const },
    { name: 'Christmas Eve',                  date: new Date('2026-12-24'), type: 'SPECIAL_NON_WORKING' as const },
    { name: "New Year's Eve",                 date: new Date('2026-12-31'), type: 'SPECIAL_NON_WORKING' as const },
    // ── Cebu Local Holidays ──
    { name: 'Sinulog Festival',       date: new Date('2026-01-18'), type: 'LOCAL_HOLIDAY' as const },
    { name: 'Cebu City Charter Day',  date: new Date('2026-02-24'), type: 'LOCAL_HOLIDAY' as const },
  ];

  let holidayCount = 0;
  for (const h of HOLIDAY_SEEDS) {
    const exists = await prisma.holiday.findFirst({
      where: { clientId: atmsClient.id, date: h.date },
    });
    if (!exists) {
      await prisma.holiday.create({
        data: { clientId: atmsClient.id, name: h.name, date: h.date, type: h.type },
      });
      holidayCount++;
    }
  }
  console.log(`  ✓ ${holidayCount} holiday(s) seeded (${HOLIDAY_SEEDS.length - holidayCount} already existed)`);

  // ── 16. Seed Chart of Accounts (AccountType → AccountDetailType → GlAccount) ─

  // 16a. Account Types
  const AT_DEFS: Array<{ name: string; group: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'; normalBalance: 'DEBIT' | 'CREDIT' }> = [
    { name: 'Current Assets',          group: 'ASSET',     normalBalance: 'DEBIT'  },
    { name: 'Non-Current Assets',      group: 'ASSET',     normalBalance: 'DEBIT'  },
    { name: 'Current Liabilities',     group: 'LIABILITY', normalBalance: 'CREDIT' },
    { name: 'Non-Current Liabilities', group: 'LIABILITY', normalBalance: 'CREDIT' },
    { name: 'Equity',                  group: 'EQUITY',    normalBalance: 'CREDIT' },
    { name: 'Revenue',                 group: 'REVENUE',   normalBalance: 'CREDIT' },
    { name: 'Cost of Sales / Service', group: 'EXPENSE',   normalBalance: 'DEBIT'  },
    { name: 'Expenses',                group: 'EXPENSE',   normalBalance: 'DEBIT'  },
  ];

  for (const at of AT_DEFS) {
    await prisma.accountType.upsert({
      where: { name: at.name },
      update: { group: at.group, normalBalance: at.normalBalance },
      create: { name: at.name, group: at.group, normalBalance: at.normalBalance },
    });
  }
  console.log(`  ✓ ${AT_DEFS.length} account types seeded`);

  // 16b. Build a lookup: AccountType.name → id
  const allAccountTypes = await prisma.accountType.findMany({ select: { id: true, name: true } });
  const atById = new Map(allAccountTypes.map((a) => [a.name, a.id]));

  // 16c. Account Detail Types  (accountTypeName → detailTypeName[])
  const ADT_DEFS: Array<{ typeName: string; detailNames: string[] }> = [
    { typeName: 'Current Assets',          detailNames: ['Cash and Cash Equivalents', 'Accounts Receivables', 'Prepaid Expenses', 'Inventory', 'Loans to Owner'] },
    { typeName: 'Non-Current Assets',      detailNames: ['Vehicles', 'Properties', 'Equipment'] },
    { typeName: 'Current Liabilities',     detailNames: ['Accounts Payable', 'Client Funds'] },
    { typeName: 'Non-Current Liabilities', detailNames: ['Loans Payable'] },
    { typeName: 'Equity',                  detailNames: ['Capital', 'Drawing', 'Adjustments'] },
    { typeName: 'Revenue',                 detailNames: ['Service Revenue', 'Sales - Retail', 'Sales - Wholesale', 'Other Income'] },
    { typeName: 'Cost of Sales / Service', detailNames: ['Cost of Sales / Service'] },
    { typeName: 'Expenses',                detailNames: ['Expenses'] },
  ];

  for (const { typeName, detailNames } of ADT_DEFS) {
    const accountTypeId = atById.get(typeName);
    if (!accountTypeId) continue;
    for (const name of detailNames) {
      await prisma.accountDetailType.upsert({
        where: { accountTypeId_name: { accountTypeId, name } },
        update: {},
        create: { accountTypeId, name },
      });
    }
  }
  console.log(`  ✓ Account detail types seeded`);

  // 16d. GlAccount seed rows — tied to the ATMS client
  // Build ADT lookup: accountTypeName|detailName → id
  const allAdt = await prisma.accountDetailType.findMany({
    select: { id: true, name: true, accountTypeId: true },
  });
  const adtKey = (typeId: number, name: string) => `${typeId}|${name}`;
  const adtById = new Map(allAdt.map((a) => [adtKey(a.accountTypeId, a.name), a.id]));

  function glAt(typeName: string) { return atById.get(typeName)!; }
  function glAdt(typeName: string, detailName: string) {
    return adtById.get(adtKey(atById.get(typeName)!, detailName))!;
  }

  const GL_DEFS: Array<{
    accountCode: string; name: string;
    typeName: string; detailName: string;
    isBankAccount?: boolean;
    openingBalance?: number;
  }> = [
    // Current Assets
    { accountCode: '1001', name: 'Cash on Hand',        typeName: 'Current Assets', detailName: 'Cash and Cash Equivalents', openingBalance: 50000 },
    { accountCode: '1002', name: 'Cash in Bank',        typeName: 'Current Assets', detailName: 'Cash and Cash Equivalents', isBankAccount: true, openingBalance: 250000 },
    { accountCode: '1003', name: 'Petty Cash Fund',     typeName: 'Current Assets', detailName: 'Cash and Cash Equivalents', openingBalance: 5000 },
    { accountCode: '1010', name: 'Accounts Receivable', typeName: 'Current Assets', detailName: 'Accounts Receivables',      openingBalance: 45000 },
    { accountCode: '1020', name: 'Advance Rent',        typeName: 'Current Assets', detailName: 'Prepaid Expenses',          openingBalance: 15000 },
    { accountCode: '1030', name: 'Inventory',           typeName: 'Current Assets', detailName: 'Inventory' },
    { accountCode: '1040', name: 'Advances to Owner',   typeName: 'Current Assets', detailName: 'Loans to Owner' },
    // Non-Current Assets
    { accountCode: '1101', name: 'Motorcycle',  typeName: 'Non-Current Assets', detailName: 'Vehicles',    openingBalance: 85000 },
    { accountCode: '1102', name: 'Land',        typeName: 'Non-Current Assets', detailName: 'Properties' },
    { accountCode: '1103', name: 'Computers',   typeName: 'Non-Current Assets', detailName: 'Equipment',   openingBalance: 120000 },
    // Current Liabilities
    { accountCode: '2001', name: 'Accounts Payable', typeName: 'Current Liabilities', detailName: 'Accounts Payable' },
    { accountCode: '2002', name: 'Client Funds',     typeName: 'Current Liabilities', detailName: 'Client Funds' },
    // Non-Current Liabilities
    { accountCode: '2101', name: 'Loans Payable',    typeName: 'Non-Current Liabilities', detailName: 'Loans Payable' },
    { accountCode: '2102', name: 'Mortgage Payable', typeName: 'Non-Current Liabilities', detailName: 'Loans Payable' },
    // Equity
    { accountCode: '3001', name: 'Capital',      typeName: 'Equity', detailName: 'Capital',      openingBalance: 500000 },
    { accountCode: '3002', name: 'Drawing',      typeName: 'Equity', detailName: 'Drawing' },
    { accountCode: '3003', name: 'Adjustments',  typeName: 'Equity', detailName: 'Adjustments' },
    // Revenue
    { accountCode: '4001', name: 'Service Revenue', typeName: 'Revenue', detailName: 'Service Revenue' },
    { accountCode: '4002', name: 'Sales (Retail)',   typeName: 'Revenue', detailName: 'Sales - Retail' },
    { accountCode: '4003', name: 'Sales (Wholesale)',typeName: 'Revenue', detailName: 'Sales - Wholesale' },
    { accountCode: '4004', name: 'Other Income',     typeName: 'Revenue', detailName: 'Other Income' },
    // Cost of Sales / Service
    { accountCode: '5001', name: 'Purchases', typeName: 'Cost of Sales / Service', detailName: 'Cost of Sales / Service' },
    // Expenses
    { accountCode: '6001', name: 'Rental Expense',           typeName: 'Expenses', detailName: 'Expenses' },
    { accountCode: '6002', name: 'Transportation Expense',   typeName: 'Expenses', detailName: 'Expenses' },
    { accountCode: '6003', name: 'Repairs and Maintenance',  typeName: 'Expenses', detailName: 'Expenses' },
  ];

  let glCreated = 0;
  for (const gl of GL_DEFS) {
    const existing = await prisma.glAccount.findUnique({
      where: { clientId_accountCode: { clientId: atmsClient.id, accountCode: gl.accountCode } },
    });
    if (!existing) {
      await prisma.glAccount.create({
        data: {
          clientId:            atmsClient.id,
          accountCode:         gl.accountCode,
          name:                gl.name,
          accountTypeId:       glAt(gl.typeName),
          accountDetailTypeId: glAdt(gl.typeName, gl.detailName),
          isBankAccount:       gl.isBankAccount ?? false,
          openingBalance:      gl.openingBalance ?? null,
          isActive:            true,
        },
      });
      glCreated++;
    } else if (gl.openingBalance != null) {
      // Back-fill opening balance on existing rows that don't have one yet
      await prisma.glAccount.update({
        where: { id: existing.id },
        data: { openingBalance: gl.openingBalance },
      });
    }
  }
  console.log(`  ✓ ${GL_DEFS.length} GL accounts checked — ${glCreated} created, ${GL_DEFS.length - glCreated} already existed`);

  // ── 17. Seed Sample Journal Entries ──────────────────────────────

  // Build a quick lookup: accountCode → GlAccount.id
  const seedAccounts = await prisma.glAccount.findMany({
    where: { clientId: atmsClient.id },
    select: { id: true, accountCode: true },
  });
  const glId = (code: string) => seedAccounts.find((a) => a.accountCode === code)?.id ?? '';

  const JE_SEEDS: Array<{
    referenceNo: string;
    transactionDate: Date;
    transactionType: 'JOURNAL_ENTRY' | 'INVOICE' | 'PAYMENT' | 'EXPENSE' | 'RECEIPT';
    status: 'DRAFT' | 'POSTED';
    notes: string;
    lines: Array<{ code: string; debit?: number; credit?: number; description: string; name: string; sortOrder: number }>;
  }> = [
    {
      referenceNo: 'JE-2026-0001',
      transactionDate: new Date('2026-03-15'),
      transactionType: 'JOURNAL_ENTRY',
      status: 'POSTED',
      notes: 'Owner capital contribution — March.',
      lines: [
        { code: '1001', debit: 100000, description: 'Capital contribution',  name: 'Owner', sortOrder: 0 },
        { code: '3001', credit: 100000, description: 'Initial capital',       name: 'Owner', sortOrder: 1 },
      ],
    },
    {
      referenceNo: 'INV-2026-0001',
      transactionDate: new Date('2026-03-02'),
      transactionType: 'INVOICE',
      status: 'POSTED',
      notes: 'Tax consultation services billed.',
      lines: [
        { code: '1010', debit: 15000, description: 'Invoice #INV-2026-0001', name: 'Santos & Co.',       sortOrder: 0 },
        { code: '4001', credit: 15000, description: 'Tax consultation — Q1', name: 'Santos & Co.',       sortOrder: 1 },
      ],
    },
    {
      referenceNo: 'PMT-2026-0001',
      transactionDate: new Date('2026-03-05'),
      transactionType: 'PAYMENT',
      status: 'POSTED',
      notes: 'Partial payment received — GCash.',
      lines: [
        { code: '1001', debit: 7500, description: 'Partial payment received',    name: 'Santos & Co.', sortOrder: 0 },
        { code: '1010', credit: 7500, description: 'Applied to INV-2026-0001',   name: 'Santos & Co.', sortOrder: 1 },
      ],
    },
    {
      referenceNo: 'EXP-2026-0001',
      transactionDate: new Date('2026-03-08'),
      transactionType: 'EXPENSE',
      status: 'POSTED',
      notes: 'March rental payment.',
      lines: [
        { code: '6001', debit: 15000, description: 'March office rent',  name: 'Landlord', sortOrder: 0 },
        { code: '1001', credit: 15000, description: 'Cash payment',       name: 'Landlord', sortOrder: 1 },
      ],
    },
    {
      referenceNo: 'JE-2026-0002',
      transactionDate: new Date('2026-03-31'),
      transactionType: 'JOURNAL_ENTRY',
      status: 'DRAFT',
      notes: 'Month-end adjusting entry — accrued income.',
      lines: [
        { code: '1010', debit: 8000, description: 'Accrued service fee — March', name: 'Pending Clients', sortOrder: 0 },
        { code: '4001', credit: 8000, description: 'Accrual adjustment',          name: 'Pending Clients', sortOrder: 1 },
      ],
    },
  ];

  let jeCreated = 0;
  for (const je of JE_SEEDS) {
    if (!glId(je.lines[0]!.code)) continue; // skip if accounts not yet seeded
    const existing = await prisma.journalEntry.findUnique({ where: { referenceNo: je.referenceNo } });
    if (!existing) {
      await prisma.journalEntry.create({
        data: {
          referenceNo:     je.referenceNo,
          transactionDate: je.transactionDate,
          transactionType: je.transactionType,
          status:          je.status,
          notes:           je.notes,
          clientId:        atmsClient.id,
          lines: {
            create: je.lines.map((l) => ({
              glAccountId: glId(l.code),
              debit:       l.debit  ?? null,
              credit:      l.credit ?? null,
              description: l.description,
              name:        l.name,
              sortOrder:   l.sortOrder,
            })),
          },
        },
      });
      jeCreated++;
    }
  }
  console.log(`  ✓ ${JE_SEEDS.length} journal entries checked — ${jeCreated} created, ${JE_SEEDS.length - jeCreated} already existed`);
}

main()
  .catch((e: unknown) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
