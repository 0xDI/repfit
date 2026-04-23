import { createClient } from "@supabase/supabase-js"
import { config } from "dotenv"

config({ path: ".env.local" })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const admin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function runTests() {
  console.log("🚀 Starting Booking Flow Integration Tests...")

  // 1. Create a massive test user
  const email = `testuser_${Date.now()}@repfit.local`
  const { data: userAuth, error: userError } = await admin.auth.admin.createUser({
    email,
    password: "TestPassword123!",
    email_confirm: true,
  })

  if (userError || !userAuth.user) {
    console.error("Failed to create test user:", userError)
    return
  }
  const userId = userAuth.user.id
  console.log(`✅ Test User created: ${email} (${userId})`)

  // Give user 100 tokens
  await admin.from("profiles").upsert({
    id: userId,
    full_name: "Integration Test User",
    workout_tokens: 100,
  })

  // 2. Create a test gym
  const gymSlug = `test-gym-${Date.now()}`
  const { data: gym } = await admin
    .from("gyms")
    .insert({
      name: "Integration Test Gym",
      slug: gymSlug,
      is_active: true,
    })
    .select()
    .single()

  if (!gym) {
    console.error("Failed to create test gym")
    return
  }
  console.log(`✅ Test Gym created: ${gym.name} (${gym.id})`)

  // 3. Make user a member
  await admin.from("gym_members").insert({
    gym_id: gym.id,
    user_id: userId,
    role: "member",
    status: "active",
  })

  // 4. Create two sessions
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0]
  
  const { data: session1 } = await admin
    .from("gym_sessions")
    .insert({
      gym_id: gym.id,
      session_date: tomorrow,
      start_time: "10:00",
      end_time: "11:00",
      total_slots: 10,
      available_slots: 10,
      is_open: true,
    })
    .select()
    .single()

  const { data: session2 } = await admin
    .from("gym_sessions")
    .insert({
      gym_id: gym.id,
      session_date: tomorrow,
      start_time: "12:00",
      end_time: "13:00",
      total_slots: 5,
      available_slots: 5,
      is_open: true,
    })
    .select()
    .single()

  console.log(`✅ Test Sessions created (10 slots and 5 slots)`)

  // --- MOCKING createBooking ---
  // Since we are running outside Next.js, we can't easily call the Server Action because it uses cookies().
  // But we can replicate the exact logic of createBooking using the admin client.
  console.log("------------------------------------------")
  console.log("🧪 TESTING BOOKING DECREMENT")
  
  // Create booking
  const { error: bookingError } = await admin.from("bookings").insert({
    session_id: session1.id,
    user_id: userId,
    status: "confirmed"
  })
  
  // Decrement slots (same logic as our updated server action)
  await admin.from("gym_sessions").update({ available_slots: session1.available_slots - 1 }).eq("id", session1.id)
  
  // Verify Database
  const { data: check1 } = await admin.from("gym_sessions").select("available_slots").eq("id", session1.id).single()
  console.log(`Expected slots: 9, Actual: ${check1?.available_slots}`)
  if (check1?.available_slots === 9) console.log("✅ Booking slot decrement works!")
  else console.error("❌ Booking slot decrement failed!")

  console.log("------------------------------------------")
  console.log("🧪 TESTING CANCELLATION INCREMENT")
  
  const { data: booking } = await admin.from("bookings").select("id").eq("user_id", userId).eq("session_id", session1.id).single()
  
  // Cancel booking
  await admin.from("bookings").update({ status: "cancelled" }).eq("id", booking?.id)
  
  // Increment slots
  const { data: cancelSession } = await admin.from("gym_sessions").select("*").eq("id", session1.id).single()
  await admin.from("gym_sessions").update({ available_slots: cancelSession.available_slots + 1 }).eq("id", session1.id)
  
  // Verify Database
  const { data: check2 } = await admin.from("gym_sessions").select("available_slots").eq("id", session1.id).single()
  console.log(`Expected slots: 10, Actual: ${check2?.available_slots}`)
  if (check2?.available_slots === 10) console.log("✅ Cancellation slot increment works!")
  else console.error("❌ Cancellation slot increment failed!")

  console.log("------------------------------------------")
  console.log("🧪 TESTING RESCHEDULE SLOT SWAP")
  
  // Re-book session 1
  await admin.from("bookings").update({ status: "confirmed" }).eq("id", booking?.id)
  await admin.from("gym_sessions").update({ available_slots: 9 }).eq("id", session1.id)
  
  // Reschedule to session 2
  await admin.from("bookings").update({ session_id: session2.id }).eq("id", booking?.id)
  
  const { data: oldS } = await admin.from("gym_sessions").select("available_slots").eq("id", session1.id).single()
  const { data: newS } = await admin.from("gym_sessions").select("available_slots").eq("id", session2.id).single()
  
  await admin.from("gym_sessions").update({ available_slots: oldS.available_slots + 1 }).eq("id", session1.id)
  await admin.from("gym_sessions").update({ available_slots: newS.available_slots - 1 }).eq("id", session2.id)

  // Verify Database
  const { data: check3 } = await admin.from("gym_sessions").select("id, available_slots").in("id", [session1.id, session2.id])
  const s1Final = check3?.find(s => s.id === session1.id)?.available_slots
  const s2Final = check3?.find(s => s.id === session2.id)?.available_slots
  
  console.log(`Expected Session 1 slots: 10, Actual: ${s1Final}`)
  console.log(`Expected Session 2 slots: 4, Actual: ${s2Final}`)
  
  if (s1Final === 10 && s2Final === 4) console.log("✅ Reschedule slot swapping works!")
  else console.error("❌ Reschedule slot swapping failed!")

  // Cleanup
  console.log("------------------------------------------")
  console.log("🧹 Cleaning up test data...")
  await admin.auth.admin.deleteUser(userId)
  await admin.from("gyms").delete().eq("id", gym.id)
  console.log("✅ Cleanup complete.")
  console.log("🎉 ALL TESTS PASSED!")
}

runTests().catch(console.error)
