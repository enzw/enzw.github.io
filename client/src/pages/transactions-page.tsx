import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  ArrowDownLeft,
  ArrowRightLeft,
  ArrowUpRight,
  PiggyBank,
  ReceiptText,
} from "lucide-react"
import { toast } from "sonner"

import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TransactionDialog } from "@/components/transactions/transaction-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  currentMonth,
  formatCurrency,
  formatDate,
  labels,
} from "@/lib/format"
import { api, errorMessage } from "@/services/api"
import type {
  TransactionHistoryItem,
  TransactionType,
} from "@/types/finance"

type HistoryType = TransactionType | "TRANSFER"

const iconByType = {
  INCOME: ArrowDownLeft,
  EXPENSE: ArrowUpRight,
  SAVING: PiggyBank,
  TRANSFER: ArrowRightLeft,
}

function activityName(item: TransactionHistoryItem) {
  if (item.type === "TRANSFER") {
    return item.note || `${item.fromWallet.name} ke ${item.toWallet.name}`
  }
  return (
    item.note ||
    item.category?.name ||
    item.savingGoal?.name ||
    labels[item.type]
  )
}

function activityWallet(item: TransactionHistoryItem) {
  return item.type === "TRANSFER"
    ? `${item.fromWallet.name} ke ${item.toWallet.name}`
    : item.wallet.name
}

function activityClassification(item: TransactionHistoryItem) {
  if (item.type === "TRANSFER") return "Transfer internal"
  if (item.incomeType) return labels[item.incomeType]
  if (item.expenseType) return labels[item.expenseType]
  return "Tabungan"
}

function amountPrefix(item: TransactionHistoryItem) {
  if (item.type === "TRANSFER") return ""
  return item.type === "INCOME" ? "+" : "−"
}

