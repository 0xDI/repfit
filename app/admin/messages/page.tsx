import { createClient, createAdminClient } from "@/lib/supabase/server"
import { MessageManager } from "@/components/message-manager"

export default async function AdminMessagesPage() {
  const supabase = await createAdminClient()

  const { data: messages } = await supabase.from("admin_messages").select("*").order("created_at", { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Announcements</h1>
        <p className="text-sm font-medium text-muted-foreground">Broadcast messages and important updates to all your gym members.</p>
      </div>

      <MessageManager messages={messages || []} />
    </div>
  )
}
