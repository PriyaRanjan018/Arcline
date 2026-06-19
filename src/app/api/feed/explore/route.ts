import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const PAGE_SIZE = 20

/** GET /api/feed/explore — public feed, no auth required */
export async function GET(req: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)

  const type    = searchParams.get('type')     // WIN | SETBACK | MILESTONE | REALIZATION
  const sort    = searchParams.get('sort')     // latest | trending (default: latest)
  const cursor  = searchParams.get('cursor')
  const limit   = Math.min(Number(searchParams.get('limit') ?? PAGE_SIZE), 50)

  const { data: pubProjects } = await supabase.from('projects').select('id').eq('is_public', true)
  const pubProjectIds = pubProjects?.map(p => p.id) ?? []

  let query = supabase
    .from('entries')
    .select(`
      id, type, title, body, day_number, mood, reaction_count, comment_count, created_at,
      project:projects!inner(id, slug, title, is_public),
      author:profiles!inner(id, username, name, avatar_url)
    `)
    .in('project_id', pubProjectIds)
    .limit(limit)

  // Type filter — SETBACK and WIN are treated identically in query logic (rule #4)
  if (type) query = query.eq('type', type.toUpperCase())

  // Sort — trending by reaction_count, otherwise by created_at DESC
  if (sort === 'trending') {
    query = query.order('reaction_count', { ascending: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  if (cursor) query = query.lt('created_at', cursor)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const nextCursor = data && data.length === limit ? data[data.length - 1].created_at : null
  return NextResponse.json({ data, meta: { nextCursor, count: data?.length ?? 0 } })
}
