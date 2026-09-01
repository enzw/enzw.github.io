import { WalletCards } from "lucide-react"
import { cn } from "@/lib/utils"

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return <div className={cn("flex items-center gap-2.5", className)}><span className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground"><WalletCards className="size-5" /></span>{!compact && <span className="font-heading text-lg font-bold tracking-tight">WangWang</span>}</div>
}
