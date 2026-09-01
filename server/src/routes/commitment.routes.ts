import { Router } from "express"
import { prisma } from "../config/prisma.js"
import { HttpError } from "../utils/http-error.js"
import { debtSchema, subscriptionSchema } from "../validators/schemas.js"

export const subscriptionRouter = Router()
export const debtRouter = Router()

subscriptionRouter.get("/", async (req, res, next) => {
  try { res.json({ subscriptions: await prisma.subscription.findMany({ where: { userId: req.userId }, include: { wallet: { select: { id: true, name: true } } }, orderBy: [{ isActive: "desc" }, { billingDay: "asc" }] }) }) } catch (error) { next(error) }
})
subscriptionRouter.post("/", async (req, res, next) => {
  try { const input = subscriptionSchema.parse(req.body); res.status(201).json({ subscription: await prisma.subscription.create({ data: { ...input, userId: req.userId!, walletId: input.walletId ?? null, note: input.note ?? null } }) }) } catch (error) { next(error) }
})
subscriptionRouter.patch("/:id", async (req, res, next) => {
  try { const input = subscriptionSchema.partial().parse(req.body); const result = await prisma.subscription.updateMany({ where: { id: req.params.id, userId: req.userId }, data: input }); if (!result.count) throw new HttpError(404, "Langganan tidak ditemukan."); res.json({ subscription: await prisma.subscription.findUnique({ where: { id: req.params.id } }) }) } catch (error) { next(error) }
})
subscriptionRouter.delete("/:id", async (req, res, next) => {
  try { const result = await prisma.subscription.deleteMany({ where: { id: req.params.id, userId: req.userId } }); if (!result.count) throw new HttpError(404, "Langganan tidak ditemukan."); res.status(204).send() } catch (error) { next(error) }
})

debtRouter.get("/", async (req, res, next) => {
  try { res.json({ debts: await prisma.debt.findMany({ where: { userId: req.userId }, include: { wallet: { select: { id: true, name: true } } }, orderBy: [{ isPaid: "asc" }, { dueDate: "asc" }] }) }) } catch (error) { next(error) }
})
debtRouter.post("/", async (req, res, next) => {
  try { const input = debtSchema.parse(req.body); res.status(201).json({ debt: await prisma.debt.create({ data: { ...input, userId: req.userId!, walletId: input.walletId ?? null, monthlyPayment: input.monthlyPayment ?? null, dueDate: input.dueDate ?? null, note: input.note ?? null } }) }) } catch (error) { next(error) }
})
debtRouter.patch("/:id", async (req, res, next) => {
  try { const input = debtSchema.partial().parse(req.body); const result = await prisma.debt.updateMany({ where: { id: req.params.id, userId: req.userId }, data: input }); if (!result.count) throw new HttpError(404, "Hutang tidak ditemukan."); res.json({ debt: await prisma.debt.findUnique({ where: { id: req.params.id } }) }) } catch (error) { next(error) }
})
debtRouter.delete("/:id", async (req, res, next) => {
  try { const result = await prisma.debt.deleteMany({ where: { id: req.params.id, userId: req.userId } }); if (!result.count) throw new HttpError(404, "Hutang tidak ditemukan."); res.status(204).send() } catch (error) { next(error) }
})
