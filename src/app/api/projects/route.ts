import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('user_id')

  let query = supabase
    .from('projects')
    .select('*, profiles(username, name, avatar_url)')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(20)

  if (userId) query = query.eq('user_id', userId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { title, slug, tagline, description, category, stage } = body

  if (!title || !slug) {
    return NextResponse.json({ error: 'title and slug are required' }, { status: 400 })
  }

  // Validate slug: lowercase alphanumeric + hyphens
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: 'slug must be lowercase alphanumeric with hyphens only' }, { status: 400 })
  }

  let finalSlug = slug;
  let counter = 1;
  let success = false;
  let projectData = null;

  while (!success && counter < 50) {
    const { data, error } = await supabase
      .from('projects')
      .insert({ user_id: user.id, title, slug: finalSlug, tagline, description, category, stage })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Unique violation, append counter and retry
        finalSlug = `${slug}-${counter}`;
        counter++;
      } else {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      success = true;
      projectData = data;
    }
  }

  if (!success) {
    return NextResponse.json({ error: 'Could not generate a unique slug' }, { status: 500 })
  }

  return NextResponse.json({ data: projectData }, { status: 201 })
}
