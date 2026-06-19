import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = createClient()

  const [
    { count: buildersCount },
    { count: entriesCount },
    { count: projectsCount },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('entries').select('*', { count: 'exact', head: true }),
    supabase.from('projects').select('*', { count: 'exact', head: true }).eq('is_public', true),
  ])

  return NextResponse.json({
    builders: buildersCount ?? 0,
    entries:  entriesCount  ?? 0,
    projects: projectsCount ?? 0,
  })
}
