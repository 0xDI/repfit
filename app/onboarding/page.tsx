'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { createGym, completeOnboarding, checkOnboardingStatus } from '@/app/actions/onboarding'
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
  UserCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'

// Gym Types (Step 1)
const GYM_TYPES = [
  {
    id: 'community',
    title: 'Community Hub',
    icon: Users,
    description: 'A place for connection & growth',
    color: 'bg-emerald-500',
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

        // Handling already onboarded users
        if (result && !result.needsOnboarding) {
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
        await completeOnboarding(response.data.id)
        setStep('success')
        setTimeout(() => router.push('/onboarding/subscription'), 3000)
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
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="gym-name" className="text-foreground font-semibold">Gym Name</Label>
                    <Input
                      id="gym-name"
                      placeholder="e.g. Titan Performance"
                      value={details.name}
                      onChange={(e) => setDetails(prev => ({ ...prev, name: e.target.value }))}
                      required
                      className="h-12 bg-card border-border focus:border-[#FC4C02] rounded-lg"
                    />
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
                  disabled={isLoading || !details.name || !details.city}
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
              <p className="text-xl text-muted-foreground">
                Redirecting you to subscription setup...
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
