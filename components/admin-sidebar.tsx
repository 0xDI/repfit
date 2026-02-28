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
      <div className="flex h-16 items-center gap-3 border-b border-border/40 px-6">
        <div className="relative h-10 w-10 overflow-hidden rounded-lg flex-shrink-0">
          <Image src="/repfit-logo.png" alt="REPFIT" fill className="object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">REPFIT</h1>
          <p className="text-xs text-muted-foreground">{t("adminPanel" as any)}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : isLoading
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
              ) : (
                <item.icon className="h-5 w-5 flex-shrink-0" />
              )}
              {t(item.name as any)}
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
          <Button variant="ghost" size="icon" className="fixed left-4 top-3 z-50 md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <MobileSidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar — collapsed by default, expands on hover */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden md:flex flex-col",
          "border-r border-border/40 bg-card/95 backdrop-blur-xl",
          "w-[72px] hover:w-64 transition-all duration-300 ease-in-out",
          "group overflow-hidden"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border/40 px-4">
          <div className="relative h-9 w-9 overflow-hidden rounded-lg flex-shrink-0">
            <Image src="/repfit-logo.png" alt="REPFIT" fill className="object-cover" />
          </div>
          <div className="overflow-hidden whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
            <h1 className="text-base font-semibold leading-tight">REPFIT</h1>
            <p className="text-[10px] text-muted-foreground leading-tight">{t("adminPanel" as any)}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : isLoading
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 flex-shrink-0 animate-spin" />
                ) : (
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                )}
                <span className="overflow-hidden whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-75">
                  {t(item.name as any)}
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
