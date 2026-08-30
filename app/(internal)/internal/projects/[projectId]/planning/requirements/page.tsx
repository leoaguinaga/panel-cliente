import { RequirementManager } from '@/components/agile/RequirementManager';
import { getProjectPlanning } from '@/src/modules/projects/server/queries';
import { getWorkers } from '@/src/modules/leads/server/queries';

export default async function RequirementsPage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; const [data, workers] = await Promise.all([getProjectPlanning(projectId), getWorkers().catch(() => [])]); return <section aria-labelledby="requirements-title" className="space-y-4"><div><h2 id="requirements-title" className="text-base font-bold text-slate-900">Requerimientos</h2><p className="mt-1 text-sm text-slate-500">Define necesidades y vincúlalas con tareas de ejecución.</p></div><RequirementManager projectId={projectId} requirements={data.requirements} sprints={data.sprints} workers={workers} /></section>; }
