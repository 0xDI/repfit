import { createAdminClient } from "./lib/supabase/server"

async function findGyms() {
    const admin = await createAdminClient()
    const { data, error } = await admin
        .from("gyms")
        .select("name, slug")
        .eq("is_active", true)
        .not("slug", "is", null)
        .limit(5)

    if (error) {
        console.error("Error fetching gyms:", error)
        return
    }

    console.log("Found Gyms:")
    console.table(data)
}

findGyms()
