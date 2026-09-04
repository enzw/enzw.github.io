import { useEffect } from "react"
import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  BarChart3,
  HandCoins,
  LayoutDashboard,
  PiggyBank,
  ReceiptText,
  Repeat2,
  Tags,
  WalletCards,
} from "lucide-react"

import { Brand } from "@/components/brand"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/features/auth/auth-context"

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transaksi", icon: ReceiptText },
  { to: "/budgets", label: "Budget", icon: Tags },
  { to: "/savings", label: "Tabungan", icon: PiggyBank },
  { to: "/wallets", label: "Wallet", icon: WalletCards },
  { to: "/subscriptions", label: "Langganan", icon: Repeat2 },
  { to: "/debts", label: "Hutang", icon: HandCoins },
  { to: "/statistics", label: "Statistik", icon: BarChart3 },
] as const

function UserMenu() {
  const { user } = useAuth()
  const { isMobile, state } = useSidebar()
  const compact = !isMobile && state === "collapsed"
  const initials = user?.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return (
    <Button
      variant="ghost"
      className={
        compact
          ? "h-10 w-full justify-center px-0"
          : "h-11 w-full min-w-0 justify-start px-2"
      }
      aria-label="Buka pengaturan profil"
      render={<NavLink to="/settings" />}
    >
      <Avatar className="size-8">
        <AvatarFallback className={user?.avatarEmoji ? "text-lg" : ""}>
          {user?.avatarEmoji ?? initials}
        </AvatarFallback>
      </Avatar>
      {!compact && (
        <span className="min-w-0 flex-1 truncate text-left">{user?.name}</span>
      )}
    </Button>
  )
}

function SidebarBrand() {
  const { isMobile, state } = useSidebar()
  return <Brand compact={!isMobile && state === "collapsed"} />
}

function MobileSidebarAutoClose() {
  const { pathname } = useLocation()
  const { setOpenMobile } = useSidebar()

  useEffect(() => {
    setOpenMobile(false)
  }, [pathname, setOpenMobile])

  return null
}

export function AppLayout() {
  const location = useLocation()

  return (
    <TooltipProvider>
      <SidebarProvider>
        <MobileSidebarAutoClose />
        <Sidebar collapsible="icon">
          <SidebarHeader className="h-16 items-start justify-center overflow-hidden px-3 group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:px-2">
            <SidebarBrand />
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Keuangan saya</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigation.map((item) => (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton
                        isActive={location.pathname === item.to}
                        tooltip={item.label}
                        render={<NavLink to={item.to} />}
                      >
                        <item.icon />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <UserMenu />
          </SidebarFooter>
        </Sidebar>
        <SidebarInset>
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur lg:px-6">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="md:hidden">
                <Brand />
              </div>
            </div>
            <p className="hidden text-sm text-muted-foreground md:block">
              Rencanakan uangmu, jalani hidupmu.
            </p>
          </header>
          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
