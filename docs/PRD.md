# PRD - Panel de Cliente Foxcode

## 1. Nombre del producto

Panel de Cliente Foxcode

## 2. Descripción general

El Panel de Cliente Foxcode es una aplicación web interna y externa diseñada para centralizar la gestión comercial, operativa y documental de Foxcode.

El sistema funcionará como:

- CRM interno para gestión de leads y clientes.
- Panel operativo para seguimiento de proyectos.
- Portal de cliente para visualizar avances, documentos, pagos y entregas.
- Panel administrativo para KPIs, trabajadores y configuración interna.
- Módulo de seguimiento comercial para productos propios de Foxcode, iniciando con FoxRooms.

La aplicación busca reducir la dispersión de información, mejorar la trazabilidad de proyectos y profesionalizar la experiencia del cliente desde el primer contacto hasta la entrega final del servicio.

---

## 3. Objetivo del producto

Crear una plataforma centralizada que permita a Foxcode gestionar leads, clientes, proyectos, documentos, pagos programados y seguimiento comercial de productos propios, ofreciendo a la vez un portal simple y transparente para los clientes.

---

## 4. Objetivos específicos

- Centralizar los leads provenientes de la landing page de Foxcode.
- Permitir el seguimiento comercial desde lead hasta cliente activo.
- Gestionar clientes, empresas y contactos asociados.
- Gestionar proyectos contratados por clientes.
- Registrar hitos, estados, avances y fechas de entrega de proyectos.
- Gestionar documentos como propuestas comerciales, contratos, entregables y archivos internos.
- Permitir que los clientes visualicen sus proyectos, documentos, pagos y fechas importantes.
- Permitir que administración visualice KPIs operativos, comerciales y de proyectos.
- Gestionar usuarios internos de Foxcode.
- Registrar demos y seguimiento comercial de productos propios, empezando por FoxRooms.
- Diseñar la arquitectura para que pueda crecer módulo por módulo sin perder orden.

---

## 5. Público objetivo

### 5.1 Trabajadores de Foxcode

Usuarios internos encargados de:

- Gestionar leads.
- Crear y actualizar clientes.
- Gestionar proyectos.
- Subir documentos.
- Registrar avances.
- Dar seguimiento comercial.
- Atender solicitudes de clientes.

### 5.2 Clientes

Usuarios externos que contratan servicios con Foxcode y necesitan:

- Visualizar sus proyectos activos.
- Consultar avances.
- Revisar fechas de entrega.
- Descargar documentos.
- Ver pagos programados.
- Acceder a información de contacto y canales de pago.

### 5.3 Administración de Foxcode

Usuarios internos con acceso total al sistema.

Pueden:

- Visualizar todos los módulos internos.
- Ver KPIs generales.
- Crear trabajadores.
- Gestionar configuración interna.
- Supervisar clientes, proyectos, leads y productos.

---

## 6. Roles y permisos

### 6.1 ADMIN

Rol administrativo con acceso total al sistema.

Puede:

- Acceder al dashboard general.
- Gestionar leads.
- Gestionar clientes.
- Gestionar proyectos.
- Gestionar documentos.
- Gestionar trabajadores.
- Visualizar KPIs.
- Gestionar configuración interna.
- Visualizar seguimiento comercial de productos propios.
- Acceder a toda la información registrada en el sistema.

### 6.2 WORKER

Rol operativo interno.

Puede:

- Acceder al dashboard operativo.
- Gestionar leads.
- Gestionar clientes asignados o generales, según configuración futura.
- Gestionar proyectos.
- Subir y consultar documentos.
- Registrar avances.
- Registrar seguimiento comercial.
- Consultar demos de productos propios.

No puede:

- Crear trabajadores.
- Modificar configuración global.
- Ver ciertos KPIs administrativos sensibles, salvo que se habilite explícitamente.

### 6.3 CLIENT

Rol externo.

Puede:

- Acceder únicamente al portal de cliente.
- Ver sus propios proyectos.
- Ver documentos visibles para cliente.
- Ver pagos programados.
- Ver fechas de entrega.
- Actualizar información básica de perfil.
- Consultar canales de contacto y ayuda.

No puede:

- Ver otros clientes.
- Ver información interna de Foxcode.
- Ver documentos marcados como internos.
- Crear proyectos.
- Modificar estados operativos.

---

## 7. Alcance inicial del sistema

El sistema estará dividido en tres grandes áreas:

