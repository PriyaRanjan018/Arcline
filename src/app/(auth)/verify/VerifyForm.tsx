'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ArclineLogo from '@/components/shared/ArclineLogo';

export default function VerifyForm({ email, next }: { email: string; next: string }) {
  const router = useRouter();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Handle countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^[0-9]*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto move to next box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Move to previous box if current is empty
        inputRefs.current[index - 1]?.focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newOtp = [...otp];
    let focusedIndex = 5; // Default to last if full

    pastedData.forEach((char, index) => {
      if (/^[0-9]$/.test(char) && index < 6) {
        newOtp[index] = char;
        focusedIndex = index;
      }
    });

    setOtp(newOtp);
    if (focusedIndex < 5) {
      inputRefs.current[focusedIndex + 1]?.focus();
    } else {
      inputRefs.current[5]?.focus();
      inputRefs.current[5]?.blur();
    }
  };

  const handleVerify = async () => {
    const token = otp.join('');
    if (token.length < 6) {
      setStatus('error');
      setErrorMessage('Please enter all 6 digits.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data.session) {
        setStatus('success');
        
        // Wait a brief moment to show success state
        setTimeout(async () => {
          // Check profile existence for new vs existing user routing
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, username')
            .eq('id', data.session.user.id)
            .single();

          if (!profile || !profile.username) {
            router.push('/onboarding');
          } else {
            router.push(next);
          }
        }, 800);
      } else {
        throw new Error('Authentication failed. No session created.');
      }
    } catch (err: any) {
      console.error('Verify error:', err);
      setStatus('error');
      
      const msg = err.message.toLowerCase();
      if (msg.includes('expired')) {
        setErrorMessage('This code has expired. Please request a new one.');
      } else if (msg.includes('invalid') || msg.includes('token')) {
        setErrorMessage('Invalid code. Please check and try again.');
      } else if (msg.includes('network') || msg.includes('fetch')) {
        setErrorMessage('Network error. Please check your connection.');
      } else {
        setErrorMessage(err.message || 'Verification failed.');
      }
      
      // Clear OTP on error for easy re-entry
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    
    setErrorMessage('');
    setOtp(['', '', '', '', '', '']);
    
    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to resend');
      
      setCountdown(60);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setStatus('error');
      setErrorMessage(err.message || 'Failed to resend code.');
    }
  };

  // Auto-submit when fully typed
  useEffect(() => {
    if (otp.every(digit => digit !== '') && status !== 'loading' && status !== 'success') {
      handleVerify();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <div className="w-full max-w-[400px] flex flex-col items-center bg-[#111111] border border-[#222222] p-[48px] shadow-2xl relative">
      <div className="absolute top-6 left-6">
        <ArclineLogo size="sm" />
      </div>

      <div className="mt-8 flex flex-col items-center w-full">
        <h2 className="font-display font-bold text-[1.6rem] text-[#F2EDE4] mb-2">Check your email</h2>
        <p className="font-body font-light text-[0.85rem] text-[#888888] mb-8 text-center px-4">
          We sent a 6-digit verification code to <br/>
          <span className="font-medium text-[#F2EDE4]">{email}</span>
        </p>

        <div className="flex justify-between w-full mb-8" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={el => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={status === 'loading' || status === 'success'}
              className="w-[45px] h-[55px] bg-[#080808] border border-[#333333] text-[#F2EDE4] text-xl text-center font-mono focus:outline-none focus:border-[#E8572A] transition-colors disabled:opacity-50"
            />
          ))}
        </div>

        {status === 'error' && (
          <div className="w-full mb-6 p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[0.8rem] text-center font-body">
            {errorMessage}
          </div>
        )}

        {status === 'success' && (
          <div className="w-full mb-6 p-3 bg-green-500/10 border border-green-500/30 text-green-500 text-[0.8rem] text-center font-body flex items-center justify-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
            Verified successfully! Redirecting...
          </div>
        )}

        <button
          onClick={handleVerify}
          disabled={status === 'loading' || status === 'success' || otp.some(d => d === '')}
          className="w-full h-[44px] bg-[#E8572A] flex items-center justify-center font-body font-medium text-[0.85rem] text-white hover:bg-[#D14820] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-6"
        >
          {status === 'loading' ? 'Verifying...' : 'Verify code →'}
        </button>

        <div className="text-center font-body text-sm text-[#888888]">
          Didn't receive the code?{' '}
          {countdown > 0 ? (
            <span className="text-[#555555]">Resend in {countdown}s</span>
          ) : (
            <button 
              onClick={handleResend}
              className="text-[#E8572A] hover:underline focus:outline-none"
            >
              Resend now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
