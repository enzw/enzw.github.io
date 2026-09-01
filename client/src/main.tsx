import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@/components/theme-provider'
import { PROFILE_THEME_STORAGE_KEY } from '@/lib/profile'
import './index.css'
import App from './App.tsx'

const savedProfileTheme = window.localStorage.getItem(PROFILE_THEME_STORAGE_KEY)
if (savedProfileTheme === 'male' || savedProfileTheme === 'female') {
  document.documentElement.dataset.profileTheme = savedProfileTheme
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      enableColorScheme
      disableTransitionOnChange
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
