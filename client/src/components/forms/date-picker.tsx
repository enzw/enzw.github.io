import { useState } from "react"
import { id } from "date-fns/locale"
import { CalendarDays, X } from "lucide-react"
import type { Matcher } from "react-day-picker"

import { Calendar } from "@/components/ui/calendar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

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

function toDisplayDate(date: Date | undefined) {
  if (!date) return ""
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0")
  return `${day}/${month}/${date.getFullYear()}`
}

function formatTypedDate(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8)
  return [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)]
    .filter(Boolean)
    .join("/")
}

function parseDisplayDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value)
  if (!match) return undefined

  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]))
  if (
    date.getFullYear() !== Number(match[3]) ||
    date.getMonth() !== Number(match[2]) - 1 ||
    date.getDate() !== Number(match[1])
  ) {
    return undefined
  }
  return date
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
    <InputGroup>
      <InputGroupInput
        key={value}
        id={inputId}
        defaultValue={toDisplayDate(selected)}
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        aria-invalid={invalid}
        onChange={(event) => {
          const nextValue = formatTypedDate(event.target.value)
          const nextDate = parseDisplayDate(nextValue)
          event.target.value = nextValue

          if (nextDate) {
            onValueChange(toDateInput(nextDate))
          } else if (!nextValue) {
            onValueChange("")
          }
        }}
        onBlur={(event) => {
          if (event.currentTarget.value && !parseDisplayDate(event.currentTarget.value)) {
            event.currentTarget.value = ""
            onValueChange("")
          }
          onBlur?.()
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault()
            setOpen(true)
          }
        }}
      />
      <InputGroupAddon align="inline-end">
        {clearable && selected && (
          <InputGroupButton
            size="icon-xs"
            aria-label="Hapus tanggal"
            onClick={() => {
              onValueChange("")
            }}
          >
            <X />
          </InputGroupButton>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <InputGroupButton size="icon-xs" aria-label="Buka kalender" />
            }
          >
            <CalendarDays />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-auto p-0">
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
          </PopoverContent>
        </Popover>
      </InputGroupAddon>
    </InputGroup>
  )
}
