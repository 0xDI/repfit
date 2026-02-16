import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// DEV ONLY: Bypass rate limits by generating OTP via admin API and verifying it server-side
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email") || "dimitris@devsagency.net"

    try {
        // Step 1: Generate OTP via admin API (bypasses rate limits)
        const generateRes = await fetch(
            `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/generate_link`,
            {
                method: "POST",
                headers: {
                    apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
                    Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, type: "magiclink" }),
            }
        )

        if (!generateRes.ok) {
            const err = await generateRes.text()
            return NextResponse.json({ error: "Failed to generate link", details: err }, { status: 500 })
        }

        const linkData = await generateRes.json()
        const otp = linkData.email_otp

        // Step 2: Verify OTP server-side using the SSR client (sets proper cookies)
        const cookieStore = await cookies()

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, {
                                ...options,
                                maxAge: options?.maxAge || 31536000,
                                sameSite: "lax",
                                httpOnly: true,
                                secure: process.env.NODE_ENV === "production",
                                path: "/",
                            })
                        })
                    },
                },
            }
        )

        const { data, error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: "email",
        })

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 400 })
        }

        // Step 3: Redirect to dashboard
        return NextResponse.redirect(new URL("/dashboard", request.url))
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
