import { ClientPageHeader } from '@/components/client/ClientPageHeader';
import { ClientPaymentsView } from '@/components/client/ClientPaymentsView';
import { getClientDashboard } from '@/src/modules/dashboard/server/queries';

export default async function ClientPaymentsPage() {
  const { payments } = await getClientDashboard();

  return (
    <>
      <ClientPageHeader
        title="Pagos y Facturación"
        description="Revisa tus próximos vencimientos, canales de pago disponibles y sube tus comprobantes para validación inmediata."
      />
      <ClientPaymentsView payments={payments} />
    </>
  );
}
