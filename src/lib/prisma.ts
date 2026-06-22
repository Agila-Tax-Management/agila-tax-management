// src/lib/prisma.ts
// Re-export the singleton from db.ts to avoid creating a second pg.Pool.
// Both files previously used the same globalThis.prisma key, so whichever
// loaded first would win — and this file lacked the idle-timeout / keepAlive
// settings needed to prevent P1017 "Server has closed the connection" errors.
import prismaDefault from './db';

export const prisma = prismaDefault;
export default prismaDefault;

