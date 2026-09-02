import { useCallback, useEffect, useState } from "react"

import { api, errorMessage } from "@/services/api"

export function useFinanceData<T>(url: string, key: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const response = await api.get<Record<string, T[]>>(url, {
        params: { _refresh: Date.now() },
      })
      setData(response.data[key] ?? [])
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setLoading(false)
    }
  }, [url, key])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { data, loading, error, refresh }
}
