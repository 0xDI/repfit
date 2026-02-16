import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { LanguageProvider } from "@/lib/i18n/language-context"
import "./globals.css"

export const metadata: Metadata = {
  title: "REPFIT - Gym Management SaaS Platform",
  description: "The complete gym management solution. Manage members, bookings, subscriptions, and grow your fitness business with REPFIT.",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <LanguageProvider>
          {children}
          <Toaster />
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}
