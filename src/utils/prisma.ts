import { PrismaClient } from "@prisma/generated";

// Extend the NodeJS global type to include `prisma`
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const db = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = db;
}

export default db;
