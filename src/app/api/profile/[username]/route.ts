import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: { username: string } }
) {
  const supabase = createClient()
  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Fetch profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', params.username)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Fetch follower / following counts
  const [{ count: followersCount }, { count: followingCount }] = await Promise.all([
    supabaseAdmin
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    supabaseAdmin
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
  ])

  // Fetch public projects
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', profile.id)
    .eq('is_public', true)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return NextResponse.json({
    data: {
      profile: {
        ...profile,
        followers: followersCount ?? 0,
        following: followingCount ?? 0,
      },
      projects: projects ?? [],
    },
  })
}
