'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Piezas comunes de los tableros Kanban del panel (Tareas, Leads, proyecto):
 * columnas sobre superficie neutra, tarjetas arrastrables y desplazamiento
 * horizontal con barra visible (sin arrastrar el fondo para navegar).
 */

export type KanbanColumnDef = { id: string; title: string; dot: string };

/** Mantener presionada la tarjeta este tiempo activa el arrastre; un clic corto la abre. */
const LONG_PRESS_MS = 200;
/** Si el puntero se mueve más que esto antes de tiempo, no es una pulsación larga. */
const MOVE_TOLERANCE = 6;
const EDGE = 64;

type DragSession = { pointerId: number; startX: number; startY: number; timer: number; active: boolean; ghost?: HTMLElement; offsetX: number; offsetY: number; key: string | null; x: number; frame?: number; scroller: HTMLElement | null; cleanup: () => void };

/**
 * Arrastrar y soltar tarjetas entre columnas (o celdas de una fila) con pulsación
 * larga: el clic corto queda libre para abrir la tarjeta. Funciona con mouse,
 * lápiz y táctil; Escape cancela. Las zonas de destino se marcan con `dropProps`.
 */
export function useKanbanDrag<T extends { id: string }>(_items: T[], onDrop: (item: T, target: string, lane?: string) => void) {
  const [dragged, setDragged] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const onDropRef = useRef(onDrop);
  const sessionRef = useRef<DragSession | null>(null);
  useEffect(() => {
    onDropRef.current = onDrop;
  });
  useEffect(() => () => sessionRef.current?.cleanup(), []);

  const dragProps = (item: T) => ({
    'data-kanban-card': item.id,
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
      if (event.button !== 0 || sessionRef.current) return;
      const target = event.target as HTMLElement;
      // Los controles internos (menú, enlaces externos) no arrastran.
      if (target.closest('a, button, input, select, textarea') && !target.closest('[data-card-open]')) return;
      const card = event.currentTarget;
      const rect = card.getBoundingClientRect();
      const session: DragSession = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        x: event.clientX,
        offsetX: event.clientX - rect.left,
        offsetY: event.clientY - rect.top,
        active: false,
        key: null,
        scroller: card.closest<HTMLElement>('[data-kanban-scroller]'),
        timer: 0,
        cleanup: () => {},
      };

      const zoneAt = (x: number, y: number) => document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop-key]') ?? null;
      const autoScroll = () => {
        const scroller = session.scroller;
        if (!session.active || !scroller) return;
        const box = scroller.getBoundingClientRect();
        if (session.x < box.left + EDGE) scroller.scrollLeft -= 14;
        else if (session.x > box.right - EDGE) scroller.scrollLeft += 14;
        session.frame = requestAnimationFrame(autoScroll);
      };
      const start = () => {
        session.active = true;
        const ghost = card.cloneNode(true) as HTMLElement;
        ghost.removeAttribute('id');
        Object.assign(ghost.style, {
          position: 'fixed',
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          margin: '0',
          pointerEvents: 'none',
          zIndex: '60',
          opacity: '0.95',
          transform: 'rotate(1.5deg)',
          boxShadow: '0 18px 40px -12px rgb(0 0 0 / 0.6)',
          listStyle: 'none',
        });
        document.body.appendChild(ghost);
        session.ghost = ghost;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
        navigator.vibrate?.(10);
        setDragged(item.id);
        session.frame = requestAnimationFrame(autoScroll);
      };
      const onMove = (move: PointerEvent) => {
        if (move.pointerId !== session.pointerId) return;
        session.x = move.clientX;
        if (!session.active) {
          if (Math.hypot(move.clientX - session.startX, move.clientY - session.startY) > MOVE_TOLERANCE) finish();
          return;
        }
        move.preventDefault();
        if (session.ghost) session.ghost.style.translate = `${move.clientX - session.startX}px ${move.clientY - session.startY}px`;
        const key = zoneAt(move.clientX, move.clientY)?.dataset.dropKey ?? null;
        if (key !== session.key) {
          session.key = key;
          setDropTarget(key);
        }
      };
      const onUp = (up: PointerEvent) => {
        if (up.pointerId !== session.pointerId) return;
        if (session.active) {
          const zone = zoneAt(up.clientX, up.clientY);
          // El clic que sigue a soltar no debe abrir la tarjeta.
          const swallow = (click: MouseEvent) => {
            click.stopPropagation();
            click.preventDefault();
          };
          window.addEventListener('click', swallow, { capture: true, once: true });
          setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
          if (zone?.dataset.dropTarget) onDropRef.current(item, zone.dataset.dropTarget, zone.dataset.dropLane || undefined);
        }
        finish();
      };
      const onKey = (key: KeyboardEvent) => {
        if (key.key === 'Escape') finish();
      };
      // Mientras se arrastra, el gesto no debe desplazar la página ni seleccionar texto.
      const onTouchMove = (touch: TouchEvent) => {
        if (session.active) touch.preventDefault();
      };
      const finish = () => {
        window.clearTimeout(session.timer);
        if (session.frame) cancelAnimationFrame(session.frame);
        session.ghost?.remove();
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
        window.removeEventListener('pointercancel', onUp);
        window.removeEventListener('keydown', onKey);
        window.removeEventListener('touchmove', onTouchMove);
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        if (session.active) {
          setDragged(null);
          setDropTarget(null);
        }
        sessionRef.current = null;
      };
      session.cleanup = finish;
      session.timer = window.setTimeout(start, LONG_PRESS_MS);
      window.addEventListener('pointermove', onMove, { passive: false });
      window.addEventListener('pointerup', onUp);
      window.addEventListener('pointercancel', onUp);
      window.addEventListener('keydown', onKey);
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      sessionRef.current = session;
    },
    // Evita el arrastre nativo del navegador (enlaces, texto) y el menú de mantener presionado.
    onDragStart: (event: React.DragEvent) => event.preventDefault(),
    onContextMenu: (event: React.MouseEvent) => {
      if (sessionRef.current) event.preventDefault();
    },
  });

  /** `key` identifica la zona resaltada; `target` y `lane` viajan al callback (p. ej. estado y persona). */
  const dropProps = (key: string, target: string, lane?: string) => ({
    'data-drop-key': key,
    'data-drop-target': target,
    ...(lane ? { 'data-drop-lane': lane } : {}),
  });

  return { dragged, dropTarget, dragProps, dropProps };
}

