import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { AuthContextType, AuthUser, AuthTokens } from '../types/auth.types';
import { setupAxiosInterceptors } from '../api/axiosInstance';

const STORAGE_ACCESS_KEY = 'auth_access_token';
const STORAGE_REFRESH_KEY = 'auth_refresh_token';

// --------------------------------------------------------------------------
// Context creation
// --------------------------------------------------------------------------
const AuthContext = createContext<AuthContextType | null>(null);

// --------------------------------------------------------------------------
// Provider
// --------------------------------------------------------------------------
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  // On mount: hydrate session from localStorage if a valid token exists
  useEffect(() => {
    const storedToken = localStorage.getItem(STORAGE_ACCESS_KEY);
    if (storedToken) {
      try {
        const decoded = jwtDecode<any>(storedToken);
        // Check token expiry (exp is in seconds)
        if (decoded.exp * 1000 > Date.now()) {
          setUser({
            id: String(decoded.sub ?? decoded.userId ?? ''),
            email: decoded.email,
            role: decoded.role,
            branchId: decoded.branchId,
          });
        } else {
          // Token expired — clean up storage
          localStorage.removeItem(STORAGE_ACCESS_KEY);
          localStorage.removeItem(STORAGE_REFRESH_KEY);
        }
      } catch {
        // Malformed token — clean up
        localStorage.removeItem(STORAGE_ACCESS_KEY);
        localStorage.removeItem(STORAGE_REFRESH_KEY);
      }
    }
    setIsHydrating(false);
  }, []);

  // Save tokens, decode payload and update user state
  const login = (tokens: AuthTokens) => {
    localStorage.setItem(STORAGE_ACCESS_KEY, tokens.accessToken);
    localStorage.setItem(STORAGE_REFRESH_KEY, tokens.refreshToken);

    const decoded = jwtDecode<any>(tokens.accessToken);
    setUser({
      id: String(decoded.sub ?? decoded.userId ?? ''),
      email: decoded.email,
      role: decoded.role,
      branchId: decoded.branchId,
    });
  };

  // Clear everything and reset state
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_ACCESS_KEY);
    localStorage.removeItem(STORAGE_REFRESH_KEY);
    setUser(null);
  }, []);

  // RSK-001 / T-044: Wire Axios interceptors once so the logout callback is stable
  useEffect(() => {
    setupAxiosInterceptors(logout);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: user !== null, isHydrating, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// --------------------------------------------------------------------------
// Custom hook — must be used inside <AuthProvider>
// --------------------------------------------------------------------------
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
};
