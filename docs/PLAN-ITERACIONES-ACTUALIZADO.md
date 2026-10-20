# Plan de desarrollo por iteraciones

## Cierre técnico local — 19 de octubre de 2026

- Se amplió la suite PostgreSQL a **11 E2E**: conversión lead→cliente/proyecto idempotente, tareas/hitos/progreso, reemplazo/eliminación de documentos, auditoría y seguimiento de demos, además de aislamiento y pagos.
- Demos ya dispone de API e interfaz para ADMIN/WORKER, con seis estados, contactos, responsable, próxima acción, relaciones y notas. Se corrigió el registro del Proxy en la raíz de Next.js y el guard de páginas ADMIN.
- Backend: **30 pruebas unitarias**. Portal: **5 pruebas**. El runner prueba restauración de **25 tablas** por digest y **5 archivos** por SHA-256, compila el backend y comprueba su arranque de producción con readiness.
- Se añadieron ejemplos de entorno, Nginx y procedimiento de despliegue/recuperación. No se desplegó ni se modificó producción.
- **Iteración 5: cierre técnico local completado.** Evidencias y límites en `../../docs/CIERRE-ITERACION-5-2026-10-19.md`. Se corrigieron los 51 errores de lint frontend y 124 backend de la auditoría inicial: ambos linters pasan (frontend conserva 70 advertencias). La siguiente fase es configurar y comprobar el destino real de despliegue.
- Las brechas históricas de demos, archivos, ficha de cliente y Prisma descritas más abajo no representan el estado actual. Consultar el reporte antes de volver a planificarlas.

## Continuación comprobada — 17 de octubre de 2026

- El código actual ya incluye StoragePort/LocalStorageAdapter, cargas y descargas en NestJS, proxy HTTP del frontend, ficha de cliente con documentos/leads/actividad y sincronización de progreso. Las brechas históricas descritas abajo deben contrastarse con esa implementación antes de volver a desarrollarlas.
- Se añadió `backend/scripts/test-postgres.mjs` y la suite `backend/test/client-isolation.e2e-spec.ts`. Ejecutar `pnpm --dir backend test:postgres` desde `panel-cliente`.
- Comprobado: nueve migraciones desde cero en PostgreSQL temporal; siete pruebas HTTP con sesiones y persistencia reales para ADMIN, WORKER, CLIENT A/B y CLIENT sin asociación. Cubren aislamiento de listados/descargas, visibilidad, reportes y verificación de pagos y auditoría.
- Validación adicional: 23 pruebas unitarias backend, build backend y 5 pruebas del portal aprobadas.
- La iteración 5 continúa abierta: falta ampliar E2E a conversión y tareas/hitos, revisión visual responsive y verificación operativa de backup/restauración/despliegue. El seguimiento comercial de demos requiere contrastar el modelo existente con sus endpoints e interfaz antes de declararlo completo.

El contenido siguiente conserva el alcance original de las iteraciones; no es una lista actualizada de funcionalidades ausentes.

Actualizado el 21 de septiembre de 2026 a partir de la implementación presente en `frontend/` y `backend/`. Este documento reemplaza el estado histórico del plan de cierre en `ROADMAP-ERP.md`; conserva su dirección de producto, pero no vuelve a planificar trabajo ya implementado.

## Avance comprobado

| Área | Evidencia de implementación | Estado |
| --- | --- | --- |
| Dominio y operación de proyectos | API para proyectos, sprints, requisitos, tareas, dependencias, alcance, hitos, entregables, evidencias y condiciones de pago; acciones del frontend consumen esa API. | Implementado; requiere prueba integrada. |
| Leads y clientes | API de creación, edición y conversión de lead; rutas internas para listado, alta y ficha de cliente. | Implementado; quedan detalles de ficha y pruebas. |
| Pagos y portal | API de pagos, reporte y verificación; rutas de pagos, documentos, perfil, ayuda y proyectos para `CLIENT`. | Implementado; falta cierre E2E con datos reales. |
| Catálogos | API CRUD de productos y servicios, y alta/baja de sectores. | Parcial en interfaz: no están expuestas las ediciones de producto ni de sector. |
| NestJS | Hay módulos separados de administración, catálogos, clientes, documentos, leads, pagos, proyectos y dashboard. | En transición: archivos, configuración y trabajadores aún tienen acceso directo a Prisma desde Next. |

## Principios de ejecución

- Cada iteración termina con un flujo completo comprobable, no solo con rutas o componentes creados.
- Mantener `Empresa/cliente → proyecto → tarea, documento y pago` como recorrido operativo central.
- NestJS conserva la autoridad sobre dominio, permisos y auditoría; Better Auth se mantiene temporalmente en Next.js solo para emitir sesiones.
- Las páginas y segmentos asíncronos incorporan skeleton Boneyard con fixture seguro, revisado en 375, 768 y 1280 px cuando cambie su layout.

## Iteración 0 — Base de cierre y contrato

**Objetivo:** asegurar que el avance existente sea ejecutable y medible antes de ampliar módulos.

**Alcance:**

- Ejecutar build y pruebas actuales de frontend y backend; registrar fallos que sean deuda previa.
- Definir una matriz de permisos para `ADMIN`, `WORKER` y `CLIENT` por endpoint y acción.
- Confirmar que cada mutación sensible cree `ActivityLog` dentro de la transacción correspondiente; completar las que falten.
- Consolidar formatos de fecha, moneda, estados, prioridad y respuestas de error en los componentes compartidos.
- Revisar enlaces, estados de carga, errores y vacíos de las rutas internas existentes.

