import { createContext } from 'react';
import type { SafeUser, UserRole, Permission } from '../types';

export interface AuthContextType {
  user: SafeUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  permissions: Permission[];
  login: (email: string, password: string) => Promise<{ requiresMfa?: boolean; mfaToken?: string }>;
  verifyMfa: (mfaToken: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  hasPermission: (...permissions: Permission[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
