"use client"

import { cn } from "@/lib/utils"
import { Calendar, Home, Menu, MessageSquare, Users, CreditCard, Settings, Shield } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"
import { useLanguage } from "@/lib/i18n/language-context"

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
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()

  const SidebarContent = () => (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-border/40 px-6">
        <div className="relative h-10 w-10 overflow-hidden rounded-lg">
          <Image src="/repfit-logo.png" alt="REPFIT" fill className="object-cover" />
        </div>
        <div>
          <h1 className="text-lg font-semibold">REPFIT</h1>
          <p className="text-xs text-muted-foreground">{t("adminPanel")}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {t(item.name)}
            </Link>
          )
        })}
      </nav>
    </>
  )

  return (
    <>
      {/* Mobile Hamburger Menu */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="fixed left-4 top-3 z-50 md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/40 bg-card md:flex">
        <SidebarContent />
      </aside>
    </>
  )
}
