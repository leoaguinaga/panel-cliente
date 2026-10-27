'use server';

import { revalidatePath } from 'next/cache';
import { BackendApiError, backendFetch } from '@/src/lib/api/server';
import type { TaskEvidence } from '../types';

export type TaskActionResult = { ok: true; error: null } | { ok: false; error: string };

export type TaskPatch = Partial<{
  title: string;
  productId: string | null;
  leadId: string | null;
  description: string | null;
  status: string;
  priority: string;
  assignedToId: string | null;
  reviewerId: string | null;
  milestoneId: string | null;
  sprintId: string | null;
  requirementId: string | null;
  plannedStartDate: string | null;
  dueDate: string | null;
  estimateHours: number | null;
  requiresEvidence: boolean;
}>;

async function run(projectId: string, request: () => Promise<unknown>): Promise<TaskActionResult> {
  try {
    await request();
  } catch (error) {
    if (error instanceof BackendApiError) return { ok: false, error: error.message };
    throw error;
  }
  revalidatePath(`/internal/projects/${projectId}`, 'layout');
  revalidatePath('/internal/tasks');
  revalidatePath('/internal/dashboard');
  return { ok: true, error: null };
}

const json = (method: string, body: unknown): RequestInit => ({
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});

export async function patchTaskAction(projectId: string, taskId: string, patch: TaskPatch) {
  return run(projectId, () => backendFetch(`/projects/${projectId}/tasks/${taskId}`, json('PATCH', patch)));
}

export async function setTaskStatusAction(projectId: string, taskId: string, status: string) {
  return run(projectId, () => backendFetch(`/projects/${projectId}/tasks/${taskId}/status`, json('PATCH', { status })));
}

export async function createTaskQuickAction(
  projectId: string,
  input: { title: string; status?: string; priority?: string; parentId?: string; assignedToId?: string | null; reviewerId?: string | null; sprintId?: string | null; requirementId?: string | null; milestoneId?: string | null; plannedStartDate?: string | null; dueDate?: string | null; estimateHours?: number | null; productId?: string | null; leadId?: string | null },
) {
  const body = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== '' && value !== null && value !== undefined));
  return run(projectId, () => backendFetch(`/projects/${projectId}/tasks`, json('POST', body)));
}

export async function addTaskCommentAction(projectId: string, taskId: string, body: string) {
  return run(projectId, () => backendFetch(`/projects/${projectId}/tasks/${taskId}/comments`, json('POST', { body })));
}

export async function deleteTaskCommentAction(projectId: string, taskId: string, commentId: string) {
  return run(projectId, () => backendFetch(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' }));
}

export async function reviewTaskAction(projectId: string, taskId: string, verdict: 'APPROVE' | 'RETURN', note?: string) {
  return run(projectId, () => backendFetch(`/projects/${projectId}/tasks/${taskId}/review`, json('POST', { verdict, note: note || undefined })));
}

export async function deleteTaskQuickAction(projectId: string, taskId: string) {
  return run(projectId, () => backendFetch(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' }));
}

export type EvidenceInput = { kind: 'LINK' | 'IMAGE' | 'NOTE'; title?: string; fileUrl?: string; notes?: string };

export async function addTaskEvidenceAction(projectId: string, taskId: string, input: EvidenceInput) {
  let created: TaskEvidence | null = null;
  const result = await run(projectId, async () => {
    created = await backendFetch<TaskEvidence>(`/projects/${projectId}/tasks/${taskId}/evidences`, json('POST', input));
  });
  return result.ok ? { ...result, evidence: created as TaskEvidence | null } : { ...result, evidence: null };
}
