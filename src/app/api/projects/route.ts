import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { PROJECT_CATEGORIES, PROJECT_STAGES } from '@/lib/enums'

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

  // ── Required fields ───────────────────────────────────────
  if (!title?.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 })
  }
  if (!slug?.trim()) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  // ── Slug format validation ────────────────────────────────
  if (!/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      { error: 'slug must be lowercase alphanumeric with hyphens only' },
      { status: 400 }
    )
  }

  // ── Enum validation ───────────────────────────────────────
  if (stage && !PROJECT_STAGES.includes(stage)) {
    return NextResponse.json(
      { error: `Invalid stage. Must be one of: ${PROJECT_STAGES.join(', ')}` },
      { status: 400 }
    )
  }

  // Category is optional — if an unrecognised value arrives, just store null
  const safeCategory = category && PROJECT_CATEGORIES.includes(category) ? category : null;

  // ── Auto-increment slug on collision ─────────────────────
  let finalSlug = slug.trim();
  let counter = 1;
  let success = false;
  let projectData = null;

  while (!success && counter < 50) {
    const { data, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title: title.trim(),
        slug: finalSlug,
        tagline: tagline?.trim() || null,
        description: description?.trim() || null,
        category: safeCategory,
        stage: stage || 'BUILDING',
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation — try with appended counter
        finalSlug = `${slug.trim()}-${counter}`;
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
    return NextResponse.json({ error: 'Could not generate a unique slug after 50 attempts' }, { status: 500 })
  }

  return NextResponse.json({ data: projectData }, { status: 201 })
}
