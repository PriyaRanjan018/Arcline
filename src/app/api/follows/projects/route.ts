import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/** POST /api/follows/projects — follow a project */
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id, notify = true } = await req.json()
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  const { data, error } = await supabase
    .from('project_follows')
    .upsert({ follower_id: user.id, project_id, notify }, { onConflict: 'follower_id,project_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

/** DELETE /api/follows/projects — unfollow a project */
export async function DELETE(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { project_id } = await req.json()
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 })

  const { error } = await supabase
    .from('project_follows')
    .delete()
    .eq('follower_id', user.id)
    .eq('project_id', project_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: { unfollowed: true } })
}
