'use client'

import React from "react"
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'

type AuthStep = 'email' | 'otp'

import { sendOtpAction, verifyOtpAction } from '@/app/actions/auth'

export default function Page() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<AuthStep>('email')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || undefined

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await sendOtpAction(email)
      if (result.error) throw new Error(result.error)

      setStep('otp')
      setSuccess('Check your email for the verification code!')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // Server Action handles verification AND redirect
      const result = await verifyOtpAction(email, otp, redirectTo)
      if (result?.error) throw new Error(result.error)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Invalid code. Please try again.')
      setIsLoading(false) // Only stop loading on error, success redirects
    }
  }

  const handleBack = () => {
    setStep('email')
    setOtp('')
    setError(null)
    setSuccess(null)
  }

  const handleResendCode = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await sendOtpAction(email)
      if (result.error) throw new Error(result.error)
      setSuccess('New code sent to your email!')
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Failed to resend code')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <Image
            src="/repfit-logo.png"
            alt="REPFIT Logo"
            width={80}
            height={80}
            className="h-20 w-20"
          />
          <h1 className="text-2xl font-bold text-foreground">REPFIT</h1>
          <p className="text-sm text-muted-foreground">Gym Management Platform</p>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {step === 'email' ? 'Welcome' : 'Enter Code'}
              </CardTitle>
              <CardDescription>
                {step === 'email'
                  ? 'Enter your email to sign in or create an account'
                  : `We sent a code to ${email}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === 'email' ? (
                <form onSubmit={handleSendOTP}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="gym@example.com"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {success && <p className="text-sm text-orange-600">{success}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Sending code...' : 'Continue with Email'}
                    </Button>
                  </div>
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    We&apos;ll send you a one-time code to verify your identity
                  </p>
                </form>
              ) : (
                <form onSubmit={handleVerifyOTP}>
                  <div className="flex flex-col gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="otp">Verification Code</Label>
                      <Input
                        id="otp"
                        type="text"
                        placeholder="123456"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={8}
                        autoFocus
                        className="text-center text-2xl tracking-widest"
                      />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    {success && <p className="text-sm text-green-600">{success}</p>}
                    <Button type="submit" className="w-full" disabled={isLoading || otp.length < 6}>
                      {isLoading ? 'Verifying...' : 'Verify Code'}
                    </Button>
                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        onClick={handleBack}
                        className="text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
                      >
                        Use different email
                      </button>
                      <button
                        type="button"
                        onClick={handleResendCode}
                        disabled={isLoading}
                        className="text-primary underline-offset-4 hover:underline disabled:opacity-50"
                      >
                        Resend code
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
