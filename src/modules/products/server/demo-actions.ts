'use server';
import { BackendApiError, backendFetch } from '@/src/lib/api/server';
import { requireAuth } from '@/src/lib/auth';
import { revalidatePath } from 'next/cache';
import { demoStatuses } from '../demo-types';

export async function saveDemoAction(productId: string, demoId: string | null, form: FormData) {
  await requireAuth(['ADMIN', 'WORKER']);
  const text = (key: string) => String(form.get(key) || '').trim();
  const status = text('status');
  if (!Object.hasOwn(demoStatuses, status)) return { ok: false as const, error: 'Selecciona un estado válido' };
  const data: Record<string, string | null | undefined> = { companyName: text('companyName'), status };
  if (!data.companyName) return { ok: false as const, error: 'Empresa obligatoria' };
  for (const key of ['contactName', 'contactEmail', 'contactPhone', 'notes']) data[key] = text(key) || undefined;
  for (const key of ['assignedToId', 'leadId', 'clientId']) data[key] = text(key) || null;
  // Date inputs represent calendar days. Use noon in Lima to avoid a date shift in the UI.
  for (const key of ['demoDate', 'nextActionAt']) data[key] = text(key) ? `${text(key)}T12:00:00-05:00` : null;
  try { await backendFetch(`/catalogs/products/${encodeURIComponent(productId)}/demos${demoId ? `/${encodeURIComponent(demoId)}` : ''}`, {
    method: demoId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
  });
  } catch (error) {
    if (error instanceof BackendApiError) return { ok: false as const, error: error.message };
    throw error;
  }
  revalidatePath(`/internal/products/${productId}/demos`);
  revalidatePath('/internal/products');
  return { ok: true as const };
}
