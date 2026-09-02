import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import * as helmetModule from "helmet"
import morgan from "morgan"
import { env } from "./config/env.js"
import { requireAuth } from "./middlewares/auth.js"
import { errorHandler, notFound } from "./middlewares/error.js"
import { authRouter } from "./routes/auth.routes.js"
import { budgetRouter, savingRouter } from "./routes/planning.routes.js"
import { categoryRouter } from "./routes/category.routes.js"
import { debtRouter, subscriptionRouter } from "./routes/commitment.routes.js"
import { dashboardRouter } from "./routes/dashboard.routes.js"
import { transactionRouter } from "./routes/transaction.routes.js"
import { walletRouter } from "./routes/wallet.routes.js"

export const app = express()

app.use(helmetModule.default())
app.use(cors({ origin: env.CLIENT_URL, credentials: true }))
app.use(express.json({ limit: "100kb" }))
app.use(cookieParser())
if (env.NODE_ENV !== "test") app.use(morgan("dev"))

app.get("/api/health", (_req, res) => res.json({ status: "ok" }))
app.use("/api/auth", authRouter)
app.use("/api/wallets", requireAuth, walletRouter)
app.use("/api/categories", requireAuth, categoryRouter)
app.use("/api/transactions", requireAuth, transactionRouter)
app.use("/api/budgets", requireAuth, budgetRouter)
app.use("/api/savings", requireAuth, savingRouter)
app.use("/api/subscriptions", requireAuth, subscriptionRouter)
app.use("/api/debts", requireAuth, debtRouter)
app.use("/api/dashboard", requireAuth, dashboardRouter)

app.use(notFound)
app.use(errorHandler)
