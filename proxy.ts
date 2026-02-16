import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    },
  )

  // IMPORTANT: Always call getUser() to refresh the auth token.
  // This must happen on EVERY request so the session cookie stays valid.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const isProtectedRoute =
    request.nextUrl.pathname.startsWith("/dashboard") || request.nextUrl.pathname.startsWith("/admin")

  if (!user && isProtectedRoute) {
    const redirectUrl = new URL("/auth/login", request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}

