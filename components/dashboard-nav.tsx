"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { BarChart3, Bell, TrendingUp, User, Shield, LogOut, Share2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/lib/actions/auth"

interface DashboardNavProps {
  gym: {
    id: string
    name: string
    logo_url?: string
  }
  user: {
    id: string
    email?: string
  }
  role: string
  profile?: {
    full_name?: string | null
    age?: number | null
  } | null
}

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/dashboard/analytics", label: "Analytics", icon: TrendingUp },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/profile", label: "Profile", icon: User },
]

export function DashboardNav({ gym, user, role, profile }: DashboardNavProps) {
  const pathname = usePathname()
  const isAdmin = role === "owner" || role === "admin"
  const [copied, setCopied] = useState(false)

  const handleSignOut = async () => {
    await signOut()
  }

  const handleShare = () => {
    // If slug is missing (legacy gyms), fallback to ID or handle gracefully
    // But ideally connection should rely on slug. For now we assume slug exists or we fallback.
    const slug = (gym as any).slug || gym.id
    const url = `${window.location.origin}/gym/${slug}`

    try {
      navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'User'
  const initials = profile?.full_name
    ? profile.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
    : user.email?.charAt(0).toUpperCase() || 'U'

  return (
    <nav className="border-b border-border bg-card">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/repfit-logo.png" alt="REPFIT" width={32} height={32} className="rounded-md" />
            <span className="text-lg font-bold text-foreground">REPFIT</span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                </Link>
              )
            })}
            {isAdmin && (
              <>
                <Link href="/admin">
                  <Button
                    variant={pathname.startsWith("/admin") ? "secondary" : "ghost"}
                    size="sm"
                    className="gap-2 text-primary"
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="gap-2 hidden sm:flex border-primary/20 text-primary hover:text-primary hover:bg-primary/10"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" /> Copied!
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" /> Share Gym Link
                </>
              )}
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <div className="flex items-center gap-2">
                  <span className="hidden sm:inline text-sm">{displayName}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {initials}
                  </div>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 sm:hidden">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="w-full gap-2 border-primary/20 text-primary hover:text-primary hover:bg-primary/10"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" /> Copied!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" /> Share Gym Link
                    </>
                  )}
                </Button>
              </div>
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="text-primary">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}
