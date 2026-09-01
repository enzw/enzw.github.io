import { useState } from "react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { CalendarDays, X } from "lucide-react"
import type { Matcher } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type DatePickerProps = {
  id?: string
  value: string
  onValueChange: (value: string) => void
  onBlur?: () => void
  placeholder?: string
  disabled?: Matcher | Matcher[]
  clearable?: boolean
  invalid?: boolean
}

function parseDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return undefined
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toDateInput(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export function DatePicker({
  id: inputId,
  value,
  onValueChange,
  onBlur,
  placeholder = "Pilih tanggal",
  disabled,
  clearable = false,
  invalid = false,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseDateInput(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={inputId}
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start font-normal",
              !selected && "text-muted-foreground",
            )}
            aria-invalid={invalid}
            onBlur={onBlur}
          />
        }
      >
        <CalendarDays />
        {selected ? format(selected, "d MMMM yyyy", { locale: id }) : placeholder}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          mode="single"
          locale={id}
          selected={selected}
          defaultMonth={selected}
          disabled={disabled}
          onSelect={(date) => {
            if (!date) return
            onValueChange(toDateInput(date))
            setOpen(false)
          }}
        />
        {clearable && selected && (
          <div className="border-t p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => {
                onValueChange("")
                setOpen(false)
              }}
            >
              <X />
              Hapus tanggal
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
