import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export async function POST(req: Request) {
  const { username, cli_password } = await req.json()
  if (!username || !cli_password) {
    return NextResponse.json({ error: 'username and cli_password required' }, { status: 400 })
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Look up user by username
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, cli_password_hash')
    .eq('username', username.trim().toLowerCase())
    .single()

  if (!profile || !profile.cli_password_hash) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const valid = await bcrypt.compare(cli_password, profile.cli_password_hash)
  if (!valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  // Get the user's email to generate a session
  const { data: { user } } = await supabase.auth.admin.getUserById(profile.id)
  if (!user?.email) {
    return NextResponse.json({ error: 'Account error' }, { status: 500 })
  }

  // Generate a magic link and immediately exchange it for a session
  const { data: linkData } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: user.email,
  })

  if (!linkData?.properties?.hashed_token) {
    return NextResponse.json({ error: 'Could not generate session' }, { status: 500 })
  }

  // Exchange the token for a real session
  const { data: sessionData } = await supabase.auth.verifyOtp({
    token_hash: linkData.properties.hashed_token,
    type: 'magiclink',
  })

  if (!sessionData?.session) {
    return NextResponse.json({ error: 'Session exchange failed' }, { status: 500 })
  }

  return NextResponse.json({
    access_token: sessionData.session.access_token,
    refresh_token: sessionData.session.refresh_token,
    username: username,
  })
}
