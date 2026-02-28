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
    Info,
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'

import type { PublicGymData, PublicSession } from '@/lib/actions/public-gym'
import { checkMembership, joinGym, bookPublicSession, getGymSessions } from '@/lib/actions/public-gym'

// Dashboard components (used for member view)
import { StatsCards } from '@/components/stats-cards'
import { BookingCalendar } from '@/components/booking-calendar'
import { MyBookings } from '@/components/my-bookings'

interface GymPageClientProps {
    gym: PublicGymData
    initialSessions: PublicSession[]
    memberData?: {
        profile: any
        isAdmin: boolean
        subscriptionData: any
        sessionsWithParticipants: any[]
        bookings: any[]
        hasNoSubscription: boolean
        totalTokens: number
        stats: {
            upcomingBookings: number
            completedThisMonth: number
            currentStreak: number
            longestStreak: number
            weeklyActivity: number[]
        }
    } | null
}

export default function GymPageClient({ gym, initialSessions, memberData }: GymPageClientProps) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [sessions, setSessions] = useState(initialSessions)
    const [membership, setMembership] = useState<{
        isMember: boolean
        isAuthenticated: boolean
        role?: string | null
    } | null>(memberData ? { isMember: true, isAuthenticated: true, role: 'member' } : null)
    const [joinLoading, setJoinLoading] = useState(false)
    const [bookingId, setBookingId] = useState<string | null>(null)
    const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
    const [copied, setCopied] = useState(false)

    const searchParams = useSearchParams()
    const autoJoin = searchParams.get('join') === 'true'

    useEffect(() => {
        if (!memberData) {
            checkMembership(gym.id).then((result) => {
                setMembership(result)

                // Auto-join if requested and not already a member
                if (autoJoin && result.isAuthenticated && !result.isMember && !joinLoading) {
                    handleJoin()
                }
            })
        }
    }, [gym.id, autoJoin])

    const handleJoin = async () => {
        if (!membership?.isAuthenticated) {
            router.push(`/auth/login?redirect=/${gym.slug}?join=true`)
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
            // Reload to get member data
            router.refresh()
        }
        setJoinLoading(false)
    }

    const handleBook = async (sessionId: string) => {
        if (!membership?.isAuthenticated) {
            router.push(`/auth/login?redirect=/${gym.slug}`)
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

    // If we have memberData, render the full member dashboard
    if (memberData && membership?.isMember) {
        return <MemberView gym={gym} memberData={memberData} location={location} onShare={handleShare} copied={copied} />
    }

    // Otherwise, render the guest/public view
    return <GuestView
        gym={gym}
        sessions={sessions}
        membership={membership}
        joinLoading={joinLoading}
        bookingId={bookingId}
        feedback={feedback}
        copied={copied}
        location={location}
        onJoin={handleJoin}
        onBook={handleBook}
        onShare={handleShare}
    />
}


// ─── MEMBER VIEW ───────────────────────────────────────────────────────────────
function MemberView({ gym, memberData, location, onShare, copied }: {
    gym: PublicGymData
    memberData: NonNullable<GymPageClientProps['memberData']>
    location: string
    onShare: () => void
    copied: boolean
}) {
    return (
        <div className="min-h-screen">
            {/* Premium Member Header */}
            <section className="relative overflow-hidden">
                {/* Subtle gradient background */}
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-orange-500 to-primary" />

                <div className="container relative px-4 py-8 md:py-10">
                    <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 flex-wrap">
                                <h1 className="text-3xl font-black tracking-tight">{gym.name}</h1>
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/20">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Active Member
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                {location && (
                                    <span className="flex items-center gap-1.5">
                                        <MapPin className="h-4 w-4 text-primary/60" /> {location}
                                    </span>
                                )}
                                {gym.phone && (
                                    <a href={`tel:${gym.phone}`} className="flex items-center gap-1.5 hover:text-primary transition-colors">
                                        <Phone className="h-4 w-4 text-primary/60" /> {gym.phone}
                                    </a>
                                )}
                                {gym.email && (
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="h-4 w-4 text-primary/60" /> {gym.email}
                                    </span>
                                )}
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={onShare} className="rounded-xl border-border/60 hover:border-primary/40 hover:bg-primary/5">
                            <Share2 className="h-4 w-4 mr-1.5" />
                            {copied ? 'Copied!' : 'Share'}
                        </Button>
                    </div>
                </div>
                <div className="border-b border-border/30" />
            </section>

            {/* Full Dashboard Content */}
            <main className="mx-auto w-full max-w-2xl space-y-5 p-4 pt-6 md:max-w-7xl md:space-y-6 md:p-8">
                {/* Subscription Warning — soft styling */}
                {memberData.hasNoSubscription && (
                    <div className="rounded-2xl bg-gradient-to-r from-primary/[0.06] to-orange-500/[0.04] border border-primary/10 p-5 md:p-6">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                <Info className="h-5 w-5 text-primary" />
                            </div>
                            <div className="flex-1 space-y-3">
                                <div>
                                    <h3 className="font-bold text-foreground">No Active Subscription</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        You need an active subscription to book sessions. Contact the gym to get started.
                                    </p>
                                </div>
                                {gym.phone && (
                                    <a
                                        href={`tel:${gym.phone}`}
                                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 shadow-sm shadow-primary/20"
                                    >
                                        <Phone className="h-4 w-4" />
                                        Call {gym.phone}
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <StatsCards
                    workoutTokens={memberData.totalTokens}
                    totalBookings={memberData.bookings.length}
                    upcomingBookings={memberData.stats.upcomingBookings}
                    completedThisMonth={memberData.stats.completedThisMonth}
                    currentStreak={memberData.stats.currentStreak}
                    longestStreak={memberData.stats.longestStreak}
                    weeklyActivity={memberData.stats.weeklyActivity}
                    subscriptionEndDate={memberData.subscriptionData?.end_date}
                />

                {/* BookingCalendar + MyBookings Grid */}
                <div className="grid w-full gap-5 md:gap-6 lg:grid-cols-2">
                    <div id="booking" className="min-w-0">
                        <BookingCalendar
                            sessions={memberData.sessionsWithParticipants || []}
                            userTokens={memberData.profile.workout_tokens}
                            hasActiveSubscription={!memberData.hasNoSubscription}
                        />
                    </div>

                    <div className="min-w-0">
                        <MyBookings bookings={memberData.bookings} isAdmin={memberData.isAdmin} />
                    </div>
                </div>
            </main>
        </div>
    )
}


// ─── GUEST VIEW ────────────────────────────────────────────────────────────────
function GuestView({ gym, sessions, membership, joinLoading, bookingId, feedback, copied, location, onJoin, onBook, onShare }: {
    gym: PublicGymData
    sessions: PublicSession[]
    membership: { isMember: boolean; isAuthenticated: boolean; role?: string | null } | null
    joinLoading: boolean
    bookingId: string | null
    feedback: { type: 'success' | 'error'; message: string } | null
    copied: boolean
    location: string
    onJoin: () => void
    onBook: (sessionId: string) => void
    onShare: () => void
}) {
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
                                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-500/10 text-orange-600 text-sm font-medium border border-orange-500/20">
                                    <CheckCircle2 className="h-4 w-4" /> You're a member
                                </div>
                            ) : (
                                <Button
                                    size="lg"
                                    onClick={onJoin}
                                    disabled={joinLoading}
                                    className="rounded-xl px-8 bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20"
                                >
                                    {joinLoading ? (
                                        <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Joining...</>
                                    ) : !membership.isAuthenticated ? (
                                        <><UserPlus className="h-4 w-4 mr-2" /> Sign in to Join</>
                                    ) : (
                                        <><UserPlus className="h-4 w-4 mr-2" /> Join This Gym</>
                                    )}
                                </Button>
                            )}

                            <Button
                                variant="outline"
                                size="lg"
                                onClick={onShare}
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
                        ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
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
                                        const slotsColor = slotsPercentage > 50 ? 'text-orange-600' : slotsPercentage > 20 ? 'text-amber-500' : 'text-primary'

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
                                                            onClick={() => onBook(session.id)}
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
