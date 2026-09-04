import { Router, type Response } from "express"
import bcrypt from "bcryptjs"
import { prisma } from "../config/prisma.js"
import { env } from "../config/env.js"
import { requireAuth, signToken } from "../middlewares/auth.js"
import { authRateLimit } from "../middlewares/rate-limit.js"
import { HttpError } from "../utils/http-error.js"
import { loginSchema, profileSchema, registerSchema } from "../validators/schemas.js"

export const authRouter = Router()

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  avatarEmoji: true,
} as const

const defaultCategories = [
  ["Kos & tagihan", "FIXED", "#7c3aed"], ["Makanan", "VARIABLE", "#16a34a"],
  ["Transportasi", "VARIABLE", "#0891b2"], ["Langganan", "SUBSCRIPTION", "#eab308"],
  ["Pembayaran hutang", "DEBT", "#ef4444"], ["Hiburan", "DISCRETIONARY", "#ec4899"],
] as const

function setAuthCookie(res: Response, token: string) {
  res.cookie("access_token", token, {
    httpOnly: true,
    sameSite: env.NODE_ENV === "production" ? "none" : "lax",
    secure: env.NODE_ENV === "production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  })
}

authRouter.post("/register", authRateLimit, async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body)
    const exists = await prisma.user.findUnique({ where: { email: input.email } })
    if (exists) throw new HttpError(409, "Email sudah digunakan.")
    const passwordHash = await bcrypt.hash(input.password, 12)
    const user = await prisma.user.create({
      data: {
        name: input.name, email: input.email, passwordHash,
        wallets: { create: { name: "Cash", type: "CASH", openingBalance: 0 } },
        categories: { create: defaultCategories.map(([name, expenseType, color]) => ({ name, expenseType, color })) },
      },
      select: publicUserSelect,
    })
    setAuthCookie(res, signToken(user.id))
    res.status(201).json({ user })
  } catch (error) { next(error) }
})

authRouter.post("/login", authRateLimit, async (req, res, next) => {
  try {
    const input = loginSchema.parse(req.body)
    const user = await prisma.user.findUnique({ where: { email: input.email } })
    if (!user) throw new HttpError(404, "Akun dengan email ini belum terdaftar. Silakan daftar terlebih dahulu.")
    if (!(await bcrypt.compare(input.password, user.passwordHash))) throw new HttpError(401, "Kata sandi salah.")
    setAuthCookie(res, signToken(user.id))
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarEmoji: user.avatarEmoji,
      },
    })
  } catch (error) { next(error) }
})

authRouter.post("/logout", (_req, res) => {
  res.clearCookie("access_token", { path: "/" })
  res.status(204).send()
})

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: publicUserSelect })
    if (!user) throw new HttpError(401, "Pengguna tidak ditemukan.")
    res.json({ user })
  } catch (error) { next(error) }
})

authRouter.patch("/profile", requireAuth, async (req, res, next) => {
  try {
    const input = profileSchema.parse(req.body)
    const result = await prisma.user.updateMany({
      where: { id: req.userId },
      data: input,
    })
    if (!result.count) throw new HttpError(404, "Pengguna tidak ditemukan.")
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: publicUserSelect,
    })
    res.json({ user })
  } catch (error) { next(error) }
})
