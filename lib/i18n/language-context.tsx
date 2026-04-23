"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { translations, type Language } from "./translations"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof typeof translations.en) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    const initLanguage = async () => {
      try {
        const stored = typeof localStorage !== "undefined" ? (localStorage.getItem("language") as Language | null) : null

        if (stored && (stored === "en" || stored === "el")) {
          setLanguageState(stored)
          return
        }

        // Set default immediately to prevent hanging
        setLanguageState("en")
        if (typeof localStorage !== "undefined") {
          localStorage.setItem("language", "en")
        }

        // Optional: detect country in background (non-blocking)
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 1000)

        fetch("https://ipapi.co/json/", { signal: controller.signal })
          .then(response => response.json())
          .then(data => {
            clearTimeout(timeoutId)
            if (data.country_code === "GR" || data.country === "Greece") {
              setLanguageState("el")
              if (typeof localStorage !== "undefined") {
                localStorage.setItem("language", "el")
              }
            }
          })
          .catch(() => {
            // Ignore errors silently
          })
      } catch {
        // Fallback to English
        setLanguageState("en")
      }
    }

    initLanguage()
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("language", lang)
  }

  const t = (key: keyof typeof translations.en): string => {
    return translations[language][key] || translations.en[key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
