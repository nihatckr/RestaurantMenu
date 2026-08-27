import { PrismaClient } from "@prisma/client";

// Single PrismaClient instance behind a globalThis guard so Next.js dev/HMR and
// serverless invocations don't open a new connection each reload
// (ARCHITECTURE.md → Prisma conventions). Only the data-access layer imports this.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
