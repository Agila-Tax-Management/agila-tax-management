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
  { name: "SALES" as const, label: "Sales Portal" },
  { name: "COMPLIANCE" as const, label: "Compliance Portal" },
  { name: "LIAISON" as const, label: "Liaison Portal" },
  { name: "ACCOUNTING" as const, label: "Accounting Portal" },
  { name: "ACCOUNT_OFFICER" as const, label: "Account Officer Portal" },
  { name: "HR" as const, label: "HR Portal" },
  { name: "TASK_MANAGEMENT" as const, label: "Task Management Portal" },
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
  address: string;
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
    address: "Cebu City, Philippines",
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
    address: "Cebu City, Philippines",
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
    address: "Mandaue City, Philippines",
    department: "Accounting",
    departmentDescription: "Bookkeeping, payroll, and financial reporting",
    positionTitle: "Accountant",
    positionDescription: "Handles client accounting and tax filings",
    employeeLevel: "Junior",
    hireDate: new Date("2024-01-15"),
    appAccess: {
      COMPLIANCE: { canRead: true, canWrite: true, canEdit: true, canDelete: false },
      ACCOUNTING: { canRead: true, canWrite: true, canEdit: false, canDelete: false },
      ACCOUNT_OFFICER: { canRead: true, canWrite: false, canEdit: false, canDelete: false },
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
  businessType: "INDIVIDUAL" | "SOLE_PROPRIETORSHIP" | "PARTNERSHIP" | "CORPORATION" | "COOPERATIVE";
  branchType?: string;
}

const CLIENT_COMPANIES: ClientSeed[] = [
  {
    companyCode: "comp-001",
    clientNo: "2024-0001",
    businessName: "Santos General Merchandise",
    portalName: "Santos General Merchandise",
    businessType: "SOLE_PROPRIETORSHIP",
    branchType: "Main Branch",
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
}

const CLIENT_USERS: ClientUserSeed[] = [
  {
    name: "Maria Santos",
    email: "client@agila.com",
    password: "clientpassword",
    companyCode: "comp-001",
    role: "OWNER",
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

  // 3. Upsert ClientAccount (BetterAuth credential)
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
        address: seed.address,
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

async function main(): Promise<void> {
  // ── 1. Seed Company (Agila — the internal company) ───────────────
  await prisma.client.upsert({
    where: { companyCode: "atms" },
    update: {
      active: true,
      businessName: "Agila Tax Management Services",
      portalName: "Agila Tax Management Services",
      branchType: "Main Branch",
    },
    create: {
      companyCode: "atms",
      clientNo: "2023-1001",
      active: true,
      businessType: "SOLE_PROPRIETORSHIP",
      businessName: "Agila Tax Management Services",
      portalName: "Agila Tax Management Services",
      branchType: "Main Branch",
    },
  });
  console.log("  ✓ Company (Agila Tax Management Services) seeded");

  // ── 2. Seed Portal Apps ──────────────────────────────────────────
  for (const app of PORTAL_APPS) {
    await prisma.app.upsert({
      where: { name: app.name },
      update: { label: app.label },
      create: { name: app.name, label: app.label },
    });
  }
  console.log(`  ✓ ${PORTAL_APPS.length} portal apps seeded`);

  // ── 3. Resolve ATMS client ID ────────────────────────────────────
  const agilaClient = await prisma.client.findUnique({
    where: { companyCode: "atms" },
  });
  if (!agilaClient) throw new Error("ATMS client not found — step 1 failed");

  // ── 4. Seed Employee Levels ──────────────────────────────────────
  for (const level of EMPLOYEE_LEVELS) {
    await prisma.employeeLevel.upsert({
      where: { name: level.name },
      update: { position: level.position, description: level.description },
      create: level,
    });
  }
  const allLevels = await prisma.employeeLevel.findMany();
  const levelsByName = new Map(allLevels.map((l) => [l.name, l.id]));
  console.log(`  ✓ ${EMPLOYEE_LEVELS.length} employee levels seeded`);

  // ── 5. Seed Departments, Positions & Internal Users ─────────────
  //  Each internal user's department is upserted before creating the user
  //  so that we can pass the correct departmentId, positionId, and levelId.

  console.log("\n  Seeding internal users (all linked to ATMS client):\n");

  for (const seed of INTERNAL_USERS) {
    const dept = await prisma.department.upsert({
      where: {
        clientId_name: { clientId: agilaClient.id, name: seed.department },
      },
      update: {},
      create: {
        clientId: agilaClient.id,
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
    await seedInternalUser(seed, agilaClient.id, dept.id, position.id, employeeLevelId);
  }

  console.log("\n  Internal user credentials:");
  console.log("  ─────────────────────────────────────────────────────");
  for (const u of INTERNAL_USERS) {
    console.log(`  [${u.role.padEnd(11)}]  ${u.email.padEnd(28)}  ${u.password}`);
  }
  console.log("  ─────────────────────────────────────────────────────\n");

  // ── 6. Seed External Client Companies ─────────────────────────────
  for (const c of CLIENT_COMPANIES) {
    await prisma.client.upsert({
      where: { companyCode: c.companyCode },
      update: {
        active: true,
        businessName: c.businessName,
        portalName: c.portalName,
        branchType: c.branchType ?? "Main Branch",
      },
      create: {
        companyCode: c.companyCode,
        clientNo: c.clientNo,
        active: true,
        businessType: c.businessType,
        businessName: c.businessName,
        portalName: c.portalName,
        branchType: c.branchType ?? "Main Branch",
      },
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
}

main()
  .catch((e: unknown) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
