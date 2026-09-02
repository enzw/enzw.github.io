import type { AvatarEmoji } from "@/lib/profile"

export type TransactionType = "INCOME" | "EXPENSE" | "SAVING"
export type IncomeType = "PRIMARY" | "SECONDARY"
export type ExpenseType = "FIXED" | "VARIABLE" | "SUBSCRIPTION" | "DEBT" | "DISCRETIONARY"
export type WalletType = "CASH" | "BANK" | "E_WALLET"

export type User = { id: string; name: string; email: string; avatarEmoji: AvatarEmoji | null }
export type Wallet = { id: string; name: string; type: WalletType; openingBalance: number | string; balance: number }
export type Category = { id: string; name: string; expenseType: ExpenseType; color?: string | null }
export type SavingGoal = { id: string; name: string; targetAmount: number | string; targetDate?: string | null; priority: number; plannedMonthlyAmount: number | string; currentTotal: number; actualThisMonth: number }
export type Transaction = { id: string; type: TransactionType; incomeType?: IncomeType | null; expenseType?: ExpenseType | null; amount: number | string; date: string; note?: string | null; wallet: Pick<Wallet, "id" | "name">; category?: Pick<Category, "id" | "name" | "color"> | null; savingGoal?: Pick<SavingGoal, "id" | "name"> | null }
export type WalletTransfer = { id: string; type: "TRANSFER"; amount: number | string; date: string; note?: string | null; fromWallet: Pick<Wallet, "id" | "name">; toWallet: Pick<Wallet, "id" | "name"> }
export type TransactionHistoryItem = Transaction | WalletTransfer
export type Budget = { id: string; categoryId?: string | null; month: string; amount: number | string; actual: number; category?: Category | null }
export type Subscription = { id: string; name: string; amount: number | string; billingDay: number; isActive: boolean; note?: string | null; wallet?: Pick<Wallet, "id" | "name"> | null }
export type Debt = { id: string; name: string; originalAmount: number | string; remainingAmount: number | string; monthlyPayment?: number | string | null; dueDate?: string | null; isPaid: boolean; note?: string | null; wallet?: Pick<Wallet, "id" | "name"> | null }
export type DashboardData = { summary: { income: number; expenses: number; plannedSaving: number; actualSaving: number; availableBalance: number; plannedRemaining: number; safeSpendingPerDay: number; overallBudget: number }; expenseBreakdown: { name: ExpenseType; value: number }[]; incomeSources: { name: IncomeType; value: number }[]; monthlyComparison: { month: string; income: number; expense: number; saving: number }[]; recentTransactions: TransactionHistoryItem[] }
