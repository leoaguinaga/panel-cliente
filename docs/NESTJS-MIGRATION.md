# Backend NestJS

La API vive en `api/` y utiliza el mismo esquema Prisma/PostgreSQL que el frontend durante la transición.

## Ejecutar

1. Copiar `api/.env.example` a `api/.env` y configurar `DATABASE_URL`.
2. Ejecutar `pnpm api:dev` desde la raíz.
3. La API escucha en `http://localhost:3004` por defecto.

## Autenticación

Nest valida la cookie de sesión emitida por Better Auth contra las tablas `Session` y `User`. Los endpoints de `/v1` requieren sesión activa; `workers` y `settings` requieren rol `ADMIN`.

## Endpoints iniciales

- `GET /v1/dashboard`
- `GET|POST /v1/clients`
- `GET|POST /v1/leads`
- `GET|POST /v1/projects`
- `PATCH /v1/tasks/:taskId/status`
- `GET /v1/documents`
- `GET /v1/payments`
- `GET /v1/catalogs`
- `GET /v1/workers`
- `GET /v1/settings`

## Regla de transición

Next.js conserva acceso directo a Prisma temporalmente mientras se reemplazan las consultas y acciones por clientes HTTP equivalentes, módulo por módulo. No se debe eliminar `src/lib/prisma.ts` hasta que todos los consumidores utilicen la API y las pruebas de flujos críticos estén cubiertas.
