"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Profile } from "@/lib/types"
import { updateProfile } from "@/lib/actions/profile"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ProfileFormProps {
  profile: Profile
}

export function ProfileForm({ profile }: ProfileFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [isUpdating, setIsUpdating] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name || "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdating(true)

    const result = await updateProfile({ full_name: fullName })

    if (result.success) {
      toast({ title: "Profile updated successfully" })
      router.refresh()
    } else {
      toast({ title: "Failed to update profile", description: result.error, variant: "destructive" })
    }

    setIsUpdating(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your profile details</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={profile.phone || ""} disabled className="bg-muted" />
            <p className="text-xs text-muted-foreground">Phone number cannot be changed</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div className="space-y-2">
            <Label>Subscription Status</Label>
            <div className="rounded-lg border border-border/50 bg-muted/50 p-3">
              <p className="text-sm font-medium capitalize">{profile.subscription_status}</p>
              {profile.subscription_plan && (
                <p className="text-xs text-muted-foreground">{profile.subscription_plan}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Workout Tokens</Label>
            <div className="rounded-lg border border-border/50 bg-muted/50 p-3">
              <p className="text-2xl font-bold">{profile.workout_tokens}</p>
              <p className="text-xs text-muted-foreground">Available tokens</p>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isUpdating}>
            {isUpdating ? "Updating..." : "Update Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
