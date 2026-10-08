import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient, User, Session } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔧 Supabase config - URL:', supabaseUrl ? 'SET' : 'NOT SET');
console.log('🔧 Supabase config - Key:', supabaseAnonKey ? 'SET' : 'NOT SET');

// Create a mock client if environment variables are missing
const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

console.log('🔧 Supabase client:', supabase ? 'CREATED' : 'NULL (using mock)');

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Signed in anonymously to try chat without an account. */
  isGuest: boolean;
  /** Start an anonymous session so a visitor can chat before signing up. */
  startGuestSession: () => Promise<Session | null>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (password: string) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      // Set a mock user for development when Supabase is not configured
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440001',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString()
      } as User;
      console.log('🔧 Using mock user for development:', mockUser);
      setUser(mockUser);
      setLoading(false);
      
      // Set test token for API calls
      localStorage.setItem('auth_token', 'test-token');
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const isGuest = Boolean(user?.is_anonymous);

  const startGuestSession = async () => {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error('Guest sign-in failed:', error);
      return null;
    }
    return data.session;
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    // A guest converts in place so their conversations stay with them. Supabase
    // only allows a password once the email is verified, so the confirmation
    // link lands on a page that asks for one (password here is unused).
    if (user?.is_anonymous) {
      const { error } = await supabase.auth.updateUser(
        { email },
        { emailRedirectTo: `${window.location.origin}/email-confirm?set_password=1` }
      );
      return { error };
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/email-confirm`
      }
    });
    return { error };
  };

  const signOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/email-confirm`
    });
    return { error };
  };

  const updatePassword = async (password: string) => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') };
    }
    const { error } = await supabase.auth.updateUser({ password });
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    isGuest,
    startGuestSession,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};