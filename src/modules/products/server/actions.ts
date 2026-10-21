'use server';

import { BackendApiError, backendFetch } from '@/src/lib/api/server';
import { requireAuth } from '@/src/lib/auth';
import { ROLES } from '@/src/modules/auth/server/permissions';
import { revalidatePath } from 'next/cache';

async function serviceRequest(path: string, init: RequestInit) {
  await requireAuth([ROLES.ADMIN]);
  try { await backendFetch(path, init); }
  catch (error) { if (error instanceof BackendApiError) return { ok: false as const, error: error.message }; throw error; }
  revalidatePath('/internal/settings');
  revalidatePath('/internal/services');
  return { ok: true as const };
}
export async function createServiceAction(formData: FormData) {
  const name = String(formData.get('name') || '').trim(), slug = String(formData.get('slug') || '').trim();
  if (!name || !slug) return { ok: false as const, error: 'Nombre e identificador son obligatorios' };
  return serviceRequest('/catalogs/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slug, type: String(formData.get('type') || 'CUSTOM_SOFTWARE'), description: String(formData.get('description') || '') }) });
}

export async function createSectorAction(serviceId: string, formData: FormData) {
  await requireAuth([ROLES.ADMIN]);
  const name = String(formData.get('name') || '').trim(); if (!name) throw new Error('Sector name is required');
  await backendFetch(`/catalogs/services/${serviceId}/sectors`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name}) });
  revalidatePath('/internal/services'); revalidatePath('/internal/settings');
}

/** Campos de identidad del espacio que comparten crear y editar. */
function productPayload(formData: FormData) {
  const text = (key: string) => String(formData.get(key) || '').trim() || undefined;
  return { name: text('name') || '', slug: text('slug') || '', description: text('description'), status: text('status') || 'ACTIVE', color: text('color'), logoUrl: text('logoUrl') };
}
type ActionResult = { ok: true } | { ok: false; error: string };
/** Las acciones de espacios devuelven el error del backend en vez de lanzarlo: el cliente lo muestra junto al formulario. */
async function productRequest(path: string, init: RequestInit): Promise<ActionResult> {
  await requireAuth([ROLES.ADMIN]);
  try { await backendFetch(path, init); }
  catch (error) { if (error instanceof BackendApiError) return { ok: false, error: error.message }; throw error; }
  revalidatePath('/internal/products');
  return { ok: true };
}
const json = (method: string, body: unknown): RequestInit => ({ method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export async function createProductAction(formData: FormData) {
  const body = productPayload(formData);
  if (!body.name || !body.slug) return { ok: false, error: 'Nombre e identificador son obligatorios' } as ActionResult;
  return productRequest('/catalogs/products', json('POST', body));
}
export async function updateProductAction(id: string, formData: FormData) {
  const body = productPayload(formData);
  if (!body.name || !body.slug) return { ok: false, error: 'Nombre e identificador son obligatorios' } as ActionResult;
  return productRequest(`/catalogs/products/${encodeURIComponent(id)}`, json('PATCH', body));
}
/** Archivar reemplaza a eliminar: el espacio sale del selector y conserva sus datos. */
export async function archiveProductAction(id: string) { return productRequest(`/catalogs/products/${encodeURIComponent(id)}/archive`, { method: 'POST' }); }
export async function restoreProductAction(id: string) { return productRequest(`/catalogs/products/${encodeURIComponent(id)}/restore`, { method: 'POST' }); }
export async function deleteServiceAction(id: string) { return serviceRequest(`/catalogs/services/${encodeURIComponent(id)}`, { method: 'DELETE' }); }
export async function deleteSectorAction(id: string) { await requireAuth([ROLES.ADMIN]); await backendFetch(`/catalogs/sectors/${id}`, { method: 'DELETE' }); revalidatePath('/internal/services'); revalidatePath('/internal/settings'); }
export async function updateSectorAction(id: string, formData: FormData) { await requireAuth([ROLES.ADMIN]); const name=String(formData.get('name')||'').trim(); const slug=String(formData.get('slug')||'').trim(); if(!name) throw new Error('Nombre de sector obligatorio'); await backendFetch(`/catalogs/sectors/${id}`, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,slug})}); revalidatePath('/internal/services'); revalidatePath('/internal/settings'); }
export async function updateServiceAction(id: string, formData: FormData) {
  const name = String(formData.get('name') || '').trim(), slug = String(formData.get('slug') || '').trim();
  if (!name || !slug) return { ok: false as const, error: 'Nombre e identificador son obligatorios' };
  return serviceRequest(`/catalogs/services/${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slug, type: String(formData.get('type') || 'CUSTOM_SOFTWARE'), description: String(formData.get('description') || ''), active: formData.get('active') !== 'false' }) });
}
