import { DemosFixture } from '@/components/shared/DemosLoading';
export const metadata = { robots: { index: false, follow: false } };
export default function Fixture() { return <main className="mx-auto max-w-7xl p-4 sm:p-6"><div data-boneyard="product-demos"><DemosFixture /></div></main>; }
