import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { AuthProvider } from '../lib/auth-context';
import { useEffect } from 'react';

export default function App({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Handle service worker registration
    if ('serviceWorker' in navigator) {
      if (process.env.NODE_ENV === 'production') {
        // Register service worker for PWA features (only in production)
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
              console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
              console.log('SW registration failed: ', registrationError);
            });
        });
      } else {
        // Unregister service worker in development to avoid conflicts
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (let registration of registrations) {
            registration.unregister();
          }
        });
      }
    }

    // Request notification permission
    if ('Notification' in window) {
      Notification.requestPermission();
    }
  }, []);

  return (
    <AuthProvider>
      <Component {...pageProps} />
    </AuthProvider>
  );
} 