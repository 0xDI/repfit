"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Dumbbell, Phone, AlertCircle, CheckCircle } from "lucide-react"
import { differenceInDays } from "date-fns"
import { useLanguage } from "@/lib/i18n/language-context"

interface SubscriptionStatusCardProps {
  subscription: {
    remaining_trainings: number
    total_trainings: number
    status: string
    start_date: string
    end_date: string
    plan_name: string
    plan_price?: number | null
    subscription_plans?: {
      name: string
      price: number
    }
  } | null
}

export function SubscriptionStatusCard({ subscription }: SubscriptionStatusCardProps) {
  const { t, language } = useLanguage()

  const hasActiveSubscription = subscription && subscription.remaining_trainings > 0

  if (!hasActiveSubscription) {
    return (
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-base md:text-lg">
              {language === "el" ? "Δεν Υπάρχει Ενεργή Συνδρομή" : "No Active Subscription"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {language === "el"
              ? "Χρειάζεστε ενεργό πρόγραμμα για να κάνετε κρατήσεις. Επικοινωνήστε μαζί μας για να ξεκινήσετε σήμερα!"
              : "You need an active subscription plan to book sessions. Contact us to get started today!"}
          </p>
          <Button className="w-full" onClick={() => (window.location.href = "tel:+306937043559")}>
            <Phone className="w-4 h-4 mr-2" />
            {language === "el" ? "Κλήση +30 693 704 3559" : "Call +30 693 704 3559"}
          </Button>
        </CardContent>
      </Card>
    )
  }

  const planName =
    subscription.plan_name ||
    subscription.subscription_plans?.name ||
    (language === "el" ? "Ενεργή Συνδρομή" : "Active Subscription")
  const planPrice = subscription.plan_price || subscription.subscription_plans?.price
  const trainingsProgress =
    subscription.total_trainings > 0 ? (subscription.remaining_trainings / subscription.total_trainings) * 100 : 100

  const endDate = subscription.end_date ? new Date(subscription.end_date) : null
  const daysRemaining = endDate ? differenceInDays(endDate, new Date()) : 999
  const isExpiringSoon = subscription.remaining_trainings <= 3 || (daysRemaining > 0 && daysRemaining <= 7)

  return (
    <Card className={isExpiringSoon ? "border-primary/50 bg-primary/5" : "border-primary/30 bg-primary/5"}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-base md:text-lg">
              {language === "el" ? "Ενεργή Συνδρομή" : "Active Subscription"}
            </CardTitle>
          </div>
          <Badge variant="default" className="bg-primary">
            {language === "el" ? "Ενεργή" : "Active"}
          </Badge>
        </div>
        {planName && <CardDescription className="text-lg font-semibold text-foreground">{planName}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trainings remaining */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground">
                {language === "el" ? "Υπόλοιπο Προπονήσεων" : "Trainings Remaining"}
              </span>
            </div>
            <span className="font-bold text-primary text-lg">
              {subscription.remaining_trainings}
              {subscription.total_trainings > 0 && ` / ${subscription.total_trainings}`}
            </span>
          </div>
          {subscription.total_trainings > 0 && <Progress value={trainingsProgress} className="h-2" />}
        </div>

        {/* Price - only show if available */}
        {planPrice && (
          <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
            <span className="text-sm text-muted-foreground">{language === "el" ? "Τιμή Πακέτου" : "Plan Price"}</span>
            <span className="text-lg font-bold">€{planPrice}</span>
          </div>
        )}

        {/* Warning for low trainings */}
        {isExpiringSoon && (
          <div className="rounded-lg bg-primary/10 border border-primary/20 p-3">
            <p className="text-sm text-primary mb-2">
              {subscription.remaining_trainings <= 3
                ? language === "el"
                  ? `Σας απομένουν μόνο ${subscription.remaining_trainings} προπονήσεις!`
                  : `You only have ${subscription.remaining_trainings} trainings left!`
                : language === "el"
                  ? `Η συνδρομή σας λήγει σε ${daysRemaining} μέρες!`
                  : `Your subscription expires in ${daysRemaining} days!`}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
              onClick={() => (window.location.href = "tel:+306937043559")}
            >
              <Phone className="w-4 h-4 mr-2" />
              {language === "el" ? "Ανανέωση Τώρα" : "Renew Now"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
