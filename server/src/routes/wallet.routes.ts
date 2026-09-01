import { Router } from "express"
import { prisma } from "../config/prisma.js"
import { HttpError } from "../utils/http-error.js"
import { walletSchema } from "../validators/schemas.js"

export const walletRouter = Router()

walletRouter.get("/", async (req, res, next) => {
  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId: req.userId }, include: { transactions: { select: { type: true, amount: true } } }, orderBy: { createdAt: "asc" },
    })
    res.json({ wallets: wallets.map(({ transactions, ...wallet }) => ({
      ...wallet,
      balance: transactions.reduce((sum, item) => sum + (item.type === "INCOME" ? Number(item.amount) : -Number(item.amount)), Number(wallet.openingBalance)),
    })) })
  } catch (error) { next(error) }
})

walletRouter.post("/", async (req, res, next) => {
  try {
    const input = walletSchema.parse(req.body)
    const wallet = await prisma.wallet.create({ data: { ...input, userId: req.userId! } })
    res.status(201).json({ wallet })
  } catch (error) { next(error) }
})

walletRouter.patch("/:id", async (req, res, next) => {
  try {
    const input = walletSchema.partial().parse(req.body)
    const result = await prisma.wallet.updateMany({ where: { id: req.params.id, userId: req.userId }, data: input })
    if (!result.count) throw new HttpError(404, "Wallet tidak ditemukan.")
    res.json({ wallet: await prisma.wallet.findUnique({ where: { id: req.params.id } }) })
  } catch (error) { next(error) }
})

walletRouter.delete("/:id", async (req, res, next) => {
  try {
    const used = await prisma.transaction.count({ where: { walletId: req.params.id, userId: req.userId } })
    if (used) throw new HttpError(409, "Wallet yang sudah memiliki transaksi tidak dapat dihapus.")
    const result = await prisma.wallet.deleteMany({ where: { id: req.params.id, userId: req.userId } })
    if (!result.count) throw new HttpError(404, "Wallet tidak ditemukan.")
    res.status(204).send()
  } catch (error) { next(error) }
})
