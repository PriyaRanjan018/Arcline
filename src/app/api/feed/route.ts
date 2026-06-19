import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const PAGE_SIZE = 20

/** GET /api/feed — personalised feed (entries from followed projects + users) */
export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get('cursor')
  const limit = Math.min(Number(searchParams.get('limit') ?? PAGE_SIZE), 50)

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get project IDs the user follows
  const { data: followedProjects } = await supabaseAdmin
    .from('project_follows')
    .select('project_id')
    .eq('follower_id', user.id)

  // Get user IDs the user follows
  const { data: followedUsers } = await supabaseAdmin
    .from('user_follows')
    .select('following_id')
    .eq('follower_id', user.id)

  const projectIds = followedProjects?.map(f => f.project_id) ?? []
  const userIds    = followedUsers?.map(f => f.following_id)   ?? []

  if (projectIds.length === 0 && userIds.length === 0) {
    return NextResponse.json({ data: [], meta: { nextCursor: null, count: 0 } })
  }

  let query = supabase
    .from('entries')
    .select(`
      id, type, title, body, day_number, mood, reaction_count, comment_count, created_at,
      project:projects!inner(id, slug, title),
      author:profiles!inner(id, username, name, avatar_url)
    `)

  const filters: string[] = []
  if (projectIds.length > 0) filters.push(`project_id.in.(${projectIds.join(',')})`)
  if (userIds.length > 0) filters.push(`user_id.in.(${userIds.join(',')})`)
  if (filters.length > 0) query = query.or(filters.join(','))

  query = query
    .order('created_at', { ascending: false })
    .limit(limit)

  if (cursor) query = query.lt('created_at', cursor)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const nextCursor = data && data.length === limit ? data[data.length - 1].created_at : null
  return NextResponse.json({ data, meta: { nextCursor, count: data?.length ?? 0 } })
}
