import { PlanEditor } from '@/components/projects/PlanEditor';
import { ProjectPaymentPlan } from '@/components/projects/ProjectPaymentPlan';
import { getProjectDocumentation } from '@/src/modules/projects/server/queries';
import { getPaymentAgenda } from '@/src/modules/payments/server/queries';
import { getSession } from '@/src/lib/auth';

export default async function PaymentsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const [data, plan, session] = await Promise.all([
    getProjectDocumentation(projectId),
    getPaymentAgenda({ projectId }),
    getSession(),
  ]);
  const isAdmin = session?.user.role === 'ADMIN';
  const empty = data.payments.every((payment) => payment.status === 'CANCELLED');
  const paidById = Object.fromEntries(plan.items.map((item) => [item.id, item.paidAmount]));
  // El editor guarda borradores en su estado: se monta de nuevo cuando el plan cambia en el servidor.
  const version = data.payments.map((p) => [p.id, p.status, p.amount, p.concept, p.dueDate, p.milestoneId, p.notes, paidById[p.id]].join(':')).join('|');

  return (
    <section aria-label="Pagos del proyecto" className="space-y-8">
      <ProjectPaymentPlan items={plan.items} today={plan.summary.today} isAdmin={isAdmin} reminder={plan.reminder} projectPrice={Number(data.price)} />

      <details open={empty} className="group rounded-xl border">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <span aria-hidden="true" className="text-xs text-muted-foreground transition group-open:rotate-90">▸</span>
          Editar plan
          <span className="font-normal text-muted-foreground">· conceptos, montos, fechas e hitos de cada cuota</span>
        </summary>
        <div className="border-t p-4">
          <PlanEditor key={version} projectId={projectId} clientId={data.clientId} projectPrice={Number(data.price)} payments={data.payments} paidById={paidById} milestones={data.milestones} isAdmin={isAdmin} />
        </div>
      </details>
    </section>
  );
}
