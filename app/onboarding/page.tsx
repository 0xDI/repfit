'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createGym, completeOnboarding, checkOnboardingStatus, uploadGymLogoOnboarding, checkSlugAvailability } from '@/app/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dumbbell,
  Users,
  Trophy,
  Heart,
  ArrowRight,
  Check,
  Building2,
  Camera,
  MapPin,
  Phone,
  Sparkles,
  Zap,
  Flame,
  Target,
  Calendar,
  Layers,
  Activity,
  Baby,
  Clock,
  UserCheck,
  Link2,
  Copy,
  CheckCircle2,
  Globe
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Gym Types (Step 1)
const GYM_TYPES = [
  {
    id: 'community',
    title: 'Community Hub',
    icon: Users,
    description: 'A place for connection & growth',
    color: 'bg-orange-600',
  },
  {
    id: 'performance',
    title: 'Performance Lab',
    icon: Zap,
    description: 'Data-driven training facility',
    color: 'bg-orange-500',
  },
  {
    id: 'boutique',
    title: 'Boutique Studio',
    icon: Sparkles,
    description: 'Specialized fitness experience',
    color: 'bg-purple-500',
  },
  {
    id: 'wellness',
    title: 'Wellness Center',
    icon: Heart,
    description: 'Holistic health & recovery',
    color: 'bg-blue-500',
  },
]

// Focus Areas (Step 2)
const FOCUS_AREAS = [
  {
    id: 'classes',
    title: 'Group Classes',
    icon: Calendar,
    description: 'Scheduled sessions & programming',
  },
  {
    id: 'pt',
    title: 'Personal Training',
    icon: UserCheck,
    description: '1-on-1 coaching & guidance',
  },
  {
    id: 'open_gym',
    title: 'Open Gym',
    icon: Dumbbell,
    description: '24/7 access & equipment',
  },
  {
    id: 'hybrid',
    title: 'Hybrid',
    icon: Layers,
    description: 'A mix of everything',
  },
]

// Core Values (Step 3)
const CORE_VALUES = [
  { id: 'community', label: 'Community', icon: Users },
  { id: 'performance', label: 'Performance', icon: Zap },
  { id: 'passion', label: 'Passion', icon: Flame },
  { id: 'growth', label: 'Growth', icon: Target },
  { id: 'inclusion', label: 'Inclusion', icon: Heart },
  { id: 'discipline', label: 'Discipline', icon: Trophy },
  { id: 'innovation', label: 'Innovation', icon: Sparkles },
  { id: 'balance', label: 'Balance', icon: Building2 },
]

// Target Audience (Step 4)
const AUDIENCES = [
  { id: 'general', label: 'General Pop', icon: Users },
  { id: 'athletes', label: 'Athletes', icon: Trophy },
  { id: 'youth', label: 'Youth', icon: Baby },
  { id: 'seniors', label: 'Seniors', icon: Heart },
  { id: 'rehab', label: 'Rehab', icon: Activity },
  { id: 'corporate', label: 'Corporate', icon: Building2 },
]

// Operating Hours Options (Step 5 - Operations - New)
const HOURS_OPTIONS = [
  { id: '24/7', label: '24/7 Access', icon: Clock },
  { id: 'business_hours', label: 'Standard Business Hours', icon: Building2 },
  { id: 'classes_only', label: 'Classes Only (Scheduled)', icon: Calendar },
  { id: 'appointment', label: 'By Appointment Only', icon: UserCheck },
]

