"use server"

import { stripe } from "@/lib/stripe"
import { GYM_PLANS, getGymPlan } from "@/lib/products"
import { createClient } from "@/lib/supabase/server"
import { headers } from "next/headers"

export async function createCheckoutSession(
  planId: string,
  gymId: string
): Promise<{ clientSecret?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Not authenticated" }
    }

    // Get gym details
    const { data: gym } = await supabase
      .from("gyms")
      .select("*")
      .eq("id", gymId)
      .single()

    if (!gym) {
      return { error: "Gym not found" }
    }

    if (gym.owner_id !== user.id) {
      return { error: "Not authorized" }
    }

    // Get plan details
    const plan = getGymPlan(planId)
    if (!plan) {
      return { error: "Invalid plan" }
    }

    const headersList = await headers()
    const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://repfitapp.com"

    // Create or retrieve Stripe customer
    let customerId = gym.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          gym_id: gymId,
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Update gym with customer ID
      await supabase
        .from("gyms")
        .update({ stripe_customer_id: customerId })
        .eq("id", gymId)
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      ui_mode: "embedded",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `REPFIT ${plan.name} Plan`,
              description: plan.description,
            },
            unit_amount: plan.priceInCents,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      return_url: `${origin}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        gym_id: gymId,
        plan_id: planId,
      },
    })

    return { clientSecret: session.client_secret! }
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return { error: "Failed to create checkout session" }
  }
}

export async function createCustomerPortalSession(
  gymId: string
): Promise<{ url?: string; error?: string }> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Not authenticated" }
    }

    const { data: gym } = await supabase
      .from("gyms")
      .select("stripe_customer_id")
      .eq("id", gymId)
      .single()

    if (!gym?.stripe_customer_id) {
      return { error: "No subscription found" }
    }

    const headersList = await headers()
    const origin = headersList.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://repfitapp.com"

    const session = await stripe.billingPortal.sessions.create({
      customer: gym.stripe_customer_id,
      return_url: `${origin}/dashboard/billing`,
    })

    return { url: session.url }
  } catch (error) {
    console.error("Error creating portal session:", error)
    return { error: "Failed to create portal session" }
  }
}
