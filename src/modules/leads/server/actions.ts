'use server';

import { revalidatePath } from 'next/cache';
import type { Lead } from '@/src/lib/api/contracts';
import { backendFetch } from '@/src/lib/api/server';

const payload = (formData: FormData) => ({
  name: String(formData.get('name') || '').trim(),
  email: String(formData.get('email') || '').trim() || null,
  phone: String(formData.get('phone') || '').trim() || null,
  companyName: String(formData.get('companyName') || '').trim() || null,
  type: String(formData.get('type') || 'GENERAL'),
  status: String(formData.get('status') || 'MAPPED'),
  priority: String(formData.get('priority') || 'MEDIUM'),
  zone: String(formData.get('zone') || '').trim() || null,
  previewUrl: String(formData.get('previewUrl') || '').trim() || null,
  message: String(formData.get('message') || '').trim() || null,
  assignedToId: String(formData.get('assignedToId') || '').trim() || null,
  // Solo si el formulario trae el campo: vacío = FoxCode; ausente = no tocar el espacio.
  ...(formData.has('productId') ? { productId: String(formData.get('productId') || '').trim() || null } : {}),
});

const refresh = (id?: string) => {
  revalidatePath('/internal/leads');
  revalidatePath('/internal/projects');
  revalidatePath('/internal/clients');
  revalidatePath('/internal/dashboard');
  if (id) revalidatePath(`/internal/leads/${id}`);
};

export async function createLeadAction(formData: FormData) {
  const res = await backendFetch<Lead>('/leads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload(formData)),
  });
  refresh();
  return res;
}

export async function updateLeadAction(id: string, formData: FormData) {
  const res = await backendFetch<Lead>(`/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload(formData)),
  });
  refresh(id);
  return res;
}

/** Campos que el panel del lead guarda uno a uno, sin pasar por el formulario completo. */
export type LeadPatch = Partial<{
  name: string;
  companyName: string | null;
  email: string | null;
  phone: string | null;
  zone: string | null;
  type: string;
  previewUrl: string | null;
  message: string | null;
  priority: string;
  assignedToId: string | null;
  productId: string | null;
  nextActionAt: string | null;
  nextActionNote: string | null;
  lastContactAt: string | null;
}>;

export async function patchLeadAction(id: string, patch: LeadPatch) {
  const res = await backendFetch<Lead>(`/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  refresh(id);
  return res;
}

export async function changeLeadStatusAction(id: string, status: string, lostReason?: string | null) {
  const res = await backendFetch<Lead>(`/leads/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, ...(lostReason !== undefined ? { lostReason } : {}) }),
  });
  refresh(id);
  return res;
}

export async function markLeadAsLostAction(id: string, formData?: FormData) {
  const reason = String(formData?.get('lostReason') || '').trim();
  await changeLeadStatusAction(id, 'LOST', reason || null);
}

export async function convertLeadToProjectAction(leadId: string, projectName?: string, price?: number, responsibleWorkerId?: string | null, projectType?: string) {
  const res = await backendFetch<{ success: boolean; project: { id: string } }>(`/leads/${leadId}/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectName, price, responsibleWorkerId, projectType }),
  });
  refresh(leadId);
  return res;
}


export async function setLeadNextActionAction(id: string, formData: FormData) {
  const date = String(formData.get('nextActionAt') || '').trim();
  await backendFetch<Lead>(`/leads/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    // Mediodía de Lima: el día no se corre al convertir a UTC (igual que en demos).
    body: JSON.stringify({ nextActionAt: date ? `${date}T12:00:00-05:00` : null }),
  });
  refresh(id);
}
