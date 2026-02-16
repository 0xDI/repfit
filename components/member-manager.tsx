"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Plus } from "lucide-react"
import type { Profile } from "@/lib/types"
import { updateMemberSubscription, updateMemberTokens } from "@/lib/actions/admin"
import { getSubscriptionPlans } from "@/lib/actions/subscriptions"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface MemberManagerProps {
  members: Profile[]
}

export function MemberManager({ members }: MemberManagerProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [selectedMember, setSelectedMember] = useState<Profile | null>(null)
  const [tokenAmount, setTokenAmount] = useState(0)
  const [isTokenDialogOpen, setIsTokenDialogOpen] = useState(false)
  const [isSubscriptionDialogOpen, setIsSubscriptionDialogOpen] = useState(false)
  const [currentMemberId, setCurrentMemberId] = useState<string>("")
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([])
  const [subscriptionData, setSubscriptionData] = useState({
    subscription_plan: "",
    subscription_status: "active",
  })

  const handleAddTokens = async (memberId: string, currentTokens: number) => {
    if (tokenAmount <= 0) return

    const result = await updateMemberTokens(memberId, currentTokens + tokenAmount)

    if (result.success) {
      toast({ title: "Tokens added successfully" })
      setTokenAmount(0)
      setIsTokenDialogOpen(false)
      router.refresh()
    } else {
      toast({ title: "Failed to add tokens", description: result.error, variant: "destructive" })
    }
  }

  const handleUpdateSubscription = async (memberId: string) => {
    const result = await updateMemberSubscription(memberId, subscriptionData)

    if (result.success) {
      toast({ title: "Subscription updated" })
      setSelectedMember(null)
      setIsSubscriptionDialogOpen(false)
      router.refresh()
    } else {
      toast({ title: "Failed to update", description: result.error, variant: "destructive" })
    }
  }

  const handleOpenSubscriptionDialog = async (member: Profile) => {
    setCurrentMemberId(member.id)
    setSelectedMember(member)
    setSubscriptionData({
      subscription_plan: member.subscription_plan || "",
      subscription_status: member.subscription_status,
    })

    try {
      const plans = await getSubscriptionPlans()
      setSubscriptionPlans(plans)
    } catch (error) {
      console.error("Failed to load subscription plans:", error)
    }

    setIsSubscriptionDialogOpen(true)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Members</CardTitle>
        <CardDescription>Total: {members.length} members</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => (
            <div key={member.id} className="rounded-lg border p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-medium">{member.full_name || "Unnamed Member"}</p>
                  <p className="text-sm text-muted-foreground">{member.phone}</p>
                </div>
                <Badge variant={member.subscription_status === "active" ? "default" : "secondary"}>
                  {member.subscription_status}
                </Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted-foreground">Workout Tokens</p>
                  <p className="text-lg font-semibold">{member.workout_tokens}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Subscription Plan</p>
                  <p className="text-sm">{member.subscription_plan || "None"}</p>
                </div>
              </div>

              <div className="flex gap-2 mt-3">
                <Dialog
                  open={isTokenDialogOpen && currentMemberId === member.id}
                  onOpenChange={(open) => {
                    setIsTokenDialogOpen(open)
                    if (!open) {
                      setTokenAmount(0)
                      setCurrentMemberId("")
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentMemberId(member.id)
                        setIsTokenDialogOpen(true)
                      }}
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Add Tokens
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Workout Tokens</DialogTitle>
                      <DialogDescription>Add tokens to {member.full_name || "this member"}'s account</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Current Tokens: {member.workout_tokens}</Label>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tokens">Tokens to Add</Label>
                        <Input
                          id="tokens"
                          type="number"
                          min={1}
                          value={tokenAmount}
                          onChange={(e) => setTokenAmount(Number.parseInt(e.target.value) || 0)}
                        />
                      </div>
                      <Button className="w-full" onClick={() => handleAddTokens(member.id, member.workout_tokens)}>
                        Add {tokenAmount} Tokens
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={isSubscriptionDialogOpen && currentMemberId === member.id}
                  onOpenChange={(open) => {
                    setIsSubscriptionDialogOpen(open)
                    if (!open) {
                      setCurrentMemberId("")
                      setSelectedMember(null)
                    }
                  }}
                >
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => handleOpenSubscriptionDialog(member)}>
                      <Edit className="mr-1 h-3 w-3" />
                      Edit Subscription
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Subscription</DialogTitle>
                      <DialogDescription>Update subscription details for {member.full_name}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="plan">Subscription Plan</Label>
                        <Select
                          value={subscriptionData.subscription_plan}
                          onValueChange={(value) =>
                            setSubscriptionData({ ...subscriptionData, subscription_plan: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a plan" />
                          </SelectTrigger>
                          <SelectContent>
                            {subscriptionPlans.map((plan) => (
                              <SelectItem key={plan.id} value={plan.name}>
                                {plan.name} - €{plan.price} ({plan.training_count} trainings)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={subscriptionData.subscription_status}
                          onValueChange={(value) =>
                            setSubscriptionData({ ...subscriptionData, subscription_status: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button className="w-full" onClick={() => handleUpdateSubscription(member.id)}>
                        Update Subscription
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
