import { NextResponse } from "next/server"
import { createClient, createAdminClient } from "@/lib/supabase/server"

export async function GET() {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: "Not authenticated", user: null })
    }

    // Check owned gyms
    const { data: ownedGyms, error: gymError } = await adminClient
        .from("gyms")
        .select("id, owner_id, name, subscription_status, onboarding_completed")
        .eq("owner_id", user.id)

    return NextResponse.json({
        user: { id: user.id, email: user.email },
        ownedGyms,
        gymError,
        debug: {
            targetOwnerId: user.id,
            expectedOwner: "a1252f17-036e-40da-ab12-7f6d0b00d446"
        }
    })
}
