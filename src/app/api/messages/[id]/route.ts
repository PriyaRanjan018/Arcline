import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = () => createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/** DELETE /api/messages/[id]
 *  Deletes a specific message.
 */
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = admin()

  // Verify the user is the sender of the message
  const { data: msg } = await db
    .from('messages')
    .select('sender_id')
    .eq('id', params.id)
    .maybeSingle()

  if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

  if (msg.sender_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden. You can only delete your own messages.' }, { status: 403 })
  }

  const { error } = await db
    .from('messages')
    .delete()
    .eq('id', params.id)

  if (error) {
    console.error('Delete message error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { deleted: true } }, { status: 200 })
}
