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
  if (!projectId) return runUnassigned(taskId, json('PATCH', patch));
  return run(projectId, () => backendFetch(`/projects/${projectId}/tasks/${taskId}`, json('PATCH', patch)));
}

export async function setTaskStatusAction(projectId: string, taskId: string, status: string) {
  if (!projectId) return runUnassigned(taskId, json('PATCH', { status }));
  return run(projectId, () => backendFetch(`/projects/${projectId}/tasks/${taskId}/status`, json('PATCH', { status })));
}

async function runUnassigned(taskId: string, request: RequestInit): Promise<TaskActionResult> {
  try {
    await backendFetch(`/projects/tasks/${taskId}`, request);
  } catch (error) {
    if (error instanceof BackendApiError) return { ok: false, error: error.message };
    throw error;
  }
  revalidatePath('/internal/tasks');
  revalidatePath('/internal/dashboard');
  return { ok: true, error: null };
}

export async function createTaskQuickAction(
  projectId: string,
  input: { title: string; status?: string; priority?: string; parentId?: string; assignedToId?: string | null; reviewerId?: string | null; sprintId?: string | null; requirementId?: string | null; milestoneId?: string | null; plannedStartDate?: string | null; dueDate?: string | null; estimateHours?: number | null; productId?: string | null; leadId?: string | null },
) {
  const body = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== '' && value !== null && value !== undefined));
  return projectId.trim()
    ? run(projectId, () => backendFetch(`/projects/${projectId}/tasks`, json('POST', body)))
    : runUnassignedCreate(body);
}

async function runUnassignedCreate(body: Record<string, unknown>): Promise<TaskActionResult> {
  try {
    await backendFetch('/projects/tasks', json('POST', body));
  } catch (error) {
    if (error instanceof BackendApiError) return { ok: false, error: error.message };
    throw error;
  }
  revalidatePath('/internal/tasks');
  revalidatePath('/internal/dashboard');
  return { ok: true, error: null };
}

export async function addTaskCommentAction(projectId: string, taskId: string, body: string) {
  if (!projectId) return runUnassigned(taskId, json('POST', { body }));
  return run(projectId, () => backendFetch(`/projects/${projectId}/tasks/${taskId}/comments`, json('POST', { body })));
}

export async function deleteTaskCommentAction(projectId: string, taskId: string, commentId: string) {
  if (!projectId) return runUnassigned(taskId, { method: 'DELETE' });
  return run(projectId, () => backendFetch(`/projects/${projectId}/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' }));
}

export async function reviewTaskAction(projectId: string, taskId: string, verdict: 'APPROVE' | 'RETURN', note?: string) {
  if (!projectId) return runUnassigned(taskId, json('POST', { verdict, note: note || undefined }));
  return run(projectId, () => backendFetch(`/projects/${projectId}/tasks/${taskId}/review`, json('POST', { verdict, note: note || undefined })));
}

export async function deleteTaskQuickAction(projectId: string, taskId: string) {
  if (!projectId) return runUnassigned(taskId, { method: 'DELETE' });
  return run(projectId, () => backendFetch(`/projects/${projectId}/tasks/${taskId}`, { method: 'DELETE' }));
}

export type EvidenceInput = { kind: 'LINK' | 'IMAGE' | 'NOTE'; title?: string; fileUrl?: string; notes?: string };

export async function addTaskEvidenceAction(projectId: string, taskId: string, input: EvidenceInput) {
  let created: TaskEvidence | null = null;
  const result = projectId
    ? await run(projectId, async () => {
        created = await backendFetch<TaskEvidence>(`/projects/${projectId}/tasks/${taskId}/evidences`, json('POST', input));
      })
    : await (async () => {
        try {
          created = await backendFetch<TaskEvidence>(`/projects/tasks/${taskId}/evidences`, json('POST', input));
          revalidatePath('/internal/tasks');
          return { ok: true, error: null } as const;
        } catch (error) {
          return { ok: false, error: error instanceof BackendApiError ? error.message : 'No se pudo guardar la evidencia' } as const;
        }
      })();
  return result.ok ? { ...result, evidence: created as TaskEvidence | null } : { ...result, evidence: null };
}

export async function deleteTaskEvidenceAction(projectId: string, taskId: string, evidenceId: string) {
  if (!projectId) {
    try {
      await backendFetch(`/projects/tasks/${taskId}/evidences/${evidenceId}`, { method: 'DELETE' });
      revalidatePath('/internal/tasks');
      return { ok: true, error: null } as const;
    } catch (error) {
      return { ok: false, error: error instanceof BackendApiError ? error.message : 'No se pudo eliminar la evidencia' } as const;
    }
  }
  return run(projectId, () => backendFetch(`/projects/${projectId}/tasks/${taskId}/evidences/${evidenceId}`, { method: 'DELETE' }));
}
