# Pruebas del frontend

## Ejecutar

```bash
pnpm test:portal
pnpm build
pnpm lint
```

## Fiabilidad y seguridad

- Todas las rutas visibles en la navegación cliente existen.
- Navegación móvil expone nombre accesible y estado expandido.
- Las rutas asíncronas utilizan el skeleton nombrado `client-portal`.
- Boneyard captura 375, 768 y 1280 px.
- Las descargas de clientes validan pertenencia al `clientId` y `visibleToClient`.
- El documento usa idioma español y respeta movimiento reducido.

## Verificación visual

Revisar `/client/dashboard`, `/client/projects`, `/client/documents`, `/client/payments`, `/client/profile` y `/client/help` en 375, 768 y 1280 px con una sesión `CLIENT`.

El lint global contiene deuda previa en la superficie interna. Un fallo ajeno al portal debe registrarse y no confundirse con la validación de estas rutas.


## Aceptación integrada — 19 de octubre de 2026

Desde `panel-cliente`, ejecutar `pnpm --dir backend test:acceptance`. El runner mantiene PostgreSQL y archivos efímeros, levanta las aplicaciones en 3403/3404 y ejecuta `frontend/scripts/review-ui.mjs` con sesiones persistidas por rol. No usa cuentas ni base de producción. Requiere `pnpm exec playwright install chromium` desde frontend.

La revisión cubre las rutas principales ADMIN/WORKER/CLIENT en 375, 768 y 1280, axe WCAG A/AA, desbordamiento horizontal, errores de ejecución, restricciones de acceso, alta/edición de demos, error de validación, foco con teclado y menú móvil. Las fixtures Boneyard públicas contienen únicamente estructura segura. Evidencias y límites: `../docs/CIERRE-ITERACION-5-2026-10-19.md`.
