import { ScopeManager } from '@/components/projects/ScopeManager';
import { getProjectPlanning } from '@/src/modules/projects/server/queries';

export default async function ScopePage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; const data = await getProjectPlanning(projectId); return <section aria-labelledby="scope-title" className="space-y-4"><div><h2 id="scope-title" className="text-base font-bold text-slate-900">Alcance y entregables</h2><p className="mt-1 text-sm text-slate-500">Define qué incluye el proyecto y qué debe entregarse.</p></div><ScopeManager projectId={projectId} scope={data.scope} deliverables={data.deliverables} /></section>; }
