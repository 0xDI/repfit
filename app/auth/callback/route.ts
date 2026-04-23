
import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = {
      getAll() {
        // @ts-ignore
        return request.cookies.getAll() ?? []
      },
      setAll(cookiesToSet: any[]) {
        // We can't set cookies on the request object in the GET handler directly for the response exchange
        // But we need to create the client. The actual cookie setting happens in the redirect response.
      }
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // @ts-ignore
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            // This is a bit tricky in route handlers vs middleware. 
            // We'll rely on the exchangeCodeForSession to return the session, 
            // and we need to manually set cookies on the response.
          },
        },
      }
    )

    // Correction: In Next.js App Router Route Handlers, the proper way to handle cookie setting 
    // with Supabase exchange code is slightly different. Let's use the standard pattern.

    const response = NextResponse.redirect(`${origin}${next}`)

    const supabaseResponse = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            // @ts-ignore
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options) // update res cookies only
            })
          },
        },
      }
    )

    const { error } = await supabaseResponse.auth.exchangeCodeForSession(code)

    if (!error) {
      return response
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
