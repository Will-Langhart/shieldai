import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { OAuthButtons } from './OAuthButtons';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToSignUp?: () => void;
}

export const LoginForm= ({ onSuccess, onSwitchToSignUp }: LoginFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn(email, password);
    
    if (error) {
      console.error('Login error:', error);
      setError(error.message);
      setLoading(false);
    } else {
      onSuccess?.();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-shield-panel rounded-lg p-8">
        <h2 className="text-2xl font-bold text-shield-fg mb-6 text-center">Sign In</h2>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <OAuthButtons onError={setError} />

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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-shield-brand to-shield-brand-dim py-3 px-4 font-medium text-white shadow-shield-glow-sm hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-shield-brand focus:ring-offset-2 focus:ring-offset-shield-panel disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-shield-muted">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignUp}
              className="font-medium text-shield-brand hover:text-sky-300"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
