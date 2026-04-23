'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function verifyOtpAction(email: string, otp: string, redirectTo?: string) {
    const supabase = await createClient()

    const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email'
    })

    if (error) {
        return { error: error.message }
    }

    redirect(redirectTo || '/dashboard')
}

export async function sendOtpAction(email: string) {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
            shouldCreateUser: true,
            // emailRedirectTo: undefined // Not needed for OTP code flow
        }
    })

    if (error) {
        return { error: error.message }
    }

    return { success: true }
}
