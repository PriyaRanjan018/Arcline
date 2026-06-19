import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function PATCH(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { 
    name, username, bio, location, avatar_url, tags, open_to,
    builder_role, currently_building, pronouns, building_since,
    github_url, twitter_url, website_url, linkedin_url
  } = body

  // Build update payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: Record<string, any> = {}
  if (name !== undefined) updatePayload.name = name.trim()
  if (bio !== undefined) updatePayload.bio = bio.trim()
  if (location !== undefined) updatePayload.location = location.trim()
  if (avatar_url !== undefined) updatePayload.avatar_url = avatar_url
  if (tags !== undefined) updatePayload.tags = tags
  if (open_to !== undefined) updatePayload.open_to = open_to
  
  if (builder_role !== undefined) updatePayload.builder_role = builder_role
  if (currently_building !== undefined) updatePayload.currently_building = currently_building
  if (pronouns !== undefined) updatePayload.pronouns = pronouns
  if (building_since !== undefined) updatePayload.building_since = building_since
  if (github_url !== undefined) updatePayload.github_url = github_url
  if (twitter_url !== undefined) updatePayload.twitter_url = twitter_url
  if (website_url !== undefined) updatePayload.website_url = website_url
  if (linkedin_url !== undefined) updatePayload.linkedin_url = linkedin_url

  if (username !== undefined) {
    const trimmedUsername = username.trim().toLowerCase()
    if (!/^[a-z0-9_]{3,20}$/.test(trimmedUsername)) {
      return NextResponse.json({ error: 'Username must be 3-20 characters, lowercase letters, numbers, and underscores only.' }, { status: 400 })
    }
    updatePayload.username = trimmedUsername
  }

  // Use service role client to bypass any RLS policy restrictions for this specific profile update
  const adminClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await adminClient
    .from('profiles')
    .update(updatePayload)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Username is already taken' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}
