import { useEffect, useId, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import {
  CalendarClock,
  Copy,
  Loader2,
  LogOut,
  Pencil,
  PiggyBank,
  Plus,
  RefreshCw,
  UsersRound,
} from "lucide-react"
import { toast } from "sonner"

import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import { EmptyState } from "@/components/empty-state"
import { CurrencyInput } from "@/components/forms/currency-input"
import { DatePicker } from "@/components/forms/date-picker"
import { PageHeader } from "@/components/page-header"
import { TransactionDialog } from "@/components/transactions/transaction-dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from "@/components/ui/avatar"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useFinanceData } from "@/hooks/use-finance-data"
import { zodResolver } from "@/lib/form-resolver"
import { currentMonth, formatCurrency, formatDate } from "@/lib/format"
import { api, errorMessage } from "@/services/api"
import type { SavingGoal } from "@/types/finance"

const goalSchema = z.object({
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
  isShared: z.boolean(),
})

const joinSchema = z.object({
  code: z.string().regex(/^\d{6}$/, "Masukkan kode yang terdiri dari 6 angka"),
})

type GoalValues = z.infer<typeof goalSchema>
type JoinValues = z.infer<typeof joinSchema>

const DAY_IN_MS = 24 * 60 * 60 * 1000
const AVERAGE_DAYS_PER_MONTH = 365.25 / 12

function startOfToday() {
  return startOfTodayDate().getTime()
}

function startOfTodayDate() {
  const today = new Date()
  return new Date(today.getFullYear(), today.getMonth(), today.getDate())
}

function calculateSavingPlan(targetAmount: number, targetDate: string) {
  const targetTime = new Date(`${targetDate}T00:00:00`).getTime()
  if (
    !Number.isFinite(targetAmount) ||
    targetAmount <= 0 ||
    !targetDate ||
    Number.isNaN(targetTime)
  ) {
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

function valuesForGoal(goal?: SavingGoal): GoalValues {
  return {
    name: goal?.name ?? "",
    targetAmount: Number(goal?.targetAmount ?? 0),
    targetDate: goal?.targetDate?.slice(0, 10) ?? "",
    priority: goal?.priority ?? 1,
    isShared: goal?.isShared ?? false,
  }
}

function GoalDialog({
  goal,
  onSaved,
}: {
  goal?: SavingGoal
  onSaved: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const formId = `goal-form-${useId().replaceAll(":", "")}`
  const form = useForm<GoalValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: valuesForGoal(goal),
  })
  const [targetAmount, targetDate, isShared] = useWatch({
    control: form.control,
    name: ["targetAmount", "targetDate", "isShared"],
  })
  const savingPlan = calculateSavingPlan(Number(targetAmount), targetDate)

  const changeOpen = (nextOpen: boolean) => {
    if (nextOpen) form.reset(valuesForGoal(goal))
    setOpen(nextOpen)
  }

  const submit = async (values: GoalValues) => {
    const plan = calculateSavingPlan(values.targetAmount, values.targetDate)
    if (!plan) return

    try {
      const payload = {
        ...values,
        plannedMonthlyAmount: plan.monthlyAmount,
      }
      if (goal) await api.patch(`/savings/${goal.id}`, payload)
      else await api.post("/savings", payload)
      await onSaved()
      toast.success(goal ? "Tujuan tabungan diperbarui" : "Tujuan tabungan dibuat")
      setOpen(false)
    } catch (cause) {
      toast.error("Gagal menyimpan", { description: errorMessage(cause) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger
        render={
          <Button
            variant={goal ? "ghost" : "default"}
            size={goal ? "icon-sm" : "default"}
            aria-label={goal ? "Edit tujuan tabungan" : undefined}
          />
        }
      >
        {goal ? <Pencil /> : <Plus />}
        {!goal && "Buat tujuan"}
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh]">
        <DialogHeader className="shrink-0 border-b px-6 py-5 pr-16">
          <DialogTitle>
            {goal ? "Edit tujuan tabungan" : "Tujuan tabungan baru"}
          </DialogTitle>
          <DialogDescription>
            Atur target, tanggal, dan tentukan apakah tujuan ini ditabung bersama.
          </DialogDescription>
        </DialogHeader>
        <form
          id={formId}
          className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
          onSubmit={form.handleSubmit(submit)}
        >
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field
              className="sm:col-span-2"
              data-invalid={Boolean(form.formState.errors.name)}
            >
              <FieldLabel htmlFor={`${formId}-name`}>Nama tujuan</FieldLabel>
              <Input
                id={`${formId}-name`}
                placeholder="Dana darurat"
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.targetAmount)}>
              <FieldLabel htmlFor={`${formId}-target`}>Target total</FieldLabel>
              <Controller
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <CurrencyInput
                    id={`${formId}-target`}
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="0"
                    aria-invalid={Boolean(form.formState.errors.targetAmount)}
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.targetAmount]} />
            </Field>
            <Field>
              <FieldLabel htmlFor={`${formId}-plan`}>Rencana per bulan</FieldLabel>
              <Input
                id={`${formId}-plan`}
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
              <FieldLabel htmlFor={`${formId}-date`}>Target tanggal</FieldLabel>
              <Controller
                control={form.control}
                name="targetDate"
                render={({ field }) => (
                  <DatePicker
                    id={`${formId}-date`}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={{ before: startOfTodayDate() }}
                    invalid={Boolean(form.formState.errors.targetDate)}
                    placeholder="Pilih tanggal target"
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.targetDate]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.priority)}>
              <FieldLabel htmlFor={`${formId}-priority`}>Prioritas</FieldLabel>
              <Input
                id={`${formId}-priority`}
                type="number"
                min="1"
                {...form.register("priority")}
              />
              <FieldError errors={[form.formState.errors.priority]} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Status berbagi</FieldLabel>
              <Select
                value={isShared ? "SHARED" : "PRIVATE"}
                onValueChange={(value) =>
                  form.setValue("isShared", value === "SHARED", {
                    shouldDirty: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {isShared ? "Nabung bersama" : "Tabungan pribadi"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PRIVATE">Tabungan pribadi</SelectItem>
                  <SelectItem value="SHARED">Nabung bersama</SelectItem>
                </SelectContent>
              </Select>
              <FieldDescription>
                {isShared
                  ? "Kode unik enam digit berlaku selama 15 menit dan dapat diganti kapan saja."
                  : goal?.isShared
                    ? "Mengubah ke pribadi akan mengeluarkan seluruh anggota dari tujuan ini."
                    : "Hanya kamu yang dapat melihat dan mengisi tujuan ini."}
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter
          showCloseButton
          className="sticky bottom-0 z-10 shrink-0 border-t bg-popover px-6 py-4"
        >
          <Button
            form={formId}
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
            {goal ? "Simpan perubahan" : "Simpan tujuan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function JoinGoalDialog({ onJoined }: { onJoined: () => Promise<void> }) {
  const [open, setOpen] = useState(false)
  const form = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: { code: "" },
  })

  const submit = async ({ code }: JoinValues) => {
    try {
      const response = await api.post<{ goal: { name: string } }>("/savings/join", { code })
      await onJoined()
      toast.success(`Berhasil bergabung ke ${response.data.goal.name}`)
      form.reset()
      setOpen(false)
    } catch (cause) {
      toast.error("Tidak dapat bergabung", { description: errorMessage(cause) })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" />}>
        <UsersRound />
        Gabung
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gabung tabungan bersama</DialogTitle>
          <DialogDescription>
            Masukkan kode enam digit yang masih berlaku dari pemilik tujuan tabungan.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
          <Field data-invalid={Boolean(form.formState.errors.code)}>
            <FieldLabel htmlFor="saving-share-code">Kode tabungan</FieldLabel>
            <Input
              id="saving-share-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="123456"
              className="text-center font-mono text-xl tracking-[0.35em]"
              {...form.register("code", {
                onChange: (event) => {
                  event.target.value = event.target.value
                    .replace(/\D/g, "")
                    .slice(0, 6)
                },
              })}
            />
            <FieldError errors={[form.formState.errors.code]} />
          </Field>
          <DialogFooter showCloseButton>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
              Gabung sekarang
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function LeaveGoalButton({ goal, onLeft }: { goal: SavingGoal; onLeft: () => Promise<void> }) {
  const [loading, setLoading] = useState(false)

  const leave = async () => {
    setLoading(true)
    try {
      await api.delete(`/savings/${goal.id}/members/me`)
      await onLeft()
      toast.success(`Kamu keluar dari ${goal.name}`)
    } catch (cause) {
      toast.error("Gagal keluar", { description: errorMessage(cause) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            aria-label="Keluar dari tabungan bersama"
          />
        }
      >
        <LogOut />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Keluar dari tabungan bersama?</AlertDialogTitle>
          <AlertDialogDescription>
            Tujuan ini tidak akan muncul lagi di akunmu. Setoran yang pernah kamu catat tetap masuk ke progres bersama.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Batal</AlertDialogCancel>
          <AlertDialogAction
            type="button"
            variant="destructive"
            disabled={loading}
            onClick={() => void leave()}
          >
            {loading && <Loader2 className="animate-spin" />}
            Keluar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ShareCodeControl({
  goal,
  onUpdated,
}: {
  goal: SavingGoal
  onUpdated: () => Promise<void>
}) {
  const [remainingSeconds, setRemainingSeconds] = useState(
    goal.shareCodeExpiresInSeconds ?? 0,
  )
  const [loading, setLoading] = useState(false)
  const hasActiveCode = Boolean(goal.shareCode && remainingSeconds > 0)
  const minutes = Math.floor(remainingSeconds / 60)
  const seconds = remainingSeconds % 60

  useEffect(() => {
    if (!goal.shareCode || !goal.shareCodeExpiresInSeconds) return

    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => {
        if (value <= 1) {
          window.clearInterval(timer)
          return 0
        }
        return value - 1
      })
    }, 1_000)
    return () => window.clearInterval(timer)
  }, [goal.shareCode, goal.shareCodeExpiresInSeconds])

  const copyCode = async () => {
    if (!goal.shareCode) return
    try {
      await navigator.clipboard.writeText(goal.shareCode)
      toast.success("Kode tabungan disalin")
    } catch {
      toast.error("Kode belum dapat disalin")
    }
  }

  const replaceCode = async () => {
    setLoading(true)
    try {
      await api.post(`/savings/${goal.id}/share-code`)
      await onUpdated()
      toast.success(hasActiveCode ? "Kode tabungan diganti" : "Kode tabungan dibuat")
    } catch (cause) {
      toast.error("Kode belum dapat dibuat", { description: errorMessage(cause) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-1">
        {hasActiveCode && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="font-mono tracking-widest"
            onClick={() => void copyCode()}
          >
            {goal.shareCode}
            <Copy />
          </Button>
        )}
        <Button
          type="button"
          variant={hasActiveCode ? "ghost" : "outline"}
          size="sm"
          disabled={loading}
          onClick={() => void replaceCode()}
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
          {hasActiveCode ? "Ganti" : "Buat kode"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {hasActiveCode
          ? `Berlaku ${minutes}:${seconds.toString().padStart(2, "0")}`
          : "Kode sudah kedaluwarsa"}
      </p>
    </div>
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
        description="Bandingkan rencana dengan realisasi sendiri atau bersama."
        action={
          <div className="flex flex-wrap gap-2">
            <TransactionDialog
              initialType="SAVING"
              onSaved={() => void goals.refresh()}
            />
            <JoinGoalDialog onJoined={goals.refresh} />
            <GoalDialog onSaved={goals.refresh} />
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
            description="Buat tujuan sendiri atau bergabung memakai kode enam digit."
            action={<GoalDialog onSaved={goals.refresh} />}
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
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap gap-2">
                        <Badge variant="secondary">Prioritas {goal.priority}</Badge>
                        {goal.isShared && (
                          <Badge>
                            <UsersRound />
                            Nabung bersama
                          </Badge>
                        )}
                        {goal.isShared && !goal.isOwner && (
                          <Badge variant="outline">Milik {goal.owner.name}</Badge>
                        )}
                      </div>
                      <CardTitle>{goal.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-1">
                        <CalendarClock className="size-3.5" />
                        {goal.targetDate
                          ? formatDate(goal.targetDate)
                          : "Tanpa batas waktu"}
                      </CardDescription>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {goal.isOwner ? (
                        <>
                          <GoalDialog goal={goal} onSaved={goals.refresh} />
                          <ConfirmDeleteButton
                            label="Hapus tujuan"
                            title="Hapus tujuan tabungan?"
                            description="Tujuan akan dihapus, tetapi transaksi tabungan yang sudah tercatat tetap tersimpan."
                            onConfirm={() => remove(goal.id)}
                          />
                        </>
                      ) : (
                        <LeaveGoalButton goal={goal} onLeft={goals.refresh} />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {goal.isShared && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-muted/30 p-3">
                      <div className="flex items-center gap-3">
                        <AvatarGroup>
                          {goal.participants.slice(0, 4).map((participant) => (
                            <Avatar key={participant.id} title={participant.name}>
                              <AvatarFallback>
                                {participant.avatarEmoji ?? participant.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          ))}
                          {goal.participants.length > 4 && (
                            <AvatarGroupCount>
                              +{goal.participants.length - 4}
                            </AvatarGroupCount>
                          )}
                        </AvatarGroup>
                        <div>
                          <p className="text-sm font-medium">
                            {goal.participants.length} penabung
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Progres dihitung dari seluruh anggota
                          </p>
                        </div>
                      </div>
                      {goal.isOwner && (
                        <ShareCodeControl
                          key={`${goal.id}-${goal.shareCode ?? "expired"}`}
                          goal={goal}
                          onUpdated={goals.refresh}
                        />
                      )}
                    </div>
                  )}
                  <div>
                    <div className="mb-2 flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground">Terkumpul</p>
                        <p className="finance-number text-xl font-semibold">
                          {formatCurrency(goal.currentTotal)}
                        </p>
                      </div>
                      <p className="text-right text-sm text-muted-foreground">
                        Target {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                    <Progress value={totalProgress} />
                    <p className="mt-2 text-right text-xs font-medium">
                      {Math.round(totalProgress)}%
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted/60 p-4">
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span>Rencana bulan ini</span>
                      <strong>{formatCurrency(goal.plannedMonthlyAmount)}</strong>
                    </div>
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span>{goal.isShared ? "Aktual bersama" : "Aktual"}</span>
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
