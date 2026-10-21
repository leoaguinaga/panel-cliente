# Design System — Panel de Cliente Foxcode

## Product UI

La interfaz interna es una herramienta operativa: jerarquía clara, densidad controlada y acciones previsibles. La navegación y las pantallas deben ayudar a decidir qué hacer a continuación.

## Typography and surfaces

- Misma línea que la landing: Raleway para todo el texto y Bebas Neue (400) solo en los `h1` de página. Se cargan con `next/font` en `app/layout.tsx`.
- Tema oscuro único: fondo `#18181a`, tarjetas `#1e1e21`, texto `#fffff1`, acento naranja FoxCode `#ee4d31`. Los botones sólidos usan `#c93a20` (blanco encima 5.1:1).
- La escala `slate` está invertida en `globals.css` (50 = superficie sutil, 950 = texto), así que `text-slate-900` sigue siendo «texto fuerte». `blue-*` apunta al naranja de marca; las escalas de estado (emerald, amber, rose…) tienen 50–300 como tintes oscuros y 700–950 como tonos claros.
- Para fondos usar `bg-card`/`bg-background`, no `bg-white`. Un bloque destacado usa `.surface-feature` (restaura los slate claros para texto sobre oscuro).
- Fondos neutros y superficies sobrias; el color se reserva para estados y acciones.
- Los estados usan texto, icono o etiqueta además de color.
- Botones, filtros, formularios y tablas comparten el mismo vocabulario visual.

## Loading and fallback policy

Toda pantalla, sección o componente que dependa de datos asíncronos debe tener una respuesta visual inmediata. Nunca se deja una pantalla bloqueada, vacía o con un spinner aislado mientras carga.

- Usar `boneyard-js` como patrón obligatorio de skeleton.
- Cada skeleton debe tener un nombre estable y una `fixture` segura para captura, sin datos reales ni sesiones de usuarios.
- Generar bones con `pnpm boneyard:build` después de cambios estructurales de layout y revisar 375, 768 y 1280 px.
- Registrar los bones generados una vez en el entrypoint de la aplicación.
- Hasta contar con bones generados, definir un fallback estructural que preserve la geometría y evite layout shift.
- Usar `loading.tsx` por segmento para navegación App Router y `BoneSuspense`/`Skeleton` para límites de datos más finos.
- La animación debe respetar `prefers-reduced-motion`; preferir `solid` o transición reducida en ese caso.

## Accessibility

- Foco visible y navegación completa por teclado.
- Contraste WCAG 2.1 AA.
- Estados de carga anunciables y sin depender de color exclusivamente.
- Tablas responsivas con alternativa estructural en pantallas pequeñas.
