# Roadmap ERP operativo Foxcode

## Dirección

El panel es principalmente una herramienta interna de operación para Foxcode. El portal de cliente será una vista externa, reducida y controlada, sobre los datos que el equipo gestione internamente.

## P0 — Núcleo de dominio

Definir y mantener separadas estas entidades:

- Servicio: línea comercial vendida por Foxcode.
- Sector: clasificación aplicable al servicio de sitios web.
- Producto: solución propia de Foxcode: FoxEats, FoxRooms o Contralio.
- Cliente: relación comercial y empresa/persona contratante.
- Proyecto: trabajo concreto asociado a un cliente y, opcionalmente, a un servicio o producto.
- Tarea: unidad ejecutable dentro de un proyecto.
- Hito: etapa de entrega o control del proyecto.
- Alcance y entregable: qué se acordó y qué debe entregarse.
- Documento y actividad: evidencia e historial operativo.

Servicios iniciales:

1. Desarrollo de sitios web, con segmentación por sector.
2. Desarrollo de software a medida.

## P1 — Operación de proyectos

El equipo debe poder crear proyectos, asignar responsables, registrar alcance, dividir el trabajo en tareas, controlar estados, fechas, prioridades, bloqueos, hitos y entregables.

Rutas objetivo:

```txt
/internal/projects
/internal/projects/[projectId]
/internal/products
```

## P2 — Centro operativo

El dashboard interno debe priorizar decisiones y próximas acciones:

- Proyectos activos.
- Tareas asignadas al usuario.
- Tareas atrasadas.
- Proyectos bloqueados.
- Próximas entregas.
- Carga por responsable.
- Estado resumido de FoxEats, FoxRooms y Contralio.

## Migración a NestJS

La migración se planifica después de estabilizar el dominio y las reglas de negocio en la primera aplicación. Antes de migrar, las consultas y mutaciones deben estar separadas de las páginas y componentes.

Orden previsto:

1. Autenticación y usuarios.
2. Clientes y contactos.
3. Proyectos, tareas e hitos.
4. Documentos y entregables.
5. Pagos.
6. Productos y reportes.

Next.js continuará como frontend y NestJS será la API de dominio sobre PostgreSQL.

## Fuera de esta fase

- Detalle final de sectores.
- Automatizaciones avanzadas.
- Chat interno.
- Facturación electrónica.
- Integraciones de WhatsApp, SUNAT o pagos.
- App móvil nativa.

## Plan de siguientes prioridades

### P0.1 — Cerrar el núcleo de datos

Objetivo: dejar una base operativa consistente antes de multiplicar pantallas.

Entregables:

- Crear y aplicar la migración PostgreSQL de `Service`, `Sector`, `Task`, `ProjectScope` y `Deliverable`.
- Registrar los servicios iniciales:
  - Desarrollo de sitios web.
  - Desarrollo de software a medida.
- Registrar FoxEats, FoxRooms y Contralio como productos propios.
- Definir sectores iniciales solo como catálogo editable, sin asumir todavía la segmentación final.
- Añadir validaciones de progreso, fechas, estados y responsables.
- Crear datos seed mínimos para desarrollo.

Criterio de cierre: se puede crear un proyecto asociado a un cliente y a un servicio o producto, con responsable, tareas, alcance y entregables persistidos en PostgreSQL.

### P1.1 — Detalle y operación de proyectos

Objetivo: convertir proyectos en el centro de ejecución diaria.

Rutas:

```txt
/internal/projects
/internal/projects/new
/internal/projects/[projectId]
```

Entregables:

- Crear, editar y archivar proyectos.
- Ver ficha de cliente, servicio/producto, responsable, prioridad y fechas.
- Editar alcance, inclusiones, exclusiones y supuestos.
- Crear y editar tareas.
- Asignar tareas a trabajadores.
- Cambiar estado y prioridad de tareas.
- Registrar fechas límite y detectar atrasos.
- Gestionar hitos y entregables.
- Mostrar actividad reciente del proyecto.
- Implementar estados vacíos, errores y confirmaciones.

Criterio de cierre: un trabajador puede gestionar un proyecto completo sin editar directamente la base de datos.

### P1.2 — Catálogos operativos