/** Barra de desplazamiento fina y siempre visible para recorrer las columnas. */
export const kanbanScrollbar =
  '[scrollbar-color:var(--color-border)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent';

/**
 * Contenedor horizontal de columnas. `fit` reparte el ancho entre pocas columnas;
 * sin `fit`, cada columna mide `columnWidth` y el resto se alcanza con la barra
 * o con ← → del teclado.
 */
export function KanbanScroller({ label, columns, fit = false, columnWidth = 288, children }: { label: string; columns: number; fit?: boolean; columnWidth?: number; children: ReactNode }) {
  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') || event.target !== event.currentTarget) return;
    event.preventDefault();
    const container = event.currentTarget;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.scrollBy({ left: (event.key === 'ArrowRight' ? 1 : -1) * Math.max(container.clientWidth * 0.8, columnWidth), behavior: reduce ? 'auto' : 'smooth' });
  };
  return (
    <div role="region" data-kanban-scroller aria-label={`${label}. Usa ← y → para desplazarte entre columnas.`} tabIndex={0} onKeyDown={onKeyDown} className={cn('-mx-1 overflow-x-auto px-1 pb-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', kanbanScrollbar)}>
      <div
        className="grid gap-3"
        style={{
          gridTemplateColumns: fit ? `repeat(${columns}, minmax(${columnWidth - 100}px, 1fr))` : `repeat(${columns}, ${columnWidth}px)`,
          minWidth: fit ? columns * (columnWidth - 100) + (columns - 1) * 12 : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function KanbanColumn({
  column,
  count,
  meta,
  over = false,
  highlighted = false,
  onAdd,
  dropProps,
  note,
  footer,
  emptyLabel = 'Arrastra tarjetas aquí',
  children,
}: {
  column: KanbanColumnDef;
  count: number;
  /** Texto a la derecha del título en lugar del conteo (p. ej. «3 / 2»). */
  meta?: ReactNode;
  /** Pasó su límite: se tiñe. */
  over?: boolean;
  highlighted?: boolean;
  onAdd?: () => void;
  dropProps?: Record<string, unknown>;
  note?: ReactNode;
  footer?: ReactNode;
  emptyLabel?: string;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`col-${column.id}`}
      {...dropProps}
      className={cn(
        'flex max-h-[calc(100dvh-13rem)] min-h-[420px] flex-col gap-2 rounded-xl border bg-card/40 p-2.5 transition-colors',
        over && 'border-rose-500/50 bg-rose-500/[0.04]',
        highlighted && 'border-ring bg-muted/40',
      )}
    >
      <div className="flex items-center gap-2 px-1 pb-1 pt-0.5 text-[13px] font-semibold">
        <span aria-hidden className={cn('size-2 shrink-0 rounded-full', column.dot)} />
        <h2 id={`col-${column.id}`} className="min-w-0 truncate">
          {column.title}
        </h2>
        <span className={cn('ml-auto shrink-0 text-xs font-medium tabular-nums text-muted-foreground', over && 'font-semibold text-rose-400')}>{meta ?? count}</span>
        {onAdd && (
          <button type="button" onClick={onAdd} aria-label={`Añadir en ${column.title}`} className="grid size-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
            <Plus className="size-3.5" />
          </button>
        )}
      </div>
      {note}
      <ul className={cn('-mr-1 flex flex-1 flex-col gap-2 overflow-y-auto pr-1', kanbanScrollbar)}>
        {children}
        {count === 0 && <li className="grid h-20 shrink-0 place-items-center rounded-lg border border-dashed px-3 text-center text-xs text-muted-foreground">{emptyLabel}</li>}
      </ul>
      {footer}
    </section>
  );
}

/** Tarjeta base: superficie, borde y estados (bloqueada, atenuada, arrastrándose). */
export function KanbanCard({
  dragProps,
  dragging = false,
  blocked = false,
  dimmed = false,
  focused = false,
  compact = false,
  id,
  onOpen,
  children,
}: {
  dragProps?: Record<string, unknown>;
  /** Clic corto en la tarjeta (fuera de sus controles) la abre. */
  onOpen?: () => void;
  dragging?: boolean;
  blocked?: boolean;
  dimmed?: boolean;
  focused?: boolean;
  compact?: boolean;
  id?: string;
  children: ReactNode;
}) {
  return (
    <li
      id={id}
      {...dragProps}
      onClick={
        onOpen &&
        ((event) => {
          const target = event.target as HTMLElement;
          if (target.closest('a, button, input, select, textarea') && !target.closest('[data-card-open]')) return;
          onOpen();
        })
      }
      className={cn(
        'group relative shrink-0 cursor-pointer touch-manipulation select-none rounded-lg border bg-card text-[13px] transition-colors hover:border-muted-foreground/40 [-webkit-touch-callout:none]',
        compact ? 'space-y-1 p-2' : 'space-y-2 p-2.5',
        blocked && 'border-rose-500/45 shadow-[inset_3px_0_0_var(--color-rose-400)]',
        focused && 'border-ring ring-2 ring-ring/30',
        dimmed && 'opacity-60',
        dragging && 'opacity-40',
      )}
    >
      {children}
    </li>
  );
}

export function KanbanAddButton({ onClick, label = 'Añadir' }: { onClick: () => void; label?: string }) {
  return (
    <button type="button" onClick={onClick} className="flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-left text-xs text-muted-foreground hover:border-muted-foreground/60 hover:text-foreground">
      <Plus className="size-3.5" aria-hidden />
      {label}
    </button>
  );
}

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

export function KanbanAvatar({ name, me = false }: { name: string; me?: boolean }) {
  return (
    <span aria-hidden className={cn('grid size-6 shrink-0 place-items-center rounded-full text-[9.5px] font-bold', me ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground')}>
      {initialsOf(name)}
    </span>
  );
}
