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
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && sessionData.session) {
      const { user, session } = sessionData

      // ── Single-session enforcement ──────────────────────────────────────────
      // Stamp this session's access_token as the only valid session for this user.
      // Any other browser/device subscribed via Realtime will detect this change
      // and immediately sign out.
      await supabase
        .from('profiles')
        .update({ active_session_id: session.access_token })
        .eq('id', user.id)
      // ────────────────────────────────────────────────────────────────────────

      // Check if user has a profile (has completed onboarding)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('id', user.id)
        .single()

      // New user — no profile yet → go to onboarding
      if (!profile || !profile.username) {
        return NextResponse.redirect(`${origin}/onboarding`)
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
