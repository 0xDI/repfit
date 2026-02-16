'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
    MapPin,
    Phone,
    Mail,
    Calendar,
    Clock,
    Users,
    CheckCircle2,
    Dumbbell,
    ArrowRight,
    Share2,
    Sparkles,
    UserPlus,
    Loader2,
} from 'lucide-react'

import type { PublicGymData, PublicSession } from '@/lib/actions/public-gym'
import { checkMembership, joinGym, bookPublicSession, getGymSessions } from '@/lib/actions/public-gym'

interface GymPageClientProps {
    gym: PublicGymData
    initialSessions: PublicSession[]
}

export default function GymPageClient({ gym, initialSessions }: GymPageClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [sessions, setSessions] = useState(initialSessions)
    const [membership, setMembership] = useState<{
        isMember: boolean
        isAuthenticated: boolean
        role?: string | null
    } | null>(null)
    const [joinLoading, setJoinLoading] = useState(false)
    const [bookingId, setBookingId] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        checkMembership(gym.id).then(setMembership)
    }, [gym.id])

    const handleJoin = async () => {
        if (!membership?.isAuthenticated) {
            router.push(`/auth/login?redirect=/gym/${gym.slug}`)
            return
        }

        setJoinLoading(true)
        setFeedback(null)
        const result = await joinGym(gym.id)

        if (result.error) {
            setFeedback({ type: 'error', message: result.error })
        } else {
            setFeedback({ type: 'success', message: "Welcome! You've joined the gym 🎉" })
            setMembership(prev => prev ? { ...prev, isMember: true, role: 'member' } : null)
        }
        setJoinLoading(false)
    }

    const handleBook = async (sessionId: string) => {
        if (!membership?.isAuthenticated) {
            router.push(`/auth/login?redirect=/gym/${gym.slug}`)
            return
        }

        if (!membership?.isMember) {
            setFeedback({ type: 'error', message: 'Please join the gym first before booking.' })
            return
        }

        setBookingId(sessionId)
        setFeedback(null)
        const result = await bookPublicSession(gym.id, sessionId)

        if (result.error) {
            setFeedback({ type: 'error', message: result.error })
        } else {
            setFeedback({ type: 'success', message: 'Session booked successfully! 💪' })
            // Refresh sessions to update slot counts
            const refreshed = await getGymSessions(gym.id)
            setSessions(refreshed.sessions)
        }
        setBookingId(null)
    }

    const handleShare = async () => {
        const url = window.location.href
        try {
            await navigator.clipboard.writeText(url)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // Fallback
            const input = document.createElement('input')
            input.value = url
            document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            document.body.removeChild(input)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const location = [gym.address, gym.city, gym.state, gym.zip_code].filter(Boolean).join(', ')

    // Group sessions by date
    const sessionsByDate = sessions.reduce<Record<string, PublicSession[]>>((acc, session) => {
        const date = session.session_date
        if (!acc[date]) acc[date] = []
        acc[date].push(session)
        return acc
    }, {})

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr + 'T00:00:00')
        const today = new Date()
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        if (dateStr === today.toISOString().split('T')[0]) return 'Today'
        if (dateStr === tomorrow.toISOString().split('T')[0]) return 'Tomorrow'

        return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    }

    const formatTime = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number)
        const ampm = h >= 12 ? 'PM' : 'AM'
        const hour = h % 12 || 12
        return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
    }

    return (
        <div>
            {/* Hero Section */}
            <section className="relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-[-30%] right-[-15%] w-[60%] h-[80%] rounded-full bg-primary/5 blur-[100px]" />
                    <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[60%] rounded-full bg-blue-500/5 blur-[80px]" />
                </div>

                <div className="container relative px-4 py-12 sm:py-16">
                    <div className="max-w-3xl mx-auto text-center space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium">
                            <Dumbbell className="h-4 w-4" />
                            Open for Bookings
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
                            {gym.name}
                        </h1>

                        {gym.description && (
                            <p className="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
                                {gym.description}
                            </p>
                        )}

                        {/* Contact Info */}
                        <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
                            {location && (
                                <span className="flex items-center gap-1.5">
                                    <MapPin className="h-4 w-4" /> {location}
                                </span>
                            )}
                            {gym.phone && (
                                <span className="flex items-center gap-1.5">
                                    <Phone className="h-4 w-4" /> {gym.phone}
                                </span>
                            )}
                            {gym.email && (
                                <span className="flex items-center gap-1.5">
                                    <Mail className="h-4 w-4" /> {gym.email}
                                </span>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                            {membership === null ? (
                                <Button size="lg" disabled className="rounded-xl px-8">
                                    <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading...
                                </Button>
                            ) : membership.isMember ? (
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-sm font-medium border border-emerald-500/20">
                                    <CheckCircle2 className="h-4 w-4" /> You're a member
                                </div>
                            ) : (
                                <Button
                                    size="lg"
                                    onClick={handleJoin}
                                    disabled={joinLoading}
                                    className="rounded-xl px-8 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
                                >
                                    {joinLoading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Joining...</>
                                    ) : (
                                        <><UserPlus className="h-4 w-4 mr-2" /> Join This Gym</>
                                    )}
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleShare}
                                className="rounded-xl"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                {copied ? 'Link Copied!' : 'Share'}
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Feedback Banner */}
            {feedback && (
                <div className="container px-4">
                    <div className={`max-w-3xl mx-auto p-4 rounded-xl text-sm font-medium ${feedback.type === 'success'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-destructive/10 text-destructive border border-destructive/20'
                        }`}>
                        {feedback.message}
                    </div>
                </div>
            )}

            {/* Sessions */}
            <section className="container px-4 py-12">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <h2 className="text-2xl font-bold text-foreground">Upcoming Sessions</h2>
                    </div>

                    {Object.keys(sessionsByDate).length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <Calendar className="h-10 w-10 text-muted-foreground/40 mb-3" />
                                <p className="text-muted-foreground">No sessions available for the next 7 days.</p>
                                <p className="text-sm text-muted-foreground/60 mt-1">Check back soon!</p>
                            </CardContent>
                        </Card>
                    ) : (
                        Object.entries(sessionsByDate).map(([date, daySessions]) => (
                            <div key={date} className="space-y-3">
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                    {formatDate(date)}
                                </h3>
                                <div className="grid gap-3">
                                    {daySessions.map((session) => {
                                        const isFull = session.available_slots <= 0
                                        const isBooking = bookingId === session.id
                                        const slotsPercentage = (session.available_slots / session.total_slots) * 100
                                        const slotsColor = slotsPercentage > 50 ? 'text-emerald-400' : slotsPercentage > 20 ? 'text-amber-400' : 'text-red-400'

                                        return (
                                            <Card
                                                key={session.id}
                                                className={`group transition-all hover:border-primary/30 ${isFull ? 'opacity-60' : ''}`}
                                            >
                                                <CardContent className="flex items-center justify-between p-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex flex-col items-center px-3 py-2 bg-muted/50 rounded-xl min-w-[70px]">
                                                            <Clock className="h-4 w-4 text-primary mb-1" />
                                                            <span className="text-sm font-semibold text-foreground">
                                                                {formatTime(session.start_time)}
                                                            </span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatTime(session.end_time)}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-foreground">
                                                                {session.workout_duration_minutes
                                                                    ? `${session.workout_duration_minutes} min session`
                                                                    : 'Gym Session'}
                                                            </p>
                                                            <p className={`text-sm flex items-center gap-1 ${slotsColor}`}>
                                                                <Users className="h-3.5 w-3.5" />
                                                                {isFull ? 'Fully booked' : `${session.available_slots} / ${session.total_slots} spots left`}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {!isFull && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleBook(session.id)}
                                                            disabled={isBooking || !membership?.isMember}
                                                            className="rounded-xl"
                                                            variant={membership?.isMember ? 'default' : 'outline'}
                                                        >
                                                            {isBooking ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : membership?.isMember ? (
                                                                <>Book <ArrowRight className="h-3.5 w-3.5 ml-1" /></>
                                                            ) : (
                                                                'Join to Book'
                                                            )}
                                                        </Button>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    )
}
