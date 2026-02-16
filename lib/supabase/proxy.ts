import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

export async function updateSession(request: NextRequest) {
  console.log("[v0] Middleware - Checking environment variables")
  console.log("[v0] NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "SET" : "MISSING")
  console.log("[v0] NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "SET" : "MISSING")
  console.log("[v0] SUPABASE_URL:", process.env.SUPABASE_URL ? "SET" : "MISSING")
  console.log("[v0] SUPABASE_ANON_KEY:", process.env.SUPABASE_ANON_KEY ? "SET" : "MISSING")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("[v0] Middleware - Missing Supabase credentials")
    // Allow request to continue without Supabase check
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = NextResponse.next({
          request,
        })
        cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return supabaseResponse
}