Objetivo: evitar datos libres y preparar la futura API.

Entregables:

- CRUD de servicios.
- CRUD de productos.
- CRUD de sectores.
- Catálogo de estados y prioridades centralizado.
- Reglas para impedir borrar catálogos usados por proyectos.
- Identificadores y nombres estables para migración a NestJS.

Criterio de cierre: los formularios de proyectos consumen catálogos persistidos y no strings hardcodeados.

### P2.1 — Dashboard operativo real

Objetivo: priorizar acciones, no solo mostrar indicadores.

Entregables:

- Mis tareas pendientes.
- Tareas vencidas.
- Tareas bloqueadas.
- Proyectos sin responsable.
- Proyectos pausados.
- Próximas entregas.
- Actividad reciente.
- Resumen por producto: FoxEats, FoxRooms y Contralio.
- Filtros por responsable, producto, servicio y estado.
- Accesos directos a resolver cada situación.

Criterio de cierre: el equipo puede abrir el dashboard y saber qué debe atender primero.

### P2.2 — Seguridad y calidad transversal

Objetivo: hacer confiable la operación antes de incorporar más módulos.

Entregables:

- Permisos por rol en cada consulta y mutación.
- Validación server-side de todos los formularios.
- Registro de cambios sensibles en `ActivityLog`.
- Pruebas de aislamiento del rol `CLIENT`.
- Manejo de errores de base de datos y estados de carga.
- Accesibilidad de navegación, tablas, formularios y modales.
- Revisión responsive en 375, 768 y 1280 px.

Criterio de cierre: ninguna operación crítica depende únicamente de controles visuales del frontend.

### P3 — Clientes y portal externo

Objetivo: exponer una vista controlada del trabajo interno.

Orden:

1. Clientes y contactos internos.
2. Detalle de cliente con proyectos y actividad.
3. Portal `/client/projects`.
4. Hitos y entregables visibles al cliente.
5. Documentos visibles al cliente.
6. Pagos programados.
7. Perfil y ayuda.

Regla: el cliente nunca recibe tareas internas, notas privadas, documentos internos ni información de otros clientes.

### P4 — Documentos y almacenamiento

Objetivo: centralizar evidencia y entregables sin acoplar el dominio a un proveedor.

Entregables:

- Adapter de almacenamiento local inicial.
- Metadata de documentos en PostgreSQL.
- `storageKey` relativo, nunca rutas absolutas.
- Visibilidad interna/cliente.
- Descarga autorizada.
- Revisión de backups.
- Preparación para S3/R2 sin cambiar el dominio.

### P5 — Backend independiente NestJS

Objetivo: separar el dominio de negocio de Next.js cuando los flujos estén probados.

Condiciones previas:

- Entidades y reglas estabilizadas.
- Consultas y mutaciones separadas de páginas y componentes.
- Permisos documentados.
- Flujos críticos cubiertos por pruebas.

Fases:

1. Crear workspace NestJS y conexión PostgreSQL.
2. Migrar autenticación y usuarios.
3. Migrar clientes y proyectos.
4. Migrar tareas, hitos y actividad.
5. Migrar documentos y pagos.
6. Migrar productos y reportes.
7. Cambiar Next.js para consumir la API.
8. Retirar gradualmente acceso directo del frontend a Prisma.

Criterio de cierre: Next.js funciona como frontend y NestJS como única capa de negocio y acceso a datos.

## Orden inmediato de ejecución

1. Aplicar migración y seed del núcleo P0.1.
2. Construir detalle y CRUD de proyectos P1.1.
3. Construir operación de tareas P1.1.
4. Implementar catálogos P1.2.
5. Completar dashboard accionable P2.1.
6. Ejecutar seguridad, accesibilidad y responsive P2.2.
7. Recién entonces iniciar clientes, portal externo y NestJS.

## Plan de cierre de `/internal/`

Estado actual auditado: dashboard, leads y proyectos tienen una base funcional; clientes, documentos, pagos, productos, trabajadores y configuración todavía son rutas anunciadas o módulos placeholder. La navegación actual no debe considerarse completa hasta que cada enlace tenga pantalla, consultas, mutaciones, permisos, estados vacíos y pruebas.

