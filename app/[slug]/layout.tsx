import React from "react"
import { notFound } from "next/navigation"
import { getGymBySlug } from "@/lib/actions/public-gym"
import type { Metadata } from "next"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ensureProfileExists } from "@/lib/actions/profile"
import PublicHeader from "@/components/public-header"

interface GymLayoutProps {
    children: React.ReactNode
    params: Promise<{ slug: string }>
}

// Reserved paths — if someone hits one of these, it's not a gym slug
const RESERVED_PATHS = new Set([
    "admin", "dashboard", "auth", "onboarding", "api", "gym", "explore",
    "settings", "login", "signup", "register", "profile",
    "account", "billing", "pricing", "about", "contact",
    "help", "support", "terms", "privacy", "test",
    "_next", "favicon.ico", "repfit-logo.png",
])

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params

    if (RESERVED_PATHS.has(slug)) {
        return { title: "REPFIT" }
    }

    const { gym } = await getGymBySlug(slug)

    if (!gym) {
        return { title: "Gym Not Found — REPFIT" }
    }

    const location = [gym.city, gym.state].filter(Boolean).join(", ")

    return {
        title: `${gym.name} — Book Sessions | REPFIT`,
        description: gym.description || `Book gym sessions at ${gym.name}${location ? ` in ${location}` : ""}. Join today and start your fitness journey.`,
        openGraph: {
            title: `${gym.name} — REPFIT`,
            description: gym.description || `Book sessions at ${gym.name}`,
            type: "website",
        },
    }
}

export default async function GymLayout({ children, params }: GymLayoutProps) {
    const { slug } = await params

    // Don't intercept reserved paths
    if (RESERVED_PATHS.has(slug)) {
        notFound()
    }

    const { gym } = await getGymBySlug(slug)

    if (!gym) {
        notFound()
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let profile = null
    if (user) {
        const profileResult = await ensureProfileExists(user.id, user.email || "")
        profile = profileResult.success ? profileResult.profile : null
    }

    return (
        <div className="min-h-screen bg-background">
            <PublicHeader gym={gym} user={user} profile={profile} />

            <main>{children}</main>

            <footer className="border-t border-border/40 py-6 mt-16">
                <div className="container px-4 text-center text-xs text-muted-foreground">
                    <p>Powered by <Link href="/" className="text-primary hover:underline">REPFIT</Link> · Gym Management Platform</p>
                </div>
            </footer>
        </div>
    )
}

