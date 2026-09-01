import { useEffect, useRef, useState } from "react"

import { formatCurrency } from "@/lib/format"

type AnimatedCurrencyProps = {
  value: number | string
  duration?: number
}

function numericValue(value: number | string) {
  const number = Number(value)
  return Number.isFinite(number) ? number : 0
}

export function AnimatedCurrency({
  value,
  duration = 900,
}: AnimatedCurrencyProps) {
  const target = numericValue(value)
  const [displayValue, setDisplayValue] = useState(0)
  const currentValue = useRef(0)

  useEffect(() => {
    const from = currentValue.current
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches

    if (reduceMotion || from === target) {
      const frame = window.requestAnimationFrame(() => {
        currentValue.current = target
        setDisplayValue(target)
      })
      return () => window.cancelAnimationFrame(frame)
    }

    let animationFrame = 0
    const startedAt = performance.now()
    const difference = target - from

    const animate = (now: number) => {
      const progress = Math.min((now - startedAt) / duration, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const nextValue = from + difference * easedProgress

      currentValue.current = nextValue
      setDisplayValue(nextValue)

      if (progress < 1) {
        animationFrame = window.requestAnimationFrame(animate)
      } else {
        currentValue.current = target
        setDisplayValue(target)
      }
    }

    animationFrame = window.requestAnimationFrame(animate)
    return () => window.cancelAnimationFrame(animationFrame)
  }, [duration, target])

  return (
    <>
      <span aria-hidden="true">{formatCurrency(Math.round(displayValue))}</span>
      <span className="sr-only">{formatCurrency(target)}</span>
    </>
  )
}
