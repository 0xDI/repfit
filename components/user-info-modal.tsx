"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateUserInfo } from "@/lib/actions/profile"
import { useLanguage } from "@/lib/i18n/language-context"

interface UserInfoModalProps {
  open: boolean
  userEmail: string | null
}

export function UserInfoModal({ open, userEmail }: UserInfoModalProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
  })
  const { t } = useLanguage()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    if (!formData.full_name.trim()) {
      setError("Please enter your full name")
      setLoading(false)
      return
    }

    const age = Number.parseInt(formData.age)
    if (!age || age < 13 || age > 120) {
      setError("Please enter a valid age (13-120)")
      setLoading(false)
      return
    }

    const result = await updateUserInfo({
      full_name: formData.full_name.trim(),
      age: age,
    })

    if (!result.success) {
      setError(result.error || "Failed to update profile")
      setLoading(false)
      return
    }

    router.refresh()
  }

  return (
    <Dialog open={open} modal>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{t("completeProfile")}</DialogTitle>
          <DialogDescription className="text-sm">{t("completeProfileDesc")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">{t("fullName")}</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="John Doe"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
              disabled={loading}
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">{t("age")}</Label>
            <Input
              id="age"
              type="number"
              min="13"
              max="120"
              placeholder="25"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              required
              disabled={loading}
              className="bg-background"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full bg-primary text-primary-foreground" disabled={loading}>
            {loading ? "..." : t("continue")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
