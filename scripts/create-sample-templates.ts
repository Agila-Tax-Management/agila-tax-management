// scripts/create-sample-templates.ts
//
// Run with:  npx tsx scripts/create-sample-templates.ts
//
// Creates Compliance + Liaison departments (if not present), default task statuses,
// and 4 realistic Philippine tax-compliance task templates for ATMS.

import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import type { TaskPriority } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/* ── Helpers ─────────────────────────────────────────────────────── */

const DEFAULT_STATUSES = [
  { name: "To Do",       color: "#94a3b8", statusOrder: 1, isEntryStep: true,  isExitStep: false },
  { name: "In Progress", color: "#3b82f6", statusOrder: 2, isEntryStep: false, isExitStep: false },
  { name: "For Review",  color: "#f59e0b", statusOrder: 3, isEntryStep: false, isExitStep: false },
  { name: "Done",        color: "#22c55e", statusOrder: 4, isEntryStep: false, isExitStep: true  },
];

interface TemplateSeed {
  name: string;
  description: string;
  daysDue: number;
  routes: Array<{
    dept: string;
    order: number;
    daysDue: number;
    subtasks: Array<{
      name: string;
      description?: string;
      priority: TaskPriority;
      daysDue: number;
      order: number;
    }>;
  }>;
}

const TEMPLATES: TemplateSeed[] = [
  {
    name: "Monthly VAT Return (BIR Form 2550M)",
    description:
      "Monthly filing of VAT return for VAT-registered businesses. Due on the 20th of the following month via eFPS/eBIRForms.",
    daysDue: 7,
    routes: [
      {
        dept: "Accounting",
        order: 1,
        daysDue: 3,
        subtasks: [
          { name: "Collect purchase and sales invoices",        description: "Gather all official receipts and invoices for the covered month.",      priority: "HIGH",   daysDue: 1, order: 1 },
          { name: "Reconcile VAT input and output taxes",       description: "Compute total input VAT (purchases) and output VAT (sales).",          priority: "HIGH",   daysDue: 1, order: 2 },
          { name: "Prepare BIR Form 2550M",                     description: "Fill out the Monthly VAT Declaration form with computed figures.",     priority: "HIGH",   daysDue: 1, order: 3 },
        ],
      },
      {
        dept: "Compliance",
        order: 2,
        daysDue: 4,
        subtasks: [
          { name: "Review Form 2550M for accuracy",             description: "Validate all figures against supporting documents.",                   priority: "URGENT", daysDue: 1, order: 1 },
          { name: "File via eBIRForms / eFPS",                  description: "Submit the validated VAT return electronically.",                      priority: "URGENT", daysDue: 1, order: 2 },
          { name: "Process payment at AAB or via eFPS",         description: "Pay VAT due through Authorized Agent Bank or eFPS online.",           priority: "HIGH",   daysDue: 1, order: 3 },
          { name: "Archive filing confirmation and receipt",    description: "Save electronic confirmation and bank debit advice.",                  priority: "NORMAL", daysDue: 1, order: 4 },
        ],
      },
    ],
  },
  {
    name: "Quarterly Income Tax Return (BIR Form 1702Q)",
    description:
      "Quarterly income tax filing for corporations and partnerships. Due on the 60th day after close of each taxable quarter.",
    daysDue: 15,
    routes: [
      {
        dept: "Accounting",
        order: 1,
        daysDue: 10,
        subtasks: [
          { name: "Gather quarterly financial records",         description: "Collect all income and expense documents for the quarter.",            priority: "HIGH",   daysDue: 2, order: 1 },
          { name: "Prepare adjusted trial balance",             description: "Generate trial balance and apply adjusting entries.",                  priority: "HIGH",   daysDue: 3, order: 2 },
          { name: "Compute income tax due",                     description: "Calculate regular corporate income tax (RCIT) and MCIT.",             priority: "URGENT", daysDue: 2, order: 3 },
          { name: "Prepare BIR Form 1702Q",                     description: "Complete the Quarterly Income Tax Return form.",                      priority: "URGENT", daysDue: 3, order: 4 },
        ],
      },
      {
        dept: "Compliance",
        order: 2,
        daysDue: 5,
        subtasks: [
          { name: "Review BIR Form 1702Q",                      description: "Cross-check figures with accounting records and prior filings.",       priority: "URGENT", daysDue: 2, order: 1 },
          { name: "File and pay via eFPS or eBIRForms",         description: "Submit return and process payment electronically.",                    priority: "URGENT", daysDue: 2, order: 2 },
          { name: "Archive filing proof and payment receipt",   description: "Store electronic confirmation and bank debit advice.",                 priority: "NORMAL", daysDue: 1, order: 3 },
        ],
      },
    ],
  },
  {
    name: "Annual BIR Registration Renewal (Form 0605)",
    description:
      "Annual renewal of BIR Certificate of Registration (COR). Due every January 31 of each year.",
    daysDue: 10,
    routes: [
      {
        dept: "Compliance",
        order: 1,
        daysDue: 5,
        subtasks: [
          { name: "Prepare renewal requirements checklist",     description: "Gather previous COR, owner ID, and other BIR requirements.",          priority: "HIGH",   daysDue: 1, order: 1 },
          { name: "Complete BIR Form 0605 – Annual Reg Fee",    description: "Fill out form for ₱500 annual registration fee.",                    priority: "HIGH",   daysDue: 1, order: 2 },
          { name: "Process ₱500 payment at AAB or eFPS",       description: "Pay annual registration fee before January 31 deadline.",             priority: "HIGH",   daysDue: 2, order: 3 },
          { name: "Organize documents for RDO submission",      description: "Compile all required documents for the Revenue District Office.",     priority: "NORMAL", daysDue: 1, order: 4 },
        ],
      },
      {
        dept: "Liaison",
        order: 2,
        daysDue: 5,
        subtasks: [
          { name: "Submit payment and documents to RDO",        description: "Bring original Form 0605 with payment receipt to the assigned RDO.",  priority: "HIGH",   daysDue: 2, order: 1 },
          { name: "Follow up COR renewal status with BIR",      description: "Coordinate with RDO for release of updated Certificate of Registration.", priority: "NORMAL", daysDue: 2, order: 2 },
          { name: "Receive and post updated COR",               description: "Obtain renewed COR and display in premises as required by law.",      priority: "HIGH",   daysDue: 1, order: 3 },
        ],
      },
    ],
  },
  {
    name: "Monthly SSS / PhilHealth / Pag-IBIG Contributions",
    description:
      "Monthly filing and payment of mandatory government contributions for all covered employees.",
    daysDue: 5,
    routes: [
      {
        dept: "Accounting",
        order: 1,
        daysDue: 3,
        subtasks: [
          { name: "Compute SSS contributions per employee",     description: "Apply current SSS contribution table to each employee's monthly salary.", priority: "HIGH",   daysDue: 1, order: 1 },
          { name: "Compute PhilHealth and Pag-IBIG shares",    description: "Calculate employee and employer shares for both agencies.",             priority: "HIGH",   daysDue: 1, order: 2 },
          { name: "Prepare R3, RF-1, and MCRF reports",        description: "Generate SSS R3, PhilHealth RF-1, and PAGIBIG MCRF reports.",          priority: "HIGH",   daysDue: 1, order: 3 },
        ],
      },
      {
        dept: "Compliance",
        order: 2,
        daysDue: 2,
        subtasks: [
          { name: "File contributions online",                  description: "Submit via My.SSS, PhilHealth EPRS, and Virtual Pag-IBIG.",           priority: "URGENT", daysDue: 1, order: 1 },
          { name: "Process payments and archive confirmations", description: "Pay via online banking or OTC and save payment receipts.",            priority: "HIGH",   daysDue: 1, order: 2 },
        ],
      },
    ],
  },

  // ── One-time service templates ───────────────────────────────────

  {
    name: "DTI Business Name Registration",
    description:
      "One-time registration of a sole proprietorship business name with the Department of Trade and Industry (DTI). Required before commencing business operations.",
    daysDue: 7,
    routes: [
      {
        dept: "Compliance",
        order: 1,
        daysDue: 3,
        subtasks: [
          { name: "Check business name availability on BNRS",    description: "Search the DTI Business Name Registration System for name conflicts.", priority: "HIGH",   daysDue: 1, order: 1 },
          { name: "Prepare owner identification documents",       description: "Gather valid government-issued ID and required personal information.", priority: "HIGH",   daysDue: 1, order: 2 },
          { name: "Complete DTI online application (BNRS+)",     description: "Fill out and submit the business name registration form on DTI BNRS+.", priority: "HIGH",   daysDue: 1, order: 3 },
          { name: "Process registration fee payment",            description: "Pay the DTI registration fee based on territorial scope (Barangay/City/Regional/National).", priority: "HIGH", daysDue: 1, order: 4 },
        ],
      },
      {
        dept: "Liaison",
        order: 2,
        daysDue: 4,
        subtasks: [
          { name: "Follow up Certificate of Registration release", description: "Monitor DTI BNRS+ portal or coordinate with DTI office for COR release.", priority: "NORMAL", daysDue: 2, order: 1 },
          { name: "Receive and review DTI Certificate of Registration", description: "Verify all details on the COR (business name, owner, address, scope).", priority: "HIGH", daysDue: 1, order: 2 },
          { name: "Transmit original COR to client",              description: "Deliver or courier the original DTI COR to the client for safekeeping.", priority: "HIGH",   daysDue: 1, order: 3 },
        ],
      },
    ],
  },

  {
    name: "SEC Corporation Registration",
    description:
      "One-time registration of a stock or non-stock corporation with the Securities and Exchange Commission (SEC) via the Company Registration System (CRS).",
    daysDue: 21,
    routes: [
      {
        dept: "Compliance",
        order: 1,
        daysDue: 14,
        subtasks: [
          { name: "Reserve proposed corporate name on SEC CRS",   description: "Submit name reservation via the SEC Company Registration System.", priority: "HIGH",   daysDue: 2, order: 1 },
          { name: "Draft Articles of Incorporation and By-Laws",  description: "Prepare the AOI and By-Laws conforming to SEC template and client requirements.", priority: "URGENT", daysDue: 5, order: 2 },
          { name: "Prepare Treasurer's Affidavit and bank deposit", description: "Secure notarized Treasurer's Affidavit and proof of paid-up capital deposit.", priority: "HIGH", daysDue: 2, order: 3 },
          { name: "Compile complete SEC registration package",    description: "Gather AOI, By-Laws, Treasurer's Affidavit, IDs, and SPA if needed.", priority: "HIGH",   daysDue: 2, order: 4 },
          { name: "Submit registration package via SEC CRS",      description: "Upload and submit all documents electronically through the SEC portal.", priority: "URGENT", daysDue: 2, order: 5 },
          { name: "Pay SEC registration and filing fees",         description: "Process payment of registration fees at SEC cashier or via online payment.", priority: "HIGH", daysDue: 1, order: 6 },
        ],
      },
      {
        dept: "Liaison",
        order: 2,
        daysDue: 7,
        subtasks: [
          { name: "Follow up registration status with SEC",        description: "Monitor SEC CRS portal and coordinate with SEC examiner for clarifications.", priority: "NORMAL", daysDue: 3, order: 1 },
          { name: "Respond to SEC deficiency letters if any",      description: "Address and refile any documents flagged by the SEC examiner.", priority: "URGENT",   daysDue: 2, order: 2 },
          { name: "Receive SEC Certificate of Incorporation",      description: "Obtain and verify the SEC-issued Certificate of Incorporation and CN.", priority: "HIGH",   daysDue: 1, order: 3 },
          { name: "Transmit SEC documents to client",              description: "Deliver originals to the client and retain certified copies for files.", priority: "HIGH",   daysDue: 1, order: 4 },
        ],
      },
    ],
  },

  {
    name: "BIR Business Registration (New)",
    description:
      "One-time registration of a new business with the Bureau of Internal Revenue to obtain a Taxpayer Identification Number (TIN) and Certificate of Registration (COR).",
    daysDue: 14,
    routes: [
      {
        dept: "Compliance",
        order: 1,
        daysDue: 7,
        subtasks: [
          { name: "Compile BIR new registration requirements",    description: "Gather DTI/SEC registration docs, lease contract, valid IDs, and other BIR checklist items.", priority: "HIGH", daysDue: 2, order: 1 },
          { name: "Complete BIR Form 1901 / 1903",               description: "Fill out Application for Registration (1901 for sole prop, 1903 for corporation/partnership).", priority: "HIGH", daysDue: 2, order: 2 },
          { name: "Pay Annual Registration Fee – BIR Form 0605", description: "Process ₱500 annual registration fee payment at AAB before submission.", priority: "HIGH", daysDue: 1, order: 3 },
          { name: "Apply for Authority to Print (ATP) receipts",  description: "Submit BIR Form 1906 for ATP of official receipts / sales invoices.", priority: "NORMAL", daysDue: 2, order: 4 },
        ],
      },
      {
        dept: "Liaison",
        order: 2,
        daysDue: 7,
        subtasks: [
          { name: "Submit registration forms to assigned RDO",     description: "File all documents at the Revenue District Office covering the business address.", priority: "HIGH", daysDue: 2, order: 1 },
          { name: "Follow up Certificate of Registration issuance", description: "Coordinate with RDO examiner and monitor BIR processing of registration.", priority: "NORMAL", daysDue: 3, order: 2 },
          { name: "Receive BIR COR and Books of Accounts",         description: "Obtain COR (Form 2303), books of accounts, and ATP from the RDO.", priority: "HIGH",   daysDue: 1, order: 3 },
          { name: "Transmit BIR documents to client",              description: "Deliver originals to client; advise on posting COR requirement and bookkeeping.", priority: "HIGH", daysDue: 1, order: 4 },
        ],
      },
    ],
  },

  {
    name: "Mayor's Business Permit Registration (New)",
    description:
      "One-time application for a new Mayor's Permit / Business Permit from the Local Government Unit (LGU) where the business is located.",
    daysDue: 10,
    routes: [
      {
        dept: "Compliance",
        order: 1,
        daysDue: 4,
        subtasks: [
          { name: "Prepare LGU new business permit requirements",  description: "Gather barangay clearance, DTI/SEC docs, lease contract, and LGU-specific checklist.", priority: "HIGH", daysDue: 1, order: 1 },
          { name: "Obtain Barangay Business Clearance",            description: "Secure clearance from the barangay where the business is physically located.", priority: "HIGH", daysDue: 2, order: 2 },
          { name: "Complete Mayor's Permit application form",      description: "Fill out the LGU business permit application and attach all supporting documents.", priority: "HIGH", daysDue: 1, order: 3 },
        ],
      },
      {
        dept: "Liaison",
        order: 2,
        daysDue: 6,
        subtasks: [
          { name: "Submit application at City / Municipal Hall",   description: "File complete application package at the Business Permits and Licensing Office (BPLO).", priority: "HIGH", daysDue: 2, order: 1 },
          { name: "Facilitate inspections (Fire, Sanitary, Zoning)", description: "Coordinate and accompany government inspectors if on-site inspection is required.", priority: "NORMAL", daysDue: 2, order: 2 },
          { name: "Pay assessment and business permit fees",       description: "Process payment of LGU-assessed permit and other local fees.", priority: "HIGH",   daysDue: 1, order: 3 },
          { name: "Receive and transmit Mayor's Permit to client", description: "Obtain the original Mayor's Permit and deliver to client for display.", priority: "HIGH", daysDue: 1, order: 4 },
        ],
      },
    ],
  },

  {
    name: "SSS / PhilHealth / Pag-IBIG Employer Registration",
    description:
      "One-time registration of a new employer with SSS, PhilHealth, and Pag-IBIG Fund to enable mandatory contribution remittances for employees.",
    daysDue: 10,
    routes: [
      {
        dept: "Compliance",
        order: 1,
        daysDue: 5,
        subtasks: [
          { name: "Prepare employer registration requirements",    description: "Gather BIR COR, DTI/SEC docs, owner ID, and agency-specific application forms.", priority: "HIGH",   daysDue: 1, order: 1 },
          { name: "Complete SSS Employer Registration (Form R-1)", description: "Fill out and submit SSS Form R-1 (Employer Registration) online via My.SSS.", priority: "HIGH",   daysDue: 1, order: 2 },
          { name: "Complete PhilHealth Employer Registration (PMEF)", description: "Submit PhilHealth Member Registration Form (PMEF) for employer.", priority: "HIGH",   daysDue: 1, order: 3 },
          { name: "Complete Pag-IBIG Employer Registration",       description: "Submit Employer's Data Form (EDF) via Virtual Pag-IBIG portal.", priority: "HIGH",   daysDue: 1, order: 4 },
          { name: "Organize documents for in-person submissions",  description: "Compile signed forms and supporting docs for agencies requiring walk-in filing.", priority: "NORMAL", daysDue: 1, order: 5 },
        ],
      },
      {
        dept: "Liaison",
        order: 2,
        daysDue: 5,
        subtasks: [
          { name: "Submit pending agency registrations in person", description: "File documents at SSS / PhilHealth / Pag-IBIG branch offices where required.", priority: "HIGH",   daysDue: 3, order: 1 },
          { name: "Receive employer IDs and registration confirmations", description: "Obtain SSS Employer ID, PhilHealth ER No., and Pag-IBIG MID.", priority: "HIGH",   daysDue: 1, order: 2 },
          { name: "Transmit registration IDs and docs to client",  description: "Deliver all agency registration IDs and certificates to the client.", priority: "HIGH",   daysDue: 1, order: 3 },
        ],
      },
    ],
  },
];

