"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Shield, ShieldCheck, UserX, Mail, Phone } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { promoteToAdmin, demoteFromAdmin } from "@/lib/actions/admin-management"
import { useLanguage } from "@/lib/i18n/language-context"

interface User {
  id: string
  full_name: string | null
  phone: string
  email: string | null
  role: string
  created_at: string
}

interface AdminManagerProps {
  users: User[]
  currentUserId: string
}

export function AdminManager({ users, currentUserId }: AdminManagerProps) {
  const { toast } = useToast()
  const router = useRouter()
  const { t } = useLanguage()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [action, setAction] = useState<"promote" | "demote" | null>(null)
  const [loading, setLoading] = useState(false)

  const admins = users.filter((u) => u.role === "admin")
  const regularUsers = users.filter((u) => u.role !== "admin")

  const handlePromote = async (userId: string) => {
    setLoading(true)
    const result = await promoteToAdmin(userId)
    setLoading(false)
    setSelectedUser(null)
    setAction(null)

    if (result.success) {
      toast({
        title: t("adminPromoted"),
        description: t("adminPromotedDesc"),
      })
      router.refresh()
    } else {
      toast({
        title: t("error"),
        description: result.error || t("operationFailed"),
        variant: "destructive",
      })
    }
  }

  const handleDemote = async (userId: string) => {
    setLoading(true)
    const result = await demoteFromAdmin(userId)
    setLoading(false)
    setSelectedUser(null)
    setAction(null)

    if (result.success) {
      toast({
        title: t("adminDemoted"),
        description: t("adminDemotedDesc"),
      })
      router.refresh()
    } else {
      toast({
        title: t("error"),
        description: result.error || t("operationFailed"),
        variant: "destructive",
      })
    }
  }

  const getInitials = (name: string | null) => {
    if (!name) return "U"
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <div className="space-y-6">
        {/* Current Admins */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              {t("currentAdmins")}
            </CardTitle>
            <CardDescription>{t("currentAdminsDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {admins.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noAdmins")}</p>
              ) : (
                admins.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{user.full_name || "Unknown"}</span>
                          {user.id === currentUserId && (
                            <Badge variant="secondary" className="text-xs">
                              {t("you")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {user.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    {user.id !== currentUserId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user)
                          setAction("demote")
                        }}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        {t("removeAdmin")}
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Regular Users */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              {t("regularUsers")}
            </CardTitle>
            <CardDescription>{t("regularUsersDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {regularUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("noRegularUsers")}</p>
              ) : (
                regularUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-secondary text-secondary-foreground font-semibold">
                          {getInitials(user.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.full_name || "Unknown"}</span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {user.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {user.phone}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(user)
                        setAction("promote")
                      }}
                    >
                      <ShieldCheck className="h-4 w-4 mr-1" />
                      {t("makeAdmin")}
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{action === "promote" ? t("promoteToAdmin") : t("demoteFromAdmin")}</DialogTitle>
            <DialogDescription>
              {action === "promote" ? t("promoteToAdminDesc") : t("demoteFromAdminDesc")}
              <span className="block mt-2 font-medium text-foreground">{selectedUser?.full_name}</span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedUser(null)}>
              {t("cancel")}
            </Button>
            <Button
              variant={action === "promote" ? "default" : "destructive"}
              onClick={() =>
                selectedUser && (action === "promote" ? handlePromote(selectedUser.id) : handleDemote(selectedUser.id))
              }
              disabled={loading}
            >
              {loading ? t("processing") : t("confirm")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
