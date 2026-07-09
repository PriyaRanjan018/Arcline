import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Basic in-memory rate limiting to prevent email enumeration spam
const ipRateLimit = new Map<string, { count: number, resetAt: number }>();

export async function POST(req: Request) {
  try {
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    const now = Date.now();
    const limit = ipRateLimit.get(ip);
    
    if (limit && now < limit.resetAt) {
      if (limit.count >= 10) {
        return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
      }
      limit.count++;
    } else {
      ipRateLimit.set(ip, { count: 1, resetAt: now + 60000 }); // 60s window
    }

    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const supabase = createClient();
    
    // Secure server-side lookup via RPC
    const { data: provider, error } = await supabase.rpc('get_user_provider_by_email', { check_email: email.toLowerCase().trim() });

    if (error) {
      console.error('RPC Error (provider lookup):', error);
      // Fallback if RPC doesn't exist yet, just assume it's a new or email user to not block auth entirely
      return NextResponse.json({ provider: 'email' }); 
    }

    return NextResponse.json({ provider });
  } catch (error) {
    console.error('Check email error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
