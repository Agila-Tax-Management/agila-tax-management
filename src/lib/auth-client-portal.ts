// src/lib/auth-client-portal.ts
//
// Second BetterAuth instance — exclusively for external client portal users.
// Points to ClientUser / ClientSession / ClientAccount / ClientVerification
// tables instead of the internal User / Session / Account / Verification tables.
//
// BetterAuth's prismaAdapter resolves models by calling prisma[tableName] where
// tableName is BetterAuth's internal name ("user", "session", etc.).  Since our
// models are named ClientUser, ClientSession, etc. we use a lightweight Proxy
// that intercepts those property accesses and redirects them to the correct
// Prisma model accessors — no unofficial BetterAuth internals required.

import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "./db";

const MODEL_MAP: Record<string, string> = {
  user:         "clientUser",
  session:      "clientSession",
  account:      "clientAccount",
  verification: "clientVerification",
};

const clientPrismaProxy = new Proxy(prisma, {
  get(target, prop: string) {
    const mapped = MODEL_MAP[prop];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic model access
    if (mapped) return (target as any)[mapped];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic model access
    return (target as any)[prop];
  },
}) as typeof prisma;

export const clientPortalAuth = betterAuth({
  basePath: "/api/client-auth",
  database: prismaAdapter(clientPrismaProxy, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      active: {
        type: "boolean",
        required: true,
        defaultValue: true,
        input: false,
      },
      clientId: {
        // Set server-side only after signup — never accepted from client payload
        type: "number",
        required: false,
        input: false,
      },
    },
  },
});
