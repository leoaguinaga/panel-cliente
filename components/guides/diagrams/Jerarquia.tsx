import type { ReactNode } from 'react';
import { DiagramFrame } from './DiagramFrame';
import { ANCHO, Nodo, NombreNodo, svgProps, type NodoBase } from './shared';

export type NodoArbol = NodoBase & { hijos?: NodoArbol[] };
/** Franja de fondo que agrupa niveles enteros, como «lo ve el cliente». */
export type Banda = { label: string; niveles: [number, number] };
/** Recuadro punteado alrededor de nodos de distintas ramas, como un sprint. */
export type Grupo = { label: string; nodos: string[] };

const FILA = 112;
const CAJA_MAX = [240, 230, 200, 180];
const CAJA_MIN = 90;

type Ubicado = { nodo: NodoArbol; nivel: number; cx: number; w: number; h: number; y: number; padre?: Ubicado };

/** Qué contiene a qué. Las hojas se reparten el ancho y cada padre queda centrado sobre sus hijos. */
export function Jerarquia({ titulo, raiz, bandas = [], grupos = [], descripcion }: {
  titulo: string;
  raiz: NodoArbol;
  bandas?: Banda[];
  grupos?: Grupo[];
  descripcion?: ReactNode;
}) {
  const hojas = (nodo: NodoArbol): number => (nodo.hijos?.length ? nodo.hijos.reduce((total, hijo) => total + hojas(hijo), 0) : 1);
  const margen = bandas.length ? 20 : 8;
  const slot = (ANCHO - margen * 2) / hojas(raiz);
  const top = bandas.some((banda) => banda.niveles[0] === 0) ? 44 : 8;
  const altoCaja = (nodo: NodoArbol) => (nodo.sub ? 54 : 40);

  const ubicados: Ubicado[] = [];
  let cursor = margen;
  const ubicar = (nodo: NodoArbol, nivel: number, padre?: Ubicado): Ubicado => {
    const propio: Ubicado = { nodo, nivel, cx: 0, w: 0, h: altoCaja(nodo), y: top + nivel * FILA, padre };
    ubicados.push(propio);
    const inicio = cursor;
    if (nodo.hijos?.length) nodo.hijos.forEach((hijo) => ubicar(hijo, nivel + 1, propio));
    else cursor += slot;
    const span = cursor - inicio;
    const hijosUbicados = ubicados.filter((u) => u.padre === propio);
    propio.cx = hijosUbicados.length ? (hijosUbicados[0].cx + hijosUbicados.at(-1)!.cx) / 2 : inicio + span / 2;
    propio.w = Math.max(CAJA_MIN, Math.min(CAJA_MAX[Math.min(nivel, CAJA_MAX.length - 1)], span - 16));
    return propio;
  };
  ubicar(raiz, 0);
  const porId = new Map(ubicados.map((u) => [u.nodo.id, u]));

  const rectGrupos = grupos.map((grupo) => {
    const miembros = grupo.nodos.map((id) => porId.get(id)).filter((u): u is Ubicado => Boolean(u));
    if (!miembros.length) return null;
    const x1 = Math.min(...miembros.map((u) => u.cx - u.w / 2)) - 10;
    const x2 = Math.max(...miembros.map((u) => u.cx + u.w / 2)) + 10;
    const y1 = Math.min(...miembros.map((u) => u.y)) - 8;
    const y2 = Math.max(...miembros.map((u) => u.y + u.h)) + 34;
    return { grupo, x1, x2, y1, y2, nivel: Math.max(...miembros.map((u) => u.nivel)) };
  }).filter((g) => g !== null);

  const fondoNivel = (nivel: number) => {
    const delNivel = ubicados.filter((u) => u.nivel === nivel);
    const base = Math.max(top + nivel * FILA, ...delNivel.map((u) => u.y + u.h));
    return Math.max(base, ...rectGrupos.filter((g) => g.nivel === nivel).map((g) => g.y2));
  };
  const niveles = Math.max(...ubicados.map((u) => u.nivel));
  const rectBandas = bandas.map((banda) => ({
    banda,
    y1: top + banda.niveles[0] * FILA - 36,
    y2: fondoNivel(banda.niveles[1]) + 12,
  }));
  const alto = Math.max(fondoNivel(niveles), ...rectBandas.map((b) => b.y2)) + 8;

  const lista = (
    <ul className="list-disc space-y-1 pl-5">
      <ItemLista nodo={raiz} />
      {grupos.map((grupo) => (
        <li key={grupo.label} className="list-none text-muted-foreground">
          ⬚ {grupo.label}: {grupo.nodos.map((id) => porId.get(id)?.nodo.label).filter(Boolean).join(', ')}
        </li>
      ))}
    </ul>
  );

  return (
    <DiagramFrame titulo={titulo} descripcion={descripcion} lista={lista} minWidth={Math.max(560, hojas(raiz) * 84)}>
      <svg {...svgProps(alto, titulo)}>
        {rectBandas.map(({ banda, y1, y2 }) => (
          <g key={banda.label}>
            <rect className="dg-lane" x={2} y={y1} width={ANCHO - 4} height={y2 - y1} rx={10} />
            <text className="dg-lane-t" x={16} y={y1 + 17}>{banda.label.toUpperCase()}</text>
          </g>
        ))}
        {ubicados.filter((u) => u.padre).map((u) => {
          const padre = u.padre!;
          const sale = padre.y + padre.h;
          const medio = sale + (u.y - sale) / 2;
          return (
            <g key={u.nodo.id} data-edge="" data-from={padre.nodo.id} data-to={u.nodo.id} className="dg-edge">
              <path d={`M${padre.cx} ${sale}V${medio}H${u.cx}V${u.y}`} />
            </g>
          );
        })}
        {rectGrupos.map(({ grupo, x1, x2, y1, y2 }) => (
          <g key={grupo.label}>
            <rect className="dg-group" x={x1} y={y1} width={x2 - x1} height={y2 - y1} rx={10} />
            <text className="dg-group-t" x={x1 + 12} y={y2 - 10}>{grupo.label}</text>
          </g>
        ))}
        {ubicados.map((u) => (
          <Nodo key={u.nodo.id} nodo={u.nodo} x={u.cx - u.w / 2} y={u.y} w={u.w} h={u.h} />
        ))}
      </svg>
    </DiagramFrame>
  );
}

function ItemLista({ nodo }: { nodo: NodoArbol }) {
  return (
    <li>
      <NombreNodo nodo={nodo} />
      {nodo.hijos?.length ? (
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {nodo.hijos.map((hijo) => <ItemLista key={hijo.id} nodo={hijo} />)}
        </ul>
      ) : null}
    </li>
  );
}
