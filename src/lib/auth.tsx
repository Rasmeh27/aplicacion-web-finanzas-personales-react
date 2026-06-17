'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  apiRequest,
  clearStoredSession,
  getStoredSession,
  setStoredSession,
} from '@/lib/api';
import type { AuthResponse, AuthUser } from '@/types/api';

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput extends LoginInput {
  fullName: string;
  primaryCurrency: string;
  monthlyIncomeEstimate: number;
  monthlySavingTargetPct: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const session = getStoredSession();
    setUser(session?.user ?? null);
    setAccessToken(session?.accessToken ?? null);
    setLoading(false);
  }, []);

  const applyAuth = useCallback((auth: AuthResponse): boolean => {
    const session = setStoredSession(auth);
    if (!session) return false;

    setUser(session.user);
    setAccessToken(session.accessToken);
    return true;
  }, []);

  const login = useCallback(
    async (input: LoginInput) => {
      const auth = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: input,
        skipAuth: true,
      });
      applyAuth(auth);
    },
    [applyAuth],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const auth = await apiRequest<AuthResponse>('/auth/register', {
        method: 'POST',
        body: input,
        skipAuth: true,
      });
      return applyAuth(auth);
    },
    [applyAuth],
  );

  const logout = useCallback(async () => {
    const session = getStoredSession();
    if (session?.refreshToken) {
      await apiRequest('/auth/logout', {
        method: 'POST',
        body: { refreshToken: session.refreshToken },
      }).catch(() => undefined);
    }

    clearStoredSession();
    setUser(null);
    setAccessToken(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      loading,
      isAuthenticated: Boolean(accessToken && user),
      login,
      register,
      logout,
    }),
    [accessToken, loading, login, logout, register, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
