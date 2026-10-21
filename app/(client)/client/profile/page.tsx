import { ClientProfile } from '@/src/modules/profile/ClientProfile';
import { getClientDashboard } from '@/src/modules/dashboard/server/queries';

export default async function ClientProfilePage() {
  const data = await getClientDashboard();
  return <ClientProfile data={data} />;
}
