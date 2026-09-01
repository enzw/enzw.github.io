import { WalletCards } from "lucide-react"
import { cn } from "@/lib/utils"

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center", compact ? "gap-0" : "gap-2.5", className)}>
      <span
        className={cn(
          "grid shrink-0 place-items-center bg-primary text-primary-foreground",
          compact ? "size-8 rounded-xl" : "size-9 rounded-2xl",
        )}
      >
        <WalletCards className={compact ? "size-4" : "size-5"} />
      </span>
      {!compact && (
        <span className="whitespace-nowrap font-heading text-lg font-bold tracking-tight">
          WangWang
        </span>
      )}
    </div>
  )
}
