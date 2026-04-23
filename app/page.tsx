import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Search,
  MapPin,
  Dumbbell,
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Zap,
  Target,
  Calendar,
  Users,
  ShieldCheck,
  TrendingUp,
  CreditCard
} from "lucide-react"
import { searchGyms } from "@/lib/actions/public-gym"

export default async function HomePage() {
  const { gyms } = await searchGyms()

  return (
    <div className="flex min-h-screen flex-col bg-[#0A0A0A] selection:bg-primary/20 text-white font-sans antialiased overflow-x-hidden">
      {/* Navigation - Premium Blur Effect */}
      <header className="border-b border-white/5 sticky top-0 bg-[#0A0A0A]/60 backdrop-blur-2xl z-50 transition-all duration-300">
        <nav className="container flex h-16 sm:h-20 items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-[1px] border border-primary/20">
              <div className="absolute inset-0 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors" />
              <Image src="/repfit-logo.png" alt="REPFIT" fill className="object-contain p-1.5 drop-shadow-[0_0_8px_rgba(252,76,2,0.5)]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white transition-colors">REPFIT</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/explore" className="hidden sm:inline-block text-sm font-semibold text-white/50 hover:text-white transition-colors tracking-wide">
              Explore
            </Link>
            <div className="h-4 w-px bg-white/10 hidden sm:block" />
            <Link href="/auth/login">
              <Button variant="ghost" className="text-sm font-bold text-white hover:bg-white/10 rounded-full px-5 h-10">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up" className="hidden sm:block">
              <Button className="text-sm font-bold bg-white text-black hover:bg-white/90 rounded-full px-6 h-10 shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]">Get Started</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* HERO SECTION - Base44 Aesthetic (Perfectly Centered, Minimal, High Contrast) */}
        <section className="relative pt-24 pb-32 sm:pt-40 sm:pb-48 flex flex-col items-center justify-center text-center px-4 overflow-hidden min-h-[85vh]">
          {/* Subtle Ambient Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[120px] opacity-50 pointer-events-none" />
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-mode-both">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold tracking-widest uppercase text-white/80">The New Standard in Fitness</span>
            </div>

            <h1 className="text-6xl sm:text-7xl lg:text-9xl font-black tracking-[-0.04em] text-white leading-[1] text-balance max-w-5xl mx-auto drop-shadow-2xl">
              Elite Gyms.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white/70 to-white/30">Zero Friction.</span>
            </h1>

            <p className="max-w-2xl mx-auto text-lg sm:text-xl text-white/50 leading-relaxed font-medium text-balance animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 fill-mode-both">
              Find, book, and access the world&apos;s best training facilities instantly. Manage all your workouts from a single profile.
            </p>

            {/* Premium Search Bar */}
            <form action="/explore" className="w-full max-w-2xl mx-auto pt-6 flex flex-col sm:flex-row gap-3 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300 fill-mode-both">
              <div className="relative flex-1 group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-orange-500/50 rounded-2xl blur opacity-0 group-focus-within:opacity-20 transition duration-500" />
                <div className="relative flex items-center bg-[#111] border border-white/10 rounded-2xl h-16 shadow-2xl overflow-hidden">
                  <Search className="absolute left-6 h-5 w-5 text-white/30" />
                  <Input
                    name="q"
                    placeholder="Search by city, gym, or zip..."
                    className="h-full w-full border-none bg-transparent pl-14 pr-6 text-lg text-white placeholder:text-white/30 focus-visible:ring-0 focus-visible:outline-none"
                  />
                </div>
              </div>
              <Button type="submit" size="lg" className="w-full sm:w-auto h-16 px-10 rounded-2xl bg-white text-black hover:bg-neutral-200 font-bold text-lg shadow-[0_0_30px_rgba(255,255,255,0.1)] transition-all active:scale-95 group">
                Explore
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </form>

            {/* Social Proof */}
            <div className="pt-16 sm:pt-24 flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700 animate-in fade-in duration-1000 delay-500 fill-mode-both">
              <div className="flex items-center gap-2 font-bold tracking-tight text-sm sm:text-base uppercase">
                <Users className="h-5 w-5 text-primary" /> 10k+ Athletes
              </div>
              <div className="flex items-center gap-2 font-bold tracking-tight text-sm sm:text-base uppercase">
                <Dumbbell className="h-5 w-5 text-primary" /> 50+ Elite Partners
              </div>
              <div className="flex items-center gap-2 font-bold tracking-tight text-sm sm:text-base uppercase">
                <ShieldCheck className="h-5 w-5 text-primary" /> Secure Platform
              </div>
            </div>
          </div>
        </section>

        {/* BENTO GRID FEATURES SECTION - High End SaaS Style */}
        <section className="py-32 relative border-t border-white/5 bg-[#050505]">
          <div className="container px-4 sm:px-6 mx-auto max-w-7xl">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-20">
              <h2 className="text-4xl sm:text-6xl font-black tracking-tighter text-balance">The Operating System <br /><span className="text-white/50">for Your Fitness.</span></h2>
              <p className="text-white/40 text-lg sm:text-xl font-medium">Everything you need to find and access elite facilities.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {/* Large Bento Box */}
              <div className="md:col-span-2 group relative overflow-hidden rounded-[2rem] bg-[#111] border border-white/5 hover:border-white/10 transition-colors p-8 sm:p-12 min-h-[400px] flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-0 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none translate-x-1/2 -translate-y-1/2" />
                <div className="space-y-4 relative z-10 max-w-md">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-primary">
                    <Search className="h-7 w-7" />
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight">Discover Environments.</h3>
                  <p className="text-white/40 text-lg leading-relaxed font-medium">Instantly locate premium gyms, studios, and recovery centers. Filter by equipment, amenities, and vibe.</p>
                </div>
                {/* Mockup UI Element */}
                <div className="absolute right-[-10%] bottom-[-10%] w-[60%] h-[70%] bg-[#1A1A1A] rounded-tl-3xl border-t border-l border-white/10 shadow-2xl p-6 hidden sm:block transform group-hover:-translate-y-2 group-hover:-translate-x-2 transition-transform duration-500">
                  <div className="space-y-4 opacity-50">
                    <div className="h-8 w-1/2 bg-white/10 rounded-lg" />
                    <div className="h-4 w-3/4 bg-white/5 rounded-lg" />
                    <div className="h-32 w-full bg-white/5 rounded-xl border border-white/5 mt-4" />
                  </div>
                </div>
              </div>

              {/* Smaller Bento Box 1 */}
              <div className="group relative overflow-hidden rounded-[2rem] bg-[#111] border border-white/5 hover:border-white/10 transition-colors p-8 sm:p-10 min-h-[400px] flex flex-col justify-between">
                <div className="space-y-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white">
                    <Calendar className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">Instant Booking.</h3>
                  <p className="text-white/40 text-base leading-relaxed font-medium">Reserve your spot in real-time. Walk in, scan, and start training.</p>
                </div>
              </div>

              {/* Smaller Bento Box 2 */}
              <div className="group relative overflow-hidden rounded-[2rem] bg-[#111] border border-white/5 hover:border-white/10 transition-colors p-8 sm:p-10 min-h-[400px] flex flex-col justify-between">
                <div className="space-y-4 relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mb-4 text-white">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">One Subscription.</h3>
                  <p className="text-white/40 text-base leading-relaxed font-medium">Drop the multiple memberships. One token system for every facility.</p>
                </div>
              </div>

              {/* Wide Bento Box */}
              <div className="md:col-span-2 group relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-primary/20 to-[#111] border border-primary/20 hover:border-primary/40 transition-colors p-8 sm:p-12 min-h-[400px] flex flex-col sm:flex-row items-center justify-between gap-8">
                <div className="space-y-6 relative z-10 max-w-sm">
                  <div className="inline-flex px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-bold tracking-widest uppercase border border-primary/30">
                    For Partners
                  </div>
                  <h3 className="text-4xl font-black tracking-tight leading-none">Power Your Facility.</h3>
                  <p className="text-white/70 text-lg leading-relaxed font-medium">Monetize empty slots, attract new athletes, and streamline your operations with the Repfit Business Engine.</p>
                  <Button variant="outline" className="rounded-full border-white/20 bg-transparent hover:bg-white hover:text-black font-bold h-12 px-6">
                    Partner With Us
                  </Button>
                </div>
                <div className="relative w-full sm:w-1/2 h-full min-h-[200px] flex items-center justify-center">
                  <Zap className="w-48 h-48 text-primary opacity-20 group-hover:opacity-40 group-hover:scale-110 transition-all duration-700 blur-xl absolute" />
                  <Target className="w-32 h-32 text-white opacity-90 drop-shadow-2xl z-10 group-hover:scale-105 transition-transform duration-500" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURED GYMS CAROUSEL / GRID */}
        <section className="py-32 border-t border-white/5">
          <div className="container px-4 sm:px-6 mx-auto max-w-7xl">
            <div className="flex flex-col sm:flex-row items-end justify-between mb-16 gap-6">
              <div className="space-y-4 max-w-2xl">
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-balance">The Network.</h2>
                <p className="text-white/40 text-lg font-medium">Curated environments designed for those who take their training seriously.</p>
              </div>
              <Link href="/explore" className="shrink-0">
                <Button variant="ghost" className="rounded-full px-6 h-12 font-bold group text-white/70 hover:text-white hover:bg-white/10">
                  View Directory
                  <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {gyms.slice(0, 4).map((gym: any, i: number) => (
                <Link key={gym.id} href={`/${gym.slug}`} className="group relative">
                  <Card className="h-full overflow-hidden border-white/5 bg-[#111] transition-all duration-500 hover:border-white/20 hover:bg-[#161616] rounded-3xl flex flex-col">
                    <CardContent className="p-0 flex-1 flex flex-col">
                      <div className="aspect-[4/3] relative bg-[#0A0A0A] flex items-center justify-center p-10 border-b border-white/5 overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {gym.logo_url ? (
                          <Image src={gym.logo_url} alt={gym.name} fill className="object-contain p-8 transition-transform duration-700 group-hover:scale-110 drop-shadow-2xl" />
                        ) : (
                          <Dumbbell className="h-16 w-16 text-white/10 transition-transform duration-700 group-hover:rotate-12 group-hover:scale-110" />
                        )}
                      </div>
                      <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-1">{gym.name}</h3>
                          <div className="flex items-center gap-1.5 text-sm text-white/40 font-medium">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{gym.city}, {gym.state}</span>
                          </div>
                        </div>
                        <div className="inline-flex items-center text-xs font-bold uppercase tracking-widest text-primary/70">
                          Partner <ArrowRight className="ml-1 h-3 w-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* MINIMAL FOOTER */}
      <footer className="border-t border-white/5 py-16 sm:py-24 bg-[#050505]">
        <div className="container px-4 sm:px-6 mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-12 sm:gap-8 mb-16">
            <div className="col-span-2 xl:col-span-2 space-y-6">
              <div className="flex items-center gap-3">
                <Image src="/repfit-logo.png" alt="REPFIT" width={28} height={28} className="opacity-80" />
                <span className="text-2xl font-bold tracking-tight">REPFIT</span>
              </div>
              <p className="text-white/40 text-base leading-relaxed max-w-xs font-medium">
                The future of fitness access and facility management. One network, zero friction.
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-xs uppercase tracking-widest text-white/30">Athletes</h4>
              <ul className="space-y-4 text-white/60 font-medium text-sm">
                <li><Link href="/explore" className="hover:text-white transition-colors">Explore Facilities</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Sign In</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-xs uppercase tracking-widest text-white/30">Partners</h4>
              <ul className="space-y-4 text-white/60 font-medium text-sm">
                <li><Link href="/auth/sign-up" className="hover:text-white transition-colors">List Your Gym</Link></li>
                <li><Link href="/auth/login" className="hover:text-white transition-colors">Owner Portal</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-xs uppercase tracking-widest text-white/30">Company</h4>
              <ul className="space-y-4 text-white/60 font-medium text-sm">
                <li><Link href="#" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Legal</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-white/30">
            <p>&copy; {new Date().getFullYear()} REPFIT Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
