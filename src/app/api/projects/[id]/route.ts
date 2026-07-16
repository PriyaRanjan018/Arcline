import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PROJECT_STAGES } from '@/lib/enums'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      owner:profiles!inner(id, username, name, avatar_url)
    `)
    .eq('id', params.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
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
  const { title, tagline, description, stage, is_public, is_pinned } = body

  // ── Enum validation ───────────────────────────────────────
  if (stage !== undefined && !PROJECT_STAGES.includes(stage)) {
    return NextResponse.json(
      { error: `Invalid stage. Must be one of: ${PROJECT_STAGES.join(', ')}` },
      { status: 400 }
    )
  }

  // ── Build a clean update payload — never pass undefined fields ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() }
  if (title !== undefined)      updatePayload.title       = title.trim()
  if (tagline !== undefined)    updatePayload.tagline     = tagline?.trim() || null
  if (description !== undefined) updatePayload.description = description?.trim() || null
  if (stage !== undefined)      updatePayload.stage       = stage
  if (is_public !== undefined)  updatePayload.is_public   = is_public
  if (is_pinned !== undefined)  updatePayload.is_pinned   = is_pinned

  const { data, error } = await supabase
    .from('projects')
    .update(updatePayload)
    .eq('id', params.id)
    .eq('user_id', user.id)
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
    .from('projects')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: { deleted: true } })
}
