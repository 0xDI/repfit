"use client"

import { LogOut, Shield } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
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
    phone: string | null
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
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 md:px-8">
        {/* Left: Logo + Breadcrumb */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <Link href="/" className="flex items-center gap-2.5 group transition-opacity hover:opacity-80">
            <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-primary/10 p-1 border border-primary/20 flex flex-shrink-0">
              <Image src="/repfit-logo.png" alt="REPFIT" fill className="object-contain p-0.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-foreground hidden sm:block">REPFIT</span>
          </Link>

          <span className="text-muted-foreground/30 font-light text-xl select-none hidden sm:block">/</span>

          <GymSwitcher
            currentGymName={currentGym?.name || "Switch Gym"}
            currentGymSlug={currentGym?.slug || ""}
          />
        </div>

        {/* Right: User */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="outline-none group flex items-center gap-3">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-semibold leading-tight">{profile?.full_name || "Member"}</p>
                  <p className="text-[11px] text-muted-foreground">{userEmail || profile?.phone}</p>
                </div>
                <Avatar className="h-9 w-9 border-2 border-transparent transition-all group-hover:border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-xl overflow-hidden p-1">
              <div className="px-3 py-3 mb-1 bg-muted/30 rounded-lg">
                <p className="text-sm font-semibold truncate">{profile?.full_name || "Member"}</p>
                <p className="text-xs text-muted-foreground truncate">{userEmail || profile?.phone}</p>
                <p className="mt-1 text-[11px] text-primary font-medium">{profile?.workout_tokens} tokens remaining</p>
              </div>
              {profile?.role === "admin" && (
                <>
                  <DropdownMenuItem onClick={() => router.push("/admin")} className="rounded-lg cursor-pointer text-primary">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin Panel
                  </DropdownMenuItem>
                </>
              )}
              <DropdownMenuSeparator className="my-1 opacity-50" />
              <DropdownMenuItem onClick={handleSignOut} className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
