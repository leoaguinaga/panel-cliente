# 001 — Suavizar los cambios del panel del calendario

- **Status**: DONE
- **Commit**: 5517d3c (frontend; hay cambios locales que son parte de la base de este plan)
- **Severity**: MEDIUM
- **Category**: Missed opportunities, interruptibility, performance
- **Estimated scope**: 2 archivos de producto y el script de comprobación existente

## Alcance confirmado

El usuario seleccionó las tres mejoras: entrada/salida al crear recordatorio y reunión, selección de fecha y eliminación del salto de ancho. Conservar diseño, permisos, datos y comportamiento de guardado. Ejecutado y validado el 20 de octubre de 2026.

## Problem

Archivos absolutos:

- `/Users/leoaguinaga/apps/foxcode/panel-cliente/frontend/src/modules/calendar/CalendarWorkspace.tsx`
- `/Users/leoaguinaga/apps/foxcode/panel-cliente/frontend/src/modules/calendar/calendar.module.css`

En CalendarWorkspace.tsx:591 el panel sustituye directamente formulario/detalle/agenda:

```tsx
<div ref={panel} tabIndex={-1} className={styles.detail}>
  {form && options ? (
```

Cerrar (líneas 603 y 831) llama directamente a `setForm(undefined)`, desmontando el formulario antes de que pueda salir. Abrir tiene el mismo reemplazo sin estado de presencia. `selectDay` (193–203) actualiza el contenido y usa desplazamiento instantáneo en pantallas <=1150px:

```tsx
const selectDay = (date: string) => {
  setSelected(date);
  setDetail(undefined);
  setForm(undefined);
  requestAnimationFrame(() => {
    if (window.matchMedia("(max-width: 1150px)").matches) {
      panel.current?.focus({ preventScroll: true });
      panel.current?.scrollIntoView({ block: "start", behavior: "auto" });
    }
  });
};
```

calendar.module.css:104–112 cambia inmediatamente la distribución:

```css
.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 292px;
  gap: 20px;
  align-items: start;
}
.workspace.editing {
  grid-template-columns: minmax(0, 1fr) 340px;
}
```

No hay una librería de animación instalada ni tokens de movimiento en este módulo. Stack: React 19/Next 16, CSS Modules, Button shadcn/Radix. Uso operativo frecuente: no animar las celdas, la cuadrícula ni cada fila de agenda. globals.css:348 tiene una política global deliberada de movimiento reducido; conservarla.

## Target

### Geometría estable

Usar una columna lateral de **340px** tanto en reposo como en edición para escritorio; conservar `minmax(0,1fr)` y el gap de 20px. Mantener el breakpoint existente de 1150px, debajo del cual la disposición es una columna. Quitar la diferencia de ancho `.workspace.editing`; no animar `grid-template-columns`, width, height ni padding. El calendario no se mueve horizontalmente al abrir o cerrar un formulario.

### Movimiento exacto

Definir tokens locales en `.root`:

```css
--calendar-ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--calendar-enter-duration: 200ms;
--calendar-exit-duration: 150ms;
--calendar-day-duration: 125ms;
```

Aplicarlos al **contenido interno** del panel; el borde y la superficie del contenedor permanecen estables.

- Entrar en formulario: opacity 0 → 1 y transform `translateY(8px)` → `translateY(0)` durante 200ms con la curva indicada.
- Salir del formulario mediante X/Cancelar: opacity actual → 0 y transform actual → `translateY(4px)` durante 150ms. Mantener el formulario montado hasta completar la salida; mostrar después la agenda correspondiente con entrada de 125ms, opacity 0 → 1, sin desplazamiento.
- Cambiar fecha mientras se ve la agenda diaria: conservar encabezado y superficie; reemplazar únicamente su contenido con entrada de 125ms, opacity 0 → 1 y transform `translateY(4px)` → `translateY(0)`. No añadir 125ms de espera antes de actualizar la fecha seleccionada. No animar la cuadrícula.
- Cambiar fecha estando en formulario: aplicar la salida de formulario anterior y después presentar el día solicitado. No perder un cambio de fecha posterior durante la salida.
- Cambio recordatorio ↔ reunión: respetar la misma presencia sin dos formularios simultáneamente interactivos ni reseteos causados por un resultado de animación obsoleto.
- Reduced motion: duraciones **0ms**, transform `none`; conservar actualizaciones de contenido y foco. Respetar la política global existente, sin modificar globals.css.

