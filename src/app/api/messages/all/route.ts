import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** GET /api/messages/all
 *  Returns: list of conversations for the current user,
 *           with the latest message and the other participant's profile.
 */
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = admin()

  // 1. Get all conversations where user is a participant
  const { data: convos, error } = await db
    .from('conversations')
    .select('id, participant_ids, updated_at')
    .contains('participant_ids', [user.id])
    .order('updated_at', { ascending: false })

  if (error || !convos) {
    return NextResponse.json({ data: [] })
  }

  // 2. Fetch the other participant profiles and the latest message for each
  const result = []
  for (const convo of convos) {
    const other_user_id = convo.participant_ids.find((id: string) => id !== user.id)
    if (!other_user_id) continue

    const { data: profile } = await db
      .from('profiles')
      .select('id, name, username, avatar_url')
      .eq('id', other_user_id)
      .maybeSingle()

    const { data: latestMsg } = await db
      .from('messages')
      .select('content, created_at, is_read, sender_id')
      .eq('conversation_id', convo.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    result.push({
      id: convo.id,
      updated_at: convo.updated_at,
      other_user: profile,
      latest_message: latestMsg,
    })
  }

  return NextResponse.json({ data: result })
}
