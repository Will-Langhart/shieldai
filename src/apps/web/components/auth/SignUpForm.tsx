import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SignUpFormProps {
  onSwitchToLogin?: () => void;
}

export const SignUpForm= ({ onSwitchToLogin }: SignUpFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { signUp, isGuest } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Guests verify their email first and choose a password from the link.
    if (isGuest) {
      const { error } = await signUp(email, '');
      setLoading(false);
      if (error) {
        setError(/already/i.test(error.message)
          ? 'That email already has an account. Sign in instead (this guest conversation won\'t carry over).'
          : error.message);
      } else {
        setSuccess(true);
      }
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    const { error } = await signUp(email, password);
    
    if (error) {
      console.error('Signup error:', error);
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="bg-shield-panel rounded-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-shield-fg mb-4">Check your email</h2>
          <p className="text-shield-muted mb-6">
            {isGuest
              ? "We've sent you a confirmation link. Open it to verify your email and choose a password. Your conversation is saved to your new account."
              : "We've sent you a confirmation link. Please check your email and click the link to verify your account."}
          </p>
          <button
            onClick={onSwitchToLogin}
            className="font-medium text-shield-brand hover:text-sky-300"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-shield-panel rounded-lg p-8">
        <h2 className="text-2xl font-bold text-shield-fg mb-2 text-center">{isGuest ? 'Save your conversation' : 'Sign Up'}</h2>
        {isGuest && (
          <p className="mb-6 text-center text-sm text-shield-muted">Create a free account to keep chatting. Your conversation comes with you.</p>
        )}
        {!isGuest && <div className="mb-4" />}
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-shield-fg mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-shield-canvas border border-shield-edge rounded-lg text-shield-fg placeholder-shield-muted focus:outline-none focus:ring-2 focus:ring-shield-brand focus:border-transparent"
              placeholder="Enter your email"
            />
          </div>

          {!isGuest && (<>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-shield-fg mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-shield-canvas border border-shield-edge rounded-lg text-shield-fg placeholder-shield-muted focus:outline-none focus:ring-2 focus:ring-shield-brand focus:border-transparent"
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-shield-fg mb-2">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-shield-canvas border border-shield-edge rounded-lg text-shield-fg placeholder-shield-muted focus:outline-none focus:ring-2 focus:ring-shield-brand focus:border-transparent"
              placeholder="Confirm your password"
            />
          </div>
          </>)}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-shield-brand to-shield-brand-dim py-3 px-4 font-medium text-white shadow-shield-glow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-shield-brand focus:ring-offset-2 focus:ring-offset-shield-panel disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Creating Account...' : isGuest ? 'Create free account' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-shield-muted">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-medium text-shield-brand hover:text-sky-300"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
