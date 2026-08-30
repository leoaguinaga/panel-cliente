import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { ROLES, Role } from "../modules/auth/server/permissions";
import { BackendApiError, backendFetch } from './api/server';

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: true,
        defaultValue: ROLES.CLIENT,
      },
      status: {
        type: "string",
        required: true,
        defaultValue: "ACTIVE",
      },
      clientId: {
        type: "string",
        required: false,
      },
    },
  },
});

export async function getSession() {
  try {
    return await backendFetch<{
      user: {
        id: string;
        role: string;
        status: string;
        name?: string;
        email?: string;
        image?: string | null;
      };
    }>('/auth/session');
  } catch (error) {
    if (error instanceof BackendApiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
}

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
