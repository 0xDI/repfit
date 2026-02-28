'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { LogOut, User, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/actions/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import GymSwitcher from '@/components/gym-switcher'

interface PublicHeaderProps {
    gym: {
        name: string
        slug: string
    }
    user: {
        email: string | null
        id: string
    } | null
    profile: {
        full_name: string | null
        role?: string | null
    } | null
}

export default function PublicHeader({ gym, user, profile }: PublicHeaderProps) {
    const router = useRouter()

    const handleSignOut = async () => {
        await signOut()
        router.refresh()
    }

    const initials = profile?.full_name
        ? profile.full_name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
        : user?.email?.[0].toUpperCase() || 'U'

    return (
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
            <nav className="container flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-4 sm:gap-6">
                    <Link href="/" className="flex items-center gap-2.5 group transition-opacity hover:opacity-80">
                        <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-orange-500/10 p-1 border border-orange-500/20">
                            <Image src="/repfit-logo.png" alt="REPFIT" width={32} height={32} className="object-contain" />
                        </div>
                        <span className="text-base font-bold tracking-tight text-foreground hidden xs:block">REPFIT</span>
                    </Link>

                    <div className="h-6 w-px bg-border/40" />

                    <GymSwitcher currentGymName={gym.name} currentGymSlug={gym.slug} />
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="outline-none group">
                                    <Avatar className="h-9 w-9 border-2 border-transparent transition-all group-hover:border-primary/20">
                                        <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 mt-2 rounded-xl shadow-xl overflow-hidden p-1">
                                <div className="px-3 py-3 mb-1 bg-muted/30 rounded-lg">
                                    <p className="text-sm font-semibold truncate">{profile?.full_name || 'Member'}</p>
                                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                </div>
                                <DropdownMenuItem onClick={() => router.push('/dashboard')} className="rounded-lg cursor-pointer">
                                    <User className="mr-2 h-4 w-4" /> Dashboard
                                </DropdownMenuItem>
                                {profile?.role === 'admin' && (
                                    <DropdownMenuItem onClick={() => router.push('/admin')} className="rounded-lg cursor-pointer text-primary">
                                        <Shield className="mr-2 h-4 w-4" /> Admin Panel
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator className="my-1 opacity-50" />
                                <DropdownMenuItem onClick={handleSignOut} className="rounded-lg cursor-pointer text-destructive focus:bg-destructive/10">
                                    <LogOut className="mr-2 h-4 w-4" /> Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Link
                            href={`/auth/login?redirect=/${gym.slug}`}
                            className="text-sm font-semibold text-muted-foreground hover:text-primary transition-colors px-4 py-2"
                        >
                            Sign In
                        </Link>
                    )}
                </div>
            </nav>
        </header>
    )
}
