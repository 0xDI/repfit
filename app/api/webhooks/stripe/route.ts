import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-12-18.acacia',
  })
}

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(req: Request) {
  const stripe = getStripe()
  const supabaseAdmin = getSupabaseAdmin()
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('[v0] Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  console.log('[v0] Stripe webhook event:', event.type)

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Get gym ID from metadata
        const gymId = session.metadata?.gym_id
        
        if (!gymId) {
          console.error('[v0] No gym_id in session metadata')
          break
        }

        // Update gym with subscription info
        const { error: updateError } = await supabaseAdmin
          .from('gyms')
          .update({
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
            subscription_plan: session.metadata?.plan_id,
            onboarding_completed: true,
          })
          .eq('id', gymId)

        if (updateError) {
          console.error('[v0] Failed to update gym:', updateError)
        } else {
          console.log('[v0] Successfully activated subscription for gym:', gymId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Find gym by stripe_subscription_id
        const { data: gym } = await supabaseAdmin
          .from('gyms')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (gym) {
          const { error: updateError } = await supabaseAdmin
            .from('gyms')
            .update({
              subscription_status: subscription.status,
            })
            .eq('id', gym.id)

          if (updateError) {
            console.error('[v0] Failed to update subscription status:', updateError)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // Find gym by stripe_subscription_id
        const { data: gym } = await supabaseAdmin
          .from('gyms')
          .select('id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (gym) {
          const { error: updateError } = await supabaseAdmin
            .from('gyms')
            .update({
              subscription_status: 'canceled',
            })
            .eq('id', gym.id)

          if (updateError) {
            console.error('[v0] Failed to cancel subscription:', updateError)
          }
        }
        break
      }

      default:
        console.log('[v0] Unhandled event type:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('[v0] Webhook handler error:', err.message)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}
