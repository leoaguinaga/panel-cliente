'use server';
import { backendFetch } from '@/src/lib/api/server';
import { requireAuth } from '@/src/lib/auth';
import { ROLES } from '@/src/modules/auth/server/permissions';
import { revalidatePath } from 'next/cache';
const field = (data: FormData, name: string) => String(data.get(name) || '').trim();
export async function createWorkerAction(data: FormData) {
  await requireAuth([ROLES.ADMIN]);
  await backendFetch('/workers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: field(data, 'name'), email: field(data, 'email'), password: String(data.get('password') || ''), phone: field(data, 'phone'), role: field(data, 'role') || 'WORKER', status: 'ACTIVE' }) });
  revalidatePath('/internal/workers');
}
export async function updateWorkerAction(id: string, data: FormData) {
  await requireAuth([ROLES.ADMIN]);
  await backendFetch(`/workers/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: field(data, 'name'), phone: field(data, 'phone'), role: field(data, 'role'), status: field(data, 'status') }) });
  revalidatePath('/internal/workers');
}
