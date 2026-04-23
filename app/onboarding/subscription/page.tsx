'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PRODUCTS } from '@/lib/products'
import { createCheckoutSession } from '@/app/actions/stripe'
import { startFreeTrial } from '@/app/actions/onboarding'
import { Check, Loader2 } from 'lucide-react'
import Image from 'next/image'

export default function SubscriptionPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const gymId = searchParams.get('gym')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!gymId) {
      router.push('/onboarding')
    }
  }, [gymId, router])

  const handleSelectPlan = async (planId: string) => {
    if (!gymId) return

    setIsLoading(planId)
    setError(null)

    try {
      const result = await createCheckoutSession(planId, gymId)

      if (result.error || !result.url) {
        setError(result.error || 'Failed to create checkout session')
        return
      }

      window.location.href = result.url
    } catch (err) {
      setError('Failed to start checkout. Please try again.')
    } finally {
      setIsLoading(null)
    }
  }

  const handleStartTrial = async (planId: string) => {
    if (!gymId) return

    setIsLoading(`trial-${planId}`)
    setError(null)

    try {
      const result = await startFreeTrial(gymId)

      if (result.error) {
        setError(result.error)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      setError('Failed to start trial. Please try again.')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-background p-4 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <Image
              src="/repfit-logo.png"
              alt="REPFIT"
              width={60}
              height={60}
              className="rounded-lg"
            />
          </div>
          <h1 className="text-4xl font-bold text-foreground">Choose Your Plan</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with a 7-day free trial on any plan. No credit card required.
          </p>
        </div>

        {error && (
          <div className="max-w-2xl mx-auto p-4 rounded-lg bg-destructive/10 text-destructive">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRODUCTS.map((product) => {
            const features = product.id === 'gym-starter'
              ? ['Up to 50 members', 'Basic booking system', 'Email support', 'Member management']
              : product.id === 'gym-growth'
                ? ['Up to 200 members', 'Advanced booking', 'Priority support', 'Analytics dashboard', 'Custom branding']
                : ['Unlimited members', 'All features', '24/7 support', 'Advanced analytics', 'API access', 'White-label options']

            const isPopular = product.id === 'gym-growth'

            return (
              <Card
                key={product.id}
                className={`relative ${isPopular ? 'border-primary border-2 shadow-lg' : ''}`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      ${(product.priceInCents / 100).toFixed(0)}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2">
                    <Button
                      onClick={() => handleStartTrial(product.id)}
                      disabled={isLoading !== null}
                      className="w-full"
                      variant={isPopular ? 'default' : 'outline'}
                      size="lg"
                    >
                      {isLoading === `trial-${product.id}` ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        'Try Free for 7 Days'
                      )}
                    </Button>
                    <Button
                      onClick={() => handleSelectPlan(product.id)}
                      disabled={isLoading !== null}
                      className="w-full"
                      variant="ghost"
                      size="sm"
                    >
                      {isLoading === product.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Subscribe Now'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
