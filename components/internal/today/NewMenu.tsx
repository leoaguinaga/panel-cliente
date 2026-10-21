'use client';
import { useState } from 'react';
import { ChevronDown, FolderPlus, Plus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { CreateLeadSheet, CreateProjectSheet } from '@/components/internal/CreateSheets';

type Worker = { id: string; name: string; email: string };
type Client = { id: string; name: string; businessName: string | null };

/** Un solo botón de creación para el inicio: lo frecuente (lead) primero. */
export function NewMenu({ workers, clients, products = [], defaultProductId }: { workers: Worker[]; clients: Client[]; products?: { id: string; name: string }[]; defaultProductId?: string | null }) {
  const [sheet, setSheet] = useState<'lead' | 'project' | null>(null);
  const close = (open: boolean) => { if (!open) setSheet(null); };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button><Plus aria-hidden />Nuevo<ChevronDown aria-hidden className="opacity-70" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setSheet('lead')}><UserPlus aria-hidden />Prospecto</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setSheet('project')}><FolderPlus aria-hidden />Proyecto</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CreateLeadSheet workers={workers} products={products} defaultProductId={defaultProductId} open={sheet === 'lead'} onOpenChange={close} />
      <CreateProjectSheet clients={clients} open={sheet === 'project'} onOpenChange={close} />
    </>
  );
}
