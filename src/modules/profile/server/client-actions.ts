'use server';
import { revalidatePath } from 'next/cache';
import { backendFetch } from '@/src/lib/api/server';
import { requireAuth } from '@/src/lib/auth';

export async function updateClientProfileAction(values: { name: string; phone: string }) {
  await requireAuth(['CLIENT']);
  try {
    await backendFetch('/me/client-profile', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: values.name.trim(), phone: values.phone.trim() }) });
    revalidatePath('/client', 'layout');
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'No se pudo guardar. Intenta de nuevo.' };
  }
}
