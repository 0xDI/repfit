import { getSubscriptionPlans, getAllCustomersWithSubscriptions } from "@/lib/actions/subscriptions"
import { SubscriptionPlansManager } from "@/components/subscription-plans-manager"
import { CustomerSubscriptionsManager } from "@/components/customer-subscriptions-manager"

export default async function AdminSubscriptionsPage() {
  const [plans, customers] = await Promise.all([getSubscriptionPlans(), getAllCustomersWithSubscriptions()])

  return (
    <>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
        <p className="text-muted-foreground">Manage subscription plans and customer subscriptions</p>
      </div>

      <div className="space-y-8">
        <SubscriptionPlansManager initialPlans={plans} />
        <CustomerSubscriptionsManager initialCustomers={customers} />
      </div>
    </>
  )
}
