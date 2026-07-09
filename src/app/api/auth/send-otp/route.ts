import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
    }

    const supabase = createClient();
    
    // We do NOT use emailRedirectTo because we want the 6-digit OTP sent, not a magic link.
    // Ensure you have an email template configured for OTP in Supabase.
    const { error } = await supabase.auth.signInWithOtp({ 
      email: email.toLowerCase().trim()
    });

    if (error) {
      console.error('Send OTP Error:', error);
      // Don't leak details if rate limited, just return generic or the rate limit message
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const response = NextResponse.json({ success: true });
    
    // Securely pass the email to the verification page via httpOnly cookie
    // This avoids exposing the email in the URL query string
    response.cookies.set('auth_pending_email', email.toLowerCase().trim(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15 // 15 minutes
    });

    return response;
  } catch (error) {
    console.error('Send OTP internal error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
