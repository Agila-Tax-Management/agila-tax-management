// prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import type { AppPortal } from "../src/generated/prisma/client";
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
  { name: "ACCOUNTING" as const,           label: "Accounting Portal" },
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
  appAccess?: Partial<Record<AppPortal, { canRead: boolean; canWrite: boolean; canEdit: boolean; canDelete: boolean }>>;
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
      COMPLIANCE: { canRead: true, canWrite: true, canEdit: true, canDelete: false },
      ACCOUNTING: { canRead: true, canWrite: true, canEdit: false, canDelete: false },
      OPERATIONS_MANAGEMENT: { canRead: true, canWrite: false, canEdit: false, canDelete: false },
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
      LIAISON: { canRead: true, canWrite: true, canEdit: true, canDelete: false },
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
    for (const [portalName, perms] of Object.entries(seed.appAccess)) {
      const app = apps.find((a) => a.name === portalName);
      if (!app) continue;
      await prisma.employeeAppAccess.upsert({
        where: { employeeId_appId: { employeeId, appId: app.id } },
        update: perms,
        create: { employeeId, appId: app.id, ...perms },
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
    where: { companyCode: "atms" },
    update: {
      active: true,
      businessName: "Agila Tax Management Services",
      portalName: "Agila Tax Management Services",
      businessEntity: "SOLE_PROPRIETORSHIP",
      branchType: "MAIN",
    },
    create: {
      companyCode: "atms",
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
    { name: "Pending Onboarding",   color: "#8b5cf6", sequence: 7,  isDefault: false, isOnboarding: true,  isConverted: false },
    { name: "Contract Signing",     color: "#6366f1", sequence: 8,  isDefault: false, isOnboarding: false, isConverted: false },
    { name: "Waiting for Payment",  color: "#eab308", sequence: 9,  isDefault: false, isOnboarding: false, isConverted: false },
    { name: "Turn Over",            color: "#0d9488", sequence: 10, isDefault: false, isOnboarding: false, isConverted: true  },
    { name: "Lost",                 color: "#ef4444", sequence: 11, isDefault: false, isOnboarding: false, isConverted: false },
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

  // ── 10. Seed Sample Leads ─────────────────────────────────────────
  const newStatus   = await prisma.leadStatus.findFirst({ where: { name: "New" } });
  const contactedStatus = await prisma.leadStatus.findFirst({ where: { name: "Contacted" } });

  if (newStatus && contactedStatus) {
    const sampleLeads = [
      {
        firstName: "Roberto",
        lastName: "Villanueva",
        contactNumber: "09171234567",
        businessType: "Sole Proprietorship",
        leadSource: "Walk-in",
        statusId: newStatus.id,
      },
      {
        firstName: "Patricia",
        lastName: "Lim",
        contactNumber: "09189876543",
        businessType: "Corporation",
        leadSource: "Referral",
        statusId: contactedStatus.id,
      },
    ];

    for (const lead of sampleLeads) {
      const existingLead = await prisma.lead.findFirst({
        where: { firstName: lead.firstName, lastName: lead.lastName },
      });
      if (!existingLead) {
        await prisma.lead.create({ data: lead });
      }
    }
    console.log(`  ✓ 2 sample leads seeded`);
  }

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

  const birOffice   = await prisma.governmentOffice.findUnique({ where: { code: "BIR" } });
  const mayorOffice = await prisma.governmentOffice.findUnique({ where: { code: "MAYOR" } });
  const cebuCity    = await prisma.city.findUnique({ where: { name: "Cebu City" } });

  const vatTemplate = await prisma.taskTemplate.findFirst({ where: { name: "BIR 2550M – Monthly VAT Return" } });
  const tinTemplate = await prisma.taskTemplate.findFirst({ where: { name: "BIR TIN Registration – New Business" } });

  // Service Plan: Starter VAT Monthly
  const existingPlan = await prisma.servicePlan.findFirst({ where: { name: "Starter VAT Monthly Plan" } });
  if (!existingPlan) {
    await prisma.servicePlan.create({
      data: {
        name: "Starter VAT Monthly Plan",
        description: "Essential monthly tax compliance package for VAT-registered sole proprietors and professionals. Covers monthly VAT filing, withholding tax, bookkeeping, and government remittances.",
        recurring: "MONTHLY",
        serviceRate: 3500,
        status: "ACTIVE",
        taskTemplates: vatTemplate ? { create: [{ taskTemplateId: vatTemplate.id }] } : undefined,
        governmentOffices: birOffice   ? { connect: [{ id: birOffice.id }] }   : undefined,
        cities:            cebuCity    ? { connect: [{ id: cebuCity.id }] }    : undefined,
        inclusions: {
          connect: [
            "BIR Monthly VAT Filing (2550M)",
            "BIR Quarterly Income Tax (1701Q)",
            "BIR Withholding Tax (1601C)",
            "Bookkeeping",
            "Government Remittances",
          ].map((name) => ({ name })),
        },
      },
    });
    console.log("  ✓ Service plan 'Starter VAT Monthly Plan' seeded");
  }

  // One-Time Service: BIR TIN Registration
  const existingOneTime = await prisma.serviceOneTime.findFirst({ where: { name: "BIR TIN Registration (New Business)" } });
  if (!existingOneTime) {
    await prisma.serviceOneTime.create({
      data: {
        name: "BIR TIN Registration (New Business)",
        description: "End-to-end processing of BIR TIN application and Certificate of Registration (COR) for newly registered businesses. Includes form preparation, RDO submission, and Books of Accounts registration.",
        serviceRate: 1500,
        status: "ACTIVE",
        taskTemplates: tinTemplate ? { create: [{ taskTemplateId: tinTemplate.id }] } : undefined,
        governmentOffices: birOffice  ? { connect: [{ id: birOffice.id }] }  : undefined,
        cities:            cebuCity   ? { connect: [{ id: cebuCity.id }] }   : undefined,
        inclusions: {
          connect: [{ name: "BIR TIN Registration" }],
        },
      },
    });
    console.log("  ✓ One-time service 'BIR TIN Registration (New Business)' seeded");
  }

  // One-Time Service: Mayor's Permit Renewal
  const permitTemplate = await prisma.taskTemplate.findFirst({ where: { name: "Mayor's Permit Renewal" } });
  const existingPermitService = await prisma.serviceOneTime.findFirst({ where: { name: "Mayor's Permit Renewal (Annual)" } });
  if (!existingPermitService) {
    await prisma.serviceOneTime.create({
      data: {
        name: "Mayor's Permit Renewal (Annual)",
        description: "Annual renewal of the LGU Business Permit / Mayor's Permit. Includes barangay clearance processing, BPLO submission, fee payment, and permit delivery to the client.",
        serviceRate: 1200,
        status: "ACTIVE",
        taskTemplates: permitTemplate ? { create: [{ taskTemplateId: permitTemplate.id }] } : undefined,
        governmentOffices: mayorOffice ? { connect: [{ id: mayorOffice.id }] } : undefined,
        cities:            cebuCity    ? { connect: [{ id: cebuCity.id }] }    : undefined,
        inclusions: {
          connect: [{ name: "Business Permit Renewal" }],
        },
      },
    });
    console.log("  ✓ One-time service 'Mayor's Permit Renewal (Annual)' seeded");
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
}

main()
  .catch((e: unknown) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
