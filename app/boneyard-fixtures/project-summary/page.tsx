import { ProjectSummaryLoading } from '@/components/projects/ProjectSummaryLoading';

export const metadata = { robots: { index: false, follow: false } };

export default function ProjectSummaryFixturePage() {
  return <main className="mx-auto w-full max-w-[1600px] p-4 sm:p-6"><ProjectSummaryLoading /></main>;
}
