import { useCallback, useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  ArrowDownLeft,
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
import type { Transaction, TransactionType } from "@/types/finance"

const iconByType = {
  INCOME: ArrowDownLeft,
  EXPENSE: ArrowUpRight,
  SAVING: PiggyBank,
}

export function TransactionsPage({
  initialType,
}: {
  initialType?: TransactionType
}) {
  const [params] = useSearchParams()
  const [month, setMonth] = useState(currentMonth())
  const [type, setType] = useState<TransactionType | "ALL">(
    initialType ?? "ALL",
  )
  const [items, setItems] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const query = new URLSearchParams({ month })
      if (type !== "ALL") query.set("type", type)
      const { data } = await api.get<{ transactions: Transaction[] }>(
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
    () => items.reduce((sum, item) => sum + Number(item.amount), 0),
    [items],
  )

  const remove = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`)
      toast.success("Transaksi dihapus")
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
              setType(value as TransactionType | "ALL")
            }
          >
            <SelectTrigger>
              <SelectValue>
                {type === "ALL" ? "Semua jenis" : labels[type]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua jenis</SelectItem>
              {(["INCOME", "EXPENSE", "SAVING"] as const).map((value) => (
                <SelectItem value={value} key={value}>
                  {labels[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <p className="ml-auto text-sm text-muted-foreground">
          Total{" "}
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
              description="Mulai dengan mencatat pemasukan, pengeluaran, atau tabungan pertamamu."
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
                  const name =
                    item.note ||
                    item.category?.name ||
                    item.savingGoal?.name ||
                    labels[item.type]
                  return (
                    <div className="flex items-center gap-3 p-4" key={item.id}>
                      <span
                        className={`grid size-10 place-items-center rounded-2xl ${
                          item.type === "INCOME"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : item.type === "SAVING"
                              ? "bg-blue-500/10 text-blue-600"
                              : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(item.date)} · {item.wallet.name}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <p
                          className={`finance-number font-semibold ${
                            item.type === "INCOME" ? "text-emerald-600" : ""
                          }`}
                        >
                          {item.type === "INCOME" ? "+" : "−"}
                          {formatCurrency(item.amount)}
                        </p>
                        <ConfirmDeleteButton
                          label="Hapus transaksi"
                          title="Hapus transaksi?"
                          description="Ringkasan keuangan dan saldo wallet akan dihitung ulang."
                          onConfirm={() => remove(item.id)}
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
                                {item.note ||
                                  item.category?.name ||
                                  item.savingGoal?.name ||
                                  labels[item.type]}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {labels[item.type]}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {item.incomeType
                              ? labels[item.incomeType]
                              : item.expenseType
                                ? labels[item.expenseType]
                                : "Tabungan"}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.wallet.name}</TableCell>
                        <TableCell>{formatDate(item.date)}</TableCell>
                        <TableCell
                          className={`finance-number text-right font-semibold ${
                            item.type === "INCOME" ? "text-emerald-600" : ""
                          }`}
                        >
                          {item.type === "INCOME" ? "+" : "−"}
                          {formatCurrency(item.amount)}
                        </TableCell>
                        <TableCell>
                          <ConfirmDeleteButton
                            label="Hapus transaksi"
                            title="Hapus transaksi?"
                            description="Ringkasan keuangan dan saldo wallet akan dihitung ulang."
                            onConfirm={() => remove(item.id)}
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
