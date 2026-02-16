/**
 * Get current date and time in Athens timezone (Europe/Athens)
 */
export function getAthensNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Europe/Athens" }))
}

/**
 * Format a date as YYYY-MM-DD string in Athens timezone
 */
export function formatAthensDate(date: Date): string {
  const athensDate = new Date(date.toLocaleString("en-US", { timeZone: "Europe/Athens" }))
  const year = athensDate.getFullYear()
  const month = String(athensDate.getMonth() + 1).padStart(2, "0")
  const day = String(athensDate.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Check if a session date/time is in the past relative to Athens time
 */
export function isSessionPast(sessionDate: string, endTime: string): boolean {
  const sessionDateTime = new Date(`${sessionDate}T${endTime}`)
  const athensNow = getAthensNow()
  return sessionDateTime < athensNow
}

/**
 * Check if a session has started (based on start time and Athens time)
 */
export function hasSessionStarted(sessionDate: string, startTime: string): boolean {
  const sessionDateTime = new Date(`${sessionDate}T${startTime}`)
  const athensNow = getAthensNow()
  return sessionDateTime <= athensNow
}

/**
 * Get hours until session starts (Athens time)
 */
export function getHoursUntilSession(sessionDate: string, startTime: string): number {
  const sessionDateTime = new Date(`${sessionDate}T${startTime}`)
  const athensNow = getAthensNow()
  return (sessionDateTime.getTime() - athensNow.getTime()) / (1000 * 60 * 60)
}
