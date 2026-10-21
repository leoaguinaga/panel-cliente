import type {
  Worker,
  WorkerDetail,
  WorkerActivityPage,
} from "@/src/lib/api/contracts";
import { backendFetch, BackendApiError } from "@/src/lib/api/server";

export async function getWorkers() {
  return backendFetch<Worker[]>("/workers");
}
export async function getWorker(id: string) {
  try {
    return await backendFetch<WorkerDetail>(
      `/workers/${encodeURIComponent(id)}`,
    );
  } catch (error) {
    if (error instanceof BackendApiError && error.status === 404) return null;
    throw error;
  }
}
export async function getWorkerActivity(
  id: string,
  query: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  for (const key of ["page", "scope", "action", "from", "to"])
    if (query[key]) params.set(key, query[key]!);
  return backendFetch<WorkerActivityPage>(
    `/workers/${encodeURIComponent(id)}/activity?${params}`,
  );
}
