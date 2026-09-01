import { Navigate, Route, Routes } from "react-router-dom"
import { AppLayout } from "@/layouts/app-layout"
import { AuthPage } from "@/pages/auth-page"
import { BudgetsPage } from "@/pages/budgets-page"
import { CommitmentsPage } from "@/pages/commitments-page"
import { DashboardPage } from "@/pages/dashboard-page"
import { SavingsPage } from "@/pages/savings-page"
import { SettingsPage } from "@/pages/settings-page"
import { TransactionsPage } from "@/pages/transactions-page"
import { WalletsPage } from "@/pages/wallets-page"
import { AuthProvider, useAuth } from "@/features/auth/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"

function ProtectedApp() {
  const { user, loading } = useAuth()
  if (loading) return <div className="mx-auto grid min-h-screen max-w-7xl gap-4 p-6"><Skeleton className="h-16" /><Skeleton className="h-[70vh]" /></div>
  if (!user) return <Navigate to="/auth" replace />
  return <AppLayout />
}

function PublicAuth() {
  const { user, loading } = useAuth()
  if (loading) return <div className="grid min-h-screen place-items-center"><Skeleton className="h-96 w-[min(28rem,90vw)]" /></div>
  return user ? <Navigate to="/" replace /> : <AuthPage />
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/auth" element={<PublicAuth />} />
        <Route element={<ProtectedApp />}>
          <Route index element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="income" element={<TransactionsPage initialType="INCOME" />} />
          <Route path="expenses" element={<TransactionsPage initialType="EXPENSE" />} />
          <Route path="budgets" element={<BudgetsPage />} />
          <Route path="savings" element={<SavingsPage />} />
          <Route path="wallets" element={<WalletsPage />} />
          <Route path="subscriptions" element={<CommitmentsPage kind="subscriptions" />} />
          <Route path="debts" element={<CommitmentsPage kind="debts" />} />
          <Route path="statistics" element={<DashboardPage statisticsOnly />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  )
}
