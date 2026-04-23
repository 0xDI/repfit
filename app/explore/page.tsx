import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin, Dumbbell, ArrowRight } from "lucide-react"
import { searchGyms } from "@/lib/actions/public-gym"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/server"
import { ensureProfileExists } from "@/lib/actions/profile"

export default async function ExplorePage({
    searchParams,
}: {
    searchParams: { q?: string }
}) {
    const query = searchParams.q || ""
    const { gyms, error } = await searchGyms(query)

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let profile = null
    if (user) {
        const profileResult = await ensureProfileExists(user.id, user.email || "")
        profile = profileResult.success ? profileResult.profile : null
    }

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="border-b border-border/40 sticky top-0 bg-background/60 backdrop-blur-xl z-50">
                <nav className="container mx-auto max-w-7xl flex h-16 items-center justify-between px-4">
                    <Link href="/" className="flex items-center gap-2.5 group transition-opacity hover:opacity-80">
                        <div className="relative h-8 w-8 overflow-hidden rounded-xl bg-primary/10 p-1 border border-primary/20 flex flex-shrink-0">
                            <Image src="/repfit-logo.png" alt="REPFIT" fill className="object-contain p-0.5" />
                        </div>
                        <span className="text-sm font-semibold tracking-tight hidden sm:block">REPFIT</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {user ? (
                            <Link href="/dashboard">
                                <Button variant="ghost" className="text-sm font-semibold hover:bg-primary/5 hover:text-primary">Dashboard</Button>
                            </Link>
                        ) : (
                            <Link href="/auth/login">
                                <Button variant="ghost" className="text-sm font-semibold hover:bg-primary/5 hover:text-primary">Sign In</Button>
                            </Link>
                        )}
                    </div>
                </nav>
            </header>

            <main className="flex-1 container mx-auto max-w-7xl px-4 py-12 space-y-10">
                <div className="max-w-2xl mx-auto text-center space-y-4">
                    <h1 className="text-4xl font-black tracking-tight sm:text-5xl">Explore Gyms</h1>
                    <p className="text-muted-foreground text-lg">Find the perfect training environment for your goals.</p>

                    <form action="/explore" className="pt-2">
                        <div className="mx-auto max-w-xl bg-card/50 backdrop-blur-md border border-border/60 p-1.5 rounded-[2rem] shadow-xl shadow-primary/5 flex gap-1.5">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    name="q"
                                    defaultValue={query}
                                    placeholder="Search by name, city, or state..."
                                    className="h-12 border-none bg-transparent pl-11 focus-visible:ring-0 text-base placeholder:text-muted-foreground/50 font-medium"
                                />
                            </div>
                            <Button type="submit" className="h-12 px-6 rounded-[1.5rem] font-bold shadow-lg shadow-primary/20">
                                Search
                            </Button>
                        </div>
                    </form>
                </div>

                {error && (
                    <div className="text-center py-12 text-destructive">
                        <p>Error loading gyms: {error}</p>
                    </div>
                )}

                {gyms.length === 0 ? (
                    <div className="text-center py-24 space-y-4">
                        <div className="bg-muted/30 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto">
                            <Search className="h-7 w-7 text-muted-foreground/40" />
                        </div>
                        <h3 className="text-xl font-bold">No gyms found</h3>
                        <p className="text-muted-foreground">Try adjusting your search terms or location.</p>
                        <Link href="/explore">
                            <Button variant="outline" className="rounded-full px-6">Clear Search</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {gyms.map((gym, i) => (
                            <Link
                                key={gym.id}
                                href={`/${gym.slug}`}
                                className="group"
                                style={{ animationDelay: `${i * 60}ms` }}
                            >
                                <Card className="h-full border-border/40 bg-card/50 backdrop-blur-sm overflow-hidden transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 rounded-2xl flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both">
                                    <CardContent className="p-0 flex-1 flex flex-col">
                                        <div className="aspect-[4/3] relative bg-muted/10 flex items-center justify-center p-12 border-b border-border/10 overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            {gym.logo_url ? (
                                                <Image src={gym.logo_url} alt={gym.name} fill className="object-contain p-8 transition-transform duration-700 group-hover:scale-110" />
                                            ) : (
                                                <Dumbbell className="h-16 w-16 text-muted-foreground/15 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110" />
                                            )}
                                        </div>
                                        <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                                            <div className="space-y-1.5">
                                                <h3 className="text-lg font-bold group-hover:text-primary transition-colors line-clamp-1">{gym.name}</h3>
                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                    <MapPin className="h-3.5 w-3.5" />
                                                    <span className="truncate">{gym.city}, {gym.state}</span>
                                                </div>
                                            </div>

                                            <div className="pt-3 border-t border-border/30 flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-primary/50">Partner</span>
                                                <ArrowRight className="h-4 w-4 text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            <footer className="border-t border-border/40 py-10 bg-muted/10">
                <div className="container mx-auto max-w-7xl px-4 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2">
                        <Image src="/repfit-logo.png" alt="REPFIT" width={20} height={20} />
                        <span className="font-bold text-sm tracking-tight">REPFIT</span>
                    </div>
                    <p className="text-xs text-muted-foreground/60">
                        &copy; {new Date().getFullYear()} REPFIT. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    )
}
