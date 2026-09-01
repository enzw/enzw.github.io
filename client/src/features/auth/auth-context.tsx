import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"

import {
  PROFILE_THEME_STORAGE_KEY,
  profileThemeForAvatar,
} from "@/lib/profile"
import { api } from "@/services/api"
import type { User } from "@/types/finance"

type AuthContextValue = {
  user: User | null
  loading: boolean
  setUser: (user: User | null) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get<{ user: User }>("/auth/me")
      .then(({ data }) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (loading) return
    const profileTheme = profileThemeForAvatar(user?.avatarEmoji)
    document.documentElement.dataset.profileTheme = profileTheme
    window.localStorage.setItem(PROFILE_THEME_STORAGE_KEY, profileTheme)
  }, [loading, user?.avatarEmoji])

  const value = useMemo(
    () => ({
      user,
      loading,
      setUser,
      logout: async () => {
        await api.post("/auth/logout")
        setUser(null)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider")
  }
  return context
}
