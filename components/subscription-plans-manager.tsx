"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createSubscriptionPlan, updateSubscriptionPlan } from "@/lib/actions/subscriptions"
import type { SubscriptionPlan } from "@/lib/types"
import { Plus, Edit } from "lucide-react"

export function SubscriptionPlansManager({ initialPlans }: { initialPlans: SubscriptionPlan[] }) {
  const [open, setOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      training_count: Number.parseInt(formData.get("training_count") as string),
      duration_days: Number.parseInt(formData.get("duration_days") as string),
      price: Number.parseFloat(formData.get("price") as string),
    }

    try {
      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan.id, data)
      } else {
        await createSubscriptionPlan(data)
      }
      setOpen(false)
      setEditingPlan(null)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Subscription Plans</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingPlan(null)}>
              <Plus className="w-4 h-4 mr-2" />
              New Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name</Label>
                  <Input id="name" name="name" defaultValue={editingPlan?.name} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price (€)</Label>
                  <Input id="price" name="price" type="number" step="0.01" defaultValue={editingPlan?.price} required />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={editingPlan?.description || ""} rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="training_count">Number of Trainings</Label>
                  <Input
                    id="training_count"
                    name="training_count"
                    type="number"
                    defaultValue={editingPlan?.training_count}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration_days">Duration (days)</Label>
                  <Input
                    id="duration_days"
                    name="duration_days"
                    type="number"
                    defaultValue={editingPlan?.duration_days}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : editingPlan ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {initialPlans.map((plan) => (
          <Card key={plan.id} className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-lg">{plan.name}</h3>
                <p className="text-2xl font-bold text-primary">€{plan.price}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditingPlan(plan)
                  setOpen(true)
                }}
              >
                <Edit className="w-4 h-4" />
              </Button>
            </div>
            {plan.description && <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Trainings:</span>
                <span className="font-medium">{plan.training_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">{plan.duration_days} days</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </Card>
  )
}
