import { z } from "zod"

const money = z.coerce.number().positive("Nominal harus lebih dari 0")
const optionalId = z.string().uuid().nullish()

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(72),
})

export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) })

export const profileAvatars = [
  "🐻", "🐶", "🐧", "🦊", "🐼",
  "🐰", "🐱", "🐹", "🐥", "🦋",
] as const

export const profileSchema = z.object({
  name: z.string().trim().min(2).max(60),
  avatarEmoji: z.enum(profileAvatars).nullable(),
})

export const walletSchema = z.object({
  name: z.string().trim().min(2).max(40),
  type: z.enum(["CASH", "BANK", "E_WALLET"]),
  openingBalance: z.coerce.number().min(0).default(0),
})

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(40),
  expenseType: z.enum([
    "FIXED",
    "VARIABLE",
    "SUBSCRIPTION",
    "DEBT",
    "DISCRETIONARY",
  ]),
})

export const transactionSchema = z.object({
  walletId: z.string().uuid(),
  categoryId: optionalId,
  savingGoalId: optionalId,
  type: z.enum(["INCOME", "EXPENSE", "SAVING"]),
  incomeType: z.enum(["PRIMARY", "SECONDARY"]).nullish(),
  expenseType: z.enum(["FIXED", "VARIABLE", "SUBSCRIPTION", "DEBT", "DISCRETIONARY"]).nullish(),
  amount: money,
  date: z.coerce.date(),
  note: z.string().trim().max(200).nullish(),
}).superRefine((data, ctx) => {
  if (data.type === "INCOME" && !data.incomeType) ctx.addIssue({ code: "custom", path: ["incomeType"], message: "Jenis pendapatan wajib dipilih" })
  if (data.type === "EXPENSE" && !data.expenseType) ctx.addIssue({ code: "custom", path: ["expenseType"], message: "Jenis pengeluaran wajib dipilih" })
  if (data.type === "SAVING" && !data.savingGoalId) ctx.addIssue({ code: "custom", path: ["savingGoalId"], message: "Tujuan tabungan wajib dipilih" })
})

export const budgetSchema = z.object({
  categoryId: optionalId,
  month: z.string().regex(/^\d{4}-\d{2}$/),
  amount: money,
})

export const savingGoalSchema = z.object({
  name: z.string().trim().min(2).max(60),
  targetAmount: money,
  targetDate: z.coerce.date().nullish(),
  priority: z.coerce.number().int().min(1).max(99).default(1),
  plannedMonthlyAmount: z.coerce.number().min(0).default(0),
})

export const subscriptionSchema = z.object({
  name: z.string().trim().min(2).max(60), amount: money,
  billingDay: z.coerce.number().int().min(1).max(31), walletId: optionalId,
  isActive: z.boolean().default(true), note: z.string().trim().max(200).nullish(),
})

export const debtSchema = z.object({
  name: z.string().trim().min(2).max(60), originalAmount: money,
  remainingAmount: z.coerce.number().min(0), monthlyPayment: z.coerce.number().positive().nullish(),
  dueDate: z.coerce.date().nullish(), walletId: optionalId, isPaid: z.boolean().default(false),
  note: z.string().trim().max(200).nullish(),
})
