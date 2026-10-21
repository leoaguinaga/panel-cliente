'use server';
import { backendFetch } from '@/src/lib/api/server';
import { requireAuth } from '@/src/lib/auth';
import { revalidatePath } from 'next/cache';

export async function saveSettingsAction(values: Record<string, string>): Promise<{ error?: string }> {
  await requireAuth(['ADMIN']);
  try {
    await backendFetch('/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(values) });
    for (const path of ['/internal/settings', '/internal/tasks', '/internal/calendar', '/client/payments', '/client/help']) revalidatePath(path);
    return {};
  } catch (e) { return { error: e instanceof Error ? e.message : 'No se pudo guardar la configuración. Inténtalo nuevamente.' }; }
}
