import { PageHeader } from '@/components/shared/PageHeader';
import { CreatePaymentSheet } from '@/components/internal/CreateSheets';
import { CollectionsSummary } from '@/components/internal/payments/CollectionsSummary';
import { CollectionsAgenda } from '@/components/internal/payments/CollectionsAgenda';
import { getClients } from '@/src/modules/clients/server/queries';
import { getProjectsOverview } from '@/src/modules/projects/server/queries';
import { getPaymentAgenda, getPaymentHistory } from '@/src/modules/payments/server/queries';
import { getSession } from '@/src/lib/auth';

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ cobrado?: string; payment?: string }> }) {
  const query = await searchParams;
  const allPaid = query.cobrado === 'todo';
  const [agenda, session, clients, projects, selectedPayment] = await Promise.all([
    getPaymentAgenda({ allPaid }),
    getSession(),
    getClients(),
    getProjectsOverview(),
    query.payment ? getPaymentHistory(query.payment) : Promise.resolve(null),
  ]);
  const isAdmin = session?.user.role === 'ADMIN';

  return (
    <section className="space-y-6">
      <PageHeader
        title="Cobros"
        description="Lo que te deben, lo que vence y lo que ya entró."
        action={
          <div className="flex items-center gap-2">
            {isAdmin && <CreatePaymentSheet clients={clients} projects={projects} />}
          </div>
        }
      />
      <CollectionsSummary summary={agenda.summary} />
      <CollectionsAgenda key={query.payment || 'agenda'} initialPayment={selectedPayment ? { ...selectedPayment, group: selectedPayment.status === 'PAID' ? 'paid' : selectedPayment.dueDate && selectedPayment.dueDate.slice(0, 10) < agenda.summary.today && ['PENDING', 'PARTIAL', 'OVERDUE'].includes(selectedPayment.status) ? 'overdue' : 'later', lastReminderAt: null, reminderCount: 0 } : undefined} items={agenda.items} today={agenda.summary.today} isAdmin={isAdmin} allPaid={allPaid} reminder={agenda.reminder} />
    </section>
  );
}
