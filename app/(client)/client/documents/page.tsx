import { ClientPageHeader } from '@/components/client/ClientPageHeader';
import { ClientDocumentsView } from '@/components/client/ClientDocumentsView';
import { getClientDashboard } from '@/src/modules/dashboard/server/queries';

// Descargar documentos mediante /api/backend/documents/
export default async function ClientDocumentsPage() {
  const { documents } = await getClientDashboard();

  return (
    <>
      <ClientPageHeader
        title="Documentos y Entregables"
        description="Archivos compartidos contigo, propuestas, contratos y comprobantes con vista previa interactiva y descarga."
      />
      <ClientDocumentsView documents={documents} />
    </>
  );
}
