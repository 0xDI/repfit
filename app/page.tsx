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
  CheckCircle2,
  Zap,
  Users,
  Calendar,
  ShieldCheck,
  TrendingUp,
  Target
} from "lucide-react"
import { searchGyms } from "@/lib/actions/public-gym"

export default async function HomePage() {
  const { gyms } = await searchGyms()

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-primary/20">
      {/* Navigation */}
      <header className="border-b border-border/40 sticky top-0 bg-background/80 backdrop-blur-xl z-50">
        <nav className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="bg-primary/10 p-1.5 rounded-lg group-hover:bg-primary/20 transition-all duration-300">
              <Image src="/repfit-logo.png" alt="REPFIT" width={32} height={32} className="h-8 w-8" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground transition-colors group-hover:text-primary">REPFIT</span>
          </Link>
          <div className="flex items-center gap-4 sm:gap-8">
            <Link href="/explore" className="hidden sm:inline-block text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
              Browse Gyms
            </Link>
            <Link href="/auth/login">
              <Button variant="ghost" className="text-sm font-semibold hover:bg-primary/5 hover:text-primary">Member Sign In</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Dynamic Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-32 sm:pt-32 sm:pb-48">
          {/* Animated Background Orbs */}
          <div className="absolute inset-x-0 top-0 -z-10 h-full w-full">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-[20%] right-[-10%] w-[35%] h-[35%] bg-primary/15 rounded-full blur-[100px]" />
          </div>

          <div className="container px-4 relative flex flex-col items-center justify-center text-center space-y-8 min-h-[60vh]">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-medium tracking-wide">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>The New Standard in Fitness</span>
            </div>

            <div className="space-y-4 max-w-4xl mx-auto">
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-[-0.04em] text-white leading-[1.05] text-balance">
                Elite Gyms.<br />
                <span className="text-white/60">Zero Friction.</span>
              </h1>
            </div>

            <p className="max-w-xl mx-auto text-lg sm:text-xl text-white/50 leading-relaxed font-medium text-balance">
              Find, book, and access the world's best training facilities instantly. No memberships required.
            </p>

            <div className="w-full max-w-xl mx-auto pt-4 flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/40" />
                <Input
                  placeholder="Enter your city or zip code..."
                  className="h-14 w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 text-base text-white placeholder:text-white/40 focus:border-white/20 focus:ring-0 transition-colors"
                />
              </div>
              <Link href="/explore" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto h-14 px-8 rounded-2xl bg-white text-black hover:bg-white/90 font-bold text-base transition-transform active:scale-95">
                  Explore
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-12 flex flex-wrap justify-center gap-8 sm:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex items-center gap-2 font-bold tracking-tight text-lg">
                <Users className="h-6 w-6 text-primary" /> 10k+ Members
              </div>
              <div className="flex items-center gap-2 font-bold tracking-tight text-lg">
                <Dumbbell className="h-6 w-6 text-primary" /> 50+ Partners
              </div>
              <div className="flex items-center gap-2 font-bold tracking-tight text-lg">
                <ShieldCheck className="h-6 w-6 text-primary" /> Secure Booking
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-24 bg-muted/30">
          <div className="container px-4">
            <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Your Path to Personal Peak</h2>
              <p className="text-muted-foreground text-lg italic">We&apos;ve made booking your next workout as easy as a single rep.</p>
            </div>

            <div className="grid gap-12 sm:grid-cols-3 relative">
              {/* Connecting Lines (Desktop only) */}
              <div className="hidden sm:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-transparent via-border to-transparent -translate-y-1/2 -z-10" />

              <div className="text-center space-y-6 group">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border-2 border-primary/20 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <Search className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold">1. Discover</h3>
                <p className="text-muted-foreground leading-relaxed px-4">Browse our curated list of top-tier gyms and studios near your location.</p>
              </div>

              <div className="text-center space-y-6 group">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border-2 border-primary/20 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <Calendar className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold">2. Reserve</h3>
                <p className="text-muted-foreground leading-relaxed px-4">Select your preferred session and book your spot in seconds with instant confirmation.</p>
              </div>

              <div className="text-center space-y-6 group">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto border-2 border-primary/20 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                  <Zap className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-bold">3. Perform</h3>
                <p className="text-muted-foreground leading-relaxed px-4">Show up, scan in, and let Repfit handle the rest while you focus on your movement.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Gyms Showcase */}
        <section className="py-24">
          <div className="container px-4">
            <div className="flex flex-col sm:flex-row items-end justify-between mb-12 gap-6 text-center sm:text-left">
              <div className="space-y-4 max-w-xl">
                <h2 className="text-3xl sm:text-5xl font-black tracking-tight">Explore Partner Gyms</h2>
                <p className="text-muted-foreground text-lg">Curated environments designed for those who take their training seriously.</p>
              </div>
              <Link href="/explore">
                <Button variant="outline" className="rounded-full px-8 h-12 font-bold group border-primary/30 hover:border-primary hover:bg-primary/5">
                  View Full Directory
                  <ArrowUpRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Button>
              </Link>
            </div>

            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {gyms.slice(0, 3).map((gym) => (
                <Link key={gym.id} href={`/${gym.slug}`} className="group relative">
                  <Card className="overflow-hidden border-border/40 transition-all duration-500 hover:border-primary/40 hover:shadow-[0_20px_50px_rgba(252,76,2,0.1)] rounded-[2rem] bg-card/50">
                    <CardContent className="p-0">
                      <div className="aspect-[16/10] relative bg-muted/10 flex items-center justify-center overflow-hidden border-b border-border/10">
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        {gym.logo_url ? (
                          <Image src={gym.logo_url} alt={gym.name} fill className="object-contain p-10 transition-transform duration-700 group-hover:scale-110" />
                        ) : (
                          <Dumbbell className="h-20 w-20 text-primary/10 transition-transform duration-700 group-hover:rotate-[15deg] group-hover:scale-125" />
                        )}
                      </div>
                      <div className="p-8 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-black group-hover:text-primary transition-colors">{gym.name}</h3>
                          <div className="bg-primary/10 px-3 py-1 rounded-full text-[10px] font-black uppercase text-primary border border-primary/20">Active</div>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground font-medium">
                          <MapPin className="h-4 w-4 text-primary" />
                          {gym.city}, {gym.state}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 bg-foreground text-background">
          <div className="container px-4">
            <div className="grid gap-16 lg:grid-cols-2 items-center">
              <div className="space-y-12">
                <div className="space-y-6">
                  <h2 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none">Built for the <br /><span className="text-primary italic">Modern Athlete</span></h2>
                  <p className="text-background/60 text-xl leading-relaxed">Repfit removes all the noise so you can focus on the work. No messy contracts, no hidden fees, just pure movement.</p>
                </div>

                <div className="grid gap-6">
                  {[
                    { title: "One Unified Profile", desc: "Manage all memberships and bookings from a single dashboard.", icon: Target },
                    { title: "Smart Scheduling", desc: "Real-time slot availability so you never show up to a crowded floor.", icon: Calendar },
                    { title: "Performance Tracking", desc: "Keep record of your training frequency and gym visits.", icon: TrendingUp }
                  ].map((benefit, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary transition-colors duration-300">
                        <benefit.icon className="h-6 w-6 text-primary group-hover:text-white" />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold mb-1">{benefit.title}</h4>
                        <p className="text-background/50 font-medium">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative aspect-square sm:aspect-auto sm:h-[600px] rounded-[3rem] bg-gradient-to-br from-primary/30 to-orange-500/20 p-1">
                <div className="w-full h-full rounded-[2.9rem] bg-background/5 backdrop-blur-3xl overflow-hidden relative border border-white/10">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Dumbbell className="h-64 w-64 text-primary opacity-20 rotate-[-15deg] blur-sm" />
                  </div>
                  <div className="absolute inset-4 sm:inset-12 p-8 bg-card/10 backdrop-blur-md rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="w-12 h-2 bg-primary rounded-full" />
                      <h5 className="text-3xl font-black">Join 50k+ Runners, Lifters, and Movers.</h5>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Weekly bookings</p>
                        <p className="text-3xl font-black text-white">4.2k</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                        <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Active Gyms</p>
                        <p className="text-3xl font-black text-white">128</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* B2B / Gym Owner Section */}
        <section className="container px-4 py-32">
          <div className="relative bg-primary rounded-[3.5rem] p-12 sm:p-24 overflow-hidden group shadow-[0_50px_100px_rgba(252,76,2,0.2)]">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 p-12 text-white/5">
              <Dumbbell className="h-96 w-96 rotate-12 transition-transform duration-1000 group-hover:rotate-[25deg] group-hover:scale-110" />
            </div>
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-400 rounded-full blur-[100px] opacity-30" />

            <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white text-xs font-extrabold uppercase tracking-widest border border-white/20">
                  Business Engine
                </div>
                <h2 className="text-4xl sm:text-7xl font-black tracking-tighter text-white leading-none">Power Your Gym with Repfit.</h2>
                <p className="text-white/80 text-xl leading-relaxed font-medium">
                  The ultimate operating system for modern fitness centers. Manage memberships, automate payments, and grow your community with high-end tools.
                </p>
                <div className="flex flex-wrap gap-6 pt-4">
                  <Link href="/auth/sign-up">
                    <Button size="lg" className="rounded-full px-10 h-16 bg-white text-primary hover:bg-white/90 text-lg font-black shadow-2xl active:scale-95 transition-all">
                      Start Free Trial
                    </Button>
                  </Link>
                  <Link href="/auth/login">
                    <Button size="lg" variant="ghost" className="rounded-full px-10 h-16 text-white hover:bg-white/10 text-lg font-bold border-2 border-white/20">
                      Owner Login
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="hidden lg:grid grid-cols-2 gap-4">
                {[
                  { label: "Commission", value: "0%" },
                  { label: "Setup Time", value: "5 min" },
                  { label: "Success Rate", value: "99.9%" },
                  { label: "Support", value: "24/7" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 flex flex-col justify-center items-center text-center group-hover:translate-y-[-5px] transition-transform duration-500" style={{ transitionDelay: `${i * 100}ms` }}>
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-2">{stat.label}</p>
                    <p className="text-4xl font-black text-white tracking-widest">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-24 bg-muted/30">
        <div className="container px-4">
          <div className="grid gap-16 md:grid-cols-4 lg:grid-cols-6 mb-16">
            <div className="md:col-span-2 space-y-8">
              <div className="flex items-center gap-3">
                <Image src="/repfit-logo.png" alt="REPFIT" width={40} height={40} />
                <span className="text-3xl font-black tracking-tighter">REPFIT</span>
              </div>
              <p className="text-muted-foreground text-lg leading-relaxed max-w-sm">
                The future of fitness registration and gym management. Peak performance, unified.
              </p>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Discover</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="/explore" className="hover:text-primary transition-colors">Find a Gym</Link></li>
                <li><Link href="/explore" className="hover:text-primary transition-colors" >Top Rated</Link></li>
                <li><Link href="/explore" className="hover:text-primary transition-colors">New Additions</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Platform</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="/auth/login" className="hover:text-primary transition-colors">Member Sign In</Link></li>
                <li><Link href="/auth/sign-up" className="hover:text-primary transition-colors">Register Gym</Link></li>
                <li><Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Company</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="#" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Terms</Link></li>
              </ul>
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-sm uppercase tracking-widest text-primary">Connect</h4>
              <ul className="space-y-4 text-muted-foreground font-medium">
                <li><Link href="#" className="hover:text-primary transition-colors">Instagram</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Twitter</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Support</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/40 flex flex-col md:flex-row justify-between items-center gap-6 text-sm font-medium text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} REPFIT Inc. All rights reserved.</p>
            <div className="flex gap-8">
              <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-primary transition-colors">Security</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Sparkles(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
      <path d="M5 3v4" />
      <path d="M19 17v4" />
      <path d="M3 5h4" />
      <path d="M17 19h4" />
    </svg>
  )
}
