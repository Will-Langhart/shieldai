import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, LogOut, Key, Church } from 'lucide-react';

type Denomination = 'Protestant' | 'Catholic' | 'Oriental Orthodox' | 'Eastern Orthodox';

const DENOMINATIONS: Denomination[] = [
  'Protestant',
  'Catholic',
  'Oriental Orthodox',
  'Eastern Orthodox',
];

interface UserProfileProps {
  onClose: () => void;
}

export const UserProfile= ({ onClose }: UserProfileProps) => {
  const { user, session, signOut, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [denomination, setDenomination] = useState<Denomination | ''>('');
  const [denominationSaving, setDenominationSaving] = useState(false);

  useEffect(() => {
    const authToken = session?.access_token;
    if (!authToken) return;

    fetch('/api/user/preferences', {
      headers: { Authorization: `Bearer ${authToken}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data?.preferences?.denomination) {
          setDenomination(data.preferences.denomination as Denomination);
        }
      })
      .catch(() => {});
  }, [session]);

  const handleSaveDenomination = async (value: Denomination | '') => {
    setDenomination(value);
    setDenominationSaving(true);

    const authToken = session?.access_token;
    if (!authToken) {
      setMessage('Error: Could not authenticate request');
      setDenominationSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ denomination: value || null }),
      });

      if (res.ok) {
        setMessage('Denomination saved successfully.');
      } else {
        setMessage('Error: Failed to save denomination');
      }
    } catch {
      setMessage('Error: Failed to save denomination');
    }

    setDenominationSaving(false);
  };

  const handleSignOut = async () => {
    setLoading(true);
    await signOut();
    setLoading(false);
    onClose();
  };

  const handleResetPassword = async () => {
    if (!user?.email) return;
    
    setLoading(true);
    const { error } = await resetPassword(user.email);
    
    if (error) {
      setMessage(`Error: ${error.message}`);
    } else {
      setMessage('Password reset email sent! Check your inbox.');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-shield-panel rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-shield-fg">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-shield-muted hover:text-shield-fg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-500/10 border border-red-500/40 text-shield-fg' 
              : 'bg-green-500/10 border border-green-500/40 text-shield-fg'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3 p-4 bg-shield-canvas rounded-lg">
            <div className="w-12 h-12 bg-shield-brand rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-shield-on-brand" />
            </div>
            <div>
              <p className="text-shield-fg font-medium">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-shield-muted text-sm">{user?.email}</p>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-shield-canvas rounded-lg">
              <Mail className="w-5 h-5 text-shield-muted" />
              <div>
                <p className="text-shield-fg text-sm font-medium">Email</p>
                <p className="text-shield-muted text-sm">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-shield-canvas rounded-lg">
              <Key className="w-5 h-5 text-shield-muted" />
              <div>
                <p className="text-shield-fg text-sm font-medium">Account Status</p>
                <p className="text-shield-muted text-sm">
                  {user?.email_confirmed_at ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
            </div>
          </div>

          {/* Denomination */}
          <div className="p-4 bg-shield-canvas rounded-lg space-y-2">
            <div className="flex items-center space-x-2">
              <Church className="w-5 h-5 text-shield-muted" />
              <p className="text-shield-fg text-sm font-medium">Christian Denomination</p>
            </div>
            <p className="text-shield-muted text-xs">
              Select your denomination so Shield AI can tailor responses to your tradition's theology and perspective.
            </p>
            <select
              value={denomination}
              onChange={e => handleSaveDenomination(e.target.value as Denomination | '')}
              disabled={denominationSaving}
              className="w-full mt-1 px-3 py-2 bg-shield-panel border border-shield-edge rounded-lg text-shield-fg text-sm focus:outline-none focus:ring-2 focus:ring-shield-brand/50 disabled:opacity-50"
            >
              <option value="">No preference</option>
              {DENOMINATIONS.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t border-shield-edge">
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-shield-canvas border border-shield-edge rounded-lg text-shield-fg hover:bg-shield-elevated transition-colors disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              <span>Reset Password</span>
            </button>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-500/10 border border-red-500/40 text-red-500 rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{loading ? 'Signing Out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
