import { useEffect, useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

export function EmailConfirm() {
  const { user, updatePassword } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'set_password' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [passwordSet, setPasswordSet] = useState(false);
  const confirmed = Boolean(user?.email_confirmed_at);
  // Converted guests verify their email first; Supabase only lets them choose
  // a password afterwards, so the link brings them here with ?set_password=1.
  const wantsPassword = router.query.set_password === '1' && !passwordSet;

  // Supabase picks the session up from the link's URL fragment asynchronously,
  // so the user may arrive a moment after mount. Each run cleans up its own
  // timer, which keeps a stale "not yet confirmed" check from overwriting success.
  useEffect(() => {
    if (!router.isReady) return;
    if (confirmed && wantsPassword) {
      setStatus('set_password');
      return;
    }
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
  }, [confirmed, wantsPassword, router]);

  const handleSetPassword = async (e: FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    setSaving(true);
    setPasswordError(null);
    const { error } = await updatePassword(password);
    setSaving(false);
    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSet(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-shield-canvas">
      <div className="max-w-md w-full bg-shield-panel rounded-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-shield-fg mb-4">Confirming Email...</h2>
            <p className="text-shield-muted">Please wait while we confirm your email address.</p>
          </>
        )}

        {status === 'set_password' && (
          <form onSubmit={handleSetPassword} className="text-left">
            <h2 className="text-2xl font-bold text-shield-fg mb-2 text-center">Email confirmed</h2>
            <p className="text-shield-muted mb-6 text-center">Choose a password so you can sign in on any device. Your conversation is saved.</p>
            {passwordError && (
              <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">{passwordError}</div>
            )}
            <label htmlFor="new-password" className="block text-sm font-medium text-shield-fg mb-2">Password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 mb-4 bg-shield-canvas border border-shield-edge rounded-lg text-shield-fg placeholder-shield-muted focus:outline-none focus:ring-2 focus:ring-shield-brand focus:border-transparent"
              placeholder="At least 6 characters"
            />
            <button
              type="submit"
              disabled={saving}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save password and continue'}
            </button>
          </form>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-shield-fg mb-4">Email Confirmed!</h2>
            <p className="text-shield-muted mb-6">{message}</p>
            <button
              onClick={() => router.push('/chat')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
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
