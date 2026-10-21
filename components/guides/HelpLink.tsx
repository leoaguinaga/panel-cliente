'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleHelp } from 'lucide-react';
import { findGuideForPath } from '@/src/modules/guides/registry';

/** «?» del header: lleva a la sección de la guía que explica la pantalla actual. Sin guía, no aparece. */
export function HelpLink() {
  const match = findGuideForPath(usePathname());
  if (!match) return null;
  const label = `Cómo funciona esta pantalla: ${match.guide.title}`;
  return (
    <Link
      href={match.href}
      aria-label={label}
      title={label}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-input bg-card text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <CircleHelp className="size-4" aria-hidden />
    </Link>
  );
}
