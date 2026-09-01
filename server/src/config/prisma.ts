import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { env } from "./env.js"

declare global {
  var prisma: PrismaClient | undefined
}

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL })
export const prisma = globalThis.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma
