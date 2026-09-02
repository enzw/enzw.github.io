import { Router } from "express"
import { prisma } from "../config/prisma.js"
import { monthRange } from "../utils/dates.js"

export const dashboardRouter = Router()

dashboardRouter.get("/", async (req, res, next) => {
  try {
    const monthValue = typeof req.query.month === "string" ? req.query.month : undefined
    const { start, end } = monthRange(monthValue)
    const comparisonStart = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 5, 1))
    const [current, historical, goals, recent, recentTransfers, overallBudget] = await Promise.all([
      prisma.transaction.findMany({ where: { userId: req.userId, date: { gte: start, lt: end } }, include: { category: true, wallet: { select: { name: true } }, savingGoal: { select: { name: true } } } }),
      prisma.transaction.findMany({ where: { userId: req.userId, date: { gte: comparisonStart, lt: end } }, select: { type: true, amount: true, date: true } }),
      prisma.savingGoal.findMany({ where: { userId: req.userId, isActive: true }, select: { plannedMonthlyAmount: true } }),
      prisma.transaction.findMany({ where: { userId: req.userId }, include: { category: true, wallet: { select: { name: true } }, savingGoal: { select: { name: true } } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 6 }),
      prisma.walletTransfer.findMany({ where: { userId: req.userId }, include: { fromWallet: { select: { id: true, name: true } }, toWallet: { select: { id: true, name: true } } }, orderBy: [{ date: "desc" }, { createdAt: "desc" }], take: 6 }),
      prisma.budget.findFirst({ where: { userId: req.userId, categoryId: null, month: { gte: start, lt: end } } }),
    ])

    const sumType = (type: "INCOME" | "EXPENSE" | "SAVING") => current.filter((item) => item.type === type).reduce((sum, item) => sum + Number(item.amount), 0)
    const income = sumType("INCOME"), expenses = sumType("EXPENSE"), actualSaving = sumType("SAVING")
    const plannedSaving = goals.reduce((sum, goal) => sum + Number(goal.plannedMonthlyAmount), 0)
    const availableBalance = income - expenses - actualSaving
    const plannedRemaining = income - expenses - plannedSaving
    const now = new Date()
    const isCurrentMonth = now.getFullYear() === start.getUTCFullYear() && now.getMonth() === start.getUTCMonth()
    const daysInMonth = new Date(start.getUTCFullYear(), start.getUTCMonth() + 1, 0).getDate()
    const remainingDays = isCurrentMonth ? Math.max(daysInMonth - now.getDate() + 1, 1) : daysInMonth
    const expenseTypes = ["FIXED", "VARIABLE", "SUBSCRIPTION", "DEBT", "DISCRETIONARY"] as const
    const expenseBreakdown = expenseTypes.map((type) => ({ name: type, value: current.filter((item) => item.type === "EXPENSE" && item.expenseType === type).reduce((sum, item) => sum + Number(item.amount), 0) }))
    const incomeSources = (["PRIMARY", "SECONDARY"] as const).map((type) => ({ name: type, value: current.filter((item) => item.type === "INCOME" && item.incomeType === type).reduce((sum, item) => sum + Number(item.amount), 0) }))
    const monthlyComparison = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() - 5 + index, 1))
      const items = historical.filter((item) => item.date.getUTCFullYear() === date.getUTCFullYear() && item.date.getUTCMonth() === date.getUTCMonth())
      const value = (type: "INCOME" | "EXPENSE" | "SAVING") => items.filter((item) => item.type === type).reduce((sum, item) => sum + Number(item.amount), 0)
      return { month: date.toLocaleDateString("id-ID", { month: "short", timeZone: "UTC" }), income: value("INCOME"), expense: value("EXPENSE"), saving: value("SAVING") }
    })
    const recentActivities = [
      ...recent,
      ...recentTransfers.map((transfer) => ({
        id: transfer.id,
        type: "TRANSFER" as const,
        amount: transfer.amount,
        date: transfer.date,
        note: transfer.note,
        fromWallet: transfer.fromWallet,
        toWallet: transfer.toWallet,
        createdAt: transfer.createdAt,
      })),
    ].sort((a, b) => {
      const dateDifference = b.date.getTime() - a.date.getTime()
      return dateDifference || b.createdAt.getTime() - a.createdAt.getTime()
    }).slice(0, 6)

    res.json({
      summary: { income, expenses, plannedSaving, actualSaving, availableBalance, plannedRemaining, safeSpendingPerDay: plannedRemaining / remainingDays, overallBudget: overallBudget ? Number(overallBudget.amount) : 0 },
      expenseBreakdown, incomeSources, monthlyComparison, recentTransactions: recentActivities,
    })
  } catch (error) { next(error) }
})
