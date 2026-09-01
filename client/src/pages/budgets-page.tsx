import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Gauge, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { ConfirmDeleteButton } from "@/components/confirm-delete-button"
import { EmptyState } from "@/components/empty-state"
import { CurrencyInput } from "@/components/forms/currency-input"
import { PageHeader } from "@/components/page-header"
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
import { currentMonth, formatCurrency, labels } from "@/lib/format"
import { api, errorMessage } from "@/services/api"
import type { Budget, Category } from "@/types/finance"

const schema = z.object({
  categoryId: z.string(),
  month: z.string().min(7),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
})
type Values = z.infer<typeof schema>

function BudgetDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const categories = useFinanceData<Category>("/categories", "categories")
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      categoryId: "OVERALL",
      month: currentMonth(),
      amount: 0,
    },
  })
  const categoryId = form.watch("categoryId")

  const submit = async (values: Values) => {
    try {
      await api.post("/budgets", {
        ...values,
        categoryId: values.categoryId === "OVERALL" ? null : values.categoryId,
      })
      toast.success("Budget tersimpan")
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
        Buat budget
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh]">
        <DialogHeader className="shrink-0 border-b px-6 py-5 pr-16">
          <DialogTitle>Buat budget bulanan</DialogTitle>
          <DialogDescription>
            Atur batas keseluruhan atau per kategori.
          </DialogDescription>
        </DialogHeader>
        <form
          id="budget-form"
          className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
          onSubmit={form.handleSubmit(submit)}
        >
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>Jenis budget</FieldLabel>
              <Select
                value={categoryId}
                onValueChange={(value) =>
                  form.setValue("categoryId", value ?? "OVERALL")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {categoryId === "OVERALL"
                      ? "Keseluruhan pengeluaran"
                      : categories.data.find(
                          (category) => category.id === categoryId,
                        )?.name ?? "Pilih kategori"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="OVERALL">
                    Keseluruhan pengeluaran
                  </SelectItem>
                  {categories.data.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name} · {labels[category.expenseType]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.month)}>
              <FieldLabel htmlFor="budget-month">Bulan</FieldLabel>
              <Input
                id="budget-month"
                type="month"
                {...form.register("month")}
              />
              <FieldError errors={[form.formState.errors.month]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.amount)}>
              <FieldLabel htmlFor="budget-amount">Batas budget</FieldLabel>
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <CurrencyInput
                    id="budget-amount"
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="0"
                    aria-invalid={Boolean(form.formState.errors.amount)}
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.amount]} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter
          showCloseButton
          className="sticky bottom-0 z-10 shrink-0 border-t bg-popover px-6 py-4"
        >
          <Button
            form="budget-form"
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

export function BudgetsPage() {
  const month = currentMonth()
  const budgets = useFinanceData<Budget>(
    `/budgets?month=${month}`,
    "budgets",
  )

  const remove = async (id: string) => {
    try {
      await api.delete(`/budgets/${id}`)
      toast.success("Budget dihapus")
      await budgets.refresh()
    } catch (cause) {
      toast.error("Gagal menghapus", { description: errorMessage(cause) })
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Budget"
        description="Beri batas pada pengeluaran sebelum uangmu habis."
        action={<BudgetDialog onSaved={() => void budgets.refresh()} />}
      />
      {budgets.loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-52" />
          ))}
        </div>
      ) : budgets.error ? (
        <EmptyState
          icon={Gauge}
          title="Budget belum dapat dimuat"
          description={budgets.error}
        />
      ) : !budgets.data.length ? (
        <Card>
          <EmptyState
            icon={Gauge}
            title="Belum ada budget bulan ini"
            description="Mulai dengan budget pengeluaran keseluruhan, lalu tambahkan batas per kategori."
            action={<BudgetDialog onSaved={() => void budgets.refresh()} />}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {budgets.data.map((budget) => {
            const amount = Number(budget.amount)
            const remaining = amount - budget.actual
            const progress = amount ? (budget.actual / amount) * 100 : 0
            return (
              <Card key={budget.id}>
                <CardHeader>
                  <CardTitle>
                    {budget.category?.name ?? "Budget pengeluaran bulanan"}
                  </CardTitle>
                  <CardDescription>
                    {budget.category
                      ? labels[budget.category.expenseType]
                      : "Keseluruhan"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Terpakai</p>
                      <p className="finance-number text-xl font-semibold">
                        {formatCurrency(budget.actual)}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      dari {formatCurrency(amount)}
                    </p>
                  </div>
                  <Progress
                    value={Math.min(progress, 100)}
                    className={
                      progress > 100
                        ? "[&_[data-slot=progress-indicator]]:bg-destructive"
                        : ""
                    }
                  />
                  <div className="flex items-center justify-between">
                    <p
                      className={
                        remaining < 0
                          ? "text-sm text-destructive"
                          : "text-sm text-muted-foreground"
                      }
                    >
                      {remaining < 0 ? "Melebihi " : "Sisa "}
                      <strong>{formatCurrency(Math.abs(remaining))}</strong>
                    </p>
                    <ConfirmDeleteButton
                      label="Hapus budget"
                      title="Hapus budget?"
                      description="Batas budget ini akan dihapus. Transaksi yang sudah tercatat tidak akan berubah."
                      onConfirm={() => remove(budget.id)}
                    />
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
