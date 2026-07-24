import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Resend-specific rate limit: max 3 resends per email per 10 minutes
const resendLimits = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const key = email.toLowerCase().trim();
    const now = Date.now();
    const limit = resendLimits.get(key);

    if (limit && now < limit.resetAt) {
      if (limit.count >= 3) {
        return NextResponse.json({ error: 'Too many resend requests. Please wait before trying again.' }, { status: 429 });
      }
      limit.count++;
    } else {
      resendLimits.set(key, { count: 1, resetAt: now + 10 * 60 * 1000 }); // 10-minute window
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({ email: key });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
