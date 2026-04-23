'use client'

import React from "react"
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'

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
      const result = await verifyOtpAction(email, otp, redirectTo)
      if (result?.error) throw new Error(result.error)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Invalid code. Please try again.')
      setIsLoading(false)
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
    <div className="relative flex min-h-svh w-full items-center justify-center bg-background p-6 md:p-10 overflow-hidden">
      {/* Animated background orbs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[-15%] w-[50%] h-[50%] bg-primary/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-2xl border border-primary/20">
            <Image
              src="/repfit-logo.png"
              alt="REPFIT Logo"
              width={48}
              height={48}
              className="h-12 w-12"
            />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">REPFIT</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Your fitness command center</p>
          </div>
        </div>

        {/* Auth Form */}
        <div className="space-y-6">
          {step === 'email' ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-6">
                <h2 className="text-xl font-bold tracking-tight">Welcome back</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Enter your email to sign in or create an account
                </p>
              </div>

              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    autoFocus
                    className="h-12 rounded-xl bg-card/50 border-border/60 placeholder:text-muted-foreground/50 focus:border-primary/50"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg animate-in fade-in duration-200">{error}</p>
                )}
                {success && (
                  <p className="text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg animate-in fade-in duration-200">{success}</p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-semibold text-base"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending code...</>
                  ) : (
                    'Continue with Email'
                  )}
                </Button>
              </form>

              <p className="mt-5 text-center text-xs text-muted-foreground/70">
                We&apos;ll send you a one-time code to verify your identity
              </p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="mb-6">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>
                <h2 className="text-xl font-bold tracking-tight">Check your email</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
                </p>
              </div>

              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp" className="text-sm font-medium">Verification Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="• • • • • •"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                    autoComplete="one-time-code"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={8}
                    autoFocus
                    className="h-14 rounded-xl bg-card/50 border-border/60 text-center text-2xl tracking-[0.5em] font-mono placeholder:tracking-[0.3em] placeholder:text-muted-foreground/30 focus:border-primary/50"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-lg animate-in fade-in duration-200">{error}</p>
                )}
                {success && (
                  <p className="text-sm text-primary bg-primary/10 px-3 py-2 rounded-lg animate-in fade-in duration-200">{success}</p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 rounded-xl font-semibold text-base"
                  disabled={isLoading || otp.length < 6}
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...</>
                  ) : (
                    'Verify Code'
                  )}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="text-sm text-muted-foreground hover:text-primary disabled:opacity-50"
                  >
                    Didn&apos;t receive a code? <span className="font-medium underline underline-offset-4">Resend</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
