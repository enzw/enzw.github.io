import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  Plus,
  Repeat2,
} from "lucide-react"
import { toast } from "sonner"

import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import { EmptyState } from "@/components/empty-state"
import { PageHeader } from "@/components/page-header"
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
import { formatCurrency, formatDate } from "@/lib/format"
import { api, errorMessage } from "@/services/api"
import type { Debt, Subscription, Wallet } from "@/types/finance"

const subscriptionSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  amount: z.coerce.number().positive("Biaya harus lebih dari 0"),
  billingDay: z.coerce.number().int().min(1).max(31),
  walletId: z.string(),
  note: z.string(),
})
const debtSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  originalAmount: z.coerce.number().positive("Total harus lebih dari 0"),
  remainingAmount: z.coerce.number().min(0),
  monthlyPayment: z.coerce.number().min(0),
  dueDate: z.string(),
  walletId: z.string(),
  note: z.string(),
})
type SubscriptionValues = z.infer<typeof subscriptionSchema>
type DebtValues = z.infer<typeof debtSchema>

function WalletSelect({
  wallets,
  value,
  onChange,
}: {
  wallets: Wallet[]
  value: string
  onChange: (value: string) => void
}) {
  return (
    <Select
      value={value}
      onValueChange={(nextValue) => onChange(nextValue ?? "NONE")}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="NONE">Belum ditentukan</SelectItem>
        {wallets.map((wallet) => (
          <SelectItem key={wallet.id} value={wallet.id}>
            {wallet.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function SubscriptionDialog({
  wallets,
  onSaved,
}: {
  wallets: Wallet[]
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const form = useForm<SubscriptionValues>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      name: "",
      amount: 0,
      billingDay: 1,
      walletId: "NONE",
      note: "",
    },
  })

  const submit = async (values: SubscriptionValues) => {
    try {
      await api.post("/subscriptions", {
        ...values,
        walletId: values.walletId === "NONE" ? null : values.walletId,
        isActive: true,
      })
      toast.success("Langganan ditambahkan", {
        description: "Catat pembayarannya sebagai transaksi saat tagihan dibayar.",
      })
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
        Tambah langganan
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Langganan baru</DialogTitle>
          <DialogDescription>
            Kelola jadwal tagihan. Pembayaran aktual tetap dicatat sebagai
            transaksi.
          </DialogDescription>
        </DialogHeader>
        <form id="subscription-form" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field
              className="sm:col-span-2"
              data-invalid={Boolean(form.formState.errors.name)}
            >
              <FieldLabel htmlFor="sub-name">Nama</FieldLabel>
              <Input
                id="sub-name"
                placeholder="Spotify"
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.amount)}>
              <FieldLabel htmlFor="sub-amount">Biaya bulanan</FieldLabel>
              <Input
                id="sub-amount"
                type="number"
                min="1"
                {...form.register("amount")}
              />
              <FieldError errors={[form.formState.errors.amount]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.billingDay)}>
              <FieldLabel htmlFor="sub-day">Tanggal tagihan</FieldLabel>
              <Input
                id="sub-day"
                type="number"
                min="1"
                max="31"
                {...form.register("billingDay")}
              />
              <FieldError errors={[form.formState.errors.billingDay]} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Wallet pembayaran</FieldLabel>
              <WalletSelect
                wallets={wallets}
                value={form.watch("walletId")}
                onChange={(value) => form.setValue("walletId", value)}
              />
            </Field>
            <Field
              className="sm:col-span-2"
              data-invalid={Boolean(form.formState.errors.note)}
            >
              <FieldLabel htmlFor="sub-note">Catatan</FieldLabel>
              <Input id="sub-note" {...form.register("note")} />
              <FieldError errors={[form.formState.errors.note]} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter showCloseButton>
          <Button
            form="subscription-form"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DebtDialog({
  wallets,
  onSaved,
}: {
  wallets: Wallet[]
  onSaved: () => void
}) {
  const [open, setOpen] = useState(false)
  const form = useForm<DebtValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      name: "",
      originalAmount: 0,
      remainingAmount: 0,
      monthlyPayment: 0,
      dueDate: "",
      walletId: "NONE",
      note: "",
    },
  })

  const submit = async (values: DebtValues) => {
    try {
      await api.post("/debts", {
        ...values,
        remainingAmount: values.remainingAmount || values.originalAmount,
        monthlyPayment: values.monthlyPayment || null,
        dueDate: values.dueDate || null,
        walletId: values.walletId === "NONE" ? null : values.walletId,
        isPaid: false,
      })
      toast.success("Hutang ditambahkan", {
        description: "Pembayaran aktual dicatat sebagai expense tipe Hutang.",
      })
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
        Tambah hutang
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat hutang</DialogTitle>
          <DialogDescription>
            Pantau sisa kewajiban tanpa mencampurnya dengan pembayaran aktual.
          </DialogDescription>
        </DialogHeader>
        <form id="debt-form" onSubmit={form.handleSubmit(submit)}>
          <FieldGroup className="grid gap-4 sm:grid-cols-2">
            <Field
              className="sm:col-span-2"
              data-invalid={Boolean(form.formState.errors.name)}
            >
              <FieldLabel htmlFor="debt-name">Nama hutang</FieldLabel>
              <Input
                id="debt-name"
                placeholder="Cicilan laptop"
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field
              data-invalid={Boolean(form.formState.errors.originalAmount)}
            >
              <FieldLabel htmlFor="debt-original">Total awal</FieldLabel>
              <Input
                id="debt-original"
                type="number"
                min="1"
                {...form.register("originalAmount")}
              />
              <FieldError errors={[form.formState.errors.originalAmount]} />
            </Field>
            <Field
              data-invalid={Boolean(form.formState.errors.remainingAmount)}
            >
              <FieldLabel htmlFor="debt-remaining">Sisa sekarang</FieldLabel>
              <Input
                id="debt-remaining"
                type="number"
                min="0"
                placeholder={String(form.watch("originalAmount") || 0)}
                {...form.register("remainingAmount")}
              />
              <FieldError errors={[form.formState.errors.remainingAmount]} />
            </Field>
            <Field
              data-invalid={Boolean(form.formState.errors.monthlyPayment)}
            >
              <FieldLabel htmlFor="debt-payment">Rencana cicilan</FieldLabel>
              <Input
                id="debt-payment"
                type="number"
                min="0"
                {...form.register("monthlyPayment")}
              />
              <FieldError errors={[form.formState.errors.monthlyPayment]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.dueDate)}>
              <FieldLabel htmlFor="debt-date">Jatuh tempo</FieldLabel>
              <Input
                id="debt-date"
                type="date"
                {...form.register("dueDate")}
              />
              <FieldError errors={[form.formState.errors.dueDate]} />
            </Field>
            <Field className="sm:col-span-2">
              <FieldLabel>Wallet pembayaran</FieldLabel>
              <WalletSelect
                wallets={wallets}
                value={form.watch("walletId")}
                onChange={(value) => form.setValue("walletId", value)}
              />
            </Field>
            <Field
              className="sm:col-span-2"
              data-invalid={Boolean(form.formState.errors.note)}
            >
              <FieldLabel htmlFor="debt-note">Catatan</FieldLabel>
              <Input id="debt-note" {...form.register("note")} />
              <FieldError errors={[form.formState.errors.note]} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter showCloseButton>
          <Button
            form="debt-form"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function CommitmentsPage({
  kind,
}: {
  kind: "subscriptions" | "debts"
}) {
  const subscriptions = useFinanceData<Subscription>(
    "/subscriptions",
    "subscriptions",
  )
  const debts = useFinanceData<Debt>("/debts", "debts")
  const wallets = useFinanceData<Wallet>("/wallets", "wallets")
  const current = kind === "subscriptions" ? subscriptions : debts

  const remove = async (id: string) => {
    try {
      await api.delete(`/${kind}/${id}`)
      toast.success(kind === "subscriptions" ? "Langganan dihapus" : "Hutang dihapus")
      await current.refresh()
    } catch (cause) {
      toast.error("Gagal menghapus", { description: errorMessage(cause) })
    }
  }

  if (kind === "subscriptions") {
    const total = subscriptions.data
      .filter((item) => item.isActive)
      .reduce((sum, item) => sum + Number(item.amount), 0)
    return (
      <div className="page-container">
        <PageHeader
          title="Langganan"
          description="Ingat semua tagihan rutin sebelum tanggal pembayaran."
          action={
            <SubscriptionDialog
              wallets={wallets.data}
              onSaved={() => void subscriptions.refresh()}
            />
          }
        />
        <Card className="mb-4">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Total langganan aktif per bulan
            </p>
            <p className="finance-number mt-1 text-3xl font-semibold">
              {formatCurrency(total)}
            </p>
          </CardContent>
        </Card>
        {subscriptions.loading ? (
          <Skeleton className="h-64" />
        ) : !subscriptions.data.length ? (
          <Card>
            <EmptyState
              icon={Repeat2}
              title="Belum ada langganan"
              description="Tambahkan langganan digital atau tagihan rutin agar tidak ada yang terlupa."
              action={
                <SubscriptionDialog
                  wallets={wallets.data}
                  onSaved={() => void subscriptions.refresh()}
                />
              }
            />
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {subscriptions.data.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between">
                    <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Repeat2 className="size-5" />
                    </span>
                    <ConfirmDeleteButton
                      label="Hapus langganan"
                      title="Hapus langganan?"
                      description="Jadwal langganan akan dihapus. Transaksi pembayaran yang sudah ada tetap tersimpan."
                      onConfirm={() => remove(item.id)}
                    />
                  </div>
                  <CardTitle className="mt-3">{item.name}</CardTitle>
                  <CardDescription>
                    {item.wallet?.name ?? "Wallet belum dipilih"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="finance-number text-2xl font-semibold">
                    {formatCurrency(item.amount)}
                  </p>
                  <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarClock className="size-4" />
                    Tagihan setiap tanggal {item.billingDay}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  const remaining = debts.data
    .filter((item) => !item.isPaid)
    .reduce((sum, item) => sum + Number(item.remainingAmount), 0)

  return (
    <div className="page-container">
      <PageHeader
        title="Hutang"
        description="Pantau kewajiban dan progres pembayaranmu."
        action={
          <DebtDialog
            wallets={wallets.data}
            onSaved={() => void debts.refresh()}
          />
        }
      />
      <Card className="mb-4">
        <CardContent>
          <p className="text-sm text-muted-foreground">Total sisa hutang</p>
          <p className="finance-number mt-1 text-3xl font-semibold">
            {formatCurrency(remaining)}
          </p>
        </CardContent>
      </Card>
      {debts.loading ? (
        <Skeleton className="h-64" />
      ) : !debts.data.length ? (
        <Card>
          <EmptyState
            icon={CircleDollarSign}
            title="Belum ada hutang"
            description="Catat kewajiban yang sedang berjalan untuk melihat progres pelunasannya."
            action={
              <DebtDialog
                wallets={wallets.data}
                onSaved={() => void debts.refresh()}
              />
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {debts.data.map((item) => {
            const progress = Number(item.originalAmount)
              ? ((Number(item.originalAmount) - Number(item.remainingAmount)) /
                  Number(item.originalAmount)) *
                100
              : 0
            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex justify-between">
                    <Badge variant={item.isPaid ? "default" : "secondary"}>
                      {item.isPaid ? (
                        <>
                          <CheckCircle2 />
                          Lunas
                        </>
                      ) : (
                        "Berjalan"
                      )}
                    </Badge>
                    <ConfirmDeleteButton
                      label="Hapus hutang"
                      title="Hapus catatan hutang?"
                      description="Catatan hutang akan dihapus. Transaksi pembayaran yang sudah ada tetap tersimpan."
                      onConfirm={() => remove(item.id)}
                    />
                  </div>
                  <CardTitle className="mt-3">{item.name}</CardTitle>
                  <CardDescription>
                    {item.dueDate
                      ? `Jatuh tempo ${formatDate(item.dueDate)}`
                      : "Tanpa jatuh tempo"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Sisa</p>
                    <p className="finance-number text-2xl font-semibold">
                      {formatCurrency(item.remainingAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      dari {formatCurrency(item.originalAmount)}
                    </p>
                  </div>
                  <Progress value={Math.max(0, Math.min(100, progress))} />
                  {item.monthlyPayment && (
                    <p className="text-sm text-muted-foreground">
                      Rencana cicilan {formatCurrency(item.monthlyPayment)}/bulan
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
