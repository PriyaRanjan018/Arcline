import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** POST /api/messages/conversations
 *  Body: { other_user_id: string }
 *  Returns: { conversation_id, messages[] }
 */
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { other_user_id } = await req.json()
  if (!other_user_id) return NextResponse.json({ error: 'other_user_id required' }, { status: 400 })
  if (other_user_id === user.id) return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })

  const db = admin()

  // Check if a conversation already exists between these two users (in any order)
  const { data: existing } = await db
    .from('conversations')
    .select('id')
    .contains('participant_ids', [user.id, other_user_id])
    .maybeSingle()

  let conversation_id: string

  if (existing) {
    conversation_id = existing.id
  } else {
    // Create new conversation
    const { data: created, error } = await db
      .from('conversations')
      .insert({ participant_ids: [user.id, other_user_id] })
      .select('id')
      .single()
    if (error || !created) {
      console.error('Create conversation error:', error)
      return NextResponse.json({ error: error?.message || 'Failed to create conversation' }, { status: 500 })
    }
    conversation_id = created.id
  }

  // Fetch messages for this conversation, ordered oldest first
  const { data: messages, error: msgError } = await db
    .from('messages')
    .select('id, sender_id, content, created_at')
    .eq('conversation_id', conversation_id)
    .order('created_at', { ascending: true })
    .limit(100)

  if (msgError) {
    console.error('Fetch messages error:', msgError)
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  // Mark messages from the other user as read
  await db
    .from('messages')
    .update({ is_read: true })
    .eq('conversation_id', conversation_id)
    .eq('sender_id', other_user_id)
    .eq('is_read', false)

  return NextResponse.json({ conversation_id, messages: messages ?? [] })
}
