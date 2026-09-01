import { Router } from "express"
import { prisma } from "../config/prisma.js"

export const categoryRouter = Router()

categoryRouter.get("/", async (req, res, next) => {
  try { res.json({ categories: await prisma.category.findMany({ where: { userId: req.userId }, orderBy: [{ expenseType: "asc" }, { name: "asc" }] }) }) } catch (error) { next(error) }
})
