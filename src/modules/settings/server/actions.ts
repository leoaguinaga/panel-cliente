'use server';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/auth';
import { ROLES } from '@/src/modules/auth/server/permissions';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/src/lib/server/activity';
import { optionalText } from '@/src/lib/server/validation';

export async function saveSettingsAction(formData: FormData) {
  const session = await requireAuth([ROLES.ADMIN]);
  const values = [['company_name', 'Nombre de empresa'], ['contact_email', 'Correo de contacto'], ['official_whatsapp', 'WhatsApp oficial'], ['payment_instructions', 'Instrucciones de pago'], ['tax_information', 'Información fiscal']];
  await prisma.$transaction(values.map(([key]) => { const value = optionalText(formData, key, 5_000) || ''; return prisma.internalSetting.upsert({ where: { key }, update: { value }, create: { key, value } }); }));
  await logActivity({ actorId: session.user.id, entityType: 'InternalSetting', entityId: 'settings', action: 'UPDATED', description: 'Configuración operativa actualizada' });
  revalidatePath('/internal/settings');
}