1. Área interna para trabajadores.
2. Portal de clientes.
3. Área administrativa.

---

# 8. Módulos del sistema

## 8.1 Área interna Foxcode

### 8.1.1 Dashboard trabajadores

Ruta sugerida:

```txt
/internal/dashboard

Objetivo:

Mostrar información operativa relevante para el trabajador.

KPIs sugeridos:

Leads nuevos.
Leads pendientes de contacto.
Reuniones agendadas.
Proyectos activos.
Proyectos próximos a vencer.
Documentos pendientes.
Pagos próximos.
Demos recientes de FoxRooms.
8.1.2 Leads

Ruta sugerida:

/internal/leads
/internal/leads/[leadId]

Objetivo:

Gestionar los prospectos que llegan desde la landing page u otros canales.

Tipos de lead sugeridos:

Solicitud de reunión.
Solicitud de cotización.
Consulta general.
Interés en landing page.
Interés en sistema web.
Interés en app móvil.
Interés en FoxRooms.
Otro.

Estados del lead:

NEW
CONTACTED
MEETING_SCHEDULED
QUOTED
WON
LOST

Funciones principales:

Listar leads.
Filtrar por estado, tipo, fecha o responsable.
Ver detalle del lead.
Registrar notas de seguimiento.
Agendar próxima acción.
Convertir lead en cliente.
Asociar lead a un producto, por ejemplo FoxRooms.
Marcar lead como perdido con motivo.

Consideración:

El lead no debe mezclarse directamente con cliente. Un lead representa una oportunidad comercial. Un cliente representa una relación activa o histórica con Foxcode.

8.1.3 Empresas / Clientes

Ruta sugerida:

/internal/clients
/internal/clients/[clientId]

Objetivo:

Gestionar clientes activos, inactivos o potenciales convertidos desde leads.

Estados del cliente:

PROSPECT
ACTIVE
INACTIVE
ARCHIVED

Funciones principales:

Crear cliente manualmente.
Crear cliente desde lead ganado.
Ver datos de empresa o persona natural.
Ver contactos asociados.
Ver proyectos relacionados.
Ver documentos relacionados.
Ver pagos programados.
Ver historial de actividad.
Asignar trabajador responsable.

Información sugerida del cliente:

Nombre comercial.
Razón social, si aplica.
RUC o documento, si aplica.
Tipo de cliente.
Correo.
Teléfono.
WhatsApp.
Dirección.
Sitio web.
Responsable interno.
Estado.
Observaciones.
8.1.4 Proyectos

Ruta sugerida:

/internal/projects
/internal/projects/[projectId]

Objetivo:

Gestionar los proyectos contratados o desarrollados para clientes.

Estados del proyecto:

PLANNING
IN_PROGRESS
PAUSED
DELIVERED
CANCELLED

Funciones principales:

Crear proyecto.
Asociar proyecto a cliente.
Asignar responsable interno.
Definir fecha de inicio.
Definir fecha estimada de entrega.
Definir precio acordado, si aplica.
Definir estado.
Registrar progreso.
Crear hitos.
Subir documentos asociados.
Registrar pagos programados.
Mostrar información visible al cliente.

Tipos de proyecto sugeridos:

Landing page.
Sitio web corporativo.
Sistema web.
App móvil.
Branding.
UX/UI Design.
Mantenimiento.
Consultoría.
Otro.
8.1.5 Hitos de proyecto

Los hitos representan etapas relevantes dentro de un proyecto.

Ejemplos:

Inicio
Recolección de información
Diseño / Prototipo
Desarrollo
Revisión interna
Revisión con cliente
Correcciones
Entrega final
Soporte inicial

Cada hito debe tener:

Nombre.
Descripción.
Estado.
Fecha estimada.
Fecha completada.
Orden.
Visibilidad para cliente.

Estados sugeridos:

PENDING
IN_PROGRESS
COMPLETED
BLOCKED
8.1.6 Documentos

Ruta sugerida:

/internal/documents

También podrán verse desde:

/internal/clients/[clientId]/documents
/internal/projects/[projectId]/documents

Objetivo:

Centralizar documentos comerciales, contractuales y operativos.

Tipos de documento sugeridos:

COMMERCIAL_PROPOSAL
SIGNED_CONTRACT
INVOICE
PAYMENT_PROOF
DELIVERABLE
INTERNAL_FILE
OTHER

Funciones principales:

Subir documento.
Asociar documento a cliente.
Asociar documento a proyecto.
Marcar documento como visible o no visible para cliente.
Descargar documento.
Eliminar o archivar documento.
Registrar usuario que subió el documento.

Regla importante:

Los documentos internos no deben ser visibles para clientes.

8.1.7 Seguimiento de productos propios

Ruta sugerida:

/internal/products
/internal/products/foxrooms/demos
/internal/products/foxrooms/accounts

Objetivo:

Gestionar el seguimiento comercial de productos propios de Foxcode.

Producto inicial:

FoxRooms

Funciones principales:

Registrar demos emitidas.
Asociar demo a lead o cliente.
Registrar hotel interesado.
Registrar estado comercial.
Registrar responsable interno.
Registrar observaciones.
Registrar fecha de próxima acción.
Visualizar cuántas demos se han emitido.
Visualizar cuántos usuarios están en beta, interesados, perdidos o convertidos.

Estados sugeridos:

DEMO_REQUESTED
DEMO_GIVEN
FOLLOW_UP
BETA_USER
PAYING_CUSTOMER
LOST
8.2 Portal de clientes
8.2.1 Panel de entrada

Ruta sugerida:

/client/dashboard

Objetivo:

Mostrar al cliente un resumen claro de su relación actual con Foxcode.

Debe mostrar:

Proyectos activos.
Próximas entregas.
Pagos pendientes o próximos.
Documentos recientes.
Avisos importantes.
Datos de contacto rápido.
8.2.2 Mis proyectos

Ruta sugerida:

/client/projects
/client/projects/[projectId]

Objetivo:

Permitir que el cliente visualice los proyectos contratados.

Debe mostrar:

Nombre del proyecto.
Estado.
Progreso.
Fecha de inicio.
Fecha estimada de entrega.
Hitos visibles.
Documentos visibles asociados.
Próximos pasos.
Observaciones visibles para cliente.

El cliente no debe poder modificar datos operativos del proyecto.

8.2.3 Documentos del cliente

Ruta sugerida:

/client/documents

Objetivo:

Permitir que el cliente descargue documentos disponibles.

Debe mostrar únicamente documentos marcados como visibles para cliente.

Ejemplos:

Propuesta comercial.
Contrato firmado.
Entregables.
Comprobantes.
Manuales.
Archivos finales.
8.2.4 Pagos

Ruta sugerida:

/client/payments

Objetivo:

Mostrar pagos programados o referencias de pago.

Importante:

El sistema no procesará pagos inicialmente.

Debe mostrar:

Concepto.
Monto.
Fecha estimada.
Estado.
Proyecto asociado.
Canal de pago sugerido, si aplica.

Estados de pago sugeridos:

PENDING
PARTIAL
PAID
OVERDUE
CANCELLED
8.2.5 Mi perfil

Ruta sugerida:

/client/profile

Objetivo:

Permitir al cliente revisar o actualizar datos básicos.

Debe incluir:

Nombre.
Correo.
Teléfono.
Empresa asociada.
Conexión con Google, si Better Auth lo permite.
Datos de facturación, si se habilitan en el futuro.
8.2.6 Info / Ayuda

Ruta sugerida:

/client/help

Objetivo:

Mostrar información útil para el cliente.

Debe incluir:

Canales oficiales de contacto.
WhatsApp.
Correo.
Horario de atención.
Canales de pago.
Políticas básicas.
Mensaje de soporte.
8.3 Área administrativa
8.3.1 Gestión de trabajadores

Ruta sugerida:

/internal/workers

Disponible solo para ADMIN.

Funciones:

Crear trabajador.
Editar trabajador.
Activar/desactivar trabajador.
Asignar rol.
Ver proyectos asignados.
Ver leads asignados.
8.3.2 Configuración interna

Ruta sugerida:

/internal/settings

Disponible solo para ADMIN.

Debe permitir guardar datos internos como:

Nombre de empresa.
Correo de contacto.
WhatsApp oficial.
Datos de pago.
Información fiscal básica.
Configuración visible en portal cliente.
9. Arquitectura de rutas recomendada
app/
  (auth)/
    login/
      page.tsx
    register/
      page.tsx

  (internal)/
    internal/
      layout.tsx
      dashboard/
        page.tsx
      leads/
        page.tsx
        [leadId]/
          page.tsx
      clients/
        page.tsx
        [clientId]/
          page.tsx
      projects/
        page.tsx
        [projectId]/
          page.tsx
      products/
        page.tsx
        foxrooms/
          demos/
            page.tsx
          accounts/
            page.tsx
      documents/
        page.tsx
      workers/
        page.tsx
      settings/
        page.tsx

  (client)/
    client/
      layout.tsx
      dashboard/
        page.tsx
      projects/
        page.tsx
        [projectId]/
          page.tsx
      documents/
        page.tsx
      payments/
        page.tsx
      profile/
        page.tsx
      help/
        page.tsx

  api/
    auth/
      [...all]/
        route.ts
    uploads/
      route.ts
10. Arquitectura modular recomendada
src/
  modules/
    auth/
      server/
      components/
      permissions.ts

    users/
      server/
      components/
      schemas/
      queries.ts
      actions.ts

    leads/
      server/
      components/
      schemas/
      queries.ts
      actions.ts

    clients/
      server/
      components/
      schemas/
      queries.ts
      actions.ts

    projects/
      server/
      components/
      schemas/
      queries.ts
      actions.ts

    documents/
      server/
      storage/
        document-storage.adapter.ts
        local-storage.adapter.ts
      components/
      queries.ts
      actions.ts

    payments/
      server/
      components/
      queries.ts
      actions.ts

    products/
      foxrooms/
        server/
        components/
        queries.ts
        actions.ts

    dashboard/
      server/
      components/
      queries.ts

  components/
    ui/
    layout/
    shared/

  lib/
    auth.ts
    prisma.ts
    permissions.ts
    constants.ts
    utils.ts

  config/
    app.config.ts
11. Principios de desarrollo
11.1 Simplicidad

La interfaz debe ser simple, clara y directa. El usuario no debe sentirse dentro de un ERP complejo.

Inspiración visual:

Vercel Dashboard.
Linear.
Stripe Dashboard.
Notion en su simplicidad visual.
11.2 Claridad operativa

Cada módulo debe responder rápidamente:

Qué está pendiente.
Qué está activo.
Qué requiere atención.
Qué ya fue completado.
11.3 Separación por rol

No se deben mezclar interfaces internas con interfaces del cliente.

El área interna y el portal cliente deben tener layouts separados.

11.4 Desarrollo modular

Cada módulo debe poder desarrollarse, probarse y mantenerse de forma independiente.

11.5 Seguridad desde el inicio

Toda ruta sensible debe validar:

Sesión activa.
Rol del usuario.
Acceso al recurso solicitado.

Un cliente nunca debe poder acceder a recursos de otro cliente.

11.6 Escalabilidad pragmática

La app debe empezar simple, pero con decisiones que permitan crecer.

Ejemplo:

Documentos inicialmente en VPS.
Adaptador preparado para S3 en el futuro.
Metadata de documentos en base de datos.
Rutas limpias por entidad.
Estados bien definidos.
12. Almacenamiento de documentos
12.1 Contexto

En la primera versión, los documentos se almacenarán en una carpeta del VPS.

Sin embargo, el sistema debe prepararse para migrar a futuro hacia S3, Cloudflare R2, DigitalOcean Spaces u otro proveedor.

12.2 Regla principal

La base de datos no debe almacenar rutas absolutas del servidor.

Incorrecto:

/home/opc/apps/panel-cliente/uploads/projects/123/contrato.pdf

Correcto:

projects/123/contrato.pdf
12.3 Metadata sugerida

Cada documento debe guardar:

ID.
Nombre original.
Nombre almacenado.
MIME type.
Tamaño.
Storage provider.
Storage key.
URL pública, si aplica.
Cliente asociado.
Proyecto asociado.
Usuario que subió el archivo.
Visibilidad para cliente.
Fecha de creación.
12.4 Adaptadores

Se debe implementar un patrón adapter.

DocumentStorageAdapter
LocalStorageAdapter
S3StorageAdapter futuro
R2StorageAdapter futuro

Interfaz sugerida:

export interface DocumentStorageAdapter {
  upload(file: File, path: string): Promise<StoredFile>;
  delete(storageKey: string): Promise<void>;
  getUrl(storageKey: string): Promise<string>;
}
13. Schema conceptual de base de datos

Entidades iniciales:

User
Lead
Client
Project
ProjectMilestone
Document
PaymentSchedule
Product
ProductDemo
ActivityLog
InternalSetting
13.1 User

Representa usuarios internos y clientes.

Campos sugeridos:

id
name
email
phone
role
status
clientId nullable
createdAt
updatedAt

Roles:

ADMIN
WORKER
CLIENT

Estados:

ACTIVE
INACTIVE
INVITED
13.2 Lead

Representa oportunidad comercial.

Campos sugeridos:

id
name
email
phone
companyName
source
type
status
message
assignedToId
nextActionAt
lostReason
createdAt
updatedAt
13.3 Client

Representa cliente o empresa.

Campos sugeridos:

id
name
businessName
documentType
documentNumber
email
phone
whatsapp
website
address
status
responsibleWorkerId
createdAt
updatedAt
13.4 Project

Representa proyecto contratado o ejecutado.

Campos sugeridos:

id
clientId
name
description
type
status
progress
startDate
estimatedEndDate
deliveredAt
price
responsibleWorkerId
createdAt
updatedAt
13.5 ProjectMilestone

Representa etapas del proyecto.

Campos sugeridos:

id
projectId
title
description
status
order
dueDate
completedAt
visibleToClient
createdAt
updatedAt
13.6 Document

Representa metadata de archivos.

Campos sugeridos:

id
clientId nullable
projectId nullable
uploadedById
type
originalName
storedName
mimeType
size
storageProvider
storageKey
publicUrl nullable
visibleToClient
createdAt
updatedAt
13.7 PaymentSchedule

Representa pagos pactados o programados.

Campos sugeridos:

id
clientId
projectId nullable
concept
amount
currency
status
dueDate
paidAt
notes
createdAt
updatedAt

Estados:

PENDING
PARTIAL
PAID
OVERDUE
CANCELLED
13.8 Product

Representa productos propios de Foxcode.

Campos sugeridos:

id
name
slug
description
status
createdAt
updatedAt

Ejemplo inicial:

FoxRooms
13.9 ProductDemo

Representa seguimiento comercial de demos.

Campos sugeridos:

id
productId
leadId nullable
clientId nullable
assignedToId
companyName
contactName
contactEmail
contactPhone
status
demoDate
nextActionAt
notes
createdAt
updatedAt
13.10 ActivityLog

Representa historial de acciones importantes.

Campos sugeridos:

id
actorId
entityType
entityId
action
description
createdAt

Ejemplos:

Lead creado
Lead convertido en cliente
Proyecto actualizado
Documento subido
Pago marcado como pagado
Demo registrada
13.11 InternalSetting

Representa configuración general.

Campos sugeridos:

id
key
value
createdAt
updatedAt

Ejemplos:

company_name
company_email
company_whatsapp
payment_yape
payment_bank_account
support_schedule
14. Flujos principales del sistema
14.1 Flujo Lead → Cliente → Proyecto
1. Usuario llena formulario en landing.
2. Se registra un Lead con estado NEW.
3. Trabajador revisa el lead.
4. Trabajador contacta al lead.
5. Se agenda reunión o se envía cotización.
6. Si el lead acepta, cambia a WON.
7. Se crea un Client a partir del Lead.
8. Se crea un Project asociado al Client.
9. Se suben documentos iniciales.
10. Se generan pagos programados, si aplica.
11. Se habilita acceso del cliente al portal.
14.2 Flujo de proyecto
1. Trabajador crea proyecto.
2. Define cliente, tipo, fechas y responsable.
3. Crea hitos del proyecto.
4. Sube documentos relevantes.
5. Actualiza estados e hitos.
6. Cliente visualiza avances desde su portal.
7. Proyecto se marca como entregado.
8. Se suben entregables finales.
14.3 Flujo de documentos
1. Trabajador sube documento.
2. El sistema guarda archivo usando LocalStorageAdapter.
3. Se registra metadata en base de datos.
4. Trabajador define si el documento es visible para cliente.
5. Cliente puede ver y descargar solo documentos visibles.
14.4 Flujo de pagos programados
1. Trabajador o admin registra pago asociado a cliente/proyecto.
2. Se define monto, concepto y fecha.
3. Cliente visualiza pago pendiente.
4. Admin o worker marca pago como pagado cuando corresponde.
5. El sistema conserva historial.
14.5 Flujo de seguimiento FoxRooms
1. Se registra interés en FoxRooms.
2. Se crea lead o demo.
3. Se agenda demo.
4. Se marca demo como emitida.
5. Se registra seguimiento.
6. Se clasifica como beta user, cliente pago, perdido o pendiente.
15. KPIs iniciales
15.1 KPIs para trabajadores
Leads nuevos.
Leads pendientes de contacto.
Reuniones próximas.
Proyectos activos.
Proyectos próximos a vencer.
Hitos pendientes.
Demos pendientes.
Documentos recientes.
15.2 KPIs para administración
Total de leads por mes.
Leads convertidos.
Tasa de conversión.
Clientes activos.
Proyectos activos.
Proyectos entregados.
Ingresos proyectados.
Pagos pendientes.
Pagos vencidos.
Demos FoxRooms emitidas.
Demos convertidas en beta.
Demos convertidas en cliente pago.
15.3 KPIs para cliente
Proyectos activos.
Próxima entrega.
Pagos pendientes.
Documentos disponibles.
Progreso general del proyecto.
16. Stack tecnológico

El proyecto usará:

{
  "framework": "Next.js 16 App Router",
  "frontend": "React 19",
  "language": "TypeScript",
  "styles": "Tailwind CSS 4",
  "ui": "shadcn, Radix UI",
  "auth": "Better Auth",
  "database": "PostgreSQL",
  "orm": "Prisma 7",
  "icons": "Hugeicons",
  "deployment": "VPS inicialmente"
}
17. Criterios de diseño UI

La UI debe ser:

Simple.
Clara.
Moderna.
Ligera.
Profesional.
Inspirada en dashboards tipo Vercel.

Lineamientos:

Fondos limpios.
Cards con información puntual.
Tablas claras.
Filtros visibles.
Estados diferenciables.
Navegación lateral en área interna.
Navegación simple en portal cliente.
Evitar sobrecargar la interfaz.
Priorizar la acción principal de cada pantalla.
18. Reglas de seguridad
Toda ruta debe validar sesión.
Toda ruta debe validar rol.
Los clientes solo pueden acceder a recursos asociados a su clientId.
Los documentos internos nunca deben mostrarse al cliente.
Los endpoints de descarga deben validar permisos.
Los usuarios inactivos no deben poder acceder.
Las acciones críticas deben registrarse en ActivityLog.
19. Desarrollo por fases
Fase 1 - Base del sistema

Objetivo:

Crear la base técnica y visual de la aplicación.

Incluye:

Configuración inicial de Prisma.
Configuración de Better Auth.
Modelo User.
Roles.
Layout interno.
Layout cliente.
Protección básica de rutas.
Sidebar interno.
Navegación cliente.
Fase 2 - Leads

Objetivo:

Gestionar oportunidades comerciales.

Incluye:

Schema Lead.
Listado de leads.
Detalle de lead.
Estados.
Filtros.
Notas básicas.
Conversión lead a cliente.
Fase 3 - Clientes

Objetivo:

Gestionar clientes activos y potenciales.

Incluye:

Schema Client.
Listado de clientes.
Detalle de cliente.
Contactos básicos.
Historial de actividad.
Relación con leads y proyectos.
Fase 4 - Proyectos

Objetivo:

Gestionar proyectos por cliente.

Incluye:

Schema Project.
Schema ProjectMilestone.
CRUD de proyectos.
Estados.
Hitos.
Progreso.
Vista interna.
Vista cliente.
Fase 5 - Documentos

Objetivo:

Gestionar documentos con almacenamiento local adaptable.

Incluye:

Schema Document.
LocalStorageAdapter.
Subida de archivos.
Descarga segura.
Visibilidad para cliente.
Asociación con cliente/proyecto.
Fase 6 - Pagos programados

Objetivo:

Mostrar obligaciones y fechas de pago.

Incluye:

Schema PaymentSchedule.
Registro de pagos.
Estados.
Vista interna.
Vista cliente.
Fase 7 - Portal cliente

Objetivo:

Permitir acceso externo al cliente.

Incluye:

Dashboard cliente.
Mis proyectos.
Detalle de proyecto.
Documentos.
Pagos.
Perfil.
Info / Ayuda.
Fase 8 - Administración

Objetivo:

Permitir gestión completa por parte de administración.

Incluye:

Gestión de trabajadores.
Configuración interna.
KPIs administrativos.
Permisos avanzados.
Fase 9 - Seguimiento FoxRooms

Objetivo:

Gestionar demos y seguimiento comercial del producto FoxRooms.

Incluye:

Schema Product.
Schema ProductDemo.
Producto FoxRooms inicial.
Demos emitidas.
Estados comerciales.
KPIs de producto.
20. Criterios de aceptación generales

El sistema será considerado funcional en su primera versión cuando:

Un admin pueda crear trabajadores.
Un worker pueda gestionar leads.
Un lead pueda convertirse en cliente.
Un cliente pueda tener proyectos asociados.
Un proyecto pueda tener hitos.
Un proyecto pueda tener documentos.
Un cliente pueda iniciar sesión y ver solo sus proyectos.
Un cliente pueda ver solo documentos marcados como visibles.
Un worker pueda registrar pagos programados.
Un cliente pueda ver sus pagos programados.
Un admin pueda ver KPIs básicos.
El sistema pueda registrar demos de FoxRooms.
El almacenamiento local de documentos funcione mediante adapter.
21. Fuera del alcance inicial

No se incluirá inicialmente:

Procesamiento de pagos dentro del panel.
Firma digital de contratos.
Chat interno en tiempo real.
Integración directa con WhatsApp Business API.
Automatización avanzada de emails.
Facturación electrónica.
Integración con SUNAT.
Integración con S3 desde el primer release.
Multiempresa para varias software factories.
App móvil nativa.

Estos puntos podrán evaluarse en futuras versiones.

22. Riesgos y consideraciones
22.1 Almacenamiento local

El uso de VPS para documentos es válido inicialmente, pero debe manejarse con cuidado.

Riesgos:

Pérdida de archivos si no hay backups.
Escalabilidad limitada.
Mayor responsabilidad de seguridad.
Complicaciones al migrar si se guardan rutas absolutas.

Mitigación:

Usar adapter.
Guardar metadata en DB.
Guardar storageKey relativo.
Crear estructura ordenada de carpetas.
Preparar backups del directorio uploads.
22.2 Mezcla entre CRM y proyectos

Riesgo:

Confundir leads, clientes y proyectos en una sola entidad.

Mitigación:

Lead representa oportunidad.
Client representa relación comercial.
Project representa trabajo contratado.
ProductDemo representa seguimiento de producto propio.
22.3 Portal cliente demasiado complejo

Riesgo:

Crear una interfaz pesada para clientes.

Mitigación:

Mostrar solo lo importante.
Evitar pantallas administrativas.
Priorizar progreso, fechas, documentos y pagos.
23. Dirección del producto

El Panel de Cliente Foxcode debe evolucionar hacia una plataforma de gestión operativa interna y experiencia de cliente.

No debe convertirse en un sistema excesivamente complejo desde el inicio.

La dirección correcta es:

Simple primero.
Operativo después.
Automatizable a futuro.
Escalable sin reescribir todo.

La prioridad inicial es resolver tres problemas:

Foxcode necesita ordenar leads, clientes y proyectos.
Los clientes necesitan visibilidad sobre avances, entregas, documentos y pagos.
Administración necesita KPIs para entender el estado comercial y operativo de la empresa.
24. Prompt base para agentes de desarrollo

Este documento debe usarse como fuente de verdad.

Prompt sugerido:

Lee y respeta el documento docs/PRD.md como fuente principal del proyecto.

Antes de implementar cualquier módulo, revisa:
- Roles y permisos.
- Rutas definidas.
- Entidades relacionadas.
- Flujos esperados.
- Criterios de aceptación.
- Principios de UI.
- Reglas de seguridad.

No implementes funcionalidades fuera del alcance inicial salvo que se solicite explícitamente.

La prioridad es construir la app módulo por módulo, manteniendo una arquitectura simple, modular y escalable.

Stack:
- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn
- Radix UI
- Better Auth
- Prisma 7
- PostgreSQL

Primera tarea:
1. Crear la estructura base del proyecto.
2. Crear el schema inicial de Prisma.
3. Configurar roles.
4. Configurar protección de rutas.
5. Preparar layouts separados para área interna y portal cliente.
25. Decisión final de producto

El Panel de Cliente Foxcode será desarrollado como una aplicación modular con dos experiencias principales:

Experiencia interna para Foxcode.
Experiencia externa para clientes.

La primera versión debe priorizar:

Leads.
Clientes.
Proyectos.
Documentos.
Pagos programados.
Portal cliente.
KPIs básicos.
Seguimiento inicial de FoxRooms.

Toda decisión técnica debe favorecer la claridad, la mantenibilidad y la posibilidad de escalar el sistema sin rehacer la arquitectura.