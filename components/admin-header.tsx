"use client"

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
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-4 md:px-6">
        {/* Gym Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="gap-3 px-3 py-2 h-auto hover:bg-accent/50 transition-colors"
            >
              {currentGym?.logo_url ? (
                <div className="relative h-9 w-9 overflow-hidden rounded-lg shadow-sm flex-shrink-0">
                  <Image src={currentGym.logo_url} alt={currentGym.name || ""} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-xs font-bold shadow-sm">
                  {gymInitials}
                </div>
              )}
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-semibold leading-tight">
                  {currentGym?.name || "Select Gym"}
                </span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  Management Panel
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground hidden md:block" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal uppercase tracking-wider">
              Your Gyms
            </DropdownMenuLabel>
            {allGyms.map((gym) => (
              <DropdownMenuItem
                key={gym.id}
                onClick={() => handleSwitchGym(gym.id)}
                className="flex items-center gap-3 py-2.5 cursor-pointer"
              >
                {gym.logo_url ? (
                  <div className="relative h-8 w-8 overflow-hidden rounded-md flex-shrink-0">
                    <Image src={gym.logo_url} alt={gym.name} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary text-xs font-bold">
                    {gym.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium">{gym.name}</p>
                </div>
                {gym.id === currentGym?.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/onboarding?new=true")}
              className="flex items-center gap-3 py-2.5 cursor-pointer text-muted-foreground hover:text-foreground"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/30">
                <Plus className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium">Create New Gym</p>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher />

          {/* Profile dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2 hover:bg-accent/50">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-semibold text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-medium leading-tight">{profile?.full_name || "Admin"}</span>
                  <span className="text-[11px] text-muted-foreground leading-tight">Owner</span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{profile?.full_name || "Admin"}</p>
                  <p className="text-xs text-muted-foreground">{userEmail || profile?.phone}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/admin/settings")} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
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
