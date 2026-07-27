// Data returned from the JWT payload
export interface JwtPayload {
  sub: string;  // user id (as string)
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  branchId?: number;
}

// Roles defined by the backend RBAC system
export type UserRole = 'CLIENT' | 'ADMIN' | 'SELLER' | 'SUPPLY' | 'DELIVERY';

// Hydrated user object stored in AuthContext
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  avatarUrl?: string;
  authProvider?: 'local' | 'google';
  branchId?: number;
}

// Token pair returned on successful login
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Shape exposed by AuthContext
export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
}

// Helper to determine the default landing route based on user role
export const getDefaultRouteForRole = (role?: UserRole | string): string => {
  switch (role) {
    case 'ADMIN': return '/admin/inventory/stock';
    case 'SELLER': return '/pos';
    case 'SUPPLY': return '/admin/inventory/stock';
    case 'DELIVERY': return '/admin/orders';
    default: return '/';
  }
};
