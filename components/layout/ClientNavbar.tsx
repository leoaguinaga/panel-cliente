"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, UserRound, X } from 'lucide-react';
import { useState } from 'react';
import { ROUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Resumen', href: ROUTES.client.dashboard },
  { name: 'Mis proyectos', href: ROUTES.client.projects },
  { name: 'Calendario', href: ROUTES.client.calendar },
  { name: 'Pagos', href: ROUTES.client.payments },
];

export function ClientNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-10">
        <Link href={ROUTES.client.dashboard} className="flex shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950">
          <img src="/logos/logo-full-white.webp" alt="FoxCode" className="h-7 w-auto" />
          <span className="hidden border-l border-slate-200 pl-2.5 font-display text-base lg:text-lg tracking-wide text-slate-500 sm:block">Portal de cliente</span>
        </Link>

        <nav aria-label="Navegación principal" className="hidden h-full items-center gap-1 md:flex">
          {navItems.map((item) => <Link key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={cn('relative flex h-full items-center px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-slate-950', isActive(item.href) ? 'text-slate-950 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-orange-500' : 'text-slate-600 hover:text-slate-950')}>{item.name}</Link>)}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link href={ROUTES.client.help} className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950">Ayuda</Link>
          <Link href={ROUTES.client.profile} aria-label="Abrir mi perfil" className={cn('flex h-9 w-9 items-center justify-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2', isActive(ROUTES.client.profile) ? 'border-slate-950 bg-brand-button text-white' : 'border-slate-200 bg-slate-100 text-slate-700 hover:border-slate-300 hover:bg-slate-200')}><UserRound size={17} aria-hidden="true" /></Link>
        </div>

        <button type="button" aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open} aria-controls="client-mobile-navigation" onClick={() => setOpen((value) => !value)} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 md:hidden">{open ? <X size={22} /> : <Menu size={22} />}</button>
      </div>

      {open && <nav id="client-mobile-navigation" aria-label="Navegación móvil" className="fixed inset-x-0 top-16 z-30 border-b border-slate-200 bg-card px-4 pb-5 pt-2 shadow-xl md:hidden"><div className="mx-auto space-y-1">{navItems.map((item) => <Link onClick={() => setOpen(false)} key={item.href} href={item.href} aria-current={isActive(item.href) ? 'page' : undefined} className={cn('block rounded-xl px-4 py-3 text-sm font-medium', isActive(item.href) ? 'bg-brand-button text-white' : 'text-slate-700 hover:bg-slate-100')}>{item.name}</Link>)}<div className="my-2 border-t border-slate-100" /><Link onClick={() => setOpen(false)} href={ROUTES.client.help} className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">Ayuda</Link><Link onClick={() => setOpen(false)} href={ROUTES.client.profile} className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100">Mi perfil</Link></div></nav>}
    </header>
  );
}
