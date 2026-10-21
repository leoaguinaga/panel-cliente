import { ScopeManager } from '@/components/projects/ScopeManager';
import { getProjectPlanning } from '@/src/modules/projects/server/queries';

export default async function ScopePage({ params }: { params: Promise<{ projectId: string }> }) { const { projectId } = await params; const data = await getProjectPlanning(projectId); return <section aria-labelledby="scope-title" className="space-y-4"><div><h2 id="scope-title" className="text-base font-bold text-slate-900">Alcance</h2><p className="mt-1 text-sm text-slate-500">Qué incluye y qué no incluye el proyecto. Lo que se entrega se organiza en Hitos.</p></div><ScopeManager projectId={projectId} scope={data.scope} looseDeliverables={data.deliverables} /></section>; }
