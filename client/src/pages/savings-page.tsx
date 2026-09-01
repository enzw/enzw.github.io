import { useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { CalendarClock, Loader2, PiggyBank, Plus } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
import { TransactionDialog } from "@/components/transactions/transaction-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { useFinanceData } from "@/hooks/use-finance-data"
import { zodResolver } from "@/lib/form-resolver"
import { currentMonth, formatCurrency, formatDate } from "@/lib/format"
import { api, errorMessage } from "@/services/api"
import type { SavingGoal } from "@/types/finance"

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  targetAmount: z.coerce.number().positive("Target harus lebih dari 0"),
  targetDate: z
    .string()
    .min(1, "Tanggal target wajib diisi")
    .refine(
      (value) =>
        !value || new Date(`${value}T00:00:00`).getTime() >= startOfToday(),
      "Tanggal target tidak boleh sebelum hari ini",
    ),
  priority: z.coerce.number().int().min(1),
})
type Values = z.infer<typeof schema>

const DAY_IN_MS = 24 * 60 * 60 * 1000
const AVERAGE_DAYS_PER_MONTH = 365.25 / 12

function startOfToday() {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
}

function dateInputToday() {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, "0")
  const day = String(today.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function calculateSavingPlan(targetAmount: number, targetDate: string) {
  const targetTime = new Date(`${targetDate}T00:00:00`).getTime()
  if (!Number.isFinite(targetAmount) || targetAmount <= 0 || !targetDate || Number.isNaN(targetTime)) {
    return null
  }

  const remainingDays = Math.max(
    1,
    Math.ceil((targetTime - startOfToday()) / DAY_IN_MS),
  )
  const remainingMonths = Math.max(1, remainingDays / AVERAGE_DAYS_PER_MONTH)

  return {
    remainingDays,
    remainingMonths,
    monthlyAmount: Math.ceil(targetAmount / remainingMonths),
    dailyAmount: Math.ceil(targetAmount / remainingDays),
  }
}

function GoalDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      targetAmount: 0,
      targetDate: "",
      priority: 1,
    },
  })
  const [targetAmount, targetDate] = useWatch({
    control: form.control,
    name: ["targetAmount", "targetDate"],
  })
  const savingPlan = calculateSavingPlan(Number(targetAmount), targetDate)

  const submit = async (values: Values) => {
    const plan = calculateSavingPlan(values.targetAmount, values.targetDate)
    if (!plan) return

    try {
      await api.post("/savings", {
        ...values,
        plannedMonthlyAmount: plan.monthlyAmount,
      })
      toast.success("Tujuan tabungan dibuat")
      setOpen(false)
      onSaved()
    } catch (cause) {
      toast.error("Gagal menyimpan", { description: errorMessage(cause) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Buat tujuan
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tujuan tabungan baru</DialogTitle>
          <DialogDescription>
            Tentukan target total dan tanggalnya. Rencana setoran akan dihitung otomatis.
          </DialogDescription>
        </DialogHeader>
        <form id="goal-form" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field
              className="sm:col-span-2"
              data-invalid={Boolean(form.formState.errors.name)}
            >
              <FieldLabel htmlFor="goal-name">Nama tujuan</FieldLabel>
              <Input
                id="goal-name"
                placeholder="Dana darurat"
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.targetAmount)}>
              <FieldLabel htmlFor="goal-target">Target total</FieldLabel>
              <Input
                id="goal-target"
                type="number"
                min="1"
                {...form.register("targetAmount")}
              />
              <FieldError errors={[form.formState.errors.targetAmount]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="goal-plan">Rencana per bulan</FieldLabel>
              <Input
                id="goal-plan"
                value={savingPlan ? formatCurrency(savingPlan.monthlyAmount) : ""}
                placeholder="Dihitung otomatis"
                readOnly
                className="bg-muted/60"
              />
              <FieldDescription>
                {savingPlan
                  ? `Berdasarkan ${savingPlan.remainingDays} hari${
                      savingPlan.remainingDays >= AVERAGE_DAYS_PER_MONTH
                        ? ` (sekitar ${savingPlan.remainingMonths.toLocaleString("id-ID", { maximumFractionDigits: 1 })} bulan)`
                        : ""
                    }, setara ${formatCurrency(savingPlan.dailyAmount)} per hari.`
                  : "Isi target total dan tanggal target terlebih dahulu."}
              </FieldDescription>
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.targetDate)}>
              <FieldLabel htmlFor="goal-date">Target tanggal</FieldLabel>
              <Input
                id="goal-date"
                type="date"
                min={dateInputToday()}
                {...form.register("targetDate")}
              />
              <FieldError errors={[form.formState.errors.targetDate]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.priority)}>
              <FieldLabel htmlFor="goal-priority">Prioritas</FieldLabel>
              <Input
                id="goal-priority"
                type="number"
                min="1"
                {...form.register("priority")}
              />
              <FieldError errors={[form.formState.errors.priority]} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter showCloseButton>
          <Button
            form="goal-form"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
            Simpan tujuan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function SavingsPage() {
  const goals = useFinanceData<SavingGoal>(
    `/savings?month=${currentMonth()}`,
    "goals",
  )

  const remove = async (id: string) => {
    try {
      await api.delete(`/savings/${id}`)
      toast.success("Tujuan tabungan dihapus")
      await goals.refresh()
    } catch (cause) {
      toast.error("Gagal menghapus", { description: errorMessage(cause) })
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Tabungan"
        description="Bandingkan rencana dengan realisasi setiap bulan."
        action={
          <div className="flex gap-2">
            <TransactionDialog
              initialType="SAVING"
              onSaved={() => void goals.refresh()}
            />
            <GoalDialog onSaved={() => void goals.refresh()} />
          </div>
        }
      />
      {goals.loading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-64" />
          ))}
        </div>
      ) : goals.error ? (
        <EmptyState
          icon={PiggyBank}
          title="Tabungan belum dapat dimuat"
          description={goals.error}
        />
      ) : !goals.data.length ? (
        <Card>
          <EmptyState
            icon={PiggyBank}
            title="Belum ada tujuan tabungan"
            description="Buat tujuan seperti dana darurat, laptop, atau liburan agar menabung lebih terarah."
            action={<GoalDialog onSaved={() => void goals.refresh()} />}
          />
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {goals.data.map((goal) => {
            const totalProgress = Math.min(
              100,
              (goal.currentTotal / Number(goal.targetAmount)) * 100,
            )
            const monthlyProgress = Number(goal.plannedMonthlyAmount)
              ? Math.min(
                  100,
                  (goal.actualThisMonth / Number(goal.plannedMonthlyAmount)) *
                    100,
                )
              : 0
            return (
              <Card key={goal.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="secondary" className="mb-3">
                        Prioritas {goal.priority}
                      </Badge>
                      <CardTitle>{goal.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1">
                        <CalendarClock className="size-3.5" />
                        {goal.targetDate
                          ? formatDate(goal.targetDate)
                          : "Tanpa batas waktu"}
                      </CardDescription>
                    </div>
                    <ConfirmDeleteButton
                      label="Hapus tujuan"
                      title="Hapus tujuan tabungan?"
                      description="Tujuan akan dihapus, tetapi transaksi tabungan yang sudah tercatat tetap tersimpan."
                      onConfirm={() => remove(goal.id)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div>
                    <div className="mb-2 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Terkumpul
                        </p>
                        <p className="finance-number text-xl font-semibold">
                          {formatCurrency(goal.currentTotal)}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Target {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                    <Progress value={totalProgress} />
                    <p className="mt-2 text-right text-xs font-medium">
                      {Math.round(totalProgress)}%
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Rencana bulan ini</span>
                      <strong>
                        {formatCurrency(goal.plannedMonthlyAmount)}
                      </strong>
                    </div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span>Aktual</span>
                      <strong>{formatCurrency(goal.actualThisMonth)}</strong>
                    </div>
                    <Progress value={monthlyProgress} className="mt-3" />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
