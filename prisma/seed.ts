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
      deptName: "Client Relations",
      tasks: [
        { name: "Client Escalation – ABC Enterprises", description: "Follow up on escalated client concern and coordinate resolution timeline with all departments.", priority: "URGENT", daysFromNow: 3 },
        { name: "Monthly Performance Review – March 2026", description: "Review KPIs and output metrics for the Client Relations department.", priority: "HIGH", daysFromNow: 6 },
        { name: "Client Retention Follow-up – Santos General Merchandise", description: "Conduct quarterly check-in call and document client satisfaction status.", priority: "NORMAL", daysFromNow: 12 },
      ],
    },
    {
      deptName: "Liaison",
      tasks: [
        { name: "BIR TIN Registration – New Client Onboarding", description: "Process TIN registration for newly onboarded client. Prepare all required BIR documents before submission to the RDO.", priority: "HIGH", daysFromNow: 5 },
        { name: "Mayor's Permit Renewal – Cebu City LGU", description: "Follow up on Mayor's Permit renewal at City Hall. Bring OR from initial payment and all supporting documents.", priority: "URGENT", daysFromNow: 4 },
        { name: "SSS / PhilHealth / Pag-IBIG Registration – New Employee", description: "Process government benefit registrations for newly hired employees across SSS, PhilHealth, and Pag-IBIG.", priority: "NORMAL", daysFromNow: 10 },
      ],
    },
    {
      deptName: "Compliance",
      tasks: [
        { name: "BIR 1701Q Q1 2026 Filing", description: "Prepare and file the BIR 1701Q quarterly income tax return for Q1 2026. Reconcile books with CAS before submission.", priority: "URGENT", daysFromNow: 21 },
        { name: "BIR 2550M VAT Filing – March 2026", description: "File monthly VAT return (BIR Form 2550M) for March 2026. Deadline is 20th day of the following month.", priority: "HIGH", daysFromNow: 26 },
        { name: "Audited Financial Statements – FY2025", description: "Complete the AFS for FY2025. Coordinate with external auditor for audit notes and final sign-off.", priority: "URGENT", daysFromNow: 36 },
        { name: "Pag-IBIG Monthly Remittance – March", description: "Submit Pag-IBIG Fund contribution remittances for all enrolled employees for March 2026.", priority: "NORMAL", daysFromNow: 8 },
      ],
    },
    {
      deptName: "Operations",
      tasks: [
        { name: "Q1 2026 Compliance Summary Report", description: "Compile Q1 summary of all compliance filings and outstanding deadlines for management presentation.", priority: "URGENT", daysFromNow: 16 },
        { name: "April Cross-Department Coordination Meeting", description: "Schedule and facilitate the cross-department planning session for April priorities. Prepare agenda and invite all team leads.", priority: "HIGH", daysFromNow: 9 },
        { name: "Process Improvement Review – Liaison Workflow", description: "Evaluate the current liaison field reporting process and identify bottlenecks for Q2 improvement.", priority: "NORMAL", daysFromNow: 20 },
      ],
    },
    {
      deptName: "Accounting",
      tasks: [
        { name: "Petty Cash Fund Replenishment – March", description: "Process and document PCF replenishment for March 2026 expenses. Attach all liquidation receipts.", priority: "NORMAL", daysFromNow: 5 },
        { name: "Client Invoice Batch – March 2026", description: "Generate and send out invoices to all active clients for services rendered in March.", priority: "HIGH", daysFromNow: 8 },
        { name: "Payroll Reconciliation – March 2026", description: "Reconcile payroll figures against attendance and HR-approved adjustments before final release.", priority: "HIGH", daysFromNow: 7 },
      ],
    },
    {
      deptName: "Human Resources",
      tasks: [
        { name: "Leave Request Processing – March", description: "Review and approve all pending leave applications filed for the month of March.", priority: "NORMAL", daysFromNow: 4 },
        { name: "Payroll Run – March 2026", description: "Prepare and release payroll for all active employees for the March 2026 pay period.", priority: "HIGH", daysFromNow: 7 },
        { name: "201 File Audit – Q1 2026", description: "Verify completeness of all employee 201 files. Flag missing documents and follow up with concerned staff.", priority: "NORMAL", daysFromNow: 15 },
      ],
    },
    {
      deptName: "Administration",
      tasks: [
        { name: "Office Supplies Procurement – Q1", description: "Consolidate office supply requests from all departments and place the Q1 order with approved vendors.", priority: "LOW", daysFromNow: 14 },
        { name: "Lease Renewal Negotiation", description: "Coordinate with building management regarding office lease renewal terms and new rate proposal.", priority: "HIGH", daysFromNow: 30 },
      ],
    },
    {
      deptName: "IT",
      tasks: [
        { name: "Server Backup Verification – March", description: "Verify all automated server and database backups completed successfully for the month of March.", priority: "HIGH", daysFromNow: 2 },
        { name: "Employee Workstation Setup – New Hire", description: "Configure workstation, user accounts, email, and system access permissions for incoming employee.", priority: "NORMAL", daysFromNow: 7 },
        { name: "Security Patch Deployment – Q1", description: "Apply pending OS and application security patches across all workstations and servers.", priority: "HIGH", daysFromNow: 10 },
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
        where: { name: t.name, currentDepartmentId: dept.id },
      });
      if (existing) continue;

      const task = await prisma.task.create({
        data: {
          name: t.name,
          description: t.description,
          priority: t.priority,
          currentDepartmentId: dept.id,
          currentStatusId: entryStatus?.id ?? null,
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
}

main()
  .catch((e: unknown) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
