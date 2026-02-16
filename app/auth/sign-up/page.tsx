import { redirect } from 'next/navigation'

export default function Page() {
  // Redirect to unified auth page
  redirect('/auth/login')
}
