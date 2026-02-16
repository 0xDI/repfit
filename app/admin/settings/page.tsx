import { GymSettingsManager } from "@/components/gym-settings-manager"
import { getCurrentUserGym } from "@/lib/actions/admin"

export default async function AdminSettingsPage() {
  const { gym } = await getCurrentUserGym()
  return (
    <>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">Gym Settings</h1>
        <p className="text-muted-foreground">Manage gym information and branding</p>
      </div>

      <GymSettingsManager gym={gym} />
    </>
  )
}
