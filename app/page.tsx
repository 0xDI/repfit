import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, TrendingUp, CheckCircle, Zap, Shield } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border/40">
        <nav className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Image src="/repfit-logo.png" alt="REPFIT" width={40} height={40} className="h-10 w-10" />
            <span className="text-xl font-bold text-foreground">REPFIT</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/auth/sign-up">
              <Button>Start Free Trial</Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        <section className="container px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
              <Image src="/repfit-logo.png" alt="REPFIT" width={60} height={60} />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
              Modern Gym Management
              <span className="mt-2 block text-primary">Made Simple</span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Everything you need to run your fitness business. Member management, class scheduling, bookings, and
              subscriptions - all in one powerful platform.
            </p>
            <div className="flex flex-col gap-8 sm:flex-row sm:justify-center mt-8">
              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">For Gym Owners</span>
                <Link href="/auth/sign-up">
                  <Button size="lg" className="w-full sm:w-auto px-8">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
              <div className="hidden sm:block w-px bg-border/50 self-stretch mx-4" />
              <div className="flex flex-col gap-3">
                <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">For Members</span>
                <Link href="/auth/login">
                  <Button size="lg" variant="outline" className="w-full bg-transparent sm:w-auto px-8">
                    Member Login
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 bg-muted/30 py-24">
          <div className="container px-4">
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-bold text-foreground">Everything You Need</h2>
              <p className="mt-2 text-muted-foreground">Powerful features to grow your gym</p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Users, title: "Member Management", description: "Track members, subscriptions, and attendance all in one place" },
                { icon: Calendar, title: "Class Scheduling", description: "Create and manage class schedules with automated booking limits" },
                { icon: TrendingUp, title: "Analytics & Reports", description: "Track your gym's performance with detailed insights and metrics" },
                { icon: CheckCircle, title: "Easy Booking", description: "Members can book classes instantly with a simple interface" },
                { icon: Zap, title: "Automated Workflows", description: "Save time with automated notifications and subscription management" },
                { icon: Shield, title: "Secure & Reliable", description: "Enterprise-grade security to protect your gym and member data" },
              ].map((feature) => (
                <Card key={feature.title} className="border-border/50">
                  <CardHeader>
                    <feature.icon className="h-10 w-10 text-primary" />
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="py-24">
          <div className="container px-4">
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="flex flex-col items-center gap-6 p-12 text-center">
                <h2 className="text-3xl font-bold text-foreground">Ready to Transform Your Gym?</h2>
                <p className="max-w-2xl text-muted-foreground">
                  Join hundreds of gyms already using REPFIT to streamline their operations and grow their business.
                </p>
                <Link href="/auth/sign-up">
                  <Button size="lg">Start Your Free Trial</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 py-8">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} REPFIT. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
