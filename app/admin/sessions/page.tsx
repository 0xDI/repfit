import { createClient, createAdminClient } from "@/lib/supabase/server"
import { SessionManager } from "@/components/session-manager"
import { WeeklyScheduleManager } from "@/components/weekly-schedule-manager"
import { PastSessionsAdmin } from "@/components/past-sessions-admin"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cookies } from "next/headers"

export default async function AdminSessionsPage() {
  const supabase = await createClient()

  // Get user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const adminClient = await createAdminClient()

  // Get owned gyms to determine active gym
  const { data: ownedGyms } = await adminClient
    .from("gyms")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })

  const cookieStore = await cookies()
  const activeGymCookie = cookieStore.get("active_gym_id")?.value
  const activeGym = (activeGymCookie && ownedGyms?.find(g => g.id === activeGymCookie)) || ownedGyms?.[0] || null

  if (!activeGym) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
          <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Sessions</h1>
          <p className="text-sm font-medium text-muted-foreground">Schedule workout sessions and manage member bookings.</p>
        </div>
        <p className="text-muted-foreground">Please create a gym to manage sessions.</p>
      </div>
    )
  }

  const { data: sessions } = await adminClient
    .from("gym_sessions")
    .select("*")
    .eq("gym_id", activeGym.id)
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Sessions</h1>
        <p className="text-sm font-medium text-muted-foreground">Schedule workout sessions and manage member bookings.</p>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="flex w-full max-w-md bg-muted/30 p-1 rounded-xl border border-border/40">
          <TabsTrigger value="weekly" className="rounded-lg py-2 font-bold transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">Weekly</TabsTrigger>
          <TabsTrigger value="manual" className="rounded-lg py-2 font-bold transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">Manual</TabsTrigger>
          <TabsTrigger value="past" className="rounded-lg py-2 font-bold transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">History</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-6">
          <WeeklyScheduleManager />
        </TabsContent>

        <TabsContent value="manual" className="mt-6">
          <SessionManager sessions={sessions ?? []} />
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <PastSessionsAdmin />
        </TabsContent>
      </Tabs>
    </div>
  )
}
