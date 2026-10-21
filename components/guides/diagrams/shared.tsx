import type { ReactNode } from 'react';

export type Tono = 'default' | 'brand' | 'ok' | 'warn' | 'info';

export type NodoBase = {
  id: string;
  label: string;
  sub?: string;
  tono?: Tono;
  /** Pantalla real a la que lleva el nodo. */
  href?: string;
  punteado?: boolean;
  /** Número en un círculo rojo, para remitir a una lista de problemas. */
  badge?: string | number;
};

export type Punto = { x: number; y: number };

/** Ancho de referencia del viewBox: el diagrama escala al ancho de la guía. */
export const ANCHO = 800;

export function Nodo({ nodo, x, y, w, h }: { nodo: NodoBase; x: number; y: number; w: number; h: number }) {
  const cx = x + w / 2;
  const box = (
    <>
      <rect className="dg-box" x={x} y={y} width={w} height={h} rx={9} />
      <text className="dg-t" x={cx} y={nodo.sub ? y + h / 2 - 3 : y + h / 2 + 4.5} textAnchor="middle">{nodo.label}</text>
      {nodo.sub && <text className="dg-s" x={cx} y={y + h / 2 + 13} textAnchor="middle">{nodo.sub}</text>}
    </>
  );
  return (
    <g data-node={nodo.id} className={`dg-node dg-${nodo.tono ?? 'default'}${nodo.punteado ? ' is-dashed' : ''}`}>
      {/* Fuera del orden de tabulación: los mismos enlaces están en «Ver como lista». */}
      {nodo.href ? <a href={nodo.href} tabIndex={-1}>{box}</a> : box}
      {nodo.badge !== undefined && (
        <>
          <circle className="dg-badge" cx={x + w - 2} cy={y + 2} r={10} />
          <text className="dg-badge-t" x={x + w - 2} y={y + 6} textAnchor="middle">{nodo.badge}</text>
        </>
      )}
    </g>
  );
}

export type EstiloFlecha = 'normal' | 'punteada' | 'problema' | 'ok';

/** Flecha: trazo, punta calculada con el último tramo y etiqueta opcional. */
export function Flecha({ de, a, d, fin, desde, label, labelEn, labelAncla = 'middle', estilo = 'normal', punta = true, capa = 'trazo' }: {
  de: string;
  a: string;
  d: string;
  fin: Punto;
  /** Punto desde el que llega el último tramo (define el ángulo de la punta). */
  desde: Punto;
  label?: string;
  labelEn?: Punto;
  labelAncla?: 'start' | 'middle' | 'end';
  estilo?: EstiloFlecha;
  punta?: boolean;
  /** Se dibuja en dos pasadas: el trazo antes de las cajas y la etiqueta después, para que ninguna caja la tape. */
  capa?: 'trazo' | 'etiqueta';
}) {
  const clase = { normal: '', punteada: ' is-dashed', problema: ' is-problem', ok: ' is-ok' }[estilo];
  if (capa === 'etiqueta') {
    if (!label || !labelEn) return null;
    return (
      <g data-edge="" data-from={de} data-to={a} className={`dg-edge${clase}`}>
        <text className="dg-edge-t" x={labelEn.x} y={labelEn.y} textAnchor={labelAncla}>{label}</text>
      </g>
    );
  }
  return (
    <g data-edge="" data-from={de} data-to={a} className={`dg-edge${clase}`}>
      <path d={d} />
      {punta && <polygon className="dg-head" points={puntaFlecha(desde, fin)} />}
    </g>
  );
}

function puntaFlecha(desde: Punto, fin: Punto) {
  const angle = Math.atan2(fin.y - desde.y, fin.x - desde.x);
  const size = 7;
  const spread = 0.45;
  const p1 = { x: fin.x - size * Math.cos(angle - spread), y: fin.y - size * Math.sin(angle - spread) };
  const p2 = { x: fin.x - size * Math.cos(angle + spread), y: fin.y - size * Math.sin(angle + spread) };
  return `${fin.x},${fin.y} ${p1.x.toFixed(1)},${p1.y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
}

/** Texto de varias líneas: cada `\n` es un renglón nuevo. */
export function Lineas({ texto, x, y, className = 'dg-note', ancla = 'middle', alto = 15 }: { texto: string; x: number; y: number; className?: string; ancla?: 'start' | 'middle' | 'end'; alto?: number }) {
  return (
    <text className={className} x={x} y={y} textAnchor={ancla}>
      {texto.split('\n').map((linea, index) => <tspan key={index} x={x} dy={index === 0 ? 0 : alto}>{linea}</tspan>)}
    </text>
  );
}

export const lineasDe = (texto?: string) => (texto ? texto.split('\n').length : 0);

/** Nombre del nodo para la versión en lista, con enlace si lo tiene. */
export function NombreNodo({ nodo }: { nodo: NodoBase }): ReactNode {
  const texto = nodo.sub ? `${nodo.label} (${nodo.sub})` : nodo.label;
  return nodo.href ? <a href={nodo.href} className="font-medium text-blue-700 underline underline-offset-4">{texto}</a> : <strong className="font-semibold text-foreground">{texto}</strong>;
}

export const svgProps = (alto: number, titulo: string, ancho = ANCHO) => ({
  viewBox: `0 0 ${Math.ceil(ancho)} ${Math.ceil(alto)}`,
  role: 'img' as const,
  'aria-label': titulo,
});
