import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"
import fs from "fs"

config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function seedTestEnvironment() {
  const ts = Date.now()
  const email = `testuser_${ts}@repfit.local`
  const password = `TestPass_${ts}!`
  const gymSlug = `test-gym-${ts}`

  console.log("Seeding test user:", email)
  const { data: userAuth } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  const userId = userAuth.user!.id

  await admin.from("profiles").upsert({
    id: userId,
    full_name: "E2E Test User",
    workout_tokens: 50,
  })

  console.log("Seeding test gym:", gymSlug)
  const { data: gym } = await admin
    .from("gyms")
    .insert({
      name: `E2E Test Gym ${ts}`,
      slug: gymSlug,
      is_active: true,
    })
    .select()
    .single()

  await admin.from("gym_members").insert({
    gym_id: gym.id,
    user_id: userId,
    role: "member",
    status: "active",
  })

  const today = new Date().toISOString().split("T")[0]
  await admin.from("gym_sessions").insert({
    gym_id: gym.id,
    session_date: today,
    start_time: "18:00",
    end_time: "19:00",
    total_slots: 10,
    available_slots: 10,
    is_open: true,
  })

  const output = {
    email,
    password,
    gymUrl: `https://repfitapp.com/${gymSlug}`
  }
  
  fs.writeFileSync("test-creds.json", JSON.stringify(output, null, 2))
  console.log("Test Environment Seeded Successfully:")
  console.log(output)
}

seedTestEnvironment().catch(console.error)
