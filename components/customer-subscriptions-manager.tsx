"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { assignSubscription, getSubscriptionPlans, recordPayment } from "@/lib/actions/subscriptions"
import { UserPlus, DollarSign, Eye } from "lucide-react"
import { format } from "date-fns"

export function CustomerSubscriptionsManager({ initialCustomers }: { initialCustomers: any[] }) {
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  async function loadPlans() {
    const data = await getSubscriptionPlans()
    setPlans(data)
  }

  async function handleAssignSubscription(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      user_id: selectedUser.id,
      plan_id: formData.get("plan_id") as string,
      start_date: formData.get("start_date") as string,
      price_paid: Number.parseFloat(formData.get("price_paid") as string) || undefined,
      payment_status: formData.get("payment_status") as any,
      payment_method: (formData.get("payment_method") as string) || undefined,
    }

    try {
      await assignSubscription(data)
      setAssignDialogOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  async function handleRecordPayment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const data = {
      user_id: selectedUser.id,
      subscription_id: (formData.get("subscription_id") as string) || undefined,
      amount: Number.parseFloat(formData.get("amount") as string),
      payment_method: formData.get("payment_method") as string,
      notes: (formData.get("notes") as string) || undefined,
    }

    try {
      await recordPayment(data)
      setPaymentDialogOpen(false)
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusBadge(status: string) {
    const variants: any = {
      active: "default",
      expired: "destructive",
      cancelled: "secondary",
    }
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>
  }

  function getPaymentBadge(status: string) {
    const variants: any = {
      paid: "default",
      pending: "secondary",
      overdue: "destructive",
    }
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Customer Management</h2>
        <p className="text-sm text-muted-foreground">Track subscriptions and payments</p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Current Subscription</TableHead>
            <TableHead>Trainings Left</TableHead>
            <TableHead>End Date</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialCustomers.map((customer) => {
            const activeSub = customer.user_subscriptions?.find((s: any) => s.status === "active")
            return (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">{customer.full_name || "N/A"}</TableCell>
                <TableCell>{customer.phone}</TableCell>
                <TableCell>
                  {activeSub ? (
                    <div>
                      <div className="font-medium">{activeSub.subscription_plans?.name}</div>
                      {getStatusBadge(activeSub.status)}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">No active subscription</span>
                  )}
                </TableCell>
                <TableCell>
                  {activeSub ? (
                    <span className="font-medium">
                      {activeSub.remaining_trainings} / {activeSub.total_trainings}
                    </span>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>{activeSub ? format(new Date(activeSub.end_date), "MMM dd, yyyy") : "-"}</TableCell>
                <TableCell>{activeSub ? getPaymentBadge(activeSub.payment_status || "pending") : "-"}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(customer)
                        setViewDialogOpen(true)
                      }}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        setSelectedUser(customer)
                        await loadPlans()
                        setAssignDialogOpen(true)
                      }}
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedUser(customer)
                        setPaymentDialogOpen(true)
                      }}
                    >
                      <DollarSign className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

      {/* Assign Subscription Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Subscription to {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignSubscription} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="plan_id">Subscription Plan</Label>
              <Select name="plan_id" required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a plan" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((plan) => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.name} - €{plan.price} ({plan.training_count} trainings)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                name="start_date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_paid">Price Paid (€)</Label>
              <Input id="price_paid" name="price_paid" type="number" step="0.01" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="payment_status">Payment Status</Label>
                <Select name="payment_status" defaultValue="pending">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="payment_method">Payment Method</Label>
                <Input id="payment_method" name="payment_method" placeholder="Cash, Card, etc." />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setAssignDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Assigning..." : "Assign Subscription"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment for {selectedUser?.full_name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (€)</Label>
              <Input id="amount" name="amount" type="number" step="0.01" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Input id="payment_method" name="payment_method" placeholder="Cash, Card, Transfer, etc." required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subscription_id">Link to Subscription (Optional)</Label>
              <Select name="subscription_id">
                <SelectTrigger>
                  <SelectValue placeholder="Select subscription" />
                </SelectTrigger>
                <SelectContent>
                  {selectedUser?.user_subscriptions?.map((sub: any) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.subscription_plans?.name} - {format(new Date(sub.start_date), "MMM dd, yyyy")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Input id="notes" name="notes" placeholder="Optional notes" />
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Recording..." : "Record Payment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Customer Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedUser?.full_name} - Subscription History</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUser?.user_subscriptions?.length > 0 ? (
              selectedUser.user_subscriptions.map((sub: any) => (
                <Card key={sub.id} className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{sub.subscription_plans?.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(sub.start_date), "MMM dd, yyyy")} -{" "}
                        {format(new Date(sub.end_date), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {getStatusBadge(sub.status)}
                      {getPaymentBadge(sub.payment_status || "pending")}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Trainings:</span>{" "}
                      <span className="font-medium">
                        {sub.remaining_trainings} / {sub.total_trainings}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Price:</span>{" "}
                      <span className="font-medium">€{sub.price_paid || sub.subscription_plans?.price}</span>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No subscriptions found</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