/* ── Main ─────────────────────────────────────────────────────────── */

async function main(): Promise<void> {
  // Find ATMS client
  const atmsClient = await prisma.client.findUnique({ where: { companyCode: "atms" } });
  if (!atmsClient) throw new Error('ATMS client not found. Run "npx prisma db seed" first.');

  // Collect unique department names needed
  const neededDepts = [...new Set(TEMPLATES.flatMap(t => t.routes.map(r => r.dept)))];

  const deptsByName = new Map<string, number>();

  for (const name of neededDepts) {
    const dept = await prisma.department.upsert({
      where:  { clientId_name: { clientId: atmsClient.id, name } },
      update: {},
      create: { clientId: atmsClient.id, name, description: `${name} department` },
    });
    deptsByName.set(name, dept.id);
  }
  console.log(`✓ ${neededDepts.length} department(s) ready: ${neededDepts.join(", ")}`);

  // Seed default statuses for each department
  for (const deptId of deptsByName.values()) {
    for (const s of DEFAULT_STATUSES) {
      await prisma.departmentTaskStatus.upsert({
        where:  { departmentId_name: { departmentId: deptId, name: s.name } },
        update: { color: s.color, statusOrder: s.statusOrder },
        create: { departmentId: deptId, ...s },
      });
    }
  }
  console.log("✓ Default task statuses seeded for each department");

  // Create templates (skip if already exists by name)
  console.log("\nSeeding templates:\n");
  let created = 0;
  let skipped = 0;

  for (const t of TEMPLATES) {
    const existing = await prisma.taskTemplate.findFirst({ where: { name: t.name } });
    if (existing) {
      console.log(`  ↩ Skipped (already exists): ${t.name}`);
      skipped++;
      continue;
    }

    await prisma.taskTemplate.create({
      data: {
        name:        t.name,
        description: t.description,
        daysDue:     t.daysDue,
        departmentRoutes: {
          create: t.routes.map(r => ({
            departmentId: deptsByName.get(r.dept)!,
            routeOrder:   r.order,
            daysDue:      r.daysDue,
            subtasks: {
              create: r.subtasks.map(s => ({
                name:         s.name,
                description:  s.description,
                priority:     s.priority,
                daysDue:      s.daysDue,
                subtaskOrder: s.order,
              })),
            },
          })),
        },
      },
    });

    console.log(`  ✓ Created: ${t.name}`);
    created++;
  }

  console.log(`\n✓ Done — ${created} created, ${skipped} skipped`);
}

main()
  .catch((e: unknown) => {
    console.error("Script failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
