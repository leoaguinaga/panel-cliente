import type { ReactNode } from 'react';
import { DiagramFrame } from './DiagramFrame';
import { ANCHO, Flecha, Nodo, NombreNodo, svgProps, type EstiloFlecha, type NodoBase, type Punto } from './shared';

export type Carril = { id: string; label: string };
export type Paso = NodoBase & {
  carril: string;
  /** Columna explícita; por defecto, la siguiente a la del paso anterior. */
  columna?: number;
};
export type FlechaCarril = { de: string; a: string; label?: string; estilo?: EstiloFlecha };

const LABEL_W = 88;
const CARRIL_ALTO = 80;
const CAJA_ALTO = 50;
const TOP = 6;

/**
 * Quién hace qué y en qué orden. Sin `flechas`, une cada paso con el siguiente.
 * Una flecha hacia una columna anterior se dibuja como retorno.
 */
export function Carriles({ titulo, carriles, pasos, flechas, descripcion }: {
  titulo: string;
  carriles: Carril[];
  pasos: Paso[];
  flechas?: FlechaCarril[];
  descripcion?: ReactNode;
}) {
  const filaDe = new Map(carriles.map((carril, i) => [carril.id, i]));
  const ubicados = pasos.reduce<(Paso & { columna: number; fila: number })[]>((lista, paso) => {
    const columna = paso.columna ?? (lista.length ? lista[lista.length - 1].columna + 1 : 0);
    return [...lista, { ...paso, columna, fila: filaDe.get(paso.carril) ?? 0 }];
  }, []);
  const porId = new Map(ubicados.map((paso) => [paso.id, paso]));
  const columnas = Math.max(...ubicados.map((paso) => paso.columna)) + 1;
  // Con muchas columnas el viewBox crece en vez de apretar las cajas.
  const ancho = Math.max(ANCHO, LABEL_W + 10 + columnas * 122);
  const colW = (ancho - LABEL_W - 10) / columnas;
  const cajaW = Math.min(124, colW - 20);
  const cx = (columna: number) => LABEL_W + colW * (columna + 0.5);
  const cy = (fila: number) => TOP + CARRIL_ALTO * (fila + 0.5);
  const alto = TOP * 2 + CARRIL_ALTO * carriles.length;

  const uniones: FlechaCarril[] = flechas ?? ubicados.slice(1).map((paso, i) => ({ de: ubicados[i].id, a: paso.id }));

  const trazo = (union: FlechaCarril, capa: 'trazo' | 'etiqueta') => {
    const a = porId.get(union.de);
    const b = porId.get(union.a);
    if (!a || !b) return null;
    const ax = cx(a.columna), ay = cy(a.fila), bx = cx(b.columna), by = cy(b.fila);
    const medio = CAJA_ALTO / 2, lado = cajaW / 2;
    const retorno = b.columna < a.columna;
    let d: string, desde: Punto, fin: Punto, labelEn: Punto;
    if (a.fila === b.fila && !retorno) {
      desde = { x: ax + lado, y: ay };
      fin = { x: bx - lado - 2, y: by };
      d = `M${desde.x} ${ay}H${fin.x}`;
      labelEn = { x: (desde.x + fin.x) / 2, y: ay - 8 };
    } else if (a.fila === b.fila) {
      const fondo = ay + medio + 14;
      desde = { x: bx, y: fondo };
      fin = { x: bx, y: by + medio + 2 };
      d = `M${ax} ${ay + medio}V${fondo}H${bx}V${fin.y}`;
      labelEn = { x: (ax + bx) / 2, y: fondo - 6 };
    } else if (a.columna === b.columna) {
      const baja = b.fila > a.fila;
      desde = { x: ax, y: ay + (baja ? medio : -medio) };
      fin = { x: bx, y: by + (baja ? -medio - 2 : medio + 2) };
      d = `M${desde.x} ${desde.y}V${fin.y}`;
      labelEn = { x: ax + 8, y: (desde.y + fin.y) / 2 + 4 };
    } else {
      const baja = b.fila > a.fila;
      const salida = ay + (baja ? medio : -medio);
      fin = { x: retorno ? bx + lado + 2 : bx - lado - 2, y: by };
      desde = { x: ax, y: by };
      d = `M${ax} ${salida}V${by}H${fin.x}`;
      labelEn = { x: (ax + fin.x) / 2, y: by - 8 };
    }
    return (
      <Flecha
        key={`${union.de}-${union.a}-${capa}`}
        capa={capa}
        de={union.de}
        a={union.a}
        d={d}
        desde={desde}
        fin={fin}
        label={union.label}
        labelEn={labelEn}
        estilo={union.estilo ?? (retorno ? 'problema' : 'normal')}
      />
    );
  };

  const lista = (
    <ol className="list-decimal space-y-1 pl-5">
      {ubicados.map((paso) => (
        <li key={paso.id}>
          <span className="text-muted-foreground">{carriles[paso.fila]?.label}:</span> <NombreNodo nodo={paso} />
          {uniones.filter((union) => union.de === paso.id && porId.get(union.a) && porId.get(union.a)!.columna < paso.columna).map((union) => (
            <span key={union.a}> (si {union.label ?? 'hace falta'}, vuelve a {porId.get(union.a)!.label})</span>
          ))}
        </li>
      ))}
    </ol>
  );

  return (
    <DiagramFrame titulo={titulo} descripcion={descripcion} lista={lista} minWidth={Math.round(Math.max(560, ancho * 0.72))}>
      <svg {...svgProps(alto, titulo, ancho)}>
        {carriles.map((carril, i) => (
          <g key={carril.id}>
            <rect className="dg-lane" x={2} y={TOP + CARRIL_ALTO * i + 3} width={ancho - 4} height={CARRIL_ALTO - 6} rx={8} />
            <text className="dg-lane-t" x={14} y={cy(i) + 4}>{carril.label.toUpperCase()}</text>
          </g>
        ))}
        {uniones.map((union) => trazo(union, 'trazo'))}
        {ubicados.map((paso) => (
          <Nodo key={paso.id} nodo={paso} x={cx(paso.columna) - cajaW / 2} y={cy(paso.fila) - CAJA_ALTO / 2} w={cajaW} h={CAJA_ALTO} />
        ))}
        {uniones.map((union) => trazo(union, 'etiqueta'))}
      </svg>
    </DiagramFrame>
  );
}
