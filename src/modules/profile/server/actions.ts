'use server';
import { revalidatePath } from 'next/cache';
import { backendFetch } from '@/src/lib/api/server';
import { requireAuth } from '@/src/lib/auth';
import type { ActionResult } from '../types';

const json = (method: string, body?: unknown): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
const message = (error: unknown, fallback: string) => error instanceof Error && error.message ? error.message : fallback;

async function run<T>(call: () => Promise<T>, fallback: string): Promise<ActionResult & { data?: T }> {
  await requireAuth(['ADMIN', 'WORKER']);
  try {
    const data = await call();
    // El nombre y la foto aparecen en la barra lateral y en otras vistas.
    revalidatePath('/internal', 'layout');
    return { ok: true, data };
  } catch (error) { return { ok: false, error: message(error, fallback) }; }
}

export async function updateProfileAction(values: { name: string; phone: string; jobTitle: string }) {
  return run(() => backendFetch('/me', json('PATCH', values)), 'No se pudo guardar tu perfil. Revisa tu conexión e intenta de nuevo.');
}
export async function removeAvatarAction() {
  return run(() => backendFetch('/me/avatar', json('DELETE')), 'No se pudo quitar la foto. Intenta de nuevo.');
}
export async function changePasswordAction(values: { currentPassword: string; newPassword: string; revokeOtherSessions: boolean }) {
  return run(() => backendFetch<{ revokedSessions: number }>('/me/password', json('POST', values)), 'No se pudo cambiar la contraseña. Intenta de nuevo.');
}
export async function revokeSessionAction(id: string) {
  return run(() => backendFetch(`/me/sessions/${encodeURIComponent(id)}`, json('DELETE')), 'No se pudo cerrar esa sesión. Intenta de nuevo.');
}
export async function revokeOtherSessionsAction() {
  return run(() => backendFetch<{ revokedSessions: number }>('/me/sessions', json('DELETE')), 'No se pudieron cerrar las demás sesiones. Intenta de nuevo.');
}
export async function saveHourFormatAction(hourFormat: '12' | '24') {
  const result = await run(() => backendFetch('/settings/preferences', json('PUT', { hourFormat })), 'No se pudo guardar la preferencia.');
  if (result.ok) for (const path of ['/internal/tasks', '/internal/calendar']) revalidatePath(path);
  return result;
}
