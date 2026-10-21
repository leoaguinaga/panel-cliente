import type { ReactNode } from 'react';
import { DiagramFrame } from './DiagramFrame';
import { ANCHO, Flecha, Nodo, NombreNodo, svgProps, type EstiloFlecha, type NodoBase, type Punto } from './shared';

export type NodoGrilla = NodoBase & { fila: number; col: number };
export type Arista = {
  de: string;
  a: string;
  label?: string;
  estilo?: EstiloFlecha;
  /** `false` para una relación sin sentido (línea sin punta). */
  flecha?: boolean;
};

const FILA = 130;
const CAJA_ALTO = 54;
const TOP = 16;

/**
 * Cómo se conectan las piezas. Los nodos van en una grilla (`fila`, `col`);
 * las aristas son rectas entre vecinos de fila o columna y curvas en diagonal.
 */
export function Relaciones({ titulo, nodos, aristas, descripcion }: {
  titulo: string;
  nodos: NodoGrilla[];
  aristas: Arista[];
  descripcion?: ReactNode;
}) {
  const columnas = Math.max(...nodos.map((nodo) => nodo.col)) + 1;
  const filas = Math.max(...nodos.map((nodo) => nodo.fila)) + 1;
  const celda = ANCHO / columnas;
  const cajaW = Math.min(170, celda - 96);
  const cx = (col: number) => celda * (col + 0.5);
  const cy = (fila: number) => TOP + FILA * fila + CAJA_ALTO / 2;
  const porId = new Map(nodos.map((nodo) => [nodo.id, nodo]));
  const alto = TOP * 2 + FILA * (filas - 1) + CAJA_ALTO + 8;
  const ancho = cajaW / 2, medio = CAJA_ALTO / 2;

  const trazo = (arista: Arista, capa: 'trazo' | 'etiqueta') => {
    const a = porId.get(arista.de);
    const b = porId.get(arista.a);
    if (!a || !b) return null;
    const ax = cx(a.col), ay = cy(a.fila), bx = cx(b.col), by = cy(b.fila);
    const punta = arista.flecha !== false;
    const hueco = punta ? 2 : 0;
    let d: string, desde: Punto, fin: Punto, labelEn: Punto, labelAncla: 'start' | 'middle' = 'middle';
    if (a.fila === b.fila) {
      const signo = bx > ax ? 1 : -1;
      const inicio = ax + signo * ancho;
      fin = { x: bx - signo * (ancho + hueco), y: by };
      desde = { x: inicio, y: ay };
      d = `M${inicio} ${ay}H${fin.x}`;
      labelEn = { x: (inicio + fin.x) / 2, y: ay - 8 };
    } else if (a.col === b.col) {
      const signo = by > ay ? 1 : -1;
      const inicio = ay + signo * medio;
      fin = { x: bx, y: by - signo * (medio + hueco) };
      desde = { x: ax, y: inicio };
      d = `M${ax} ${inicio}V${fin.y}`;
      labelEn = { x: ax + 10, y: (inicio + fin.y) / 2 + 4 };
      labelAncla = 'start';
    } else {
      // Sale vertical de A y entra de costado a B.
      const signoY = by > ay ? 1 : -1;
      const signoX = bx > ax ? 1 : -1;
      const inicio = { x: ax, y: ay + signoY * medio };
      fin = { x: bx - signoX * (ancho + hueco), y: by };
      const c1 = { x: ax, y: inicio.y + (by - inicio.y) * 0.8 };
      desde = { x: fin.x - signoX * Math.max(40, Math.abs(fin.x - ax) * 0.4), y: by };
      d = `M${inicio.x} ${inicio.y}C${c1.x} ${c1.y} ${desde.x} ${desde.y} ${fin.x} ${fin.y}`;
      labelEn = { x: (inicio.x + fin.x) / 2 + signoX * 20, y: (inicio.y + fin.y) / 2 - 2 };
    }
    return (
      <Flecha
        key={`${arista.de}-${arista.a}-${capa}`}
        capa={capa}
        de={arista.de}
        a={arista.a}
        d={d}
        desde={desde}
        fin={fin}
        punta={punta}
        label={arista.label}
        labelEn={labelEn}
        labelAncla={labelAncla}
        estilo={arista.estilo}
      />
    );
  };

  const lista = (
    <ul className="list-disc space-y-1 pl-5">
      {nodos.map((nodo) => {
        const salen = aristas.filter((arista) => arista.de === nodo.id && porId.has(arista.a));
        return (
          <li key={nodo.id}>
            <NombreNodo nodo={nodo} />
            {nodo.badge !== undefined && <span className="text-blue-700"> [{nodo.badge}]</span>}
            {salen.length > 0 && <> → {salen.map((arista) => `${porId.get(arista.a)!.label}${arista.label ? ` (${arista.label})` : ''}`).join(', ')}</>}
          </li>
        );
      })}
    </ul>
  );

  return (
    <DiagramFrame titulo={titulo} descripcion={descripcion} lista={lista} minWidth={Math.max(560, columnas * 180)}>
      <svg {...svgProps(alto, titulo)}>
        {aristas.map((arista) => trazo(arista, 'trazo'))}
        {nodos.map((nodo) => (
          <Nodo key={nodo.id} nodo={nodo} x={cx(nodo.col) - ancho} y={cy(nodo.fila) - medio} w={cajaW} h={CAJA_ALTO} />
        ))}
        {aristas.map((arista) => trazo(arista, 'etiqueta'))}
      </svg>
    </DiagramFrame>
  );
}