### Iteración I — Plataforma interna y contrato común

- Centralizar labels, estados, prioridades y formatos de fecha/moneda.
- Crear componentes compartidos para tabla, filtros, paginación, formularios, badges, confirmaciones y estados de carga/error.
- Revisar el layout interno en desktop y móvil.
- Corregir enlaces que hoy apuntan a rutas inexistentes.
- Completar autorización por módulo y registrar acciones críticas en `ActivityLog`.

### Iteración II — Leads y clientes

- Completar conversión de lead a cliente en una transacción segura.
- Crear `/internal/clients` y `/internal/clients/[clientId]`.
- CRUD de empresas/personas, contactos, estado y responsable.
- Mostrar proyectos, documentos, pagos, leads relacionados y actividad.
- Añadir búsqueda, filtros, estados vacíos y validación de duplicados.

### Iteración III — Proyectos y tareas

- Completar CRUD de proyectos y asociación a servicio/producto.
- Crear y editar alcance, hitos y entregables.
- Completar tareas con descripción, responsable, prioridad, fecha límite, estado y actividad.
- Añadir filtros por estado, responsable, producto, servicio y vencimiento.
- Calcular progreso a partir de tareas/hitos, evitando porcentajes inconsistentes.

### Iteración IV — Catálogos y productos

- Crear `/internal/products` con FoxEats, FoxRooms y Contralio.
- Crear CRUD de servicios y sectores.
- Asociar proyectos a servicio o producto, sin permitir combinaciones inválidas.
- Crear vistas de demos y seguimiento comercial por producto.
- Mantener FoxRooms como caso inicial, pero con estructura reutilizable.

### Iteración V — Documentos y entregables

- Crear `/internal/documents`.
- Implementar adapter de almacenamiento local.
- Subir, listar, descargar, archivar y eliminar documentos.
- Asociar documentos a cliente/proyecto.
- Aplicar visibilidad interna/cliente y autorización en descarga.
- Registrar tamaño, tipo, usuario y `storageKey` relativo.

### Iteración VI — Pagos

- Crear `/internal/payments`.
- Registrar cuotas, conceptos, montos, moneda, vencimiento y notas.
- Cambiar estados `PENDING`, `PARTIAL`, `PAID`, `OVERDUE` y `CANCELLED`.
- Filtrar por cliente, proyecto, estado y fecha.
- Mostrar totales proyectados, cobrados, pendientes y vencidos.

### Iteración VII — Administración

- Crear `/internal/workers`, solo para `ADMIN`.
- Crear, editar, activar, desactivar y asignar rol a trabajadores.
- Mostrar proyectos y leads asignados.
- Crear `/internal/settings`, solo para `ADMIN`.
- Gestionar datos de empresa, contacto, pagos, información fiscal y configuración visible al cliente.

### Iteración VIII — Dashboard y reportes

- KPIs de leads, conversión, clientes, proyectos, ingresos y pagos.
- KPIs de productos y demos.
- Bandejas accionables: atrasos, bloqueos, sin responsable y próximas entregas.
- Filtros por periodo, producto, servicio y responsable.
- Exportación básica de listados cuando exista una necesidad real.

### Iteración IX — Calidad de producción

- Pruebas de permisos para `ADMIN`, `WORKER` y `CLIENT`.
- Pruebas de mutaciones y transacciones críticas.
- Pruebas de aislamiento de cliente.
- Auditoría de accesibilidad, responsive y navegación por teclado.
- Manejo uniforme de errores de PostgreSQL y almacenamiento.
- Revisión de seguridad de archivos, inputs, IDs y acciones server-side.
- Verificación de backup y restauración de la base.

### Definición de 100% funcional para `/internal/`

La superficie interna se considerará cerrada cuando:

- Todos los enlaces del sidebar funcionen.
- Cada módulo tenga listado, detalle cuando corresponda, crear/editar y estados vacíos.
- Todas las mutaciones persistan en PostgreSQL.
- Cada ruta valide sesión y rol.
- Las acciones críticas registren actividad.
- No existan datos KPI hardcodeados.
- El flujo lead → cliente → proyecto → tarea/documento/pago funcione de extremo a extremo.
- Lint, build, migraciones y pruebas de permisos pasen.
