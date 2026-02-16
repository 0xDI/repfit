// REPFIT Gym Subscription Plans

export interface Product {
  id: string
  name: string
  description: string
  priceInCents: number
  features: string[]
  maxMembers: number
  maxClasses: number
}

// Gym subscription plans - source of truth for all pricing
export const GYM_PLANS: Product[] = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfect for small gyms just getting started",
    priceInCents: 4900, // $49/month
    features: [
      "Up to 50 members",
      "Unlimited classes",
      "Basic analytics",
      "Email support",
      "Mobile app access",
    ],
    maxMembers: 50,
    maxClasses: 999,
  },
  {
    id: "growth",
    name: "Growth",
    description: "For growing gyms with expanding membership",
    priceInCents: 9900, // $99/month
    features: [
      "Up to 200 members",
      "Unlimited classes",
      "Advanced analytics",
      "Priority support",
      "Mobile app access",
      "Custom branding",
      "Waitlist management",
    ],
    maxMembers: 200,
    maxClasses: 999,
  },
  {
    id: "pro",
    name: "Professional",
    description: "For established gyms with large member bases",
    priceInCents: 19900, // $199/month
    features: [
      "Unlimited members",
      "Unlimited classes",
      "Advanced analytics & reporting",
      "24/7 priority support",
      "Mobile app access",
      "Full custom branding",
      "Waitlist management",
      "API access",
      "Multi-location support",
    ],
    maxMembers: 999999,
    maxClasses: 999999,
  },
]

// Alias for compatibility with Stripe skill patterns
export const PRODUCTS = GYM_PLANS

export function getGymPlan(planId: string): Product | undefined {
  return GYM_PLANS.find((plan) => plan.id === planId)
}

export function formatPrice(priceInCents: number): string {
  return `$${(priceInCents / 100).toFixed(2)}`
}
