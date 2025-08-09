import React, { useState } from 'react';
import { X, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/auth-context';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: 'signin' | 'signup';
}

export default function AuthModal({ isOpen, onClose, mode }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          // Provide more specific error messages
          if (error.message.includes('fetch')) {
            setError('Unable to connect to authentication service. Please check your internet connection and try again.');
          } else if (error.message.includes('Invalid API key')) {
            setError('Authentication service is not properly configured. Please contact support.');
          } else {
            setError(error.message);
          }
        } else {
          setSuccess('Check your email to confirm your account!');
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('fetch')) {
            setError('Unable to connect to authentication service. Please check your internet connection and try again.');
          } else if (error.message.includes('Invalid API key')) {
            setError('Authentication service is not properly configured. Please contact support.');
          } else {
            setError(error.message);
          }
        } else {
          onClose();
        }
      }
    } catch (err: any) {
      console.error('Authentication error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccess('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-shield-gray/95 backdrop-blur-sm border border-gray-700/50 rounded-2xl p-6 w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-shield-white">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-shield-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full pl-10 pr-4 py-3 bg-shield-light-gray/50 border border-gray-600/50 rounded-xl text-shield-white placeholder-gray-400 focus:outline-none focus:border-shield-blue/50 transition-colors"
                  required={isSignUp}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 bg-shield-light-gray/50 border border-gray-600/50 rounded-xl text-shield-white placeholder-gray-400 focus:outline-none focus:border-shield-blue/50 transition-colors"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Password</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-12 py-3 bg-shield-light-gray/50 border border-gray-600/50 rounded-xl text-shield-white placeholder-gray-400 focus:outline-none focus:border-shield-blue/50 transition-colors"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-shield-white transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 text-xs text-gray-400">
                  Debug: Check your Supabase configuration in .env.local
                </div>
              )}
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/20 border border-green-500/30 rounded-lg text-green-300 text-sm">
              {success}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-shield-blue text-shield-white rounded-xl font-medium hover:bg-shield-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={toggleMode}
              className="text-shield-blue hover:underline transition-colors"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
} 