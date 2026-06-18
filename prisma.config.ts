import "dotenv/config";
import { defineConfig, env } from "prisma/config";
export default defineConfig({
  schema: "prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
    // Direct (non-pooled) connection required for migrations.
    // Advisory locks used by `prisma migrate deploy` are not supported
    // through connection poolers (e.g. Prisma Accelerate / PgBouncer).
    directUrl: env("DIRECT_URL"),
  },
});