export function TransactionsPage({
  initialType,
}: {
  initialType?: TransactionType
}) {
  const [params] = useSearchParams()
  const [month, setMonth] = useState(currentMonth())
  const [type, setType] = useState<HistoryType | "ALL">(
    initialType ?? "ALL",
  )
  const [items, setItems] = useState<TransactionHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const query = new URLSearchParams({ month })
      if (type !== "ALL") query.set("type", type)
      const { data } = await api.get<{
        transactions: TransactionHistoryItem[]
      }>(
        `/transactions?${query}`,
      )
      setItems(data.transactions)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setLoading(false)
    }
  }, [month, type])

  useEffect(() => {
    void load()
  }, [load])

  const total = useMemo(
    () => items.reduce(
      (sum, item) =>
        item.type === "TRANSFER" && type !== "TRANSFER"
          ? sum
          : sum + Number(item.amount),
      0,
    ),
    [items, type],
  )

  const remove = async (item: TransactionHistoryItem) => {
    try {
      const isTransfer = item.type === "TRANSFER"
      await api.delete(
        isTransfer
          ? `/wallets/transfers/${item.id}`
          : `/transactions/${item.id}`,
      )
      toast.success(isTransfer ? "Transfer dihapus" : "Transaksi dihapus")
      await load()
    } catch (cause) {
      toast.error("Gagal menghapus", { description: errorMessage(cause) })
    }
  }

  const title =
    initialType === "INCOME"
      ? "Pemasukan"
      : initialType === "EXPENSE"
        ? "Pengeluaran"
        : "Transaksi"

  return (
    <div className="page-container">
      <PageHeader
        title={title}
        description="Semua pergerakan uang tercatat dan terhubung otomatis."
        action={
          <TransactionDialog
            initialType={initialType}
            onSaved={() => void load()}
            openByDefault={params.get("add") === "1"}
          />
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input
          aria-label="Pilih bulan"
          type="month"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
          className="w-auto"
        />
        {!initialType && (
          <Select
            value={type}
            onValueChange={(value) =>
              setType(value as HistoryType | "ALL")
            }
          >
            <SelectTrigger>
              <SelectValue>
                {type === "ALL" ? "Semua jenis" : labels[type]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua jenis</SelectItem>
              {(["INCOME", "EXPENSE", "SAVING", "TRANSFER"] as const).map((value) => (
                <SelectItem value={value} key={value}>
                  {labels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="ml-auto text-sm text-muted-foreground">
          {type === "TRANSFER" ? "Total dipindahkan" : "Total"}{" "}
          <strong className="finance-number text-foreground">
            {formatCurrency(total)}
          </strong>
        </p>
      </div>
      <Card>
        <CardContent className="px-0">
          {loading ? (
            <div className="space-y-3 p-5">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-14" />
              ))}
            </div>
          ) : error ? (
            <EmptyState
              icon={ReceiptText}
              title="Data belum dapat dimuat"
              description={error}
              action={
                <Button variant="outline" onClick={() => void load()}>
                  Coba lagi
                </Button>
              }
            />
          ) : !items.length ? (
            <EmptyState
              icon={ReceiptText}
              title="Belum ada transaksi"
              description="Mulai dengan mencatat pemasukan, pengeluaran, tabungan, atau transfer pertamamu."
              action={
                <TransactionDialog
                  initialType={initialType}
                  onSaved={() => void load()}
                />
              }
            />
          ) : (
            <>
              <div className="divide-y md:hidden">
                {items.map((item) => {
                  const Icon = iconByType[item.type]
                  return (
                    <div className="flex items-center gap-3 p-4" key={item.id}>
                      <span
                        className={`grid size-10 place-items-center rounded-2xl ${
                          item.type === "INCOME"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : item.type === "SAVING"
                              ? "bg-blue-500/10 text-blue-600"
                              : item.type === "TRANSFER"
                                ? "bg-primary/10 text-primary"
                                : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">
                          {activityName(item)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.date)} · {activityWallet(item)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <p
                          className={`finance-number font-semibold ${
                            item.type === "INCOME"
                              ? "text-emerald-600"
                              : item.type === "EXPENSE"
                                ? "text-primary"
                                : ""
                          }`}
                        >
                          {amountPrefix(item)}
                          {formatCurrency(item.amount)}
                        </p>
                        <ConfirmDeleteButton
                          label={item.type === "TRANSFER" ? "Hapus transfer" : "Hapus transaksi"}
                          title={item.type === "TRANSFER" ? "Hapus transfer?" : "Hapus transaksi?"}
                          description={item.type === "TRANSFER" ? "Saldo wallet asal dan tujuan akan dikembalikan seperti sebelum transfer." : "Ringkasan keuangan dan saldo wallet akan dihitung ulang."}
                          onConfirm={() => remove(item)}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
              <Table className="hidden md:table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaksi</TableHead>
                    <TableHead>Klasifikasi</TableHead>
                    <TableHead>Wallet</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead className="text-right">Nominal</TableHead>
                    <TableHead className="w-12" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const Icon = iconByType[item.type]
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <span className="grid size-9 place-items-center rounded-xl bg-muted">
                              <Icon className="size-4" />
                            </span>
                            <div>
                              <p className="font-medium">
                                {activityName(item)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {labels[item.type]}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {activityClassification(item)}
                          </Badge>
                        </TableCell>
                        <TableCell>{activityWallet(item)}</TableCell>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell
                          className={`finance-number text-right font-semibold ${
                            item.type === "INCOME"
                              ? "text-emerald-600"
                              : item.type === "EXPENSE"
                                ? "text-primary"
                                : ""
                          }`}
                        >
                          {amountPrefix(item)}
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell>
                          <ConfirmDeleteButton
                            label={item.type === "TRANSFER" ? "Hapus transfer" : "Hapus transaksi"}
                            title={item.type === "TRANSFER" ? "Hapus transfer?" : "Hapus transaksi?"}
                            description={item.type === "TRANSFER" ? "Saldo wallet asal dan tujuan akan dikembalikan seperti sebelum transfer." : "Ringkasan keuangan dan saldo wallet akan dihitung ulang."}
                            onConfirm={() => remove(item)}
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
