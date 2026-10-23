import { ClientPortalFixture } from '@/components/client/ClientPortalLoading';
export const metadata = { robots: { index: false, follow: false } };
export default function ClientPortalFixturePage() { return <main className="mx-auto w-full max-w-7xl p-4 sm:p-6"><div data-boneyard="client-portal"><ClientPortalFixture /></div></main> }
