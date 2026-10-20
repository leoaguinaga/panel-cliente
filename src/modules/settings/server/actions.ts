'use server';
import { backendFetch } from '@/src/lib/api/server';
import { requireAuth } from '@/src/lib/auth';
import { ROLES } from '@/src/modules/auth/server/permissions';
import { revalidatePath } from 'next/cache';

export async function saveSettingsAction(formData: FormData) {
  await requireAuth([ROLES.ADMIN]);
  const values = [['company_name', 'Nombre de empresa'], ['contact_email', 'Correo de contacto'], ['official_whatsapp', 'WhatsApp oficial'], ['payment_instructions', 'Instrucciones de pago'], ['tax_information', 'Información fiscal']];
  await backendFetch('/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(Object.fromEntries(values.map(([key]) => [key, String(formData.get(key) || '').trim().slice(0, 5_000)]))) });
  revalidatePath('/internal/settings');
}
