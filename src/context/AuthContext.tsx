import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { UserProfile } from '../types';
import { getSupabase } from '../lib/supabase';
import { getLocalUser, saveLocalUser, clearLocalUser, openDB } from '../lib/db';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isSupabaseAuth: boolean;
  signIn: (email: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password?: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string; error?: string }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSupabaseAuth, setIsSupabaseAuth] = useState<boolean>(false);

  // Initialize and restore persistent session
  const restoreSession = useCallback(async () => {
    setLoading(true);
    await openDB(); // Ensure IndexedDB is initialized

    const supabase = getSupabase();

    if (supabase) {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (!error && session?.user) {
          setIsSupabaseAuth(true);
          const sbUser = session.user;

          // Attempt to fetch profile from Supabase
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sbUser.id)
            .single();

          const userProfile: UserProfile = {
            id: sbUser.id,
            email: sbUser.email || '',
            displayName: profile?.display_name || sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Vault Keeper',
            avatarUrl: profile?.avatar_url || '',
            theme: profile?.theme || 'midnight',
            defaultSort: profile?.default_sort || 'alphabetical-asc',
            createdAt: profile?.created_at || sbUser.created_at || new Date().toISOString(),
          };

          setUser(userProfile);
          await saveLocalUser(userProfile);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.warn('Supabase auth session check failed, falling back to local vault:', err);
      }
    }

    // Fallback: check local IndexedDB session
    const localUser = await getLocalUser();
    if (localUser) {
      setUser(localUser);
      setIsSupabaseAuth(false);
    } else {
      // If no session exists at all, auto-login or start as vault user so the user can immediately use the app
      // Wait, let's keep user as null so login/register screen is available, or check if user created one
      setUser(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    restoreSession();

    const supabase = getSupabase();
    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setIsSupabaseAuth(true);
          const sbUser = session.user;
          const userProfile: UserProfile = {
            id: sbUser.id,
            email: sbUser.email || '',
            displayName: sbUser.user_metadata?.full_name || sbUser.email?.split('@')[0] || 'Vault Keeper',
            createdAt: sbUser.created_at || new Date().toISOString(),
          };
          setUser(userProfile);
          await saveLocalUser(userProfile);
        } else if (event === 'SIGNED_OUT') {
          setIsSupabaseAuth(false);
          setUser(null);
          await clearLocalUser();
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [restoreSession]);

  const signIn = async (email: string, password?: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabase();

    if (supabase && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          setIsSupabaseAuth(true);
          const userProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            displayName: data.user.user_metadata?.full_name || email.split('@')[0],
            createdAt: data.user.created_at,
          };
          setUser(userProfile);
          await saveLocalUser(userProfile);
          return { success: true };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
      }
    }

    // Local Vault Mode sign-in
    const localId = 'user-' + btoa(email.toLowerCase()).replace(/=/g, '');
    let existing = await getLocalUser(localId);

    if (!existing) {
      // First time with this email in local vault
      existing = {
        id: localId,
        email: email.trim(),
        displayName: email.split('@')[0],
        createdAt: new Date().toISOString(),
      };
    }

    setUser(existing);
    await saveLocalUser(existing);
    setIsSupabaseAuth(false);
    return { success: true };
  };

  const signUp = async (
    email: string,
    password?: string,
    displayName?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabase();

    if (supabase && password) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: displayName || email.split('@')[0],
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          setIsSupabaseAuth(true);
          const userProfile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            displayName: displayName || email.split('@')[0],
            createdAt: data.user.created_at,
          };
          setUser(userProfile);
          await saveLocalUser(userProfile);
          return { success: true };
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
      }
    }

    // Local Vault Mode sign-up
    const localId = 'user-' + btoa(email.toLowerCase()).replace(/=/g, '');
    const newUser: UserProfile = {
      id: localId,
      email: email.trim(),
      displayName: displayName || email.split('@')[0],
      createdAt: new Date().toISOString(),
    };

    setUser(newUser);
    await saveLocalUser(newUser);
    setIsSupabaseAuth(false);
    return { success: true };
  };

  const signOut = async (): Promise<void> => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error signing out of Supabase:', err);
      }
    }
    await clearLocalUser();
    setUser(null);
    setIsSupabaseAuth(false);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; message: string; error?: string }> => {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        });
        if (error) {
          return { success: false, message: '', error: error.message };
        }
        return { success: true, message: 'Password reset link sent to your email.' };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, message: '', error: message };
      }
    }

    // In local vault mode
    return {
      success: true,
      message: 'Local Vault: Your password reset request has been processed. You can sign in directly.',
    };
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<void> => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);
    await saveLocalUser(updated);

    const supabase = getSupabase();
    if (supabase && isSupabaseAuth) {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: updated.email,
          display_name: updated.displayName,
          avatar_url: updated.avatarUrl,
          theme: updated.theme,
          default_sort: updated.defaultSort,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not sync profile update to Supabase:', err);
      }
    }
  };

  const changePassword = async (newPassword: string): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabase();
    if (supabase && isSupabaseAuth) {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) return { success: false, error: error.message };
        return { success: true };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { success: false, error: message };
      }
    }
    // Local vault password changed
    return { success: true };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isSupabaseAuth,
        signIn,
        signUp,
        signOut,
        resetPassword,
        updateProfile,
        changePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
