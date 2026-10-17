import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';
import { useWarmTheme } from '../hooks/useWarmTheme';

export function EmailConfirm() {
  const { user } = useAuth();
  const router = useRouter();
  const { themeAttr } = useWarmTheme();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const confirmed = Boolean(user?.email_confirmed_at);

  // Supabase picks the session up from the link's URL fragment asynchronously,
  // so the user may arrive a moment after mount. Each run cleans up its own
  // timer, which keeps a stale "not yet confirmed" check from overwriting success.
  useEffect(() => {
    if (confirmed) {
      setStatus('success');
      setMessage('Your email has been confirmed! Redirecting to chat...');
      const t = setTimeout(() => router.push('/chat'), 2000);
      return () => clearTimeout(t);
    }

    const t = setTimeout(() => {
      setStatus('error');
      setMessage('This confirmation link is invalid or has expired. Please sign in or sign up again.');
    }, 8000);
    return () => clearTimeout(t);
  }, [confirmed, router]);

  return (
    <div className="warm-theme min-h-screen flex items-center justify-center bg-shield-canvas" {...themeAttr}>
      <div className="max-w-md w-full bg-shield-surface border border-shield-edge/60 rounded-2xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-shield-brand/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-shield-brand border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-shield-fg mb-4">Confirming Email...</h2>
            <p className="text-shield-muted">Please wait while we confirm your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-shield-brand rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-shield-on-brand" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-shield-fg mb-4">Email Confirmed!</h2>
            <p className="text-shield-muted mb-6">{message}</p>
            <button
              onClick={() => router.push('/chat')}
              className="px-6 py-3 bg-shield-brand text-shield-on-brand rounded-lg hover:bg-shield-brand-dim transition-colors"
            >
              Go to Chat
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-shield-fg mb-4">Confirmation Failed</h2>
            <p className="text-shield-muted mb-6">{message}</p>
            <div className="space-y-2">
              <button
                onClick={() => router.push('/chat')}
                className="w-full px-6 py-3 bg-shield-brand text-shield-on-brand rounded-lg hover:bg-shield-brand-dim transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-6 py-3 border border-shield-edge bg-shield-surface text-shield-fg rounded-lg hover:bg-shield-elevated transition-colors"
              >
                Go Home
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default EmailConfirm;
