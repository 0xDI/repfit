"use client"

import { LogOut, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/lib/actions/auth"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "@/components/language-switcher"

interface AdminHeaderProps {
  profile: {
    full_name: string | null
    phone: string
  } | null
  userEmail?: string
}

export function AdminHeader({ profile, userEmail }: AdminHeaderProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
    router.refresh()
  }

  const initials = profile?.full_name
    ? profile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "AD"

  return (
    <header className="sticky top-0 z-30 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between gap-4 px-6 pl-16 md:pl-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard")}
          className="text-muted-foreground hover:text-foreground"
        >
          <Home className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden text-sm font-medium md:inline">{profile?.full_name || "Admin"}</span>
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
              <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                <Home className="mr-2 h-4 w-4" />
                Dashboard
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
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
