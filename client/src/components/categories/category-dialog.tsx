import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"

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
import { labels } from "@/lib/format"
import { api, errorMessage } from "@/services/api"
import type { Category, ExpenseType } from "@/types/finance"

const schema = z.object({
  name: z.string().trim().min(2, "Nama minimal 2 karakter").max(40),
  expenseType: z.enum([
    "FIXED",
    "VARIABLE",
    "SUBSCRIPTION",
    "DEBT",
    "DISCRETIONARY",
  ]),
})

type Values = z.infer<typeof schema>

const expenseTypes: ExpenseType[] = [
  "FIXED",
  "VARIABLE",
  "SUBSCRIPTION",
  "DEBT",
  "DISCRETIONARY",
]

type CategoryDialogProps = {
  onSaved: (category: Category) => void | Promise<void>
  initialExpenseType?: ExpenseType
  open?: boolean
  onOpenChange?: (open: boolean) => void
  showTrigger?: boolean
}

export function CategoryDialog({
  onSaved,
  initialExpenseType = "VARIABLE",
  open: controlledOpen,
  onOpenChange,
  showTrigger = true,
}: CategoryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen ?? internalOpen
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", expenseType: initialExpenseType },
  })
  const expenseType = form.watch("expenseType")

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(nextOpen)
    onOpenChange?.(nextOpen)
  }

  useEffect(() => {
    if (open) {
      form.reset({ name: "", expenseType: initialExpenseType })
    }
  }, [form, initialExpenseType, open])

  const submit = async (values: Values) => {
    try {
      const { data } = await api.post<{ category: Category }>(
        "/categories",
        values,
      )
      await onSaved(data.category)
      toast.success("Kategori ditambahkan")
      setOpen(false)
    } catch (cause) {
      toast.error("Gagal menambahkan kategori", {
        description: errorMessage(cause),
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {showTrigger && (
        <DialogTrigger render={<Button size="sm" />}>
          <Plus />
          Tambah kategori
        </DialogTrigger>
      )}
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh]">
        <DialogHeader className="shrink-0 border-b px-6 py-5 pr-16">
          <DialogTitle>Kategori pengeluaran baru</DialogTitle>
          <DialogDescription>
            Buat kategori agar pencatatan dan budget lebih sesuai kebutuhanmu.
          </DialogDescription>
        </DialogHeader>
        <form
          id="category-form"
          className="min-h-0 flex-1 overflow-y-auto px-6 py-5"
          onSubmit={form.handleSubmit(submit)}
        >
          <FieldGroup className="gap-4">
            <Field data-invalid={Boolean(form.formState.errors.name)}>
              <FieldLabel htmlFor="category-name">Nama kategori</FieldLabel>
              <Input
                id="category-name"
                placeholder="Contoh: Kesehatan"
                aria-invalid={Boolean(form.formState.errors.name)}
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>
            <Field>
              <FieldLabel>Klasifikasi pengeluaran</FieldLabel>
              <Select
                value={expenseType}
                onValueChange={(value) =>
                  form.setValue("expenseType", value as ExpenseType)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{labels[expenseType]}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {expenseTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {labels[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter
          showCloseButton
          className="sticky bottom-0 z-10 shrink-0 border-t bg-popover px-6 py-4"
        >
          <Button
            type="submit"
            form="category-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting && <Loader2 className="animate-spin" />}
            Simpan kategori
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
