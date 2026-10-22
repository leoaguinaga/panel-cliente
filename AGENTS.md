<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Guías internas

Si un cambio altera un flujo que cubre una guía (`content/guides/*.mdx`, metadatos en `src/modules/guides/registry.ts`), actualiza la guía y su `updatedAt` en el mismo commit. `pnpm test:portal` falla si una ruta cubierta, una sección o un enlace de una guía dejan de existir.
