import type { ReactNode } from 'react';
import { DiagramFrame } from './DiagramFrame';
import { ANCHO, Flecha, Lineas, Nodo, NombreNodo, lineasDe, svgProps, type EstiloFlecha, type NodoBase } from './shared';

export type Estado = NodoBase & {
  /** Qué hace entrar a este estado; va sobre la flecha que llega. `\n` parte la línea. */
  disparador?: string;
  /** Aclaración debajo de la caja. */
  nota?: string;
  /** Estilo de la flecha que llega a este estado. */
  flecha?: EstiloFlecha;
};

export type Retorno = { de: string; a: string; label?: string };

const GAP = 30;
const CAJA_ALTO = 54;
const CAJA_MIN = 110;
const CAJA_MAX = 170;
const RENGLON = 15;

/** Estados en fila, con lo que dispara cada paso y las vueltas atrás debajo. */
export function CicloDeEstados({ titulo, estados, retornos = [], descripcion }: {
  titulo: string;
  estados: Estado[];
  retornos?: Retorno[];
  descripcion?: ReactNode;
}) {
  const n = estados.length;
  const ancho = Math.max(ANCHO, n * (CAJA_MIN + GAP) + 20);
  const cajaW = Math.min(CAJA_MAX, (ancho - 20 - GAP * (n - 1)) / n);
  const x0 = (ancho - (n * cajaW + (n - 1) * GAP)) / 2;
  const xDe = (i: number) => x0 + i * (cajaW + GAP);
  const indice = new Map(estados.map((estado, i) => [estado.id, i]));

  const lineasArriba = Math.max(0, ...estados.map((estado) => lineasDe(estado.disparador)));
  const filaY = 10 + (lineasArriba ? lineasArriba * RENGLON + 14 : 0);
  const base = filaY + CAJA_ALTO;
  const retornosVisibles = retornos.filter((r) => indice.has(r.de) && indice.has(r.a));
  const zonaRetornos = retornosVisibles.length ? 30 + retornosVisibles.length * 28 : 0;
  // Una nota va pegada a su caja salvo que un retorno pase por esa columna.
  const cruzada = (i: number) => retornosVisibles.some((r) => {
    const [a, b] = [indice.get(r.de)!, indice.get(r.a)!].sort((x, y) => x - y);
    return i >= a && i <= b;
  });
  const notaY = (i: number) => (cruzada(i) ? base + zonaRetornos + 20 : base + 20);
  const alto = Math.max(
    base + zonaRetornos,
    ...estados.map((estado, i) => (estado.nota ? notaY(i) + (lineasDe(estado.nota) - 1) * RENGLON + 6 : 0)),
  ) + 8;

  const lista = (
    <ol className="list-decimal space-y-1 pl-5">
      {estados.map((estado) => (
        <li key={estado.id}>
          <NombreNodo nodo={estado} />
          {estado.disparador && <> — entra cuando: {estado.disparador.replace(/\n/g, ' ')}</>}
          {estado.nota && <>. {estado.nota.replace(/\n/g, ' ')}</>}
        </li>
      ))}
      {retornosVisibles.map((retorno) => (
        <li key={`${retorno.de}-${retorno.a}`} className="list-none">
          ↩ De {estados[indice.get(retorno.de)!].label} vuelve a {estados[indice.get(retorno.a)!].label}{retorno.label && `: ${retorno.label}`}
        </li>
      ))}
    </ol>
  );

  const retornosEn = (capa: 'trazo' | 'etiqueta') => retornosVisibles.map((retorno, k) => {
    const xa = xDe(indice.get(retorno.de)!) + cajaW / 2;
    const xb = xDe(indice.get(retorno.a)!) + cajaW / 2;
    const fondo = base + 22 + k * 28;
    const fin = { x: xb, y: base + 3 };
    const control = { x: xb, y: fondo };
    return (
      <Flecha
        key={`${retorno.de}-${retorno.a}-${capa}`}
        capa={capa}
        de={retorno.de}
        a={retorno.a}
        estilo="problema"
        d={`M${xa} ${base}C${xa} ${fondo} ${xb} ${fondo} ${fin.x} ${fin.y}`}
        desde={control}
        fin={fin}
        label={retorno.label}
        labelEn={{ x: (xa + xb) / 2, y: base + (fondo - base) * 0.75 + 16 }}
      />
    );
  });

  return (
    <DiagramFrame titulo={titulo} descripcion={descripcion} lista={lista} minWidth={Math.round(Math.max(560, ancho * 0.7))}>
      <svg {...svgProps(alto, titulo, ancho)}>
        {estados.slice(1).map((estado, i) => {
          const fin = { x: xDe(i + 1) - 2, y: filaY + CAJA_ALTO / 2 };
          const inicio = { x: xDe(i) + cajaW, y: fin.y };
          return <Flecha key={estado.id} de={estados[i].id} a={estado.id} d={`M${inicio.x} ${inicio.y}H${fin.x}`} desde={inicio} fin={fin} estilo={estado.flecha} />;
        })}
        {retornosEn('trazo')}
        {estados.map((estado, i) => (
          <g key={estado.id}>
            {estado.disparador && <Lineas texto={estado.disparador} x={xDe(i) + cajaW / 2} y={filaY - 14 - (lineasDe(estado.disparador) - 1) * RENGLON} />}
            <Nodo nodo={estado} x={xDe(i)} y={filaY} w={cajaW} h={CAJA_ALTO} />
            {estado.nota && <Lineas texto={estado.nota} x={xDe(i) + cajaW / 2} y={notaY(i)} />}
          </g>
        ))}
        {retornosEn('etiqueta')}
      </svg>
    </DiagramFrame>
  );
}
