import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin, Dumbbell, ArrowRight } from "lucide-react"
import { searchGyms } from "@/lib/actions/public-gym"
import { Input } from "@/components/ui/input"
import { PublicHeader } from "@/components/public-header"
import { createClient } from "@/lib/supabase/server"
import { ensureProfileExists } from "@/lib/actions/profile"

export default async function ExplorePage({
    searchParams,
}: {
    searchParams: { q?: string }
}) {
    const query = searchParams.q || ""
    const { gyms, error } = await searchGyms(query)

    // Fetch auth state for the header
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let profile = null
    if (user) {
        const profileResult = await ensureProfileExists(user.id, user.email || "")
        profile = profileResult.success ? profileResult.profile : null
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header - Reusing PublicHeader but without a specific gym context for the switcher */}
            {/* Since PublicHeader expects a gym for the switcher, we might need to adjust it or pass a placeholder */}
            {/* For now, I'll just use the same navbar style as the home page for brand consistency */}

            <header className="border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur-md z-50">
                <nav className="container flex h-16 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-3">
                        <Image src="/repfit-logo.png" alt="REPFIT" width={32} height={32} />
                        <span className="text-xl font-bold tracking-tight">REPFIT</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {user ? (
                            <Link href="/dashboard">
                                <Button variant="ghost">Dashboard</Button>
                            </Link>
                        ) : (
                            <Link href="/auth/login">
                                <Button variant="ghost">Sign In</Button>
                            </Link>
                        )}
                    </div>
                </nav>
            </header>

            <main className="flex-1 container px-4 py-12 space-y-12">
                <div className="max-w-2xl mx-auto text-center space-y-4">
                    <h1 className="text-4xl font-extrabold tracking-tight">Explore Gyms</h1>
                    <p className="text-muted-foreground">Find the perfect training environment for your goals.</p>

                    <form action="/explore" className="relative group pt-4">
                        <Search className="absolute left-4 top-[calc(50%+8px)] -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            name="q"
                            defaultValue={query}
                            placeholder="Search by name, city, or state..."
                            className="h-14 pl-12 pr-4 rounded-2xl border-border bg-card shadow-sm focus-visible:ring-primary/20 text-lg"
                        />
                    </form>
                </div>

                {error && (
                    <div className="text-center py-12 text-destructive">
                        <p>Error loading gyms: {error}</p>
                    </div>
                )}

                {gyms.length === 0 ? (
                    <div className="text-center py-24 space-y-4">
                        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mx-auto opacity-40">
                            <Search className="h-8 w-8" />
                        </div>
                        <h3 className="text-xl font-semibold">No gyms found</h3>
                        <p className="text-muted-foreground">Try adjusting your search terms or location.</p>
                        <Link href="/explore">
                            <Button variant="outline" className="rounded-xl">Clear Search</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {gyms.map((gym) => (
                            <Link key={gym.id} href={`/${gym.slug}`} className="group">
                                <Card className="h-full border-border/40 overflow-hidden transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 rounded-[1.5rem] flex flex-col">
                                    <CardContent className="p-0 flex-1 flex flex-col">
                                        <div className="aspect-[4/3] relative bg-muted/30 flex items-center justify-center p-12 border-b border-border/10 overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            {gym.logo_url ? (
                                                <Image src={gym.logo_url} alt={gym.name} fill className="object-contain p-8 transition-transform group-hover:scale-110" />
                                            ) : (
                                                <Dumbbell className="h-16 w-16 text-muted-foreground/20 transition-transform group-hover:rotate-12" />
                                            )}
                                        </div>
                                        <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                                            <div className="space-y-2">
                                                <h3 className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-1">{gym.name}</h3>
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <MapPin className="h-4 w-4" />
                                                    <span className="truncate">{gym.city}, {gym.state}</span>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-border/40 flex items-center justify-between">
                                                <span className="text-xs font-bold uppercase tracking-widest text-primary/60">Official Partner</span>
                                                <ArrowRight className="h-5 w-5 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <footer className="border-t border-border/40 py-12 bg-muted/10 mt-12">
                <div className="container px-4 text-center space-y-4">
                    <div className="flex items-center justify-center gap-3">
                        <Image src="/repfit-logo.png" alt="REPFIT" width={24} height={24} />
                        <span className="font-bold tracking-tight">REPFIT</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Helping you reach your physical peak.
                    </p>
                    <p className="text-xs text-muted-foreground/60 pt-4">
                        &copy; {new Date().getFullYear()} REPFIT. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
