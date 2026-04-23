"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Participant {
  user_id: string
  full_name: string | null
}

interface ParticipantAvatarsProps {
  participants: Participant[]
  maxDisplay?: number
  isAdmin?: boolean // Added isAdmin prop
  isPastSession?: boolean // Added isPastSession prop
  currentUserId?: string // Added currentUserId prop
}

export function ParticipantAvatars({
  participants,
  maxDisplay = 3,
  isAdmin = false,
  isPastSession = false,
  currentUserId,
}: ParticipantAvatarsProps) {
  if (participants.length === 0) return null

  const visibleParticipants =
    isPastSession && !isAdmin && currentUserId ? participants.filter((p) => p.user_id === currentUserId) : participants

  const shouldHideDetails = isPastSession && !isAdmin && participants.length > 1 && currentUserId

  if (shouldHideDetails) {
    const attendedSelf = participants.some((p) => p.user_id === currentUserId)
    if (!attendedSelf) return null

    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">You attended this session</span>
      </div>
    )
  }

  const displayedParticipants = visibleParticipants.slice(0, maxDisplay)
  const remainingCount = Math.max(0, visibleParticipants.length - maxDisplay)
  const firstName = participants[0]?.full_name?.split(" ")[0] || "Someone"

  const getInitials = (name: string | null) => {
    if (!name) return "?"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  const getColorClass = (userId: string) => {
    const colors = [
      "bg-orange-600",
      "bg-blue-500",
      "bg-amber-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-orange-500",
    ]
    const hash = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[hash % colors.length]
  }

  const formatDisplayName = (name: string | null) => {
    if (!name) return "User"
    // Capitalize first letter of each word
    return name
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  }

  const getParticipantText = () => {
    const displayName = formatDisplayName(participants[0]?.full_name)?.split(" ")[0] || "Someone"
    if (participants.length === 1) {
      return `${displayName} booked`
    } else if (participants.length === 2) {
      return `${displayName} and 1 other booked`
    } else {
      return `${displayName} and ${participants.length - 1} others booked`
    }
  }

  return (
    <TooltipProvider>
      <Dialog>
        <DialogTrigger asChild>
          <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="flex -space-x-2">
              {displayedParticipants.map((participant, index) => (
                <Tooltip key={participant.user_id}>
                  <TooltipTrigger asChild>
                    <Avatar className="h-7 w-7 border-2 border-background ring-1 ring-border transition-transform hover:scale-110 hover:z-10 md:h-8 md:w-8">
                      <AvatarFallback
                        className={`text-xs font-semibold text-white ${getColorClass(participant.user_id)}`}
                      >
                        {getInitials(participant.full_name)}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-sm font-medium">{formatDisplayName(participant.full_name)}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
              {remainingCount > 0 && (
                <Avatar className="h-7 w-7 border-2 border-background ring-1 ring-border md:h-8 md:w-8">
                  <AvatarFallback className="bg-muted text-xs font-semibold text-muted-foreground">
                    +{remainingCount}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            <span className="text-xs text-muted-foreground hover:text-foreground transition-colors md:text-sm">
              {getParticipantText()}
            </span>
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isPastSession && !isAdmin ? "Your Attendance" : `Participants (${visibleParticipants.length})`}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[400px] overflow-y-auto">
            {isPastSession && !isAdmin ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                <p>You attended this session.</p>
                <p className="mt-2">Participant details are only visible to administrators.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {visibleParticipants.map((participant) => (
                  <div
                    key={participant.user_id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback
                        className={`text-sm font-semibold text-white ${getColorClass(participant.user_id)}`}
                      >
                        {getInitials(participant.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{formatDisplayName(participant.full_name)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
