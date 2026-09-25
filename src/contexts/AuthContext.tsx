import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { authService } from '@/services/auth.service';
import type { Profile, Role } from '@/types';

const ANSWERS_KEY = 'admirer_questionnaire_answers';

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  role: Role | null;
  session: Session | null;
  isLoading: boolean;
  isInitialized: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const initializingRef = useRef(false);
  const profileLoadRef = useRef<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    if (profileLoadRef.current === userId) return;
    profileLoadRef.current = userId;
    try {
      const p = await authService.getProfile(userId);
      setProfile(p);
    } catch (err) {
      console.error('[Auth] Profile load error:', err);
      setProfile(null);
    } finally {
      profileLoadRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (initializingRef.current) return;
    initializingRef.current = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const s = data.session;
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await loadProfile(s.user.id);
        }
      } catch (err) {
        console.error('[Auth] Init error:', err);
      } finally {
        setIsInitialized(true);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, s) => {
      setSession(s);
      setUser(s?.user ?? null);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (s?.user) {
          await loadProfile(s.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
        profileLoadRef.current = null;
      } else if (event === 'USER_UPDATED' && s?.user) {
        await loadProfile(s.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await authService.signIn(email, password);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setIsLoading(true);
    try {
      await authService.signUp(email, password, displayName);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.signOut();
      setUser(null);
      setProfile(null);
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await authService.resetPassword(email);
  }, []);

  const updatePassword = useCallback(async (password: string) => {
    await authService.updatePassword(password);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      profileLoadRef.current = null;
      await loadProfile(user.id);
    }
  }, [user, loadProfile]);

  const role = (profile?.role as Role) ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        session,
        isLoading,
        isInitialized,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
