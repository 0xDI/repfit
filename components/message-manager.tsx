"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2 } from "lucide-react"
import type { AdminMessage } from "@/lib/types"
import { createAdminMessage, deleteAdminMessage } from "@/lib/actions/admin"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface MessageManagerProps {
  messages: AdminMessage[]
}

export function MessageManager({ messages }: MessageManagerProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    expires_at: "",
  })

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)

    const result = await createAdminMessage({
      ...formData,
      expires_at: formData.expires_at || null,
    })

    if (result.success) {
      toast({ title: "Message created successfully" })
      setFormData({ title: "", message: "", expires_at: "" })
      router.refresh()
    } else {
      toast({ title: "Failed to create message", description: result.error, variant: "destructive" })
    }

    setIsCreating(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this message?")) {
      return
    }

    const result = await deleteAdminMessage(id)

    if (result.success) {
      toast({ title: "Message deleted" })
      router.refresh()
    } else {
      toast({ title: "Failed to delete", description: result.error, variant: "destructive" })
    }
  }

  return (
    <div className="grid gap-4 md:gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Create Announcement</CardTitle>
          <CardDescription>Send a message to all members</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                placeholder="e.g., Gym Closed Tomorrow"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                required
                rows={4}
                placeholder="Enter your announcement message..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires">Expires At (Optional)</Label>
              <Input
                id="expires"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Leave empty for permanent message</p>
            </div>

            <Button type="submit" className="w-full" disabled={isCreating}>
              <Plus className="mr-2 h-4 w-4" />
              Create Message
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Messages</CardTitle>
          <CardDescription>Current announcements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-[500px] overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">No messages yet</p>
            ) : (
              messages.map((message) => {
                const isExpired = message.expires_at && new Date(message.expires_at) < new Date()

                return (
                  <div key={message.id} className="rounded-lg border p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{message.title}</p>
                          <Badge variant={isExpired ? "secondary" : message.is_active ? "default" : "secondary"}>
                            {isExpired ? "Expired" : message.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{message.message}</p>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(message.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    {message.expires_at && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {new Date(message.expires_at).toLocaleString()}
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
