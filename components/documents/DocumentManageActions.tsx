'use client';

import { useId, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Archive,
  ArchiveRestore,
  Eye,
  EyeOff,
  FileUp,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { formatBytes } from '@/components/client/client-formatters';
import { cn } from '@/lib/utils';
import { DOCUMENT_TYPES, DOCUMENT_TYPE_LABELS, DocumentIcon } from './document-meta';

export type ManagedDocument = {
  id: string;
  originalName: string;
  type: string;
  size: number;
  mimeType?: string | null;
  visibleToClient: boolean;
  archivedAt?: string | null;
};

async function request(path: string, init: RequestInit) {
  const response = await fetch(`/api/backend/documents/${path}`, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error || body?.message || 'No se pudo completar la acción');
  return body;
}

const patch = (id: string, data: Record<string, unknown>) =>
  request(id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

/** Botón «Editar» + menú de acciones; la edición vive en un panel lateral único. */
export function DocumentManageActions({ document }: { document: ManagedDocument }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, startTransition] = useTransition();

  const setArchived = (archived: boolean) =>
    startTransition(async () => {
      try {
        await patch(document.id, { archived });
        router.refresh();
        toast.success(archived ? 'Documento archivado' : 'Documento restaurado', {
          description: document.originalName,
          action: archived
            ? {
                label: 'Deshacer',
                onClick: () => patch(document.id, { archived: false }).then(() => router.refresh()),
              }
            : undefined,
        });
      } catch (error) {
        toast.error((error as Error).message);
      }
    });

  const remove = () =>
    startTransition(async () => {
      try {
        await request(document.id, { method: 'DELETE' });
        setConfirmDelete(false);
        router.refresh();
        toast.success('Documento eliminado', { description: document.originalName });
      } catch (error) {
        setConfirmDelete(false);
        toast.error((error as Error).message);
      }
    });

  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>
        <Pencil aria-hidden />
        Editar
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label={`Más acciones para ${document.originalName}`}
          >
            <MoreHorizontal aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => setEditing(true)}>
            <FileUp aria-hidden />
            Reemplazar archivo
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setArchived(!document.archivedAt)}>
            {document.archivedAt ? <ArchiveRestore aria-hidden /> : <Archive aria-hidden />}
            {document.archivedAt ? 'Restaurar' : 'Archivar'}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setConfirmDelete(true)}
            className="text-rose-700 focus:bg-rose-50 focus:text-rose-800"
          >
            <Trash2 aria-hidden />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DocumentEditSheet document={document} open={editing} onOpenChange={setEditing} />

      <AlertDialog open={confirmDelete} onOpenChange={(open) => !pending && setConfirmDelete(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar este documento?</AlertDialogTitle>
            <AlertDialogDescription>
              «{document.originalName}» y su archivo almacenado se eliminarán de forma permanente. Si
              solo quieres ocultarlo, archívalo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
            <Button type="button" variant="destructive" disabled={pending} onClick={remove}>
              {pending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function DocumentEditSheet({
  document,
  open,
  onOpenChange,
}: {
  document: ManagedDocument;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-5">
          <SheetTitle>Editar documento</SheetTitle>
          <SheetDescription>Los cambios se aplican juntos al guardar.</SheetDescription>
        </SheetHeader>
        {/* Se monta de nuevo en cada apertura para partir de los datos actuales. */}
        {open && <DocumentEditForm document={document} onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function DocumentEditForm({ document, onDone }: { document: ManagedDocument; onDone: () => void }) {
  const router = useRouter();
  const id = useId();
  const fileInput = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(document.originalName);
  const [nameTouched, setNameTouched] = useState(false);
  const [type, setType] = useState(document.type);
  const [visible, setVisible] = useState(document.visibleToClient);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pickFile = (next: File | null) => {
    setFile(next);
    // Al reemplazar, el nombre sigue al archivo nuevo salvo que se haya editado a mano.
    if (!nameTouched) setName(next?.name ?? document.originalName);
  };

  const dirty =
    file !== null ||
    name.trim() !== document.originalName ||
    type !== document.type ||
    visible !== document.visibleToClient;

  const save = () =>
    startTransition(async () => {
      setError(null);
      try {
        if (file) {
          const data = new FormData();
          data.append('file', file);
          await request(`${document.id}/replace`, { method: 'POST', body: data });
        }
        await patch(document.id, { originalName: name.trim(), type, visibleToClient: visible });
        router.refresh();
        toast.success(file ? 'Archivo reemplazado' : 'Documento actualizado', {
          description: name.trim(),
        });
        onDone();
      } catch (err) {
        setError((err as Error).message);
      }
    });

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        if (dirty) save();
      }}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 space-y-6 overflow-y-auto p-5">
        <div className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-card">
            <DocumentIcon name={document.originalName} mimeType={document.mimeType} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{document.originalName}</p>
            <p className="text-xs text-slate-500">
              {DOCUMENT_TYPE_LABELS[document.type] || document.type} · {formatBytes(document.size)}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${id}-name`} className="text-sm font-medium text-slate-800">
            Nombre
          </label>
          <input
            id={`${id}-name`}
            required
            maxLength={255}
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameTouched(true);
            }}
            className="min-h-10 w-full rounded-lg border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor={`${id}-type`} className="text-sm font-medium text-slate-800">
            Tipo
          </label>
          <select
            id={`${id}-type`}
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="min-h-10 w-full rounded-lg border bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {DOCUMENT_TYPES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-1.5 text-sm font-medium text-slate-800">Visibilidad</legend>
          {[
            {
              value: false,
              icon: EyeOff,
              title: 'Solo equipo',
              hint: 'El cliente no lo ve en su panel.',
            },
            {
              value: true,
              icon: Eye,
              title: 'Visible al cliente',
              hint: 'El cliente puede verlo y descargarlo.',
            },
          ].map((option) => (
            <label
              key={String(option.value)}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring',
                visible === option.value
                  ? 'border-brand-button bg-brand-button/10'
                  : 'hover:bg-slate-50'
              )}
            >
              <input
                type="radio"
                name={`${id}-visibility`}
                checked={visible === option.value}
                onChange={() => setVisible(option.value)}
                className="sr-only"
              />
              <option.icon
                size={18}
                aria-hidden
                className={cn('mt-0.5', visible === option.value ? 'text-brand-button' : 'text-slate-500')}
              />
              <span>
                <span className="block text-sm font-medium text-slate-900">{option.title}</span>
                <span className="block text-xs text-slate-500">{option.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="space-y-1.5">
          <p className="text-sm font-medium text-slate-800">Archivo</p>
          <input
            ref={fileInput}
            id={`${id}-file`}
            type="file"
            className="sr-only"
            onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
          />
          {file ? (
            <div className="flex items-center gap-3 rounded-xl border border-brand-button/40 bg-brand-button/5 p-3">
              <FileUp size={18} aria-hidden className="shrink-0 text-brand-button" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {formatBytes(file.size)} · reemplazará al archivo actual al guardar
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Quitar archivo nuevo"
                onClick={() => {
                  pickFile(null);
                  if (fileInput.current) fileInput.current.value = '';
                }}
              >
                <X aria-hidden />
              </Button>
            </div>
          ) : (
            <label
              htmlFor={`${id}-file`}
              className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed p-5 text-center transition-colors hover:bg-slate-50"
            >
              <FileUp size={18} aria-hidden className="text-slate-500" />
              <span className="text-sm font-medium text-slate-800">Reemplazar por otro archivo</span>
              <span className="text-xs text-slate-500">
                Conserva el historial y los pagos que lo usan como respaldo.
              </span>
            </label>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2 border-t p-4">
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={!dirty || pending || !name.trim()}>
          {pending ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </div>
    </form>
  );
}