type Step = 'vision' | 'focus' | 'values' | 'audience' | 'operations' | 'details' | 'success'

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isCreatingNew = searchParams.get('new') === 'true'
  const [step, setStep] = useState<Step>('vision')
  const [vision, setVision] = useState<string | null>(null)
  const [focus, setFocus] = useState<string | null>(null)
  const [selectedValues, setSelectedValues] = useState<string[]>([])
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([])
  const [operations, setOperations] = useState({
    hoursType: '',
    capacity: '',
  })
  const [details, setDetails] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [slug, setSlug] = useState('')
  const [slugStatus, setSlugStatus] = useState<{ available: boolean; error?: string } | null>(null)
  const [slugChecking, setSlugChecking] = useState(false)
  const [createdGymSlug, setCreatedGymSlug] = useState('')
  const [linkCopied, setLinkCopied] = useState(false)

  // Safety check: Redirect based on auth status
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await checkOnboardingStatus()

        // Handling unauthenticated users
        if (result && 'isAuthenticated' in result && result.isAuthenticated === false) {
          console.log("User not authenticated, redirecting to login")
          router.push('/auth/login')
          return
        }

        // Handling already onboarded users — but allow if creating a new gym
        if (result && !result.needsOnboarding && !isCreatingNew) {
          router.push('/dashboard')
        }
      } catch (error) {
        console.error("Failed to check status", error)
      }
    }
    checkStatus()
  }, [router])

  const handleNext = () => {
    if (step === 'vision' && vision) setStep('focus')
    else if (step === 'focus' && focus) setStep('values')
    else if (step === 'values' && selectedValues.length >= 1) setStep('audience')
    else if (step === 'audience' && selectedAudiences.length >= 1) setStep('operations')
    else if (step === 'operations' && operations.hoursType && operations.capacity) setStep('details')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const gymPayload = {
        name: details.name,
        slug: slug,
        email: "",
        phone: details.phone,
        address: details.address,
        city: details.city,
        state: "",
        zip: "",
        description: `A ${vision} gym focused on ${focus}. Validated by: ${selectedValues.join(', ')}. Serving: ${selectedAudiences.join(', ')}`,
        operating_hours: operations.hoursType,
        max_capacity: operations.capacity
      }

      const response = await createGym(gymPayload as any)

      if (response && response.data) {
        // Upload logo if selected
        if (logoFile) {
          const logoFormData = new FormData()
          logoFormData.append('file', logoFile)
          await uploadGymLogoOnboarding(response.data.id, logoFormData)
        }

        await completeOnboarding(response.data.id)
        setCreatedGymSlug(slug)
        setStep('success')
      } else {
        const errorMsg = response?.error || "Unknown error"
        console.error('Onboarding failed:', errorMsg)

        if (errorMsg === "Not authenticated") {
          alert("Your session has expired. Please sign in again.")
          router.push('/auth/login')
        } else {
          alert(`Setup failed: ${errorMsg}. (Note: If this is a new column error, please run the migration script 019_add_onboarding_fields.sql)`)
        }
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Onboarding failed:', error)
      alert("An unexpected error occurred.")
      setIsLoading(false)
    }
  }

  const toggleValue = (id: string) => {
    if (selectedValues.includes(id)) {
      setSelectedValues(prev => prev.filter(v => v !== id))
    } else if (selectedValues.length < 3) {
      setSelectedValues(prev => [...prev, id])
    }
  }

  const toggleAudience = (id: string) => {
    if (selectedAudiences.includes(id)) {
      setSelectedAudiences(prev => prev.filter(v => v !== id))
    } else if (selectedAudiences.length < 3) {
      setSelectedAudiences(prev => [...prev, id])
    }
  }

  // Calculate Progress
  const progress =
    step === 'vision' ? 15 :
      step === 'focus' ? 30 :
        step === 'values' ? 45 :
          step === 'audience' ? 60 :
            step === 'operations' ? 75 :
              step === 'details' ? 90 : 100

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary relative">
      {/* Logo */}
      <div className="absolute top-6 left-6 z-40">
        <img src="/repfit-logo.png" alt="REPFIT" className="w-10 h-10 rounded-md" />
      </div>

      {/* Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-muted z-50">
        <motion.div
          className="h-full bg-[#FC4C02]"
          initial={{ width: '0%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      <div className="container max-w-lg mx-auto px-6 py-12 min-h-screen flex flex-col justify-center">
        <AnimatePresence mode="wait">

          {step === 'vision' && (
            <motion.div
              key="vision"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">What's your gym type?</h2>
                <p className="text-muted-foreground">Choose the archetype that fits best.</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {GYM_TYPES.map((type) => {
                  const Icon = type.icon
                  const isSelected = vision === type.id
                  return (
                    <motion.div
                      key={type.id}
                      onClick={() => setVision(type.id)}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative flex items-center gap-4 p-5 rounded-xl cursor-pointer border-2 transition-all",
                        isSelected
                          ? "border-[#FC4C02] bg-[#FC4C02]/10"
                          : "border-border hover:border-border/80 bg-card"
                      )}
                    >
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                        isSelected ? "bg-[#FC4C02] text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className={cn("font-bold text-lg", isSelected ? "text-[#FC4C02]" : "text-foreground")}>
                          {type.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{type.description}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-5 right-5 text-[#FC4C02]">
                          <Check className="w-6 h-6" />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              <Button
                onClick={handleNext}
                disabled={!vision}
                className="w-full h-14 bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold rounded-lg"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {step === 'focus' && (
            <motion.div
              key="focus"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">What's your main focus?</h2>
                <p className="text-muted-foreground">How do you deliver value?</p>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {FOCUS_AREAS.map((item) => {
                  const Icon = item.icon
                  const isSelected = focus === item.id
                  return (
                    <motion.div
                      key={item.id}
                      onClick={() => setFocus(item.id)}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative flex items-center gap-4 p-5 rounded-xl cursor-pointer border-2 transition-all",
                        isSelected
                          ? "border-[#FC4C02] bg-[#FC4C02]/10"
                          : "border-border hover:border-border/80 bg-card"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                        isSelected ? "bg-[#FC4C02] text-white" : "bg-muted text-muted-foreground"
                      )}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className={cn("font-bold text-lg", isSelected ? "text-[#FC4C02]" : "text-foreground")}>
                          {item.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      {isSelected && (
                        <div className="absolute top-5 right-5 text-[#FC4C02]">
                          <Check className="w-6 h-6" />
                        </div>
                      )}
                    </motion.div>
                  )
                })}
              </div>

              <Button
                onClick={handleNext}
                disabled={!focus}
                className="w-full h-14 bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold rounded-lg"
              >
                Continue
              </Button>
            </motion.div>
          )}

          {step === 'values' && (
            <motion.div
              key="values"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">What drives you?</h2>
                <p className="text-muted-foreground">Select up to 3 core values.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {CORE_VALUES.map((value) => {
                  const Icon = value.icon
                  const isSelected = selectedValues.includes(value.id)
                  return (
                    <motion.button
                      key={value.id}
                      onClick={() => toggleValue(value.id)}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all h-32 space-y-3",
                        isSelected
                          ? "border-[#FC4C02] bg-[#FC4C02]/10"
                          : "border-border hover:border-white/20 bg-card"
                      )}
                    >
                      <Icon className={cn("w-8 h-8", isSelected ? "text-[#FC4C02]" : "text-muted-foreground")} />
                      <span className={cn("font-bold text-sm", isSelected ? "text-[#FC4C02]" : "text-foreground")}>
                        {value.label}
                      </span>
                    </motion.button>
                  )
                })}
              </div>

              <Button
                onClick={handleNext}
                disabled={selectedValues.length === 0}
                className="w-full h-14 bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold rounded-lg"
              >
                Continue ({selectedValues.length}/3)
              </Button>
            </motion.div>
          )}

          {step === 'audience' && (
            <motion.div
              key="audience"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Who do you serve?</h2>
                <p className="text-muted-foreground">Select up to 3 target audiences.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {AUDIENCES.map((item) => {
                  const Icon = item.icon
                  const isSelected = selectedAudiences.includes(item.id)
                  return (
                    <motion.button
                      key={item.id}
                      onClick={() => toggleAudience(item.id)}
                      whileTap={{ scale: 0.95 }}
                      className={cn(
                        "flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all h-32 space-y-3",
                        isSelected
                          ? "border-[#FC4C02] bg-[#FC4C02]/10"
                          : "border-border hover:border-white/20 bg-card"
                      )}
                    >
                      <Icon className={cn("w-8 h-8", isSelected ? "text-[#FC4C02]" : "text-muted-foreground")} />
                      <span className={cn("font-bold text-sm", isSelected ? "text-[#FC4C02]" : "text-foreground")}>
                        {item.label}
                      </span>
                    </motion.button>
                  )
                })}
              </div>

              <Button
                onClick={handleNext}
                disabled={selectedAudiences.length === 0}
                className="w-full h-14 bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold rounded-lg"
              >
                Continue ({selectedAudiences.length}/3)
              </Button>
            </motion.div>
          )}

          {step === 'operations' && (
            <motion.div
              key="operations"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Operations</h2>
                <p className="text-muted-foreground">Tell us about your logistics.</p>
              </div>

              <div className="space-y-6">
                {/* Hours Selection */}
                <div className="grid grid-cols-1 gap-4">
                  <Label className="text-lg font-semibold">Operating Hours</Label>
                  {HOURS_OPTIONS.map((item) => {
                    const Icon = item.icon
                    const isSelected = operations.hoursType === item.id
                    return (
                      <motion.div
                        key={item.id}
                        onClick={() => setOperations(prev => ({ ...prev, hoursType: item.id }))}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                          "relative flex items-center gap-4 p-4 rounded-xl cursor-pointer border-2 transition-all",
                          isSelected
                            ? "border-[#FC4C02] bg-[#FC4C02]/10"
                            : "border-border hover:border-border/80 bg-card"
                        )}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                          isSelected ? "bg-[#FC4C02] text-white" : "bg-muted text-muted-foreground"
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className={cn("font-bold", isSelected ? "text-[#FC4C02]" : "text-foreground")}>
                          {item.label}
                        </h3>
                        {isSelected && (
                          <div className="ml-auto text-[#FC4C02]">
                            <Check className="w-5 h-5" />
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>

                {/* Capacity Input */}
                <div className="space-y-4">
                  <Label htmlFor="capacity" className="text-lg font-semibold">Session/Gym Capacity</Label>
                  <p className="text-sm text-muted-foreground -mt-3">Roughly how many people per session?</p>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="e.g. 20"
                    value={operations.capacity}
                    onChange={(e) => setOperations(prev => ({ ...prev, capacity: e.target.value }))}
                    className="h-14 bg-card border-border focus:border-[#FC4C02] rounded-lg text-lg"
                  />
                </div>
              </div>

              <Button
                onClick={handleNext}
                disabled={!operations.hoursType || !operations.capacity}
                className="w-full h-14 bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold rounded-lg"
              >
                Continue
              </Button>
            </motion.div>
          )}


          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-2">
                <h2 className="text-3xl font-bold">Gym Details</h2>
                <p className="text-muted-foreground">Almost to the finish line.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Logo Upload */}
                <div className="flex flex-col items-center gap-3">
                  <label htmlFor="logo-upload" className="cursor-pointer group">
                    <div className="relative w-24 h-24 rounded-2xl border-2 border-dashed border-border hover:border-[#FC4C02] transition-colors overflow-hidden bg-card">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground group-hover:text-[#FC4C02] transition-colors">
                          <Camera className="w-8 h-8 mb-1" />
                          <span className="text-[10px] font-medium">Add Logo</span>
                        </div>
                      )}
                      {logoPreview && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Camera className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>
                  </label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        setLogoFile(file)
                        setLogoPreview(URL.createObjectURL(file))
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Optional • 200×200px recommended</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gym-name" className="text-foreground font-semibold">Gym Name</Label>
                    <Input
                      id="gym-name"
                      placeholder="e.g. Titan Performance"
                      value={details.name}
                      onChange={(e) => {
                        const name = e.target.value
                        setDetails(prev => ({ ...prev, name }))
                        // Auto-generate slug from name
                        const autoSlug = name
                          .toLowerCase()
                          .replace(/[^a-z0-9\s-]/g, '')
                          .replace(/\s+/g, '-')
                          .replace(/-+/g, '-')
                          .replace(/^-|-$/g, '')
                          .slice(0, 30)
                        setSlug(autoSlug)
                        setSlugStatus(null)
                        // Check availability
                        if (autoSlug.length >= 3) {
                          setSlugChecking(true)
                          checkSlugAvailability(autoSlug).then(res => {
                            setSlugStatus(res)
                            setSlugChecking(false)
                          })
                        }
                      }}
                      required
                      className="h-12 bg-card border-border focus:border-[#FC4C02] rounded-lg"
                    />
                  </div>

                  {/* Slug / Gym Link */}
                  <div className="space-y-2">
                    <Label htmlFor="gym-slug" className="text-foreground font-semibold flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      Your Gym Link
                    </Label>
                    <div className="flex items-center gap-0">
                      <div className="h-12 px-3 bg-muted border border-r-0 border-border rounded-l-lg flex items-center text-sm text-muted-foreground select-none">
                        repfitapp.com/
                      </div>
                      <Input
                        id="gym-slug"
                        placeholder="your-gym"
                        value={slug}
                        onChange={(e) => {
                          const val = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, '')
                            .replace(/-+/g, '-')
                            .slice(0, 30)
                          setSlug(val)
                          setSlugStatus(null)
                          if (val.length >= 3) {
                            setSlugChecking(true)
                            checkSlugAvailability(val).then(res => {
                              setSlugStatus(res)
                              setSlugChecking(false)
                            })
                          }
                        }}
                        required
                        className="h-12 bg-card border-border focus:border-[#FC4C02] rounded-l-none rounded-r-lg"
                      />
                    </div>
                    {/* Slug status indicator */}
                    <div className="h-5">
                      {slugChecking && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                          Checking availability...
                        </p>
                      )}
                      {!slugChecking && slugStatus?.available && (
                        <p className="text-xs text-orange-500 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          repfitapp.com/{slug} is available!
                        </p>
                      )}
                      {!slugChecking && slugStatus && !slugStatus.available && (
                        <p className="text-xs text-red-500">
                          {slugStatus.error}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-foreground font-semibold">City</Label>
                    <Input
                      id="city"
                      placeholder="e.g. Athens"
                      value={details.city}
                      onChange={(e) => setDetails(prev => ({ ...prev, city: e.target.value }))}
                      required
                      className="h-12 bg-card border-border focus:border-[#FC4C02] rounded-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address" className="text-foreground font-semibold">Address (Optional)</Label>
                    <Input
                      id="address"
                      placeholder="e.g. 123 Fitness St"
                      value={details.address}
                      onChange={(e) => setDetails(prev => ({ ...prev, address: e.target.value }))}
                      className="h-12 bg-card border-border focus:border-[#FC4C02] rounded-lg"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading || !details.name || !details.city || !slug || slug.length < 3 || !slugStatus?.available}
                  className="w-full h-14 bg-[#FC4C02] hover:bg-[#E34402] text-white font-bold rounded-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Creating...
                    </div>
                  ) : (
                    "Complete Setup"
                  )}
                </Button>
              </form>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center space-y-6 py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
                className="w-24 h-24 bg-[#FC4C02] rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/30"
              >
                <Check className="w-12 h-12 text-white" />
              </motion.div>

              <h2 className="text-4xl font-bold tracking-tight">You're In!</h2>

              {createdGymSlug && (
                <div className="w-full max-w-md space-y-3">
                  <p className="text-muted-foreground">Share this link with your gym members:</p>
                  <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-3">
                    <Link2 className="w-5 h-5 text-[#FC4C02] flex-shrink-0" />
                    <span className="text-sm font-medium flex-1 truncate">repfitapp.com/{createdGymSlug}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`https://repfitapp.com/${createdGymSlug}`)
                        setLinkCopied(true)
                        setTimeout(() => setLinkCopied(false), 2000)
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#FC4C02] hover:bg-[#E34402] text-white text-xs font-medium transition-colors"
                    >
                      {linkCopied ? (
                        <><CheckCircle2 className="w-3 h-3" /> Copied!</>
                      ) : (
                        <><Copy className="w-3 h-3" /> Copy</>
                      )}
                    </button>
                  </div>
                </div>
              )}

              <Button
                className="mt-4 bg-[#FC4C02] hover:bg-[#E34402] text-white px-8"
                onClick={() => router.push('/admin')}
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
