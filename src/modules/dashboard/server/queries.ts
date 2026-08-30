import { backendFetch } from '@/src/lib/api/server';
type ApiEntity = Record<string, any>;
type DashboardResponse = ApiEntity & { workers: ApiEntity[]; products: ApiEntity[]; services: ApiEntity[]; overdueTasks: ApiEntity[]; blockedTasks: ApiEntity[]; unassignedProjects: ApiEntity[]; myTasks: ApiEntity[]; upcomingDeliverables: ApiEntity[]; workload: ApiEntity[] };

export type DashboardFilters = { workerId?: string; productId?: string; serviceId?: string; status?: string };

export async function getOperationalDashboard(filters: DashboardFilters = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value) query.set(key, value);
  }
  return backendFetch<DashboardResponse>(`/dashboard${query.size ? `?${query}` : ''}`);
}
