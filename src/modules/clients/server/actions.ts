'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch } from '@/src/lib/api/server';

const value = (formData: FormData, key: string) => String(formData.get(key) || '').trim();

export async function createClientAction(formData: FormData) {
  await backendFetch('/clients', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: value(formData, 'name'), businessName: value(formData, 'businessName') || null, email: value(formData, 'email') || null, phone: value(formData, 'phone') || null, whatsapp: value(formData, 'whatsapp') || null, documentNumber: value(formData, 'documentNumber') || null, confirmDuplicate: formData.get('confirmDuplicate') === 'on' }) });
  revalidatePath('/internal/clients');
}

export async function updateClientAction(id: string, formData: FormData) {
  await backendFetch(`/clients/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: value(formData, 'name'), businessName: value(formData, 'businessName') || null, email: value(formData, 'email') || null, phone: value(formData, 'phone') || null, whatsapp: value(formData, 'whatsapp') || null, documentNumber: value(formData, 'documentNumber') || null, confirmDuplicate: formData.get('confirmDuplicate') === 'on', responsibleWorkerId: value(formData, 'responsibleWorkerId') || null, status: value(formData, 'status') }) });
  revalidatePath('/internal/clients'); revalidatePath(`/internal/clients/${id}`);
}

export async function convertLeadToClientAction(leadId: string, data?: FormData) {
  await backendFetch(`/clients/from-lead/${leadId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data && value(data, 'projectName') ? { project: { name: value(data, 'projectName'), type: value(data, 'projectType') || 'SYSTEM' } } : {}) });
  revalidatePath('/internal/projects');
  revalidatePath('/internal/leads'); revalidatePath(`/internal/leads/${leadId}`); revalidatePath('/internal/clients');
}
