import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { ArrowDownLeft, ArrowRight, ArrowUpRight, CalendarDays, CircleDollarSign, PiggyBank, ReceiptText, Sparkles, Target, WalletCards } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { AnimatedCurrency } from "@/components/dashboard/animated-currency"
import { SummaryCard } from "@/components/dashboard/summary-card"
import { TransactionDialog } from "@/components/transactions/transaction-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useAuth } from "@/features/auth/auth-context"
import { currentMonth, formatCurrency, formatDate, labels } from "@/lib/format"
import { api, errorMessage } from "@/services/api"
import type { DashboardData } from "@/types/finance"

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"]
const chartCurrency = (value: number) => {
  const absoluteValue = Math.abs(value)
  const unit = absoluteValue >= 1_000_000_000
    ? { divisor: 1_000_000_000, suffix: "M" }
    : absoluteValue >= 1_000_000
      ? { divisor: 1_000_000, suffix: "jt" }
      : absoluteValue >= 1_000
        ? { divisor: 1_000, suffix: "rb" }
        : null

  if (!unit) return new Intl.NumberFormat("id-ID").format(value)

  const scaledValue = value / unit.divisor
  return `${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: Math.abs(scaledValue) < 10 ? 2 : 1,
  }).format(scaledValue)} ${unit.suffix}`
}

