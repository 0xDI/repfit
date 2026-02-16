import React from "react"
import { notFound } from "next/navigation"
import { getGymBySlug } from "@/lib/actions/public-gym"
import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"

interface GymLayoutProps {
    children: React.ReactNode
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params
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
    const { gym } = await getGymBySlug(slug)

    if (!gym) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Lightweight public header */}
            <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
                <nav className="container flex h-14 items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2">
                            <Image src="/repfit-logo.png" alt="REPFIT" width={28} height={28} className="rounded-md" />
                            <span className="text-sm font-medium text-muted-foreground">REPFIT</span>
                        </Link>
                        <span className="text-muted-foreground/40">/</span>
                        <span className="font-semibold text-foreground">{gym.name}</span>
                    </div>
                    <Link
                        href="/auth/login"
                        className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Sign In
                    </Link>
                </nav>
            </header>

            <main>{children}</main>

            <footer className="border-t border-border/40 py-6 mt-16">
                <div className="container px-4 text-center text-xs text-muted-foreground">
                    <p>Powered by <Link href="/" className="text-primary hover:underline">REPFIT</Link> · Gym Management Platform</p>
                </div>
            </footer>
        </div>
    )
}
