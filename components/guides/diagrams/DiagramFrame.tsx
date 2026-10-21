'use client';

import './diagram.css';
import { useRef, type ReactNode } from 'react';

/**
 * Marco común de los diagramas: tarjeta con scroll horizontal propio, pie y
 * versión en lista. Al pasar el mouse sobre un nodo atenúa todo lo que no
 * está conectado con él.
 */
export function DiagramFrame({ titulo, descripcion, lista, minWidth, children }: {
  titulo: string;
  descripcion?: ReactNode;
  lista: ReactNode;
  minWidth: number;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const highlight = (target: EventTarget | null) => {
    const root = ref.current;
    if (!root) return;
    const node = target instanceof Element ? target.closest('[data-node]') : null;
    root.querySelectorAll('.is-on').forEach((el) => el.classList.remove('is-on'));
    if (!node) return root.classList.remove('is-hovering');
    const id = node.getAttribute('data-node');
    node.classList.add('is-on');
    root.querySelectorAll(`[data-edge]`).forEach((edge) => {
      const from = edge.getAttribute('data-from');
      const to = edge.getAttribute('data-to');
      if (from !== id && to !== id) return;
      edge.classList.add('is-on');
      root.querySelector(`[data-node="${from === id ? to : from}"]`)?.classList.add('is-on');
    });
    root.classList.add('is-hovering');
  };

  return (
    <figure className="my-6">
      <div
        ref={ref}
        className="dg overflow-x-auto rounded-xl border bg-card p-4"
        onPointerOver={(event) => highlight(event.target)}
        onPointerLeave={() => highlight(null)}
      >
        <div style={{ minWidth }}>{children}</div>
      </div>
      {descripcion && <figcaption className="mt-2 text-sm leading-6 text-muted-foreground">{descripcion}</figcaption>}
      <details className="mt-2 text-sm text-muted-foreground">
        <summary className="cursor-pointer select-none hover:text-foreground">Ver «{titulo}» como lista</summary>
        <div className="mt-2 rounded-xl border bg-card px-4 py-3 leading-6 text-slate-700">{lista}</div>
      </details>
    </figure>
  );
}
