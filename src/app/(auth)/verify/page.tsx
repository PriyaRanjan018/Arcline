import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import VerifyForm from './VerifyForm';
import PageTransition from '@/components/shared/PageTransition';

export default function VerifyPage({ searchParams }: { searchParams: { next?: string } }) {
  // Read the email securely from the server-side HttpOnly cookie
  const cookieStore = cookies();
  const pendingEmail = cookieStore.get('auth_pending_email')?.value;

  if (!pendingEmail) {
    // If no email is in the session, redirect back to login
    redirect('/login');
  }

  return (
    <PageTransition className="flex h-screen items-center justify-center bg-[#080808] p-4">
      <VerifyForm email={pendingEmail} next={searchParams.next || '/dashboard'} />
    </PageTransition>
  );
}
