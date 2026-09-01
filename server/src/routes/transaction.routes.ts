import { Router } from "express"
import { prisma } from "../config/prisma.js"
import { HttpError } from "../utils/http-error.js"
import { monthRange } from "../utils/dates.js"
import { transactionSchema } from "../validators/schemas.js"

export const transactionRouter = Router()

const include = { wallet: { select: { id: true, name: true } }, category: { select: { id: true, name: true, color: true } }, savingGoal: { select: { id: true, name: true } } } as const

async function validateRelations(userId: string, walletId?: string, categoryId?: string | null, savingGoalId?: string | null) {
  const [wallet, category, savingGoal] = await Promise.all([
    walletId ? prisma.wallet.findFirst({ where: { id: walletId, userId }, select: { id: true } }) : null,
    categoryId ? prisma.category.findFirst({ where: { id: categoryId, userId }, select: { id: true } }) : null,
    savingGoalId ? prisma.savingGoal.findFirst({ where: { id: savingGoalId, userId }, select: { id: true } }) : null,
  ])
  if (walletId && !wallet) throw new HttpError(400, "Wallet tidak valid.")
  if (categoryId && !category) throw new HttpError(400, "Kategori tidak valid.")
  if (savingGoalId && !savingGoal) throw new HttpError(400, "Tujuan tabungan tidak valid.")
}

transactionRouter.get("/", async (req, res, next) => {
  try {
    const { start, end } = monthRange(typeof req.query.month === "string" ? req.query.month : undefined)
    const type = typeof req.query.type === "string" && ["INCOME", "EXPENSE", "SAVING"].includes(req.query.type) ? req.query.type as "INCOME" | "EXPENSE" | "SAVING" : undefined
    const transactions = await prisma.transaction.findMany({
      where: { userId: req.userId, date: { gte: start, lt: end }, ...(type ? { type } : {}) }, include, orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    })
    res.json({ transactions })
  } catch (error) { next(error) }
})

transactionRouter.post("/", async (req, res, next) => {
  try {
    const input = transactionSchema.parse(req.body)
    await validateRelations(req.userId!, input.walletId, input.categoryId, input.savingGoalId)
    const transaction = await prisma.transaction.create({
      data: { ...input, userId: req.userId!, categoryId: input.categoryId ?? null, savingGoalId: input.savingGoalId ?? null, incomeType: input.type === "INCOME" ? input.incomeType : null, expenseType: input.type === "EXPENSE" ? input.expenseType : null }, include,
    })
    res.status(201).json({ transaction })
  } catch (error) { next(error) }
})

transactionRouter.patch("/:id", async (req, res, next) => {
  try {
    const current = await prisma.transaction.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!current) throw new HttpError(404, "Transaksi tidak ditemukan.")
    const input = transactionSchema.partial().parse(req.body)
    await validateRelations(req.userId!, input.walletId, input.categoryId, input.savingGoalId)
    const transaction = await prisma.transaction.update({ where: { id: current.id }, data: input, include })
    res.json({ transaction })
  } catch (error) { next(error) }
})

transactionRouter.delete("/:id", async (req, res, next) => {
  try {
    const result = await prisma.transaction.deleteMany({ where: { id: req.params.id, userId: req.userId } })
    if (!result.count) throw new HttpError(404, "Transaksi tidak ditemukan.")
    res.status(204).send()
  } catch (error) { next(error) }
})
