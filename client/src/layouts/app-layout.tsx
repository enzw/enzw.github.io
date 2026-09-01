import { NavLink, Outlet, useLocation } from "react-router-dom"
import {
  BarChart3,
  CircleDollarSign,
  CreditCard,
  HandCoins,
  LayoutDashboard,
  LogOut,
  Menu,
  PiggyBank,
  ReceiptText,
  Repeat2,
  Settings,
  Tags,
  WalletCards,
} from "lucide-react"

import { Brand } from "@/components/brand"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
} from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/features/auth/auth-context"

const navigation = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transactions", label: "Transaksi", icon: ReceiptText },
  { to: "/income", label: "Pemasukan", icon: CircleDollarSign },
  { to: "/expenses", label: "Pengeluaran", icon: CreditCard },
  { to: "/budgets", label: "Budget", icon: Tags },
  { to: "/savings", label: "Tabungan", icon: PiggyBank },
  { to: "/wallets", label: "Wallet", icon: WalletCards },
  { to: "/subscriptions", label: "Langganan", icon: Repeat2 },
  { to: "/debts", label: "Hutang", icon: HandCoins },
  { to: "/statistics", label: "Statistik", icon: BarChart3 },
] as const

function UserMenu() {
  const { user, logout } = useAuth()
  const initials = user?.name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" className="h-11 w-full justify-start px-2" />
        }
      >
        <Avatar className="size-8">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="min-w-0 flex-1 truncate text-left">{user?.name}</span>
        <Menu className="size-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block truncate">{user?.name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {user?.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Settings />
          Pengaturan
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => void logout()}>
          <LogOut />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function AppLayout() {
  const location = useLocation()

  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader className="h-16 justify-center px-3">
            <Brand />
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
