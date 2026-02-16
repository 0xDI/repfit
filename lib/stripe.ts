import 'server-only'

// Use dynamic import to avoid Turbopack ESM resolution issues with Stripe
let stripeInstance: any = null

export async function getStripe() {
    if (!stripeInstance) {
        const key = process.env.STRIPE_SECRET_KEY
        if (!key) {
            throw new Error('STRIPE_SECRET_KEY is not configured')
        }
        const { default: Stripe } = await import('stripe')
        stripeInstance = new Stripe(key)
    }
    return stripeInstance
}

// Legacy sync export still works via proxy (calls will be async internally)
export const stripe = {
    get customers() {
        return {
            create: async (...args: any[]) => {
                const s = await getStripe()
                return s.customers.create(...args)
            }
        }
    },
    get checkout() {
        return {
            sessions: {
                create: async (...args: any[]) => {
                    const s = await getStripe()
                    return s.checkout.sessions.create(...args)
                }
            }
        }
    },
    get billingPortal() {
        return {
            sessions: {
                create: async (...args: any[]) => {
                    const s = await getStripe()
                    return s.billingPortal.sessions.create(...args)
                }
            }
        }
    }
}
