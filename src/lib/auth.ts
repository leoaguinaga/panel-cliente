import { cache } from 'react';
import { ROLES, Role } from '../modules/auth/server/permissions';
import { BackendApiError, backendFetch } from './api/server';
// cache() dedupes the call per request: layout + page share one backend hit.
export const getSession = cache(async () => {
  try {
    return await backendFetch<{
      user: {
        id: string;
        role: string;
        status: string;
        name?: string;
        email?: string;
        image?: string | null;
        jobTitle?: string | null;
        clientId?: string | null;
      };
    }>('/auth/session');
  } catch (error) {
    if (error instanceof BackendApiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
});

// Helper to validate role on the server
import { redirect } from "next/navigation";

export async function requireAuth(allowedRoles?: Role[]) {
  const session = await getSession();

  if (!session || !session.user) {
    redirect("/login");
  }

  const userRole = session.user.role;
  const userStatus = session.user.status;
  const validRoles = Object.values(ROLES);

  if (!validRoles.includes(userRole as Role) || userStatus !== "ACTIVE") {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(userRole as Role)) {
    if (userRole === ROLES.CLIENT) {
      redirect("/client/dashboard");
    }

    redirect("/internal/dashboard");
  }

  return session;
}
