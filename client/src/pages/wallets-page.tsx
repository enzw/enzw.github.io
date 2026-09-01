import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import {
  Banknote,
  Building2,
  Loader2,
  Plus,
  Smartphone,
  WalletCards,
} from "lucide-react"
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
import { formatCurrency, labels } from "@/lib/format"
import { api, errorMessage } from "@/services/api"
import type { Wallet, WalletType } from "@/types/finance"

const schema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  type: z.enum(["CASH", "BANK", "E_WALLET"]),
  openingBalance: z.coerce.number().min(0),
})
type Values = z.infer<typeof schema>

function WalletDialog({ onSaved }: { onSaved: () => void }) {
  const [open, setOpen] = useState(false)
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", type: "CASH", openingBalance: 0 },
  })

  const submit = async (values: Values) => {
    try {
      await api.post("/wallets", values)
      toast.success("Wallet ditambahkan")
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
        Tambah wallet
      </DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh]">
        <DialogHeader className="shrink-0 border-b px-6 py-5 pr-16">
          <DialogTitle>Tambah wallet</DialogTitle>
          <DialogDescription>
            Wallet adalah catatan virtual dan tidak terhubung langsung ke bank.
          </DialogDescription>
        </DialogHeader>
        <form
          id="wallet-form"
          className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
          onSubmit={form.handleSubmit(submit)}
        >
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(form.formState.errors.name)}>
              <FieldLabel htmlFor="wallet-name">Nama</FieldLabel>
              <Input
                id="wallet-name"
                placeholder="BCA, GoPay, atau Cash"
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field>
              <FieldLabel>Jenis wallet</FieldLabel>
              <Select
                value={form.watch("type")}
                onValueChange={(value) =>
                  form.setValue("type", value as WalletType)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{labels[form.watch("type")]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {(["CASH", "BANK", "E_WALLET"] as const).map((type) => (
                    <SelectItem key={type} value={type}>
                      {labels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field
              data-invalid={Boolean(form.formState.errors.openingBalance)}
            >
              <FieldLabel htmlFor="wallet-balance">Saldo awal</FieldLabel>
              <Controller
                control={form.control}
                name="openingBalance"
                render={({ field }) => (
                  <CurrencyInput
                    id="wallet-balance"
                    name={field.name}
                    ref={field.ref}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="0"
                    aria-invalid={Boolean(
                      form.formState.errors.openingBalance,
                    )}
                  />
                )}
              />
              <FieldError errors={[form.formState.errors.openingBalance]} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter
          showCloseButton
          className="sticky bottom-0 z-10 shrink-0 border-t bg-popover px-6 py-4"
        >
          <Button
            form="wallet-form"
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

const walletIcon = { CASH: Banknote, BANK: Building2, E_WALLET: Smartphone }

export function WalletsPage() {
  const wallets = useFinanceData<Wallet>("/wallets", "wallets")
  const total = wallets.data.reduce((sum, wallet) => sum + wallet.balance, 0)

  const remove = async (id: string) => {
    try {
      await api.delete(`/wallets/${id}`)
      toast.success("Wallet dihapus")
      await wallets.refresh()
    } catch (cause) {
      toast.error("Wallet tidak dapat dihapus", {
        description: errorMessage(cause),
      })
    }
  }

  return (
    <div className="page-container">
      <PageHeader
        title="Wallet"
        description="Saldo virtual berdasarkan seluruh transaksi yang kamu catat."
        action={<WalletDialog onSaved={() => void wallets.refresh()} />}
      />
      <Card className="mb-4 bg-foreground text-background">
        <CardContent>
          <p className="text-sm text-background/60">
            Total saldo seluruh wallet
          </p>
          <p className="finance-number mt-1 text-3xl font-semibold">
            {formatCurrency(total)}
          </p>
        </CardContent>
      </Card>
      {wallets.loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-44" />
          ))}
        </div>
      ) : wallets.error ? (
        <EmptyState
          icon={WalletCards}
          title="Wallet belum dapat dimuat"
          description={wallets.error}
        />
      ) : !wallets.data.length ? (
        <Card>
          <EmptyState
            icon={WalletCards}
            title="Belum ada wallet"
            description="Tambahkan tempat kamu menyimpan uang, seperti Cash, rekening bank, atau e-wallet."
            action={<WalletDialog onSaved={() => void wallets.refresh()} />}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {wallets.data.map((wallet) => {
            const Icon = walletIcon[wallet.type]
            return (
              <Card key={wallet.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="size-5" />
                    </span>
                    <ConfirmDeleteButton
                      label="Hapus wallet"
                      title="Hapus wallet?"
                      description="Wallet hanya dapat dihapus jika belum memiliki transaksi."
                      onConfirm={() => remove(wallet.id)}
                    />
                  </div>
                  <CardTitle className="mt-4">{wallet.name}</CardTitle>
                  <CardDescription>{labels[wallet.type]}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="finance-number text-2xl font-semibold">
                    {formatCurrency(wallet.balance)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Saldo saat ini
                  </p>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
