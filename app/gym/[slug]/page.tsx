import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { MapPin, Clock, Users, Calendar } from 'lucide-react'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()
    const { data: gym } = await supabase.from('gyms').select('name, description').eq('slug', slug).single()

    if (!gym) return { title: 'Gym Not Found' }

    return {
        title: `${gym.name} - Join using REPFIT`,
        description: gym.description || `Join ${gym.name} on REPFIT.`,
    }
}

export default async function GymPublicPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    // Fetch gym details
    const { data: gym, error } = await supabase
        .from('gyms')
        .select('*')
        .eq('slug', slug)
        .single()

    if (error || !gym) {
        if (error && error.code !== 'PGRST116') {
            console.error('Gym fetch error:', error)
        }
        // If public RLS is missing, this will fail for anon users
        // We can handle RLS failure gracefully?
        // For now, 404
        notFound()
    }

    // Check if user is logged in to show "Book" vs "Join"
    const { data: { user } } = await supabase.auth.getUser()

    let membership = null
    if (user) {
        const { data: memberData } = await supabase
            .from('gym_members')
            .select('*')
            .eq('gym_id', gym.id)
            .eq('user_id', user.id)
            .maybeSingle()
        membership = memberData
    }

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            {/* Header */}
            <header className="border-b bg-card p-4 flex justify-between items-center sticky top-0 z-10">
                <Link href="/" className="flex items-center gap-2">
                    <span className="font-bold text-xl tracking-tighter">REPFIT</span>
                </Link>
                <div className="flex gap-4">
                    {user ? (
                        <Link href="/dashboard">
                            <Button variant="outline">Dashboard</Button>
                        </Link>
                    ) : (
                        <Link href="/auth/login">
                            <Button variant="ghost">Login</Button>
                        </Link>
                    )}
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative h-[300px] w-full bg-muted overflow-hidden">
                {gym.logo_url ? (
                    <Image
                        src={gym.logo_url}
                        alt={gym.name}
                        fill
                        className="object-cover opacity-50"
                    />
                ) : (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                        <span className="text-6xl opacity-20 font-black uppercase tracking-tighter">{gym.name.substring(0, 2)}</span>
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

                <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full max-w-4xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">{gym.name}</h1>
                    <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
                        {gym.city && <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {gym.city}, {gym.state}</span>}
                        {gym.operating_hours && <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {gym.operating_hours || 'Open Now'}</span>}
                    </div>
                </div>
            </div>

            <main className="flex-1 container mx-auto p-6 md:p-12 grid gap-8 md:grid-cols-3">
                {/* Left Column: Details */}
                <div className="md:col-span-2 space-y-8">
                    <section className="bg-card rounded-xl p-6 border shadow-sm">
                        <h2 className="text-xl font-bold mb-4">About</h2>
                        <p className="text-muted-foreground leading-relaxed">
                            {gym.description || "No description provided."}
                        </p>
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            <div className="bg-muted/50 p-4 rounded-lg">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Users className="h-5 w-5" />
                                    <span className="font-semibold">Capacity</span>
                                </div>
                                <p className="text-2xl font-bold">{gym.max_capacity || 'Limited'}</p>
                            </div>
                            {/* Add more stats if needed */}
                        </div>
                    </section>

                    <section className="bg-card rounded-xl p-6 border shadow-sm">
                        <h2 className="text-xl font-bold mb-4">Schedule</h2>
                        <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-lg border-dashed border-2">
                            <Calendar className="h-10 w-10 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium">Classes Coming Soon</h3>
                            <p className="text-sm text-muted-foreground max-w-xs mt-1">
                                The schedule for this gym isn't available online just yet. Check back soon.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Right Column: Action */}
                <div className="md:col-span-1">
                    <div className="bg-card rounded-xl p-6 border shadow-lg sticky top-24">
                        <h3 className="font-bold text-lg mb-4">Join {gym.name}</h3>

                        {membership ? (
                            <div className="space-y-4">
                                <div className="bg-green-500/10 text-green-500 p-3 rounded-md text-sm font-medium text-center">
                                    You are a member!
                                </div>
                                <Button className="w-full" size="lg">Book a Class</Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Become a member to book classes, track progress, and join the community.
                                </p>
                                {user ? (
                                    <form action={async () => {
                                        'use server'
                                        // Join logic here (call server action)
                                    }}>
                                        <Button className="w-full" size="lg">Join Now</Button>
                                    </form>
                                ) : (
                                    <Link href={`/auth/login?next=/gym/${slug}`}>
                                        <Button className="w-full" size="lg">Login to Join</Button>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    )
}
