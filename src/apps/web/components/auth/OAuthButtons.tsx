import React, { useState } from 'react';
import { useAuth, OAuthProvider } from '../../contexts/AuthContext';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.4-.4-3.5z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
    <rect x="1" y="1" width="9" height="9" fill="#F25022" />
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
    <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
  </svg>
);

const PROVIDERS: { id: OAuthProvider; label: string; Icon: () => React.JSX.Element }[] = [
  { id: 'google', label: 'Google', Icon: GoogleIcon },
  { id: 'azure', label: 'Microsoft', Icon: MicrosoftIcon },
];

interface OAuthButtonsProps {
  onError: (message: string) => void;
}

export const OAuthButtons = ({ onError }: OAuthButtonsProps) => {
  const [pending, setPending] = useState<OAuthProvider | null>(null);
  const { signInWithProvider } = useAuth();

  const handleClick = async (provider: OAuthProvider) => {
    setPending(provider);
    const { error } = await signInWithProvider(provider);
    // On success the browser navigates away, so only reset on failure
    if (error) {
      console.error('OAuth error:', error);
      onError(error.message);
      setPending(null);
    }
  };

  return (
    <div>
      <div className="space-y-3">
        {PROVIDERS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleClick(id)}
            disabled={pending !== null}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-shield-edge bg-shield-canvas py-3 px-4 font-medium text-shield-fg hover:border-shield-brand focus:outline-none focus:ring-2 focus:ring-shield-brand disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon />
            {pending === id ? 'Redirecting...' : `Continue with ${label}`}
          </button>
        ))}
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-shield-edge" />
        <span className="text-sm text-shield-muted">or</span>
        <div className="h-px flex-1 bg-shield-edge" />
      </div>
    </div>
  );
};
