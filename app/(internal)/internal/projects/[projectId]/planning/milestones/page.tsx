import { MilestoneManager } from '@/components/projects/MilestoneManager';
import { getProjectPlanning } from '@/src/modules/projects/server/queries';

export default async function MilestonesPage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; const data = await getProjectPlanning(projectId); return <section aria-labelledby="milestones-title" className="space-y-4"><div><h2 id="milestones-title" className="text-base font-bold text-slate-900">Hitos</h2><p className="mt-1 text-sm text-slate-500">Puntos de control, fechas y visibilidad para el cliente.</p></div><MilestoneManager projectId={projectId} milestones={data.milestones} /></section>; }
