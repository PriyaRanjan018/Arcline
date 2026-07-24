import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, captchaToken } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    if (!captchaToken || typeof captchaToken !== 'string') {
      return NextResponse.json({ error: 'CAPTCHA token is required.' }, { status: 400 });
    }

    // ── Server-side Turnstile token verification ─────────────────────────────
    // We verify the token with Cloudflare before even calling Supabase.
    // This stops bots at the door before any Supabase rate limits are consumed.
    const cfRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret:   process.env.TURNSTILE_SECRET_KEY!,
        response: captchaToken,
      }),
    });
    const cfData = await cfRes.json();

    if (!cfData.success) {
      console.warn('Turnstile verification failed:', cfData['error-codes']);
      return NextResponse.json({ error: 'CAPTCHA verification failed. Please try again.' }, { status: 400 });
    }
    // ─────────────────────────────────────────────────────────────────────────

    const supabase = createClient();

    // Pass captchaToken to Supabase so it can do its own server-side CAPTCHA
    // check (configured in Supabase Dashboard → Auth → Attack Protection).
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        captchaToken,
      },
    });

    if (error) {
      console.error('Send OTP Error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });

    // Pass email securely to the verify page via httpOnly cookie
    // (avoids exposing it in the URL query string)
    response.cookies.set('auth_pending_email', email.toLowerCase().trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15, // 15 minutes
    });

    return response;
  } catch (error) {
    console.error('Send OTP internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
