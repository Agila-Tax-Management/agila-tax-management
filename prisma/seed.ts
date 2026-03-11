// prisma/seed.ts
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
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
];

async function main(): Promise<void> {
  // ── 1. Seed Company (Agila) ──────────────────────────────────────
  await prisma.client.upsert({
    where: { companyCode: 'atms' },
    update: {
      active: true,
      businessName: 'Agila Tax Management Services',
      portalName: 'Agila Tax Management Services',
      branchType: 'Main Branch',
    },
    create: {
      companyCode: 'atms',
      clientNo: '2023-1001',
      active: true,
      businessType: 'SOLE_PROPRIETORSHIP',
      businessName: 'Agila Tax Management Services',
      portalName: 'Agila Tax Management Services',
      branchType: 'Main Branch',
    },
  });
  console.log('  ✓ Company (Agila Tax Management Services) seeded');

  // ── 2. Seed Portal Apps ──────────────────────────────────────────
  for (const app of PORTAL_APPS) {
    await prisma.app.upsert({
      where: { name: app.name },
      update: { label: app.label },
      create: { name: app.name, label: app.label },
    });
  }
  console.log(`  ✓ ${PORTAL_APPS.length} portal apps seeded`);

  // ── 3. Seed Super Admin ──────────────────────────────────────────
  const email = "admin@agila.com";
  const password = "agilapassword";
  const hashedPassword = await hashPassword(password);

  // Upsert super admin user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name: "Super Admin",
      role: "SUPER_ADMIN",
      active: true,
      emailVerified: true,
    },
    create: {
      name: "Super Admin",
      email,
      role: "SUPER_ADMIN",
      active: true,
      emailVerified: true,
    },
  });

  // Upsert credential account linked to the user
  const accountId = `credential:${user.id}`;
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
        id: accountId,
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });
  }

  console.log(`\n  Super Admin seeded successfully!`);
  console.log(`  Email:    ${email}`);
  console.log(`  Password: ${password}\n`);

  // ── 4. Seed Employee record for Super Admin ──────────────────────
  const existingEmployee = await prisma.employee.findUnique({
    where: { userId: user.id },
  });

  if (!existingEmployee) {
    await prisma.employee.create({
      data: {
        userId: user.id,
        firstName: "Super",
        lastName: "Admin",
        employeeNo: "EMP-00001",
        email,
        birthDate: new Date("1990-01-01"),
        gender: "Male",
        phone: "09170000000",
        address: "Cebu City, Philippines",
        employmentType: "REGULAR",
        startDate: new Date("2023-01-01"),
        active: true,
      },
    });
    console.log("  ✓ Employee record created for Super Admin");
  } else {
    console.log("  ✓ Employee record already exists for Super Admin");
  }
}

main()
  .catch((e: unknown) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
