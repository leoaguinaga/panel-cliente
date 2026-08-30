import { NextResponse } from 'next/server';
import { getSession } from '@/src/lib/auth';
import { prisma } from '@/src/lib/prisma';
import { deleteLocalDocument, readLocalDocument } from '@/src/modules/documents/server/storage';
import { DocumentType } from '@prisma/client';
import { enumValue } from '@/src/lib/server/validation';
import { logActivity } from '@/src/lib/server/activity';

export const runtime = 'nodejs';
export async function GET(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const session = await getSession(); if (!session?.user || !['ADMIN', 'WORKER'].includes(session.user.role) || session.user.status !== 'ACTIVE') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { documentId } = await params; const doc = await prisma.document.findUnique({ where: { id: documentId } }); if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  try { const data = await readLocalDocument(doc.storageKey); return new NextResponse(data as BodyInit, { headers: { 'Content-Type': doc.mimeType, 'Content-Disposition': `attachment; filename="${doc.originalName.replace(/"/g, '')}"` } }); } catch { return NextResponse.json({ error: 'File unavailable' }, { status: 404 }); }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const session = await getSession();
  if (!session?.user || !['ADMIN', 'WORKER'].includes(session.user.role) || session.user.status !== 'ACTIVE') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { documentId } = await params;
  const current = await prisma.document.findUnique({ where: { id: documentId } });
  if (!current) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  const body = await request.json().catch(() => null) as { originalName?: string; type?: string; visibleToClient?: boolean } | null;
  if (!body) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  const originalName = body.originalName?.trim();
  if (originalName !== undefined && !originalName) return NextResponse.json({ error: 'El nombre no puede estar vacío' }, { status: 400 });
  const document = await prisma.document.update({ where: { id: documentId }, data: { ...(originalName ? { originalName: originalName.slice(0, 255) } : {}), ...(body.type ? { type: enumValue(DocumentType, body.type, 'Tipo de documento') } : {}), ...(body.visibleToClient !== undefined ? { visibleToClient: Boolean(body.visibleToClient) } : {}) } });
  await logActivity({ actorId: session.user.id, entityType: 'Document', entityId: document.id, action: 'UPDATED', description: document.originalName });
  return NextResponse.json({ ok: true, document });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ documentId: string }> }) {
  const session = await getSession();
  if (!session?.user || !['ADMIN', 'WORKER'].includes(session.user.role) || session.user.status !== 'ACTIVE') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { documentId } = await params;
  const document = await prisma.document.findUnique({ where: { id: documentId } });
  if (!document) return NextResponse.json({ error: 'Documento no encontrado' }, { status: 404 });
  if (document.storageProvider === 'local') await deleteLocalDocument(document.storageKey);
  await prisma.document.delete({ where: { id: documentId } });
  await logActivity({ actorId: session.user.id, entityType: 'Document', entityId: documentId, action: 'DELETED', description: document.originalName });
  return NextResponse.json({ ok: true });
}
