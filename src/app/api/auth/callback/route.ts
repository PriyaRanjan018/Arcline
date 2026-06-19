import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const errorParam = searchParams.get('error')
  const errorDesc = searchParams.get('error_description')

  if (errorParam) {
    if (errorDesc?.includes('already registered') || errorDesc?.includes('saving new user')) {
      return NextResponse.redirect(`${origin}/login?error=email_exists`)
    }
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorDesc || errorParam)}`)
  }

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Check if user has a profile (has completed onboarding)
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('id', user.id)
          .single()

        // New user — no profile yet → go to onboarding
        if (!profile || !profile.username) {
          return NextResponse.redirect(`${origin}/onboarding`)
        }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
