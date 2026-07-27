/**
 * Domain Entity: AuthContext
 * Represents the authenticated security principal throughout the system.
 * Defined in the domain to ensure consistency across all layers.
 */
export interface AuthContext {
  userId: number;
  email: string;
  role: string;
  branchId?: number;
}
