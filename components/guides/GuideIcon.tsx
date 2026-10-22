import { CalendarDays, Flame, FolderKanban, ListChecks, type LucideProps } from 'lucide-react';
import type { GuideIcon as GuideIconName } from '@/src/modules/guides/registry';

const ICONS = {
  leads: Flame,
  tasks: ListChecks,
  today: CalendarDays,
  project: FolderKanban,
} satisfies Record<GuideIconName, React.ComponentType<LucideProps>>;

export function GuideIcon({ name, ...props }: { name: GuideIconName } & LucideProps) {
  const Icon = ICONS[name];
  return <Icon aria-hidden="true" {...props} />;
}
