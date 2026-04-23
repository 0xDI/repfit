import { getSubscriptionPlans, getAllCustomersWithSubscriptions } from "@/lib/actions/subscriptions"
import { SubscriptionPlansManager } from "@/components/subscription-plans-manager"
import { CustomerSubscriptionsManager } from "@/components/customer-subscriptions-manager"

export default async function AdminSubscriptionsPage() {
  const [plans, customers] = await Promise.all([getSubscriptionPlans(), getAllCustomersWithSubscriptions()])

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Subscriptions</h1>
        <p className="text-sm font-medium text-muted-foreground">Manage your gym's membership plans and track customer subscriptions.</p>
      </div>

      <div className="space-y-12 pb-10">
        <SubscriptionPlansManager initialPlans={plans} />
        <CustomerSubscriptionsManager initialCustomers={customers} />
      </div>
    </div>
  )
}