8px y 4px son desplazamientos pequeños específicos de este panel, no nuevos tokens de todo el sistema. Los tiempos y curva proceden de AUDIT.md (entrada de UI, interacción breve y movimiento interrumpible).

## Repo conventions to follow

- Mantener CSS en calendar.module.css y el comportamiento React en CalendarWorkspace.tsx.
- Reutilizar `panel`, `form`, `detail` y `selected`; introducir solo estado de presencia que no duplique entidades de negocio.
- No instalar dependencias. Usar Web Animations API en el nodo interno (transform y opacity) con curvas/tokens locales. WAAPI permite esperar `animation.finished` para la salida y cancelar/reorientar una transición sin desmontar el contenido antes de tiempo.
- Botones conservan Button, etiquetas y foco visible. Ejemplo existente: `panel.current?.focus({ preventScroll: true })` de selectDay.
- Mantener CalendarGridLoading/Boneyard para carga de datos; no usar su aparición para animar una selección local de fecha.

## Steps

1. Cambiar la anchura de `.workspace` a 340px y eliminar la sobrescritura de ancho de `.workspace.editing`; mantener el override a una columna del breakpoint. No cambiar el layout de la página ni otras pantallas.
2. Dentro del panel estable añadir un wrapper con ref independiente para el contenido animado. No poner `key` en el panel exterior: su foco y geometría deben conservarse.
3. Crear un controlador local de presencia para agenda/detalle/formulario. Registrar la animación activa y una generación/identificador de transición. Antes de otra transición, capturar opacity/transform actuales con getComputedStyle, cancelar la animación anterior y partir desde esos valores. No reiniciar cada transición desde opacity 0. No usar temporizadores para desmontar: usar `animation.finished` con cancelación controlada y comprobar la generación antes de ejecutar callbacks.
4. Separar las acciones de abrir/cerrar de los setters directos. Enrutar Crear recordatorio, Crear reunión, Editar, X, Cancelar, selección de fecha, regreso al día y cierre tras guardado por el controlador. Los callbacks de guardado conservan manejo de error: un error no cierra ni destruye el formulario. No cambiar la API.
5. Mantener el formulario saliente montado durante 150ms. Marcarlo `inert` mientras sale y evitar doble envío. Dar foco al primer input al montar el formulario entrante, con `focus({preventScroll:true})`. No enfocar un nodo aún saliente. Al cancelar por X/Cancelar restaurar foco al disparador que abrió el formulario, si sigue conectado; al seleccionar fecha enfocar el panel del día.
6. En escritorio no desplazar la página al cambiar de día. En móvil/tablet mantener la navegación al panel, con `scrollIntoView({block:'start',behavior:'smooth'})` cuando el usuario usa puntero/touch y permite movimiento. Para teclado o reduced-motion usar `behavior:'auto'`. La duración del scroll nativo depende del navegador: no prometer sincronía exacta con los 125ms. Evitar segundo scroll implícito al enfocar inputs usando preventScroll. Un clic adicional cambia al último día sin colas.
7. Limpiar/cancelar animaciones al desmontar y tolerar AbortError de animation.finished. Para reducir movimiento consultar matchMedia y reaccionar a cambios. Si falta Element.animate, ejecutar la transición de estado inmediatamente con el mismo foco y sin bloquear contenido.
8. Actualizar `/Users/leoaguinaga/apps/foxcode/panel-cliente/frontend/scripts/review-calendar.mjs` con checks específicos y sin cambiar su base temporal: abrir/cerrar ambos formularios, seleccionar varias fechas rápidamente, cancelar durante entrada, cambiar de formulario durante salida y repetir con reduced-motion. No enviar invitaciones reales.

