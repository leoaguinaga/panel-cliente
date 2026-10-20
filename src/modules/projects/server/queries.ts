import type { Project } from '@/src/lib/api/contracts';
import { allPages, type Page } from '@/src/lib/api/pagination';
import { backendFetch } from '@/src/lib/api/server';
import type { ProjectDocumentationSection, ProjectPlanningSection, ProjectSummary, ProjectTasksSection } from '../types';

export async function getProjectsOverview(filters?: { search?: string; status?: string }) {
  const query = new URLSearchParams();
  if (filters?.status) query.set('status', filters.status);
  if (filters?.search) query.set('q', filters.search);
  return allPages<Project>(`/projects${query.size ? `?${query}` : ''}`);
}

export async function getProjectById(id: string) {
  return backendFetch<Project>(`/projects/${id}`);
}

export const getProjectSummary = (id: string) => backendFetch<ProjectSummary>(`/projects/${id}/summary`);
export const getProjectTasks = (id: string) => backendFetch<ProjectTasksSection>(`/projects/${id}/tasks-section`);
export const getProjectPlanning = (id: string) => backendFetch<ProjectPlanningSection>(`/projects/${id}/planning-section`);
export const getProjectDocumentation = (id: string) => backendFetch<ProjectDocumentationSection>(`/projects/${id}/documentation-section`);

type ListQuery = Record<string, string | undefined>;
export type FacetCounts = Record<string, number>;
export type ProjectListItem = Project & { taskStats: { open: number; blocked: number; overdue: number } };
export type ProjectFacets = { views: Record<'active' | 'paused' | 'delivered' | 'all', number>; status: FacetCounts; worker: FacetCounts; product: FacetCounts; service: FacetCounts };
export type TaskFacets = { views: Record<'mine' | 'team' | 'overdue' | 'blocked', number>; status: FacetCounts; worker: FacetCounts; project: FacetCounts };

/** Parámetros de un listado sin vacíos ni la página (para facetas y exportación). */
export function listParams(query: ListQuery, { keepPage = true } = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) if (value && (keepPage || key !== 'page')) params.set(key, value);
  return params;
}
export const getProjectsPage = (query: ListQuery) => backendFetch<Page<ProjectListItem>>(`/projects?${listParams(query)}`);
export const getProjectFacets = (query: ListQuery) => backendFetch<ProjectFacets>(`/projects/facets?${listParams(query, { keepPage: false })}`);
export type BoardTask = {
  id: string;
  number: number;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'BLOCKED' | 'DONE';
  priority: string;
  dueDate: string | null;
  completedAt: string | null;
  statusChangedAt: string;
  blockedFromStatus: Exclude<BoardTask['status'], 'BLOCKED'> | null;
  parentId: string | null;
  project: { id: string; name: string };
  parent: { id: string; number: number; title: string } | null;
  assignedTo: { id: string; name: string } | null;
  reviewer: { id: string; name: string } | null;
  subtasks: Array<{ id: string; status: string }>;
  _count: { comments: number };
  blockedBy: Array<{ predecessor: { id: string; status: string } }>;
};
export const getTaskBoard = (query: ListQuery) => backendFetch<{ items: BoardTask[]; truncated: boolean; wipLimit: number }>(`/projects/tasks/board?${listParams(query, { keepPage: false })}`);
export const getTaskFacets = (query: ListQuery) => backendFetch<TaskFacets>(`/projects/tasks/facets?${listParams(query, { keepPage: false })}`);
