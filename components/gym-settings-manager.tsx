"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload } from "lucide-react"
import Image from "next/image"
import { updateGymSettings, uploadGymLogo } from "@/lib/actions/admin"

type Gym = {
  id: string
  name?: string | null
  logo_url?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
} | null

export function GymSettingsManager({ gym: initialGym }: { gym: Gym }) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [contactLoading, setContactLoading] = useState(false)
  const [gymName, setGymName] = useState("")
  const [location, setLocation] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [logoPreview, setLogoPreview] = useState("/repfit-logo.png")
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const gymId = initialGym?.id

  useEffect(() => {
    if (initialGym) {
      setGymName(initialGym.name ?? "")
      setLocation(initialGym.address ?? "")
      setPhone(initialGym.phone ?? "")
      setEmail(initialGym.email ?? "")
      setAddress(initialGym.address ?? "")
      setLogoPreview(initialGym.logo_url || "/repfit-logo.png")
    }
  }, [initialGym])

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setLogoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
    toast({
      title: "Logo selected",
      description: "Click Save Changes to upload and apply.",
    })
  }

  const handleSaveSettings = async () => {
    if (!gymId) {
      toast({ title: "Error", description: "No gym found.", variant: "destructive" })
      return
    }
    setLoading(true)
    try {
      if (logoFile) {
        const formData = new FormData()
        formData.append("file", logoFile)
        const uploaded = await uploadGymLogo(gymId, formData)
        if (uploaded.success && uploaded.url) {
          await updateGymSettings(gymId, { logo_url: uploaded.url })
        }
      }
      const res = await updateGymSettings(gymId, {
        name: gymName || undefined,
        address: location || undefined,
      })
      if (res.success) {
        toast({ title: "Settings saved", description: "Gym settings have been updated." })
        setLogoFile(null)
      } else {
        toast({ title: "Failed to save", description: res.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Failed to save", description: "Something went wrong.", variant: "destructive" })
    }
    setLoading(false)
  }

  const handleSaveContact = async () => {
    if (!gymId) {
      toast({ title: "Error", description: "No gym found.", variant: "destructive" })
      return
    }
    setContactLoading(true)
    try {
      const res = await updateGymSettings(gymId, {
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
      })
      if (res.success) {
        toast({ title: "Contact updated", description: "Contact information has been saved." })
      } else {
        toast({ title: "Failed to update", description: res.error, variant: "destructive" })
      }
    } catch {
      toast({ title: "Failed to update", description: "Something went wrong.", variant: "destructive" })
    }
    setContactLoading(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gym Branding</CardTitle>
          <CardDescription>Update your gym's logo and display name</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label>Gym Logo</Label>
            <div className="flex items-center gap-6">
              <div className="relative h-24 w-24 overflow-hidden rounded-lg border-2 border-border">
                <Image src={logoPreview || "/placeholder.svg"} alt="Gym Logo" fill className="object-cover" />
              </div>
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Upload a new logo for your gym. Recommended size: 200x200px
                </p>
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <div className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload New Logo
                  </div>
                  <Input id="logo-upload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                </Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="gym-name">Gym Name</Label>
            <Input
              id="gym-name"
              value={gymName}
              onChange={(e) => setGymName(e.target.value)}
              placeholder="Enter gym name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location"
            />
          </div>

          <Button onClick={handleSaveSettings} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Manage gym contact details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+30 123 456 7890" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contact@example.com" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" />
          </div>

          <Button variant="outline" onClick={handleSaveContact} disabled={contactLoading}>
            {contactLoading ? "Saving..." : "Update Contact Info"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
