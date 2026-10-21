'use server';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { requireAuth } from '@/src/lib/auth';
import { ROLES } from '@/src/modules/auth/server/permissions';
import { WORKSPACE_COOKIE, isWorkspaceValue } from './workspace';

/** Cambia el espacio activo; el backend valida que el producto exista y no esté archivado. */
export async function setWorkspaceAction(value: string) {
  await requireAuth([ROLES.ADMIN, ROLES.WORKER]);
  if (!isWorkspaceValue(value)) return { ok: false as const, error: 'Espacio inválido' };
  (await cookies()).set(WORKSPACE_COOKIE, value, { path: '/', httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365 });
  revalidatePath('/internal', 'layout');
  return { ok: true as const };
}
