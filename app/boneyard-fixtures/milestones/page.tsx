import { MilestoneManager } from '@/components/projects/MilestoneManager';

export const metadata = { robots: { index: false, follow: false } };
export default function MilestonesFixture() {
  return <main className="mx-auto max-w-6xl p-4 sm:p-8"><h1 className="mb-6 text-xl">Hitos</h1><MilestoneManager projectId="fixture" isAdmin requirements={[{ id: 'r1', code: 'R1', title: 'Identidad visual y diseño de la página principal', milestoneId: 'm1' }, { id: 'r2', code: 'R2', title: 'Formulario de contacto', milestoneId: 'm2' }]} milestones={[{ id: 'm1', title: 'Diseño aprobado', status: 'PENDING', order: 1, startDate: '2026-10-20', dueDate: '2026-11-15', visibleToClient: true, requirements: [{ id: 'r1', code: 'R1', title: 'Identidad visual y diseño de la página principal' }] }]} /></main>;
}
