import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/** POST /api/follows/users — follow a builder */
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { following_id } = await req.json()
  if (!following_id) return NextResponse.json({ error: 'following_id required' }, { status: 400 })
  if (following_id === user.id) return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })

  console.log(`POST /api/follows/users from user ${user.id} to following_id ${following_id}`);

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Check if already following
  const { data: existing } = await supabaseAdmin
    .from('user_follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', following_id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ data: existing }, { status: 200 })
  }

  // Insert new follow
  const { data, error } = await supabaseAdmin
    .from('user_follows')
    .insert({ follower_id: user.id, following_id })
    .select()
    .single()

  if (error) {
    console.error("Follow error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Fetch follower's name for the notification message
  const { data: followerProfile } = await supabaseAdmin
    .from('profiles')
    .select('name, username')
    .eq('id', user.id)
    .maybeSingle()

  const followerName = followerProfile?.name || followerProfile?.username || 'Someone'

  // Insert / upsert follow notification for the person being followed
  await supabaseAdmin
    .from('notifications')
    .upsert({
      user_id:     following_id,
      actor_id:    user.id,
      type:        'follow',
      message:     `${followerName} started following you`,
      entity_id:   user.id,
      entity_type: 'profile',
      is_read:     false,
    }, { onConflict: 'user_id,actor_id,type,entity_id' })

  console.log("Follow successful:", data);
  return NextResponse.json({ data }, { status: 201 })
}

/** DELETE /api/follows/users — unfollow a builder */
export async function DELETE(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { following_id } = await req.json()
  if (!following_id) return NextResponse.json({ error: 'following_id required' }, { status: 400 })

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await supabaseAdmin
    .from('user_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('following_id', following_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: { unfollowed: true } })
}