export function DashboardPage({ statisticsOnly = false }: { statisticsOnly?: boolean }) {
  const { user } = useAuth(); const [data, setData] = useState<DashboardData | null>(null); const [loading, setLoading] = useState(true); const [error, setError] = useState("")
  const load = async () => { setLoading(true); setError(""); try { const response = await api.get<DashboardData>(`/dashboard?month=${currentMonth()}`); setData(response.data) } catch (cause) { setError(errorMessage(cause)) } finally { setLoading(false) } }
  useEffect(() => { void load() }, [])
  const hasData = Boolean(data && (data.summary.income || data.summary.expenses || data.summary.actualSaving))
  const savingProgress = data?.summary.plannedSaving ? Math.min(100, (data.summary.actualSaving / data.summary.plannedSaving) * 100) : 0
  const spendingProgress = data?.summary.overallBudget ? Math.min(100, (data.summary.expenses / data.summary.overallBudget) * 100) : 0
  const insight = useMemo(() => { if (!data) return ""; const secondary = data.incomeSources.find((item) => item.name === "SECONDARY")?.value ?? 0; if (data.summary.income && secondary) return `${Math.round((secondary / data.summary.income) * 100)}% pemasukanmu bulan ini berasal dari pendapatan tambahan.`; if (data.summary.plannedSaving) return `Target tabungan bulan ini sudah tercapai ${Math.round(savingProgress)}%.`; return "Catat transaksi untuk mulai melihat insight keuanganmu." }, [data, savingProgress])
  const expenseChartData = data?.expenseBreakdown
    .map((item, index) => ({
      ...item,
      label: labels[item.name],
      color: COLORS[index],
    }))
    .filter((item) => item.value) ?? []
  const incomeChartData = data?.incomeSources
    .map((item, index) => ({
      ...item,
      label: labels[item.name],
      color: COLORS[index + 1],
    }))
    .filter((item) => item.value) ?? []
  if (loading) return <div className="page-container space-y-5"><Skeleton className="h-20" /><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-32" />)}</div><Skeleton className="h-80" /></div>
  if (!data || error) return <div className="page-container"><EmptyState icon={ReceiptText} title="Dashboard belum dapat dimuat" description={error || "Data tidak tersedia."} action={<Button onClick={() => void load()}>Coba lagi</Button>} /></div>
  return <div className="page-container"><PageHeader title={statisticsOnly ? "Statistik" : `Halo, ${user?.name.split(" ")[0]} 👋`} description={statisticsOnly ? "Pola keuanganmu dalam enam bulan terakhir." : "Ini kondisi uangmu bulan ini."} action={!statisticsOnly && <TransactionDialog onSaved={() => void load()} />} />{!statisticsOnly && <><Card className="mb-4 bg-primary text-primary-foreground"><CardContent className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-sm text-primary-foreground/70">Sisa uang tersedia</p><p className="finance-number mt-1 text-3xl font-semibold sm:text-4xl"><AnimatedCurrency value={data.summary.availableBalance} /></p><div className="mt-4 flex flex-wrap gap-2"><Badge className="bg-white/15 text-white">{formatCurrency(data.summary.safeSpendingPerDay)}/hari aman</Badge><Badge className="bg-white/15 text-white">Setelah tabungan aktual</Badge></div></div><WalletCards className="hidden size-20 text-white/15 sm:block" /></CardContent></Card><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"><SummaryCard label="Total pemasukan" value={data.summary.income} icon={ArrowDownLeft} tone="income" /><SummaryCard label="Total pengeluaran" value={data.summary.expenses} icon={ArrowUpRight} tone="expense" /><SummaryCard label="Tabungan aktual" value={data.summary.actualSaving} icon={PiggyBank} tone="saving" /><SummaryCard label="Sisa sesuai rencana" value={data.summary.plannedRemaining} icon={Target} hint="Pemasukan - (pengeluaran + tabungan bulanan)" /></div>{!hasData && <Card className="mt-4"><EmptyState icon={CircleDollarSign} title="Mulai dari pemasukan pertamamu" description="Catat pemasukan agar WangWang bisa menghitung budget, tabungan, dan sisa uang secara otomatis." action={<TransactionDialog initialType="INCOME" onSaved={() => void load()} />} /></Card>}</>}
  <div className="mt-4 grid gap-4 xl:grid-cols-2"><Card><CardHeader><CardTitle>Pengeluaran</CardTitle><CardDescription>Distribusi berdasarkan klasifikasi.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-[1fr_1.2fr] sm:items-center"><div className="h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={expenseChartData} dataKey="value" nameKey="label" innerRadius={55} outerRadius={80} paddingAngle={3}>{expenseChartData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value) => formatCurrency(Number(value))} /></PieChart></ResponsiveContainer></div><div className="space-y-3">{data.expenseBreakdown.map((item, index) => <div className="flex items-center gap-2 text-sm" key={item.name}><span className="size-2.5 rounded-full" style={{ backgroundColor: COLORS[index] }} /><span className="flex-1 text-muted-foreground">{labels[item.name]}</span><strong className="finance-number">{formatCurrency(item.value, true)}</strong></div>)}</div></CardContent></Card><Card><CardHeader><CardTitle>Sumber pemasukan</CardTitle><CardDescription>Utama dibandingkan tambahan.</CardDescription></CardHeader><CardContent className="grid gap-4 sm:grid-cols-[1fr_1.2fr] sm:items-center"><div className="h-52"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={incomeChartData} dataKey="value" nameKey="label" innerRadius={55} outerRadius={80} paddingAngle={3}>{incomeChartData.map((item) => <Cell key={item.name} fill={item.color} />)}</Pie><Tooltip formatter={(value) => formatCurrency(Number(value))} /></PieChart></ResponsiveContainer></div><div className="space-y-4">{data.incomeSources.map((item, index) => <div key={item.name}><div className="mb-1 flex justify-between text-sm"><span className="text-muted-foreground">{labels[item.name]}</span><strong>{formatCurrency(item.value, true)}</strong></div><Progress value={data.summary.income ? (item.value / data.summary.income) * 100 : 0} className={index === 1 ? "[&_[data-slot=progress-indicator]]:bg-chart-3" : ""} /></div>)}</div></CardContent></Card></div>
  <Card className="mt-4"><CardHeader><CardTitle>Perbandingan bulanan</CardTitle><CardDescription>Pemasukan, pengeluaran, dan tabungan enam bulan terakhir.</CardDescription></CardHeader><CardContent><div className="h-72"><ResponsiveContainer width="100%" height="100%"><BarChart data={data.monthlyComparison} margin={{ left: -18, right: 8 }}><CartesianGrid vertical={false} stroke="var(--border)" /><XAxis dataKey="month" tickLine={false} axisLine={false} /><YAxis tickFormatter={chartCurrency} tickLine={false} axisLine={false} width={70} /><Tooltip formatter={(value) => formatCurrency(Number(value))} cursor={{ fill: "var(--muted)" }} /><Legend /><Bar name="Pemasukan" dataKey="income" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /><Bar name="Pengeluaran" dataKey="expense" fill="var(--chart-4)" radius={[6, 6, 0, 0]} /><Bar name="Tabungan" dataKey="saving" fill="var(--chart-2)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
  {!statisticsOnly && <div className="mt-4 grid gap-4 xl:grid-cols-[.9fr_1.1fr]"><Card><CardHeader><CardTitle>Rencana bulan ini</CardTitle><CardDescription>Planned vs actual saving.</CardDescription></CardHeader><CardContent className="space-y-5"><div><div className="mb-2 flex justify-between text-sm"><span>Tabungan</span><span className="finance-number font-medium">{Math.round(savingProgress)}%</span></div><Progress value={savingProgress} /><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>Aktual {formatCurrency(data.summary.actualSaving)}</span><span>Rencana {formatCurrency(data.summary.plannedSaving)}</span></div></div>{data.summary.overallBudget > 0 && <div><div className="mb-2 flex justify-between text-sm"><span>Budget pengeluaran</span><span>{Math.round(spendingProgress)}%</span></div><Progress value={spendingProgress} className="[&_[data-slot=progress-indicator]]:bg-chart-3" /></div>}<div className="flex gap-3 rounded-2xl bg-primary/5 p-4 text-sm"><Sparkles className="mt-0.5 size-4 shrink-0 text-primary" /><p>{insight}</p></div></CardContent></Card><Card><CardHeader><CardTitle>Transaksi terbaru</CardTitle><CardDescription>Aktivitas terakhir di semua wallet.</CardDescription><CardAction><Button variant="ghost" size="sm" render={<Link to="/transactions" />}>Lihat semua<ArrowRight /></Button></CardAction></CardHeader><CardContent>{!data.recentTransactions.length ? <EmptyState icon={CalendarDays} title="Belum ada aktivitas" description="Transaksi terbaru akan muncul di sini." /> : <div className="divide-y">{data.recentTransactions.map((item) => <div className="flex items-center gap-3 py-3 first:pt-0 last:pb-0" key={item.id}><span className={`grid size-9 place-items-center rounded-xl ${item.type === "INCOME" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted"}`}>{item.type === "INCOME" ? <ArrowDownLeft className="size-4" /> : item.type === "SAVING" ? <PiggyBank className="size-4" /> : <ArrowUpRight className="size-4" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.note || item.category?.name || item.savingGoal?.name || labels[item.type]}</p><p className="text-xs text-muted-foreground">{formatDate(item.date)} · {item.wallet.name}</p></div><p className={`finance-number text-sm font-semibold ${item.type === "INCOME" ? "text-emerald-600" : ""}`}>{item.type === "INCOME" ? "+" : "−"}{formatCurrency(item.amount)}</p></div>)}</div>}</CardContent></Card></div>}</div>
}
