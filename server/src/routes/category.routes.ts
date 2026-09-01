import { Router } from "express"
import { z } from "zod"

import { prisma } from "../config/prisma.js"
import { HttpError } from "../utils/http-error.js"
import { categorySchema } from "../validators/schemas.js"

export const categoryRouter = Router()

categoryRouter.get("/", async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.userId, isActive: true },
      orderBy: [{ expenseType: "asc" }, { name: "asc" }],
    })
    res.json({ categories })
  } catch (error) {
    next(error)
  }
})

const categoryColors = {
  FIXED: "#7c3aed",
  VARIABLE: "#16a34a",
  SUBSCRIPTION: "#eab308",
  DEBT: "#ef4444",
  DISCRETIONARY: "#ec4899",
} as const

categoryRouter.post("/", async (req, res, next) => {
  try {
    const input = categorySchema.parse(req.body)
    const existing = await prisma.category.findFirst({
      where: {
        userId: req.userId,
        name: { equals: input.name, mode: "insensitive" },
      },
    })

    if (existing?.isActive) {
      throw new HttpError(409, "Kategori dengan nama tersebut sudah ada.")
    }

    const category = existing
      ? await prisma.category.update({
          where: { id: existing.id },
          data: {
            name: input.name,
            expenseType: input.expenseType,
            color: categoryColors[input.expenseType],
            isActive: true,
          },
        })
      : await prisma.category.create({
          data: {
            ...input,
            userId: req.userId!,
            color: categoryColors[input.expenseType],
          },
        })

    res.status(201).json({ category })
  } catch (error) {
    next(error)
  }
})

categoryRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = z.string().uuid().parse(req.params.id)
    const result = await prisma.category.updateMany({
      where: { id, userId: req.userId, isActive: true },
      data: { isActive: false },
    })
    if (!result.count) throw new HttpError(404, "Kategori tidak ditemukan.")
    res.status(204).send()
  } catch (error) {
    next(error)
  }
})
