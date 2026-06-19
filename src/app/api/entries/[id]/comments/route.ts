import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('comments')
    .select(`
      id, body, created_at,
      author:profiles!inner(id, username, name, avatar_url),
      parent_id
    `)
    .eq('entry_id', params.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { body, parent_id } = await req.json()
  if (!body?.trim()) return NextResponse.json({ error: 'Comment body required' }, { status: 400 })

  const { data, error } = await supabase
    .from('comments')
    .insert({ entry_id: params.id, user_id: user.id, body: body.trim(), parent_id: parent_id ?? null })
    .select(`id, body, created_at, author:profiles!inner(id, username, name, avatar_url), parent_id`)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
