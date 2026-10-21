import { getCatalogs } from '@/src/modules/products/server/queries';
import { redirect } from 'next/navigation';
import { requireAuth } from '@/src/lib/auth';
import { getSettings } from '@/src/modules/settings/server/queries';
import { SettingsWorkspace } from '@/src/modules/settings/SettingsWorkspace';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  const { user } = await requireAuth(['ADMIN', 'WORKER']);
  // Las preferencias personales viven en Mi perfil; Configuración es solo de la empresa.
  if (user.role !== 'ADMIN' || (await searchParams).section === 'preferencias') redirect('/internal/profile#preferencias');
  const [settings, { services }] = await Promise.all([getSettings(), getCatalogs()]);
  return <SettingsWorkspace services={services} initialValues={Object.fromEntries(settings.map(item => [item.key, item.value]))} />;
}
