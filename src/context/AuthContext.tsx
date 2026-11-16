import React, { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth.service';
import { httpClient } from '../services/api/httpClient';
import type { SafeUser, UserRole, Permission } from '../types';
import { AuthContext } from './authContextDef';
import type { AuthContextType } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchCurrentUser = useCallback(async () => {
    const token = httpClient.getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await authService.getMe();
      if (res.success && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
        httpClient.setTokens(null, null);
      }
    } catch {
      setUser(null);
      httpClient.setTokens(null, null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    // Listen for session expiry from httpClient
    httpClient.onSessionExpired(() => {
      setUser(null);
    });
  }, [fetchCurrentUser]);

  const login = async (email: string, password: string): Promise<{ requiresMfa?: boolean; mfaToken?: string }> => {
    const res = await authService.login(email, password);
    if (res.data?.requiresMfa) {
      if (!res.data.mfaToken) {
        httpClient.setTokens(null, null);
        setUser(null);
        throw new Error('The server did not start the MFA challenge. Please try signing in again.');
      }
      return {
        requiresMfa: true,
        mfaToken: res.data.mfaToken,
      };
    }

    const data = res.data?.tokens || res.data;
    if (!res.success || !data?.accessToken || !data.refreshToken || !data.user) {
      httpClient.setTokens(null, null);
      setUser(null);
      throw new Error('The server returned an incomplete authentication response. Please try again.');
    }
    setUser(data.user);
    return { requiresMfa: false };
  };

  const verifyMfa = async (mfaToken: string, code: string): Promise<void> => {
    const res = await authService.verifyMfaLogin(mfaToken, code);
    if (!res.success || !res.data?.accessToken || !res.data.refreshToken || !res.data.user) {
      httpClient.setTokens(null, null);
      setUser(null);
      throw new Error('The server returned an incomplete authentication response. Please try again.');
    }
    setUser(res.data.user);
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authService.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    await fetchCurrentUser();
  };

  const hasRole = (...roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  const hasPermission = (...permissions: Permission[]): boolean => {
    if (!user) return false;
    const userPerms = new Set(user.permissions || []);
    return permissions.every((p) => userPerms.has(p));
  };

  const value: AuthContextType = {
    user,
    role: user?.role || null,
    isAuthenticated: Boolean(user),
    isLoading,
    permissions: user?.permissions || [],
    login,
    verifyMfa,
    logout,
    refreshUser,
    hasRole,
    hasPermission,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
