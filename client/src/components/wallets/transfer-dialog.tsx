import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { ArrowRightLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { CurrencyInput } from "@/components/forms/currency-input"
import { DatePicker } from "@/components/forms/date-picker"
import { Button } from "@/components/ui/button"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { zodResolver } from "@/lib/form-resolver"
import { formatCurrency, labels } from "@/lib/format"
import { api, errorMessage } from "@/services/api"
import type { Wallet } from "@/types/finance"

const schema = z.object({
  fromWalletId: z.string().min(1, "Pilih wallet asal"),
  toWalletId: z.string().min(1, "Pilih wallet tujuan"),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  note: z.string().max(200),
}).refine((data) => data.fromWalletId !== data.toWalletId, {
  message: "Wallet tujuan harus berbeda",
  path: ["toWalletId"],
})

type Values = z.infer<typeof schema>

function defaultValues(wallets: Wallet[]): Values {
  const source =
    wallets.find((wallet) => wallet.type === "BANK" && wallet.balance > 0) ??
    wallets.find((wallet) => wallet.balance > 0) ??
    wallets[0]
  const destination =
    wallets.find(
      (wallet) => wallet.type === "CASH" && wallet.id !== source?.id,
    ) ?? wallets.find((wallet) => wallet.id !== source?.id)

  return {
    fromWalletId: source?.id ?? "",
    toWalletId: destination?.id ?? "",
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    note: "",
  }
}

export function TransferDialog({
  wallets,
  onSaved,
}: {
  wallets: Wallet[]
  onSaved: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState("")
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: defaultValues(wallets),
  })
  const fromWalletId = form.watch("fromWalletId")
  const toWalletId = form.watch("toWalletId")
  const sourceWallet = wallets.find((wallet) => wallet.id === fromWalletId)

  const changeOpen = (nextOpen: boolean) => {
    if (nextOpen) {
      form.reset(defaultValues(wallets))
      setServerError("")
    }
    setOpen(nextOpen)
  }

  const submit = async (values: Values) => {
    setServerError("")
    const source = wallets.find((wallet) => wallet.id === values.fromWalletId)
    if (source && values.amount > source.balance) {
      form.setError("amount", {
        message: "Nominal melebihi saldo wallet asal",
      })
      return
    }

    try {
      await api.post("/wallets/transfers", values)
      await onSaved()
      toast.success("Uang berhasil dipindahkan", {
        description: "Saldo kedua wallet sudah diperbarui.",
      })
      setOpen(false)
    } catch (cause) {
      setServerError(errorMessage(cause))
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" disabled={wallets.length < 2} />
        }
      >
        <ArrowRightLeft />
        Pindahkan uang
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh]">
        <DialogHeader className="shrink-0 border-b px-6 py-5 pr-16">
          <DialogTitle>Transfer antar-wallet</DialogTitle>
          <DialogDescription>
            Cairkan uang dari Bank ke Cash atau pindahkan saldo ke wallet lain
            tanpa menambah pemasukan dan pengeluaran.
          </DialogDescription>
        </DialogHeader>
        <form
          id="wallet-transfer-form"
          className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
          onSubmit={form.handleSubmit(submit)}
        >
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(form.formState.errors.fromWalletId)}>
              <FieldLabel>Wallet asal</FieldLabel>
              <Select
                value={fromWalletId}
                onValueChange={(value) => {
                  const nextSourceId = value ?? ""
                  form.setValue("fromWalletId", nextSourceId, {
                    shouldValidate: true,
                  })
                  if (nextSourceId === toWalletId) {
                    form.setValue(
                      "toWalletId",
                      wallets.find((wallet) => wallet.id !== nextSourceId)?.id ?? "",
                      { shouldValidate: true },
                    )
                  }
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {sourceWallet?.name ?? "Pilih wallet asal"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name} · {labels[wallet.type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {sourceWallet && (
                <FieldDescription>
                  Saldo tersedia {formatCurrency(sourceWallet.balance)}
                </FieldDescription>
              )}
              <FieldError errors={[form.formState.errors.fromWalletId]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.toWalletId)}>
              <FieldLabel>Wallet tujuan</FieldLabel>
              <Select
                value={toWalletId}
                onValueChange={(value) =>
                  form.setValue("toWalletId", value ?? "", {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {wallets.find((wallet) => wallet.id === toWalletId)?.name ??
                      "Pilih wallet tujuan"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {wallets
                    .filter((wallet) => wallet.id !== fromWalletId)
                    .map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name} · {labels[wallet.type]}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FieldError errors={[form.formState.errors.toWalletId]} />
            </Field>
            <Field data-invalid={Boolean(form.formState.errors.amount)}>
              <FieldLabel htmlFor="transfer-amount">Nominal</FieldLabel>
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <CurrencyInput
                    id="transfer-amount"
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
            <Field data-invalid={Boolean(form.formState.errors.date)}>
              <FieldLabel htmlFor="transfer-date">Tanggal</FieldLabel>
              <Controller
                control={form.control}
                name="date"
                render={({ field }) => (
                  <DatePicker
                    id="transfer-date"
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
              <FieldLabel htmlFor="transfer-note">
                Catatan <span className="text-muted-foreground">(opsional)</span>
              </FieldLabel>
              <Input
                id="transfer-note"
                placeholder="Contoh: Tarik tunai ATM"
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
            form="wallet-transfer-form"
            type="submit"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
            Pindahkan uang
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
