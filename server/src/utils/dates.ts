export function monthRange(value?: string) {
  const parsed = value ? new Date(`${value}-01T00:00:00.000Z`) : new Date()
  const start = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth(), 1))
  const end = new Date(Date.UTC(parsed.getUTCFullYear(), parsed.getUTCMonth() + 1, 1))
  return { start, end }
}
