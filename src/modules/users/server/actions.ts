'use server';

import { auth } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { requireAuth } from '@/src/lib/auth';
import { ROLES } from '@/src/modules/auth/server/permissions';
import { Role, UserStatus } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { logActivity } from '@/src/lib/server/activity';
import { enumValue, optionalText, requiredId, requiredText } from '@/src/lib/server/validation';

export async function createWorkerAction(formData: FormData) {
  const session = await requireAuth([ROLES.ADMIN]);
  const name = requiredText(formData, 'name', 'Nombre'); const email = requiredText(formData, 'email', 'Correo').toLowerCase(); const password = String(formData.get('password') || '');
  if (!name || !email || password.length < 10) throw new Error('Nombre, correo y una contraseña de al menos 10 caracteres son obligatorios');
  const result = await auth.api.signUpEmail({ body: { name, email, password, role: Role.WORKER, status: UserStatus.ACTIVE } });
  if (!result.user) throw new Error('No se pudo crear el trabajador');
  await prisma.user.update({ where: { id: result.user.id }, data: { role: Role.WORKER, status: UserStatus.ACTIVE, clientId: null } });
  await logActivity({ actorId: session.user.id, entityType: 'User', entityId: result.user.id, action: 'CREATED', description: `Colaborador creado: ${name}` });
  revalidatePath('/internal/workers');
}

export async function updateWorkerAction(id: string, formData: FormData) {
  const session = await requireAuth([ROLES.ADMIN]); requiredId(id, 'Colaborador');
  const role = enumValue(Role, String(formData.get('role') || 'WORKER'), 'Rol'); const status = enumValue(UserStatus, String(formData.get('status') || 'ACTIVE'), 'Estado');
  if (id === session.user.id && status !== UserStatus.ACTIVE) throw new Error('No puedes desactivar tu propia cuenta');
  await prisma.user.update({ where: { id }, data: { name: requiredText(formData, 'name', 'Nombre'), phone: optionalText(formData, 'phone', 40), role, status, clientId: null } });
  await logActivity({ actorId: session.user.id, entityType: 'User', entityId: id, action: 'UPDATED', description: `Colaborador actualizado: ${role}, ${status}` });
  revalidatePath('/internal/workers');
}
