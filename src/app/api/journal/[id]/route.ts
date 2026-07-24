import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ENTRY_TYPES } from '@/lib/enums'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('entries')
    .select(`
      id, type, title, body, day_number, mood, reaction_count, comment_count, created_at,
      project:projects!inner(id, slug, title),
      author:profiles!inner(id, username, name, avatar_url)
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
  return NextResponse.json({ data })
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, entry_body, type, mood } = body

  // ── Enum validation ───────────────────────────────────────
  if (type !== undefined) {
    const normalizedType = type.toUpperCase()
    if (!ENTRY_TYPES.includes(normalizedType as typeof ENTRY_TYPES[number])) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${ENTRY_TYPES.join(', ')}` },
        { status: 400 }
      )
    }
  }

  // ── Build a clean update payload ──────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() }
  if (title !== undefined)      updatePayload.title = title.trim()
  if (entry_body !== undefined) updatePayload.body  = entry_body.trim()
  if (type !== undefined)       updatePayload.type  = type.toUpperCase()
  if (mood !== undefined)       updatePayload.mood  = mood

  const { data, error } = await supabase
    .from('entries')
    .update(updatePayload)
    .eq('id', params.id)
    .eq('user_id', user.id) // RLS enforced + explicit owner check
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('entries')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: { deleted: true } })
}
