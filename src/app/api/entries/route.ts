import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const PAGE_SIZE = 20

export async function GET(req: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('project_id')
  const type = searchParams.get('type')          // WIN | SETBACK | MILESTONE | REALIZATION
  const cursor = searchParams.get('cursor')       // ISO timestamp for pagination
  const limit = Math.min(Number(searchParams.get('limit') ?? PAGE_SIZE), 50)

  let query = supabase
    .from('entries')
    .select(`
      id, type, title, body, day_number, mood, reaction_count, comment_count, created_at,
      project:projects!inner(id, slug, title, user_id, is_public),
      author:profiles!inner(id, username, name, avatar_url)
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (projectId) query = query.eq('project_id', projectId)
  if (type)      query = query.eq('type', type.toUpperCase())
  const username = searchParams.get('username')
  if (username) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single()
    if (profile) query = query.eq('user_id', profile.id)
  }
  if (cursor)    query = query.lt('created_at', cursor)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const nextCursor = data && data.length === limit
    ? data[data.length - 1].created_at
    : null

  return NextResponse.json({ data, meta: { nextCursor, count: data?.length ?? 0 } })
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { project_id, type, title, entry_body, day_number, mood } = body

  // Validate required fields
  if (!project_id || !type || !title || !entry_body) {
    return NextResponse.json({ error: 'project_id, type, title and body are required' }, { status: 400 })
  }

  const VALID_TYPES = ['WIN', 'SETBACK', 'MILESTONE', 'REALIZATION']
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid entry type' }, { status: 400 })
  }

  // Rate limit: max 10 entries per user per day
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const { count } = await supabase
    .from('entries')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfDay.toISOString())

  if ((count ?? 0) >= 10) {
    return NextResponse.json({ error: 'Rate limit: max 10 entries per day' }, { status: 429 })
  }

  // Verify project belongs to this user
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', project_id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Project not found or access denied' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('entries')
    .insert({
      project_id,
      user_id: user.id,
      type,
      title: title.trim(),
      body: entry_body.trim(),
      day_number: day_number ?? null,
      mood: mood ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
