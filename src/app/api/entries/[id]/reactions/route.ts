import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const VALID_REACTIONS = ['FEEL_THIS', 'KEEP_GOING', 'HIT_ME', 'BEEN_HERE']

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()

  // Get reaction counts grouped by type
  const { data, error } = await supabase
    .from('reactions')
    .select('type')
    .eq('entry_id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const counts: Record<string, number> = {
    FEEL_THIS: 0, KEEP_GOING: 0, HIT_ME: 0, BEEN_HERE: 0,
  }
  data?.forEach(r => { counts[r.type] = (counts[r.type] ?? 0) + 1 })

  // If authenticated, also return which the user has reacted with
  const { data: { user } } = await supabase.auth.getUser()
  let userReactions: string[] = []
  if (user) {
    const { data: mine } = await supabase
      .from('reactions')
      .select('type')
      .eq('entry_id', params.id)
      .eq('user_id', user.id)
    userReactions = mine?.map(r => r.type) ?? []
  }

  return NextResponse.json({ data: { counts, userReactions } })
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await req.json()
  if (!VALID_REACTIONS.includes(type)) {
    return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
  }

  // Upsert — safe to call even if already reacted (idempotent)
  const { data, error } = await supabase
    .from('reactions')
    .upsert({ entry_id: params.id, user_id: user.id, type }, { onConflict: 'entry_id,user_id,type' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type } = await req.json()
  if (!VALID_REACTIONS.includes(type)) {
    return NextResponse.json({ error: 'Invalid reaction type' }, { status: 400 })
  }

  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('entry_id', params.id)
    .eq('user_id', user.id)
    .eq('type', type)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: { deleted: true } })
}
