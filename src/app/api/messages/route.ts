import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** POST /api/messages
 *  Body: { conversation_id: string, content: string }
 */
export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { conversation_id, content } = await req.json()
  if (!conversation_id || !content?.trim()) {
    return NextResponse.json({ error: 'conversation_id and content required' }, { status: 400 })
  }

  const db = admin()

  // Verify user is a participant in this conversation
  const { data: convo } = await db
    .from('conversations')
    .select('participant_ids')
    .eq('id', conversation_id)
    .maybeSingle()

  if (!convo || !convo.participant_ids.includes(user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { data, error } = await db
    .from('messages')
    .insert({
      conversation_id,
      sender_id: user.id,
      content: content.trim(),
    })
    .select('id, sender_id, content, created_at')
    .single()

  if (error) {
    console.error('Send message error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update conversation updated_at timestamp
  await db
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversation_id)

  // Notify the other user
  const other_user_id = convo.participant_ids.find((id: string) => id !== user.id)
  if (other_user_id) {
    const { data: senderProfile } = await db
      .from('profiles')
      .select('name, username')
      .eq('id', user.id)
      .maybeSingle()

    const senderName = senderProfile?.name || senderProfile?.username || 'Someone'

    await db
      .from('notifications')
      .upsert({
        user_id:     other_user_id,
        actor_id:    user.id,
        type:        'message',
        message:     `${senderName} sent you a message`,
        entity_id:   conversation_id, // link to conversation
        entity_type: 'conversation',
        is_read:     false,
      }, { onConflict: 'user_id,actor_id,type,entity_id' })
  }

  return NextResponse.json({ data }, { status: 201 })
}
