import { Router } from "express"
import { prisma } from "../config/prisma.js"
import { HttpError } from "../utils/http-error.js"
import { monthRange } from "../utils/dates.js"
import { budgetSchema, savingGoalSchema } from "../validators/schemas.js"

export const budgetRouter = Router()
export const savingRouter = Router()

budgetRouter.get("/", async (req, res, next) => {
  try {
    const { start, end } = monthRange(typeof req.query.month === "string" ? req.query.month : undefined)
    const [budgets, expenses] = await Promise.all([
      prisma.budget.findMany({ where: { userId: req.userId, month: { gte: start, lt: end } }, include: { category: true }, orderBy: { createdAt: "asc" } }),
      prisma.transaction.findMany({ where: { userId: req.userId, type: "EXPENSE", date: { gte: start, lt: end } }, select: { amount: true, categoryId: true } }),
    ])
    const totalActual = expenses.reduce((sum, item) => sum + Number(item.amount), 0)
    res.json({ budgets: budgets.map((budget) => ({ ...budget, actual: budget.categoryId ? expenses.filter((item) => item.categoryId === budget.categoryId).reduce((sum, item) => sum + Number(item.amount), 0) : totalActual })) })
  } catch (error) { next(error) }
})

budgetRouter.post("/", async (req, res, next) => {
  try {
    const input = budgetSchema.parse(req.body)
    if (input.categoryId && !(await prisma.category.findFirst({ where: { id: input.categoryId, userId: req.userId } }))) throw new HttpError(400, "Kategori tidak valid.")
    const month = monthRange(input.month).start
    const existing = await prisma.budget.findFirst({ where: { userId: req.userId!, categoryId: input.categoryId ?? null, month } })
    const budget = existing
      ? await prisma.budget.update({ where: { id: existing.id }, data: { amount: input.amount }, include: { category: true } })
      : await prisma.budget.create({ data: { userId: req.userId!, categoryId: input.categoryId ?? null, month, amount: input.amount }, include: { category: true } })
    res.status(201).json({ budget })
  } catch (error) { next(error) }
})

budgetRouter.delete("/:id", async (req, res, next) => {
  try {
    const result = await prisma.budget.deleteMany({ where: { id: req.params.id, userId: req.userId } })
    if (!result.count) throw new HttpError(404, "Budget tidak ditemukan.")
    res.status(204).send()
  } catch (error) { next(error) }
})

savingRouter.get("/", async (req, res, next) => {
  try {
    const { start, end } = monthRange(typeof req.query.month === "string" ? req.query.month : undefined)
    const goals = await prisma.savingGoal.findMany({ where: { userId: req.userId }, include: { transactions: { where: { type: "SAVING" }, select: { amount: true, date: true } } }, orderBy: [{ priority: "asc" }, { createdAt: "asc" }] })
    res.json({ goals: goals.map(({ transactions, ...goal }) => ({ ...goal, currentTotal: transactions.reduce((sum, item) => sum + Number(item.amount), 0), actualThisMonth: transactions.filter((item) => item.date >= start && item.date < end).reduce((sum, item) => sum + Number(item.amount), 0) })) })
  } catch (error) { next(error) }
})

savingRouter.post("/", async (req, res, next) => {
  try {
    const input = savingGoalSchema.parse(req.body)
    const goal = await prisma.savingGoal.create({ data: { ...input, userId: req.userId!, targetDate: input.targetDate ?? null } })
    res.status(201).json({ goal })
  } catch (error) { next(error) }
})

savingRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = savingGoalSchema.partial().parse(req.body)
    const result = await prisma.savingGoal.updateMany({ where: { id: req.params.id, userId: req.userId }, data: input })
    if (!result.count) throw new HttpError(404, "Tujuan tabungan tidak ditemukan.")
    res.json({ goal: await prisma.savingGoal.findUnique({ where: { id: req.params.id } }) })
  } catch (error) { next(error) }
})

savingRouter.delete("/:id", async (req, res, next) => {
  try {
    const result = await prisma.savingGoal.deleteMany({ where: { id: req.params.id, userId: req.userId } })
    if (!result.count) throw new HttpError(404, "Tujuan tabungan tidak ditemukan.")
    res.status(204).send()
  } catch (error) { next(error) }
})
