import { createClient, createAdminClient } from "@/lib/supabase/server"
import { MessageManager } from "@/components/message-manager"

export default async function AdminMessagesPage() {
  const supabase = await createAdminClient()

  const { data: messages } = await supabase.from("admin_messages").select("*").order("created_at", { ascending: false })

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <p className="text-muted-foreground">Create and manage messages for all members</p>
      </div>

      <MessageManager messages={messages || []} />
    </>
  )
}
