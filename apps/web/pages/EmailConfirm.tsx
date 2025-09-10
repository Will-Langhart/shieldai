import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/router';

export function EmailConfirm() {
  const { user } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Check if user is already confirmed
        if (user?.email_confirmed_at) {
          setStatus('success');
          setMessage('Your email has been confirmed! Redirecting to chat...');
          setTimeout(() => {
            navigate('/chat');
          }, 2000);
          return;
        }

        // If not confirmed, wait a moment and check again
        setTimeout(() => {
          if (user?.email_confirmed_at) {
            setStatus('success');
            setMessage('Your email has been confirmed! Redirecting to chat...');
            setTimeout(() => {
              navigate('/chat');
            }, 2000);
          } else {
            setStatus('error');
            setMessage('Email confirmation failed. Please try signing up again.');
          }
        }, 3000);
      } catch (error) {
        console.error('Email confirmation error:', error);
        setStatus('error');
        setMessage('An error occurred during email confirmation.');
      }
    };

    handleEmailConfirmation();
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1D24]">
      <div className="max-w-md w-full bg-[#2C303A] rounded-lg p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-2xl font-bold text-[#E0E0E0] mb-4">Confirming Email...</h2>
            <p className="text-[#9CA3AF]">Please wait while we confirm your email address.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-[#E0E0E0] mb-4">Email Confirmed!</h2>
            <p className="text-[#9CA3AF] mb-6">{message}</p>
            <button
              onClick={() => navigate('/chat')}
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
            <h2 className="text-2xl font-bold text-[#E0E0E0] mb-4">Confirmation Failed</h2>
            <p className="text-[#9CA3AF] mb-6">{message}</p>
            <div className="space-y-2">
              <button
                onClick={() => navigate('/chat')}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => navigate('/')}
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
