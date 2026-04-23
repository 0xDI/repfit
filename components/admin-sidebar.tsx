"use client"

import { cn } from "@/lib/utils"
import { Calendar, Home, Menu, MessageSquare, Users, CreditCard, Settings, Shield, Loader2 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { useLanguage } from "@/lib/i18n/language-context"
import { useRouter } from "next/navigation"

const navigation = [
  { name: "overview", href: "/admin", icon: Home },
  { name: "sessions", href: "/admin/sessions", icon: Calendar },
  { name: "members", href: "/admin/members", icon: Users },
  { name: "admins", href: "/admin/admins", icon: Shield },
  { name: "subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { name: "messages", href: "/admin/messages", icon: MessageSquare },
  { name: "settings", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [clickedHref, setClickedHref] = useState<string | null>(null)
  const { t } = useLanguage()

  // Reset clicked state when navigation completes
  useEffect(() => {
    if (!isPending) {
      setClickedHref(null)
    }
  }, [isPending])

  const handleNavClick = (href: string, e: React.MouseEvent) => {
    if (href === pathname) return // Already on this page
    e.preventDefault()
    setClickedHref(href)
    startTransition(() => {
      router.push(href)
    })
  }

  const MobileSidebarContent = () => (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-border/40 px-6 bg-card/50 backdrop-blur-md">
        <div className="relative h-8 w-8 overflow-hidden rounded-lg flex-shrink-0 bg-primary/10 p-1 border border-primary/20">
          <Image src="/repfit-logo.png" alt="REPFIT" fill className="object-contain p-0.5" />
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight">REPFIT</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t("adminPanel" as any)}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1.5 p-4 bg-background/50">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          const isLoading = clickedHref === item.href && isPending
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={(e) => {
                setMobileOpen(false)
                handleNavClick(item.href, e)
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                  : isLoading
                    ? "bg-muted/50 text-foreground"
                    : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
              )}
            >
              <div className={cn(
                "flex items-center justify-center rounded-lg transition-colors",
                isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
              )}>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <item.icon className="h-5 w-5" />
                )}
              </div>
              <span className="flex-1">{t(item.name as any)}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )

  return (
    <>
      {/* Mobile Hamburger Menu */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed left-4 top-3 z-50 md:hidden bg-background/50 backdrop-blur-sm border border-border/40 rounded-xl">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 border-r border-border/40 shadow-2xl bg-card">
          <MobileSidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar — collapsed by default, expands on hover */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden md:flex flex-col",
          "border-r border-border/40 bg-card/30 backdrop-blur-2xl shadow-xl",
          "w-[72px] hover:w-64 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)",
          "group overflow-hidden"
        )}
      >
        {/* Logo Section */}
        <div className="flex h-16 items-center border-b border-border/40 px-4 group-hover:px-4 transition-all">
          <Link href="/" className="flex items-center gap-3 w-full">
            <div className="relative h-9 w-9 overflow-hidden rounded-xl flex-shrink-0 bg-primary/10 p-1.5 border border-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Image src="/repfit-logo.png" alt="REPFIT" fill className="object-contain p-0.5" />
            </div>
            <div className="overflow-hidden whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100 translate-x-2 group-hover:translate-x-0">
              <h1 className="text-base font-bold tracking-tight leading-tight">REPFIT</h1>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest leading-tight">{t("adminPanel" as any)}</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1.5 p-3 mt-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const isLoading = clickedHref === item.href && isPending
            return (
              <Link
                key={item.name}
                href={item.href}
                title={t(item.name as any)}
                onClick={(e) => handleNavClick(item.href, e)}
                className={cn(
                  "flex items-center gap-4 rounded-xl px-3.5 py-3 text-sm font-semibold transition-all duration-300",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                    : isLoading
                      ? "bg-muted/50 text-foreground"
                      : "text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                )}
              >
                <div className={cn(
                  "flex items-center justify-center transition-transform duration-300",
                  isActive ? "scale-110" : "group-hover:scale-110"
                )}>
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <item.icon className="h-5 w-5" />
                  )}
                </div>
                <span className="overflow-hidden whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100 translate-x-4 group-hover:translate-x-0">
                  {t(item.name as any)}
                </span>
                {isActive && (
                  <div className="absolute left-0 w-1 h-6 bg-primary-foreground rounded-r-full group-hover:opacity-0 transition-opacity" />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border/40 mt-auto bg-muted/10 group-hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              AD
            </div>
            <div className="overflow-hidden whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all duration-300 delay-100">
              <p className="text-xs font-bold leading-tight truncate">Admin User</p>
              <p className="text-[10px] text-muted-foreground truncate">administrator</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
