export const ROLES = {
  ADMIN: 'ADMIN',
  WORKER: 'WORKER',
  CLIENT: 'CLIENT',
} as const;

export type Role = keyof typeof ROLES;

// Base functions to be implemented later
export const hasPermission = (userRole: Role, requiredRole: Role) => {
  if (userRole === ROLES.ADMIN) return true;
  if (requiredRole === ROLES.CLIENT && userRole === ROLES.CLIENT) return true;
  if (requiredRole === ROLES.WORKER && userRole === ROLES.WORKER) return true;
  return false;
};
