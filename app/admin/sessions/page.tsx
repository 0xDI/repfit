import { createClient, createAdminClient } from "@/lib/supabase/server"
import { SessionManager } from "@/components/session-manager"
import { WeeklyScheduleManager } from "@/components/weekly-schedule-manager"
import { PastSessionsAdmin } from "@/components/past-sessions-admin"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function AdminSessionsPage() {
  const supabase = await createAdminClient()

  const { data: sessions } = await supabase
    .from("gym_sessions")
    .select("*")
    .order("session_date", { ascending: true })
    .order("start_time", { ascending: true })

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Session Management</h1>
        <p className="text-muted-foreground">Create and manage gym workout sessions</p>
      </div>

      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="manual">Manual Sessions</TabsTrigger>
          <TabsTrigger value="past">Past Sessions</TabsTrigger>
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
    </>
  )
}
