import type { ComponentProps } from "react"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type CurrencyInputProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "value" | "defaultValue" | "onChange"
> & {
  value: number | string | null | undefined
  onValueChange: (value: number) => void
}

function formatRupiahDigits(value: CurrencyInputProps["value"]) {
  if (value === null || value === undefined || value === "") return ""
  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) return ""
  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.max(0, Math.trunc(numericValue)))
}

export function CurrencyInput({
  value,
  onValueChange,
  className,
  ...props
}: CurrencyInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-sm text-muted-foreground">
        Rp
      </span>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={formatRupiahDigits(value)}
        className={cn("pl-10 tabular-nums", className)}
        onChange={(event) => {
          const digits = event.target.value.replace(/\D/g, "")
          onValueChange(digits ? Number(digits) : 0)
        }}
      />
    </div>
  )
}
