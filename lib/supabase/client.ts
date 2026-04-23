import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return document.cookie.split("; ").map((cookie) => {
          const [name, ...valueParts] = cookie.split("=")
          return { name, value: valueParts.join("=") }
        })
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          document.cookie = `${name}=${value}; path=${options?.path || "/"}; max-age=${options?.maxAge || 31536000}; samesite=${options?.sameSite || "lax"}${window.location.protocol === "https:" ? "; secure" : ""}`
        })
      },
    },
  })
}
