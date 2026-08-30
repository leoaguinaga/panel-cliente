import { prisma } from '@/src/lib/prisma';

export async function logActivity(input: { actorId?: string | null; entityType: string; entityId: string; action: string; description?: string }) {
  await prisma.activityLog.create({ data: input });
}
