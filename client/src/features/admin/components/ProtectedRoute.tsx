import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/shared/context/AuthContext';
import type { UserRole } from '@/shared/types/auth.types';

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: ['users:write', 'users:read', 'roles:manage', 'sales:read', 'products:write', 'products:read', 'inventory:write', 'inventory:read', 'pos:discounts'],
  SELLER: ['users:read', 'products:read', 'sales:read', 'pos:discounts'],
  SUPPLY: ['inventory:read', 'inventory:write', 'products:read'],
  DELIVERY: ['sales:read', 'roles:manage', 'users:read'],
  CLIENT: [],
};

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  allowedPermissions?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles, allowedPermissions }: ProtectedRouteProps) => {
  const { isAuthenticated, user, isHydrating } = useAuth();
  const location = useLocation();

  // 1. Wait for session hydration from localStorage
  if (isHydrating) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-brand-primary border-t-brand-accent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-brand-text animate-pulse">Cargando...</span>
        </div>
      </div>
    );
  }

  // 2. Validate session presence
  if (!isAuthenticated) {
    // Redirect to login but store current location to safely bring user back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Validate specific authorization vector (RBAC)
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Valid user detected but lacking dynamic privileges for requested route
    return <Navigate to="/unauthorized" replace />;
  }

  // 4. Validate specific permission vector (PBAC)
  if (allowedPermissions && user) {
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    const hasAllPermissions = allowedPermissions.every((permission) =>
      userPermissions.includes(permission)
    );
    if (!hasAllPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // 5. Validation pipeline clear - render child resource
  return <>{children}</>;
};
