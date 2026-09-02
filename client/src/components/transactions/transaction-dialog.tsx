import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

import { CategoryDialog } from "@/components/categories/category-dialog"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/forms/currency-input"
import { DatePicker } from "@/components/forms/date-picker"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFinanceData } from "@/hooks/use-finance-data"
import { zodResolver } from "@/lib/form-resolver"
import { currentMonth, labels } from "@/lib/format"
import { api, errorMessage } from "@/services/api"
import type {
  Category,
  ExpenseType,
  IncomeType,
  SavingGoal,
  TransactionType,
  Wallet,
} from "@/types/finance"

const formSchema = z.object({
  type: z.enum(["INCOME", "EXPENSE", "SAVING"]),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
  walletId: z.string().min(1, "Pilih wallet"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  note: z.string().max(200),
  incomeType: z.enum(["PRIMARY", "SECONDARY"]).optional(),
  expenseType: z
    .enum(["FIXED", "VARIABLE", "SUBSCRIPTION", "DEBT", "DISCRETIONARY"])
    .optional(),
  categoryId: z.string().optional(),
  savingGoalId: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>
const ADD_CATEGORY_VALUE = "__add_category__"

export function TransactionDialog({
  initialType = "EXPENSE",
  onSaved,
  openByDefault = false,
}: {
  initialType?: TransactionType
  onSaved?: () => void
  openByDefault?: boolean
}) {
  const [open, setOpen] = useState(openByDefault)
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false)
  const [serverError, setServerError] = useState("")
  const wallets = useFinanceData<Wallet>("/wallets", "wallets")
  const categories = useFinanceData<Category>("/categories", "categories")
  const goals = useFinanceData<SavingGoal>(
    `/savings?month=${currentMonth()}`,
    "goals",
  )
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: initialType,
      amount: 0,
      walletId: "",
      date: new Date().toISOString().slice(0, 10),
      note: "",
      incomeType: "PRIMARY",
      expenseType: "VARIABLE",
      categoryId: "",
      savingGoalId: "",
    },
  })

  const type = form.watch("type")
  const expenseType = form.watch("expenseType")
  const walletId = form.watch("walletId")
  const categoryId = form.watch("categoryId")
  const savingGoalId = form.watch("savingGoalId")
  const incomeType = form.watch("incomeType")

  useEffect(() => {
    if (wallets.data.length === 1) {
      form.setValue("walletId", wallets.data[0]!.id)
    }
  }, [wallets.data, form])

  useEffect(() => {
    setOpen(openByDefault)
  }, [openByDefault])

  const submit = async (values: FormValues) => {
    setServerError("")
    try {
      await api.post("/transactions", {
        ...values,
        incomeType: values.type === "INCOME" ? values.incomeType : null,
        expenseType: values.type === "EXPENSE" ? values.expenseType : null,
        categoryId:
          values.type === "EXPENSE" && values.categoryId
            ? values.categoryId
            : null,
        savingGoalId:
          values.type === "SAVING" && values.savingGoalId
            ? values.savingGoalId
            : null,
      })
      toast.success("Transaksi tersimpan", {
        description: "Ringkasan keuangan sudah diperbarui.",
      })
      setOpen(false)
      form.reset({ ...values, amount: 0, note: "" })
      onSaved?.()
    } catch (cause) {
      setServerError(errorMessage(cause))
    }
  }

  const filteredCategories = categories.data.filter(
    (item) => item.expenseType === expenseType,
  )

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>
        <Plus />
        Tambah transaksi
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh]">
        <DialogHeader className="shrink-0 border-b px-6 py-5 pr-16">
          <DialogTitle>Tambah transaksi</DialogTitle>
          <DialogDescription>
            Satu input akan memperbarui wallet, budget, dan ringkasanmu.
          </DialogDescription>
        </DialogHeader>
        <form
          id="transaction-form"
          className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
          onSubmit={form.handleSubmit(submit)}
        >
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>Jenis transaksi</FieldLabel>
              <Select
                value={type}
                onValueChange={(value) =>
                  form.setValue("type", value as TransactionType)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{labels[type]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(["INCOME", "EXPENSE", "SAVING"] as const).map(
                    (value) => (
                      <SelectItem key={value} value={value}>
                        {labels[value]}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.amount)}>
              <FieldLabel htmlFor="amount">Nominal</FieldLabel>
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <CurrencyInput
                    id="amount"
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
            {type === "INCOME" && (
              <Field>
                <FieldLabel>Jenis pendapatan</FieldLabel>
                <Select
                  value={incomeType}
                  onValueChange={(value) =>
                    form.setValue("incomeType", value as IncomeType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {labels[incomeType ?? "PRIMARY"]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(["PRIMARY", "SECONDARY"] as const).map((value) => (
                      <SelectItem key={value} value={value}>
                        {labels[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
            {type === "EXPENSE" && (
              <>
                <Field>
                  <FieldLabel>Klasifikasi pengeluaran</FieldLabel>
                  <Select
                    value={expenseType}
                    onValueChange={(value) => {
                      form.setValue("expenseType", value as ExpenseType)
                      form.setValue("categoryId", "")
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {labels[expenseType ?? "VARIABLE"]}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {(
                        [
                          "FIXED",
                          "VARIABLE",
                          "SUBSCRIPTION",
                          "DEBT",
                          "DISCRETIONARY",
                        ] as const
                      ).map((value) => (
                        <SelectItem key={value} value={value}>
                          {labels[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>Kategori</FieldLabel>
                  <Select
                    value={categoryId}
                    onValueChange={(value) => {
                      if (value === ADD_CATEGORY_VALUE) {
                        setCategoryDialogOpen(true)
                        return
                      }
                      form.setValue("categoryId", value ?? "")
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue>
                        {filteredCategories.find(
                          (item) => item.id === categoryId,
                        )?.name ?? "Pilih kategori"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {filteredCategories.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                      <SelectSeparator />
                      <SelectItem
                        value={ADD_CATEGORY_VALUE}
                        className="text-primary"
                      >
                        <Plus />
                        Tambah kategori baru
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </>
            )}
            {type === "SAVING" && (
              <Field>
                <FieldLabel>Tujuan tabungan</FieldLabel>
                <Select
                  value={savingGoalId}
                  onValueChange={(value) =>
                    form.setValue("savingGoalId", value ?? "")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {goals.data.find((goal) => goal.id === savingGoalId)
                        ?.name ?? "Pilih tujuan"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {goals.data.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!goals.loading && !goals.data.length && (
                  <p className="text-xs text-muted-foreground">
                    Buat tujuan tabungan terlebih dahulu.
                  </p>
                )}
              </Field>
            )}
            <Field data-invalid={Boolean(form.formState.errors.walletId)}>
              <FieldLabel>Wallet</FieldLabel>
              <Select
                value={walletId}
                onValueChange={(value) =>
                  form.setValue("walletId", value ?? "", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {wallets.data.find((wallet) => wallet.id === walletId)
                      ?.name ?? "Pilih wallet"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {wallets.data.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={[form.formState.errors.walletId]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.date)}>
              <FieldLabel htmlFor="date">Tanggal</FieldLabel>
              <Controller
                control={form.control}
                name="date"
                render={({ field }) => (
                  <DatePicker
                    id="date"
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    invalid={Boolean(form.formState.errors.date)}
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.date]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.note)}>
              <FieldLabel htmlFor="note">
                Catatan <span className="text-muted-foreground">(opsional)</span>
              </FieldLabel>
              <Input
                id="note"
                placeholder="Contoh: Makan siang"
                {...form.register("note")}
              />
              <FieldError errors={[form.formState.errors.note]} />
            </Field>
            {serverError && (
              <p className="rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {serverError}
              </p>
            )}
          </FieldGroup>
        </form>
        <DialogFooter
          showCloseButton
          className="sticky bottom-0 z-10 shrink-0 border-t bg-popover px-6 py-4"
        >
          <Button
            type="submit"
            form="transaction-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
            Simpan transaksi
          </Button>
        </DialogFooter>
      </DialogContent>
      </Dialog>
      <CategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        showTrigger={false}
        initialExpenseType={expenseType ?? "VARIABLE"}
        onSaved={async (category) => {
          form.setValue("expenseType", category.expenseType)
          await categories.refresh()
          form.setValue("categoryId", category.id, { shouldValidate: true })
        }}
      />
    </>
  )
}
