'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Settings } from 'lucide-react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';

/** Abre los ajustes del proyecto como panel lateral sobre la vista actual; el estado vive en `?ajustes=1` para poder enlazarlo. */
export function ProjectSettingsSheet({ children }: { children: React.ReactNode }) {
  const router = useRouter(), pathname = usePathname(), searchParams = useSearchParams();
  const open = searchParams.get('ajustes') === '1';
  const setOpen = (next: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (next) params.set('ajustes', '1'); else params.delete('ajustes');
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  return <Sheet open={open} onOpenChange={setOpen}>
    <button type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} className={`ml-auto inline-flex min-h-11 shrink-0 items-center gap-2 px-3.5 py-2.5 text-xs font-semibold ${open ? 'text-blue-700' : 'text-slate-500 hover:text-slate-900'}`}><Settings className="size-4" />Ajustes</button>
    <SheetContent side="right" className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
      <SheetHeader className="border-b border-slate-100 px-5 pb-4 pt-5"><SheetTitle className="text-base font-bold">Ajustes del proyecto</SheetTitle><SheetDescription>Información general, estado comercial y avance calculado desde tareas e hitos.</SheetDescription></SheetHeader>
      <div className="p-5">{children}</div>
    </SheetContent>
  </Sheet>;
}
