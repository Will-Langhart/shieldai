import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, Mail, LogOut, Key } from 'lucide-react';

interface UserProfileProps {
  onClose: () => void;
}

export const UserProfile= ({ onClose }: UserProfileProps) => {
  const { user, signOut, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
      <div className="bg-[#2C303A] rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#E0E0E0]">Profile Settings</h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#E0E0E0] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {message && (
          <div className={`mb-4 px-4 py-3 rounded-lg ${
            message.includes('Error') 
              ? 'bg-red-500/20 border border-red-500 text-red-200' 
              : 'bg-green-500/20 border border-green-500 text-green-200'
          }`}>
            {message}
          </div>
        )}

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center space-x-3 p-4 bg-[#1A1D24] rounded-lg">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-[#E0E0E0] font-medium">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-[#9CA3AF] text-sm">{user?.email}</p>
            </div>
          </div>

          {/* Account Details */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-[#1A1D24] rounded-lg">
              <Mail className="w-5 h-5 text-[#9CA3AF]" />
              <div>
                <p className="text-[#E0E0E0] text-sm font-medium">Email</p>
                <p className="text-[#9CA3AF] text-sm">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-[#1A1D24] rounded-lg">
              <Key className="w-5 h-5 text-[#9CA3AF]" />
              <div>
                <p className="text-[#E0E0E0] text-sm font-medium">Account Status</p>
                <p className="text-[#9CA3AF] text-sm">
                  {user?.email_confirmed_at ? 'Verified' : 'Pending Verification'}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-4 border-t border-[#3A404B]">
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#1A1D24] border border-[#3A404B] rounded-lg text-[#E0E0E0] hover:bg-[#3A404B] transition-colors disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              <span>Reset Password</span>
            </button>

            <button
              onClick={handleSignOut}
              disabled={loading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-600/20 border border-red-500 text-red-200 rounded-lg hover:bg-red-600/30 transition-colors disabled:opacity-50"
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
