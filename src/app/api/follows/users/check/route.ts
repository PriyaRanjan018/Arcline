import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

/** GET /api/follows/users/check?following_id=... */
export async function GET(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ isFollowing: false })

  const { searchParams } = new URL(req.url)
  const following_id = searchParams.get('following_id')
  if (!following_id) return NextResponse.json({ isFollowing: false })

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabaseAdmin
    .from('user_follows')
    .select('follower_id')
    .eq('follower_id', user.id)
    .eq('following_id', following_id)
    .maybeSingle()

  return NextResponse.json({ isFollowing: !!data })
}
