import { Router } from "express"
import { randomInt } from "node:crypto"
import { prisma } from "../config/prisma.js"
import { HttpError } from "../utils/http-error.js"
import { monthRange } from "../utils/dates.js"
import { budgetSchema, joinSavingGoalSchema, savingGoalSchema } from "../validators/schemas.js"

export const budgetRouter = Router()
export const savingRouter = Router()

const SHARE_CODE_TTL_MS = 15 * 60_000

async function generateShareCode() {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const shareCode = String(randomInt(100000, 1000000))
    const existing = await prisma.savingGoal.findUnique({ where: { shareCode }, select: { id: true } })
    if (!existing) {
      return {
        shareCode,
        shareCodeExpiresAt: new Date(Date.now() + SHARE_CODE_TTL_MS),
      }
    }
  }

  throw new HttpError(503, "Kode berbagi belum dapat dibuat. Silakan coba lagi.")
}

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
    const now = new Date()
    const goals = await prisma.savingGoal.findMany({
      where: {
        OR: [
          { userId: req.userId },
          { members: { some: { userId: req.userId } } },
        ],
      },
      include: {
        user: { select: { id: true, name: true, avatarEmoji: true } },
        members: {
          include: { user: { select: { id: true, name: true, avatarEmoji: true } } },
          orderBy: { joinedAt: "asc" },
        },
        transactions: { where: { type: "SAVING" }, select: { amount: true, date: true } },
      },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    })
    res.json({
      goals: goals.map(({ transactions, members, user, shareCode, shareCodeExpiresAt, ...goal }) => ({
        ...goal,
        isOwner: goal.userId === req.userId,
        shareCode: goal.userId === req.userId && shareCodeExpiresAt && shareCodeExpiresAt > now ? shareCode : null,
        shareCodeExpiresAt: goal.userId === req.userId ? shareCodeExpiresAt : null,
        shareCodeExpiresInSeconds: goal.userId === req.userId && shareCodeExpiresAt
          ? Math.max(0, Math.ceil((shareCodeExpiresAt.getTime() - now.getTime()) / 1_000))
          : 0,
        owner: user,
        participants: [user, ...members.map((member) => member.user)],
        currentTotal: transactions.reduce((sum, item) => sum + Number(item.amount), 0),
        actualThisMonth: transactions.filter((item) => item.date >= start && item.date < end).reduce((sum, item) => sum + Number(item.amount), 0),
      })),
    })
  } catch (error) { next(error) }
})

savingRouter.post("/", async (req, res, next) => {
  try {
    const input = savingGoalSchema.parse(req.body)
    const shareCodeData = input.isShared
      ? await generateShareCode()
      : { shareCode: null, shareCodeExpiresAt: null }
    const goal = await prisma.savingGoal.create({ data: { ...input, ...shareCodeData, userId: req.userId!, targetDate: input.targetDate ?? null } })
    res.status(201).json({ goal })
  } catch (error) { next(error) }
})

savingRouter.post("/join", async (req, res, next) => {
  try {
    const { code } = joinSavingGoalSchema.parse(req.body)
    const goal = await prisma.savingGoal.findUnique({ where: { shareCode: code }, select: { id: true, userId: true, name: true, isShared: true, isActive: true, shareCodeExpiresAt: true } })
    if (!goal || !goal.isShared || !goal.isActive) throw new HttpError(404, "Kode tabungan tidak ditemukan atau sudah tidak aktif.")
    if (!goal.shareCodeExpiresAt || goal.shareCodeExpiresAt <= new Date()) throw new HttpError(410, "Kode tabungan sudah kedaluwarsa. Minta pemilik membuat kode baru.")
    if (goal.userId === req.userId) throw new HttpError(409, "Kamu adalah pemilik tujuan tabungan ini.")

    await prisma.savingGoalMember.upsert({
      where: { savingGoalId_userId: { savingGoalId: goal.id, userId: req.userId! } },
      update: {},
      create: { savingGoalId: goal.id, userId: req.userId! },
    })
    res.status(201).json({ goal: { id: goal.id, name: goal.name } })
  } catch (error) { next(error) }
})

savingRouter.post("/:id/share-code", async (req, res, next) => {
  try {
    const current = await prisma.savingGoal.findFirst({
      where: { id: req.params.id, userId: req.userId, isShared: true, isActive: true },
      select: { id: true },
    })
    if (!current) throw new HttpError(404, "Tujuan tabungan bersama tidak ditemukan atau kamu bukan pemiliknya.")

    const shareCodeData = await generateShareCode()
    const goal = await prisma.savingGoal.update({
      where: { id: current.id },
      data: shareCodeData,
      select: { shareCode: true, shareCodeExpiresAt: true },
    })
    res.json({ goal })
  } catch (error) { next(error) }
})

savingRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = savingGoalSchema.partial().parse(req.body)
    const current = await prisma.savingGoal.findFirst({ where: { id: req.params.id, userId: req.userId } })
    if (!current) throw new HttpError(404, "Tujuan tabungan tidak ditemukan atau kamu bukan pemiliknya.")

    let shareCodeData = {
      shareCode: current.shareCode,
      shareCodeExpiresAt: current.shareCodeExpiresAt,
    }
    const remainsShared = input.isShared ?? current.isShared
    if (remainsShared && (!current.shareCode || !current.shareCodeExpiresAt || current.shareCodeExpiresAt <= new Date())) {
      shareCodeData = await generateShareCode()
    }
    if (!remainsShared) shareCodeData = { shareCode: null, shareCodeExpiresAt: null }

    const [goal] = await prisma.$transaction([
      prisma.savingGoal.update({ where: { id: current.id }, data: { ...input, ...shareCodeData } }),
      ...(input.isShared === false
        ? [prisma.savingGoalMember.deleteMany({ where: { savingGoalId: current.id } })]
        : []),
    ])
    res.json({ goal })
  } catch (error) { next(error) }
})

savingRouter.delete("/:id/members/me", async (req, res, next) => {
  try {
    const result = await prisma.savingGoalMember.deleteMany({ where: { savingGoalId: req.params.id, userId: req.userId } })
    if (!result.count) throw new HttpError(404, "Keanggotaan tabungan tidak ditemukan.")
    res.status(204).send()
  } catch (error) { next(error) }
})

savingRouter.delete("/:id", async (req, res, next) => {
  try {
    const result = await prisma.savingGoal.deleteMany({ where: { id: req.params.id, userId: req.userId } })
    if (!result.count) throw new HttpError(404, "Tujuan tabungan tidak ditemukan.")
    res.status(204).send()
  } catch (error) { next(error) }
})