## Boundaries

- No editar backend, Prisma, autenticación, OAuth, formatos horarios, filtros, invitaciones ni integraciones.
- No instalar Motion/Framer/GSAP ni cambiar otros componentes.
- Sin animación de width/height/grid-template-columns, sin transition:all, sin blur, rebote, stagger de campos o animación de las 42 celdas.
- No introducir un modal ni mover el formulario a otra ruta.
- No guardar borradores ni cambiar sus reglas como parte de esta tarea.
- El código de este repositorio está en edición activa. Si cambian las firmas o el panel deja de tener las ramas descritas, detener la implementación y reportar el desajuste; no sobrescribir cambios ajenos.

## Verification

Desde `/Users/leoaguinaga/apps/foxcode/panel-cliente`:

```sh
pnpm --dir frontend exec eslint src/modules/calendar
pnpm --dir frontend exec tsc --noEmit
node backend/scripts/test-calendar.mjs --review
```

La prueba de navegador usa PostgreSQL temporal y puertos 3503/3504; no probar mutaciones con datos de clientes reales.

**Feel check**, escritorio 1440px y móvil 390px:

- Abrir recordatorio y reunión: reacción inmediata, entrada ligera, sin mover el ancho del calendario.
- Cancelar con X y botón: el formulario sale antes de desaparecer; el foco no cae al body.
- Seleccionar fechas consecutivas: la selección responde inmediatamente y el último día siempre coincide con el encabezado/agenda. Sin colas ni parpadeos.
- Alternar rápidamente abrir/cerrar: ninguna animación antigua desmonta el nuevo formulario ni resetea lo escrito por un render innecesario.
- En DevTools Animations usar velocidad 10% y comprobar que solo cambian transform/opacity del wrapper y que no se solapan dos formularios utilizables.
- Con reduced-motion: sin desplazamiento de contenido ni scroll suave, sin espera artificial; foco y acciones funcionan.
- En touch real comprobar que el scroll al panel no produce un segundo salto por el foco del input.
- Continuar pudiendo crear/editar/completar recordatorios y crear/editar/cancelar reuniones con la misma semántica de errores y reintentos.

**Done when**: tres transiciones suaves, salida visible, geometría fija, respuesta a interrupciones correcta y navegación de teclado/reduced-motion preservadas; sin errores de runtime ni de los checks aplicables.

## Resultado de ejecución

Implementado en CalendarWorkspace.tsx, calendar.module.css y usePanelMotion.ts, sin nuevas dependencias ni cambios de backend. Se amplió scripts/review-calendar.mjs con verificación de ancho estable, cambios rápidos de fecha, interrupción de entrada/salida, foco de teclado y movimiento reducido.

Validación: ESLint del módulo y TypeScript sin errores. Integración PostgreSQL temporal y navegador pasaron para ADMIN/WORKER en 1440/768/390px; sin errores de runtime ni desbordamiento y sin incidencias axe A/AA. Reporte: ../docs/calendar-validation-2026-10-20/report.json desde panel-cliente (ruta física docs bajo panel-cliente). También se comprobó apertura, cierre y selección de fecha en la app local con la cuenta de prueba del usuario, sin guardar pendientes ni enviar invitaciones.

Revisión de movimiento: aprobado. Entrada 200ms, salida 150ms, agenda del día 125ms, curva cubic-bezier(0.23, 1, 0.32, 1), solo transform/opacity; teclado y reduced-motion inmediatos. Interrupciones protegidas por generación y limpieza de animaciones. Prueba en hardware táctil real no realizada.
