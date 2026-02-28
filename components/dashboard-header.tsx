"use client"

import { LogOut, Shield } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/lib/actions/auth"
import { useRouter } from "next/navigation"
import GymSwitcher from "@/components/gym-switcher"

interface DashboardHeaderProps {
  profile: {
    full_name: string | null
    phone: string | null // phone can be null
    workout_tokens: number
    role?: string
  } | null
  userEmail?: string
  unreadCount?: number
  currentGym?: {
    name: string
    slug: string
  }
}

export function DashboardHeader({ profile, userEmail, unreadCount = 0, currentGym }: DashboardHeaderProps) {
  const router = useRouter()

  const initials = profile?.full_name
    ? profile.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
    : profile?.phone?.slice(-4) || "U"

  const handleSignOut = () => {
    signOut().then(() => {
      router.push("/")
    })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center justify-between px-4 md:h-20 md:px-8">
        {/* Left: Logo and Name */}
        <div className="flex items-center gap-3 md:gap-4">
          <Image src="/repfit-logo.png" alt="REPFIT" width={48} height={48} className="h-10 w-10 md:h-12 md:w-12" />
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight md:text-2xl">REPFIT</h1>
            <span className="text-muted-foreground/40 text-xl font-light">/</span>
            <GymSwitcher
              currentGymName={currentGym?.name || "Switch Gym"}
              currentGymSlug={currentGym?.slug || ""}
            />
          </div>
        </div>

        {/* Right: User Info and Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-3 rounded-full px-4 py-4 hover:bg-accent bg-transparent border-0 transition-colors"
              >
                <div className="hidden text-right md:block">
                  <p className="text-sm font-semibold">{profile?.full_name || "Member"}</p>
                  <p className="text-xs text-muted-foreground">{userEmail || profile?.phone}</p>
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <div className="px-3 py-3">
                <p className="font-semibold">{profile?.full_name || "Member"}</p>
                <p className="text-sm text-muted-foreground">{userEmail || profile?.phone}</p>
                <p className="mt-1 text-xs text-muted-foreground">{profile?.workout_tokens} workout tokens</p>
              </div>
              {profile?.role === "admin" && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/admin")} className="text-primary">
                    <Shield className="mr-3 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                <LogOut className="mr-3 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
