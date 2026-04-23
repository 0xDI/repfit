import { GymSettingsManager } from "@/components/gym-settings-manager"
import { getCurrentUserGym } from "@/lib/actions/admin"

export default async function AdminSettingsPage() {
  const { gym } = await getCurrentUserGym()
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2 border-b border-border/40 pb-6">
        <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-4xl">Settings</h1>
        <p className="text-sm font-medium text-muted-foreground">Manage your gym's public profile, contact information, and branding.</p>
      </div>

      <GymSettingsManager gym={gym} />
    </div>
  )
}
