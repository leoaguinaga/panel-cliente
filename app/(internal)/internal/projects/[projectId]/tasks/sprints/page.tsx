import { SprintManager } from '@/components/agile/SprintManager';
import { getProjectTasks } from '@/src/modules/projects/server/queries';

export default async function ProjectSprintsPage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; const data = await getProjectTasks(projectId); return <section aria-labelledby="sprints-title" className="space-y-4"><div><h2 id="sprints-title" className="text-base font-bold text-slate-900">Sprints</h2><p className="mt-1 text-sm text-slate-500">Organiza ciclos, metas y tareas del proyecto.</p></div><SprintManager projectId={projectId} sprints={data.sprints} tasks={data.tasks} /></section>; }
