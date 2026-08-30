'use server';

import { backendFetch } from '@/src/lib/api/server';
import { requireAuth } from '@/src/lib/auth';
import { ROLES } from '@/src/modules/auth/server/permissions';
import { revalidatePath } from 'next/cache';

export async function createServiceAction(formData: FormData) {
  await requireAuth([ROLES.ADMIN]);
  const name = String(formData.get('name') || '').trim(); const slug = String(formData.get('slug') || '').trim();
  if (!name || !slug) throw new Error('Service name and slug are required');
  await backendFetch('/catalogs/services', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slug, type: String(formData.get('type') || 'CUSTOM_SOFTWARE') }) });
  revalidatePath('/internal/services');
}

export async function createSectorAction(serviceId: string, formData: FormData) {
  await requireAuth([ROLES.ADMIN]);
  const name = String(formData.get('name') || '').trim(); if (!name) throw new Error('Sector name is required');
  await backendFetch(`/catalogs/services/${serviceId}/sectors`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name}) });
  revalidatePath('/internal/services');
}

export async function createProductAction(formData: FormData) {
  await requireAuth([ROLES.ADMIN]);
  const name = String(formData.get('name') || '').trim(); const slug = String(formData.get('slug') || '').trim();
  if (!name || !slug) throw new Error('Product name and slug are required');
  await backendFetch('/catalogs/products', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, slug, description: String(formData.get('description') || '') || undefined }) });
  revalidatePath('/internal/products');
}
export async function deleteProductAction(id: string) { await requireAuth([ROLES.ADMIN]); await backendFetch(`/catalogs/products/${id}`, { method: 'DELETE' }); revalidatePath('/internal/products'); }
export async function deleteServiceAction(id: string) { await requireAuth([ROLES.ADMIN]); await backendFetch(`/catalogs/services/${id}`, { method: 'DELETE' }); revalidatePath('/internal/services'); }
export async function deleteSectorAction(id: string) { await requireAuth([ROLES.ADMIN]); await backendFetch(`/catalogs/sectors/${id}`, { method: 'DELETE' }); revalidatePath('/internal/services'); }
export async function updateServiceAction(id: string, formData: FormData) { await requireAuth([ROLES.ADMIN]); const name=String(formData.get('name')||'').trim(); const slug=String(formData.get('slug')||'').trim(); if(!name||!slug) throw new Error('Service name and slug are required'); await backendFetch(`/catalogs/services/${id}`, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,slug,type:String(formData.get('type')||'CUSTOM_SOFTWARE'),description:String(formData.get('description')||'')||undefined,active:formData.get('active') !== 'false'})}); revalidatePath('/internal/services'); }
