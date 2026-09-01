export const formatCurrency = (value: number | string, compact = false) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0, notation: compact ? "compact" : "standard" }).format(Number(value) || 0)
export const formatDate = (value: string) => new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value))
export const currentMonth = () => new Date().toISOString().slice(0, 7)
export const labels = { INCOME: "Pemasukan", EXPENSE: "Pengeluaran", SAVING: "Tabungan", PRIMARY: "Utama", SECONDARY: "Tambahan", FIXED: "Tetap", VARIABLE: "Variabel", SUBSCRIPTION: "Langganan", DEBT: "Hutang", DISCRETIONARY: "Keinginan", CASH: "Tunai", BANK: "Bank", E_WALLET: "E-wallet" } as const
