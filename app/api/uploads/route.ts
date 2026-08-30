import { NextResponse } from 'next/server';
import { getSession } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { saveLocalDocument } from '@/src/modules/documents/server/storage';
import { DocumentType } from '@prisma/client';
import { logActivity } from '@/src/lib/server/activity';
import { enumValue, requiredId } from '@/src/lib/server/validation';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user || !['ADMIN', 'WORKER'].includes(session.user.role) || session.user.status !== 'ACTIVE') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const form = await request.formData(); const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return NextResponse.json({ error: 'A file is required' }, { status: 400 });
  if (file.size > 25 * 1024 * 1024) return NextResponse.json({ error: 'Maximum file size is 25 MB' }, { status: 413 });
  const clientId = String(form.get('clientId') || '') || null; const projectId = String(form.get('projectId') || '') || null;
  if (clientId) await prisma.client.findUniqueOrThrow({ where: { id: requiredId(clientId, 'Cliente') }, select: { id: true } });
  if (projectId) { const project = await prisma.project.findUniqueOrThrow({ where: { id: requiredId(projectId, 'Proyecto') }, select: { clientId: true } }); if (clientId && project.clientId !== clientId) return NextResponse.json({ error: 'El proyecto no pertenece al cliente indicado' }, { status: 400 }); }
  const stored = await saveLocalDocument(file);
  const document = await prisma.document.create({ data: { originalName: file.name.slice(0, 255), storedName: stored.storedName, mimeType: file.type || 'application/octet-stream', size: file.size, storageProvider: 'local', storageKey: stored.storageKey, clientId, projectId, type: enumValue(DocumentType, String(form.get('type') || 'OTHER'), 'Tipo de documento'), visibleToClient: form.get('visibleToClient') === 'on', uploadedById: session.user.id } });
  await logActivity({ actorId: session.user.id, entityType: 'Document', entityId: document.id, action: 'UPLOADED', description: document.originalName });
  return NextResponse.json({ ok: true, document: { id: document.id, originalName: document.originalName, type: document.type } }, { status: 201 });
}
