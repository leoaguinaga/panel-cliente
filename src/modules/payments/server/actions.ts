'use server';

import { revalidatePath } from 'next/cache';
import { backendFetch } from '@/src/lib/api/server';

export async function createPaymentAction(formData: FormData) {
  await backendFetch('/payments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: String(formData.get('clientId') || ''),
      projectId: String(formData.get('projectId') || '') || null,
      concept: String(formData.get('concept') || '').trim(),
      amount: Number(formData.get('amount') || 0),
      currency: String(formData.get('currency') || 'PEN'),
      dueDate: String(formData.get('dueDate') || '') || null,
    }),
  });
  revalidatePath('/internal/payments');
  revalidatePath('/internal/dashboard');
  revalidatePath('/client/payments');
  revalidatePath('/client/dashboard');
}

export async function updatePaymentStatusAction(id: string, status: string) {
  await backendFetch(`/payments/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  revalidatePath('/internal/payments');
  revalidatePath('/internal/dashboard');
  revalidatePath('/client/payments');
  revalidatePath('/client/dashboard');
}

export async function verifyPaymentAction(id: string, status: 'PAID' | 'PENDING' | 'CANCELLED', reviewNotes?: string) {
  await backendFetch(`/payments/${id}/verify`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, reviewNotes }),
  });
  revalidatePath('/internal/payments');
  revalidatePath('/internal/dashboard');
  revalidatePath('/client/payments');
  revalidatePath('/client/dashboard');
}

export async function reportPaymentAction(
  id: string,
  body: {
    paymentChannel: string;
    transactionReference?: string;
    evidenceUrl?: string;
    evidenceStorageKey?: string;
    evidenceOriginalName?: string;
    evidenceMimeType?: string;
    clientNotes?: string;
    paidAt?: string;
  }
) {
  const result = await backendFetch(`/payments/${id}/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  revalidatePath('/client/payments');
  revalidatePath('/client/dashboard');
  revalidatePath('/internal/payments');
  revalidatePath('/internal/dashboard');
  return result;
}
