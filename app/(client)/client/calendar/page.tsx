import { ClientPageHeader } from '@/components/client/ClientPageHeader';
import { ClientCalendarView } from '@/components/client/ClientCalendarView';
import { getClientDashboard } from '@/src/modules/dashboard/server/queries';

export default async function ClientCalendarPage() {
  const data = await getClientDashboard();

  return (
    <>
      <ClientPageHeader
        title="Calendario"
        description="Reuniones programadas con el equipo, fechas de entrega y vencimientos de pago de tus proyectos."
      />
      <ClientCalendarView data={data} />
    </>
  );
}
