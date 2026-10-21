import { MilestoneManager } from '@/components/projects/MilestoneManager';
import { getSession } from '@/src/lib/auth';
import { getProjectPlanning } from '@/src/modules/projects/server/queries';

export default async function MilestonesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, session] = await Promise.all([getProjectPlanning(projectId), getSession()]);
  return (
    <section aria-labelledby="milestones-title" className="space-y-4">
      <div>
        <h2 id="milestones-title" className="text-base font-bold text-slate-900">Hitos</h2>
        <p className="mt-1 text-sm text-slate-500">Lo que el cliente recibe, cuándo y qué pago habilita. Cada hito avanza con sus tareas y se cierra con la aprobación del cliente.</p>
      </div>
      <MilestoneManager projectId={projectId} milestones={data.milestones} requirements={data.requirements} documents={data.documents} isAdmin={session?.user.role === 'ADMIN'} />
    </section>
  );
}
