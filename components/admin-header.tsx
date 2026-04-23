"use client"

import Link from "next/link"
import { LogOut, Settings, ChevronDown, Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import Image from "next/image"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/lib/actions/auth"
import { switchGym } from "@/lib/actions/admin"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"
import { cn } from "@/lib/utils"

interface Gym {
  id: string
  name: string
  logo_url?: string | null
}

interface AdminHeaderProps {
  profile: {
    full_name: string | null
    phone: string
  } | null
  userEmail?: string
  currentGym?: Gym | null
  allGyms?: Gym[]
}

export function AdminHeader({ profile, userEmail, currentGym, allGyms = [] }: AdminHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
    router.refresh()
  }

  const handleSwitchGym = async (gymId: string) => {
    if (gymId === currentGym?.id) return
    await switchGym(gymId)
    router.refresh()
  }

  const initials = profile?.full_name
    ? profile.full_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
    : "AD"

  const gymInitials = currentGym?.name
    ? currentGym.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : "GY"

  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/60 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-8">
        {/* Vercel-style Breadcrumb / Gym Switcher */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative h-7 w-7 overflow-hidden rounded-lg bg-primary/10 p-1 border border-primary/20 group-hover:scale-105 transition-transform duration-300">
              <Image src="/repfit-logo.png" alt="REPFIT" fill className="object-contain p-0.5" />
            </div>
            <span className="text-sm font-black tracking-tighter text-foreground group-hover:text-primary transition-colors">REPFIT</span>
          </Link>

          <span className="text-muted-foreground/30 font-light text-xl select-none">/</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 px-2 h-9 hover:bg-muted/50 transition-all rounded-xl border border-transparent hover:border-border/40 shadow-none"
              >
                {currentGym?.logo_url ? (
                  <div className="relative h-6 w-6 overflow-hidden rounded-md shadow-sm flex-shrink-0 border border-border/20">
                    <Image src={currentGym.logo_url} alt={currentGym.name || ""} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-[10px] font-bold shadow-sm">
                    {gymInitials}
                  </div>
                )}
                <span className="text-sm font-bold tracking-tight">
                  {currentGym?.name || "Select Gym"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 p-1.5 rounded-2xl border-border/40 shadow-2xl bg-card/95 backdrop-blur-xl">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest px-3 py-2">
                Your Managed Gyms
              </DropdownMenuLabel>
              <div className="space-y-1">
                {allGyms.map((gym) => (
                  <DropdownMenuItem
                    key={gym.id}
                    onClick={() => handleSwitchGym(gym.id)}
                    className={cn(
                      "flex items-center gap-3 py-2 px-3 cursor-pointer rounded-xl transition-all",
                      gym.id === currentGym?.id ? "bg-primary/10 text-primary font-bold" : "hover:bg-muted/50"
                    )}
                  >
                    {gym.logo_url ? (
                      <div className="relative h-8 w-8 overflow-hidden rounded-lg flex-shrink-0 border border-border/10">
                        <Image src={gym.logo_url} alt={gym.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary text-xs font-bold">
                        {gym.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="text-sm">{gym.name}</p>
                    </div>
                    {gym.id === currentGym?.id && (
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </div>
              <DropdownMenuSeparator className="my-1.5 bg-border/40" />
              <DropdownMenuItem
                onClick={() => router.push("/onboarding?new=true")}
                className="flex items-center gap-3 py-2.5 px-3 cursor-pointer text-muted-foreground hover:text-foreground rounded-xl"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-colors">
                  <Plus className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold">Create New Gym</p>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>

          <div className="h-8 w-px bg-border/40 mx-1 hidden sm:block" />

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2.5 px-2 hover:bg-muted/50 rounded-xl transition-all border border-transparent hover:border-border/20">
                <Avatar className="h-8 w-8 ring-2 ring-background shadow-sm border border-border/20">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-xs font-bold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start pr-1">
                  <span className="text-sm font-bold leading-tight">{profile?.full_name || "Admin"}</span>
                  <p className="text-[10px] text-primary font-bold uppercase tracking-widest leading-tight">Gym Owner</p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-1.5 rounded-2xl border-border/40 shadow-2xl bg-card/95 backdrop-blur-xl">
              <DropdownMenuLabel className="px-3 py-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold">{profile?.full_name || "Admin"}</p>
                  <p className="text-xs text-muted-foreground font-medium truncate">{userEmail || profile?.phone}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border/40" />
              <div className="space-y-0.5 mt-1">
                <DropdownMenuItem onClick={() => router.push("/admin/settings")} className="cursor-pointer rounded-xl py-2.5 px-3 flex items-center gap-2 hover:bg-muted/50">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/40 my-1" />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer rounded-xl py-2.5 px-3 flex items-center gap-2 hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm font-bold">Sign Out</span>
                </DropdownMenuItem>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
