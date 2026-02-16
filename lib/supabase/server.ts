import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              maxAge: options?.maxAge || 31536000, // 1 year
              sameSite: "lax",
              httpOnly: true,
              secure: process.env.NODE_ENV === "production",
              path: "/",
            })
          })
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have proxy refreshing user sessions.
        }
      },
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: "pkce",
    },
  })
}

export async function createAdminClient() {
  // This should ONLY be used in server-side admin operations
  // Never expose this to client-side code
  const { createClient: createServiceClient } = await import("@supabase/supabase-js")

  return createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
