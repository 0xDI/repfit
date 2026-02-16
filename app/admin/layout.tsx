import React from "react"
import { redirect } from "next/navigation"
import { createClient, createAdminClient } from "@/lib/supabase/server"
import { AdminSidebar } from "@/components/admin-sidebar"
import { AdminHeader } from "@/components/admin-header"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const adminClient = await createAdminClient()

  const { data: profile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Check admin access via multiple paths
  const isAdminByProfile = profile?.is_admin === true || profile?.role === "admin"

  const { data: ownedGym } = await adminClient
    .from("gyms")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle()

  const isAdmin = isAdminByProfile || !!ownedGym

  if (!isAdmin) {
    redirect("/dashboard")
  }

  const displayProfile = profile || {
    id: user.id,
    full_name: user.email?.split("@")[0] || "Admin",
    role: "admin",
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="w-full md:ml-64">
        <AdminHeader profile={displayProfile} userEmail={user.email} />
        <main className="space-y-6 p-6">{children}</main>
      </div>
    </div>
  )
}
