import { Router } from "express"
import { prisma } from "../config/prisma.js"
import { HttpError } from "../utils/http-error.js"
import { walletSchema, walletTransferSchema } from "../validators/schemas.js"

export const walletRouter = Router()

type WalletBalanceData = {
  openingBalance: unknown
  transactions: { type: string; amount: unknown }[]
  outgoingTransfers: { amount: unknown }[]
  incomingTransfers: { amount: unknown }[]
}

function calculateWalletBalance(wallet: WalletBalanceData) {
  const transactionBalance = wallet.transactions.reduce(
    (sum, item) =>
      sum + (item.type === "INCOME" ? Number(item.amount) : -Number(item.amount)),
    Number(wallet.openingBalance),
  )
  const outgoing = wallet.outgoingTransfers.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  )
  const incoming = wallet.incomingTransfers.reduce(
    (sum, item) => sum + Number(item.amount),
    0,
  )
  return transactionBalance - outgoing + incoming
}

const walletBalanceRelations = {
  transactions: { select: { type: true, amount: true } },
  outgoingTransfers: { select: { amount: true } },
  incomingTransfers: { select: { amount: true } },
} as const

walletRouter.get("/", async (req, res, next) => {
  try {
    const wallets = await prisma.wallet.findMany({
      where: { userId: req.userId },
      include: walletBalanceRelations,
      orderBy: { createdAt: "asc" },
    })
    res.json({
      wallets: wallets.map((wallet) => {
        return {
          id: wallet.id,
          userId: wallet.userId,
          name: wallet.name,
          type: wallet.type,
          openingBalance: wallet.openingBalance,
          createdAt: wallet.createdAt,
          updatedAt: wallet.updatedAt,
          balance: calculateWalletBalance(wallet),
        }
      }),
    })
  } catch (error) { next(error) }
})

walletRouter.post("/transfers", async (req, res, next) => {
  try {
    const input = walletTransferSchema.parse(req.body)
    const transfer = await prisma.$transaction(async (tx) => {
      const wallets = await tx.wallet.findMany({
        where: {
          userId: req.userId,
          id: { in: [input.fromWalletId, input.toWalletId] },
        },
        include: walletBalanceRelations,
      })
      if (wallets.length !== 2) throw new HttpError(400, "Wallet tidak valid.")

      const sourceWallet = wallets.find((wallet) => wallet.id === input.fromWalletId)
      if (!sourceWallet) throw new HttpError(400, "Wallet asal tidak valid.")
      if (calculateWalletBalance(sourceWallet) < input.amount) {
        throw new HttpError(400, "Saldo wallet asal tidak mencukupi.")
      }

      return tx.walletTransfer.create({
        data: {
          userId: req.userId!,
          fromWalletId: input.fromWalletId,
          toWalletId: input.toWalletId,
          amount: input.amount,
          date: input.date,
          note: input.note ?? null,
        },
        include: {
          fromWallet: { select: { id: true, name: true } },
          toWallet: { select: { id: true, name: true } },
        },
      })
    })
    res.status(201).json({ transfer })
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
    const [transactionCount, transferCount] = await Promise.all([
      prisma.transaction.count({ where: { walletId: req.params.id, userId: req.userId } }),
      prisma.walletTransfer.count({
        where: {
          userId: req.userId,
          OR: [
            { fromWalletId: req.params.id },
            { toWalletId: req.params.id },
          ],
        },
      }),
    ])
    const used = transactionCount + transferCount
    if (used) throw new HttpError(409, "Wallet yang sudah memiliki transaksi tidak dapat dihapus.")
    const result = await prisma.wallet.deleteMany({ where: { id: req.params.id, userId: req.userId } })
    if (!result.count) throw new HttpError(404, "Wallet tidak ditemukan.")
    res.status(204).send()
  } catch (error) { next(error) }
})