**Cierre:** una matriz de permisos comprobada, sin enlaces internos rotos en el flujo principal y una lista acotada de deuda real.

## Iteración 1 — Completar la superficie interna existente

**Objetivo:** completar las acciones que ya tienen modelo y API, evitando abrir módulos nuevos.

**Alcance:**

- Exponer edición de producto, servicio y sector; impedir bajas cuando exista una relación operativa que deba preservarse.
- Completar administración de trabajadores: alta, edición de datos, cambio de rol, activación/desactivación y prevención de auto-desactivación.
- Mover configuración y trabajadores a los endpoints NestJS correspondientes, con permisos `ADMIN` del lado servidor.
- En la ficha de cliente, integrar documentos, leads relacionados y actividad; añadir búsqueda, filtros y detección de duplicados al listado.
- Completar filtros de proyectos y tareas por responsable, producto, servicio, estado y vencimiento; calcular progreso desde tareas e hitos.

**Cierre:** un administrador realiza catálogos, trabajadores y configuración sin acceso directo de Next.js a Prisma; un operador encuentra y actualiza el trabajo pendiente desde cliente o proyecto.

## Iteración 2 — Documentos y evidencia con NestJS

**Objetivo:** retirar el manejo de archivos del frontend y cerrar el ciclo de evidencia de proyecto y cliente.

**Alcance:**

- Crear un `StoragePort` y `LocalStorageAdapter` dentro de `DocumentsModule`.
- Migrar carga, descarga, edición, archivo y eliminación de documentos desde `frontend/app/api/uploads/*` a NestJS.
- Validar asociación cliente/proyecto, tamaño, tipo, nombre, `storageKey` relativo y visibilidad para cliente antes de persistir.
- Usar las descargas autorizadas de NestJS tanto en la vista interna como en el portal.
- Registrar actividad de carga, visibilidad, reemplazo y eliminación.

**Cierre:** no existen rutas de carga de dominio en Next.js; un `CLIENT` solo puede descargar sus documentos visibles y un operador conserva trazabilidad completa.

## Iteración 3 — Flujos operativos y reportes

**Objetivo:** convertir los datos existentes en una rutina de trabajo priorizada.

**Alcance:**

- Cerrar la conversión lead → cliente → proyecto en una transacción y mostrar su actividad resultante.
- Consolidar en dashboard las bandejas de vencidos, bloqueados, sin responsable y próximas entregas, con filtros persistentes y enlaces directos de resolución.
- Completar métricas de clientes, proyectos, pagos, productos y demos solo con consultas persistidas.
- Definir y aplicar una exportación mínima de listados si el equipo confirma qué operación la requiere.
- Revisar el portal: hitos, entregables, documentos y pagos deben respetar siempre el `clientId` de sesión y las banderas de visibilidad.

**Cierre:** un equipo puede priorizar, resolver y comprobar el recorrido lead → cliente → proyecto → tarea/documento/pago sin intervención en base de datos.

## Iteración 4 — Retiro definitivo de Prisma del frontend

**Objetivo:** convertir NestJS en la única capa de negocio y datos.

**Alcance:**

- Migrar las consultas restantes de `src/modules/*/server/queries.ts` a clientes HTTP de dominio.
- Reemplazar las Server Actions restantes por adaptadores HTTP sin Prisma; conservar Better Auth solo para sesión.
- Añadir DTOs, validación estricta, filtro uniforme de errores, paginación y contratos de respuesta explícitos en los endpoints pendientes.
- Publicar OpenAPI y generar o mantener tipos compartidos para el frontend.
- Eliminar `frontend/src/lib/prisma.ts`, `frontend/src/lib/server/activity.ts`, dependencias Prisma/PG del frontend y las rutas `app/api` de dominio cuando no tengan consumidores.
- Prohibir por lint nuevos imports de Prisma en frontend.

**Cierre:** el frontend funciona únicamente contra NestJS y Prisma existe solo en `backend/`.

## Iteración 5 — Validación de producción

**Objetivo:** probar el producto con roles, persistencia y visuales reales antes de declararlo cerrado.

**Alcance:**

- Pruebas E2E contra PostgreSQL efímero para `ADMIN`, `WORKER` y dos `CLIENT` distintos.
- Cubrir autorización, conversión, proyecto/tarea, archivo, descarga, pago, reporte y verificación.
- Ejecutar migraciones y comprobar su estado antes del despliegue; verificar backup y restauración de la base.
- Revisar navegación por teclado, foco, mensajes de error y responsive en 375, 768 y 1280 px.
- Regenerar los Boneyard afectados y verificar sus fixtures públicos y seguros.

**Cierre:** build, migraciones, pruebas críticas y revisión visual pasan; el aislamiento entre clientes queda demostrado con datos reales de prueba.

## Fuera de estas iteraciones

- Aplicación móvil nativa.
- Facturación electrónica e integraciones con WhatsApp, SUNAT o pagos externos.
- Automatizaciones avanzadas y chat interno.
- Cambio de almacenamiento local a S3/R2: se aborda después de estabilizar el `StoragePort`.

## Orden de ejecución

1. Iteración 0: línea base y seguridad transversal.
2. Iteración 1: completar interfaz y administración ya modelada.
3. Iteración 2: archivos y evidencia en NestJS.
4. Iteración 3: flujo operativo, dashboard y portal.
5. Iteración 4: corte de Prisma en frontend.
6. Iteración 5: validación de producción.
