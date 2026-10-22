import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
// Node 22 quita los tipos de TypeScript al importar: el registro se lee tal cual lo usa el panel.
import { GUIDES, headingId } from '../src/modules/guides/registry.ts';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');
const exists = (path) => access(new URL(path, root)).then(() => true, () => false);
const guideFile = (slug) => `content/guides/${slug}.mdx`;
/** Ids de los `##` de una guía, igual que los genera mdx-components.tsx. */
const headings = (mdx) => [...mdx.matchAll(/^##\s+(.+?)\s*$/gm)].map((match) => headingId(match[1]));

test('cada guía del registro tiene su MDX y una fecha de revisión válida', async () => {
  assert.ok(GUIDES.length > 0);
  assert.equal(new Set(GUIDES.map((guide) => guide.slug)).size, GUIDES.length, 'hay slugs repetidos');
  for (const guide of GUIDES) {
    assert.ok(await exists(guideFile(guide.slug)), `falta ${guideFile(guide.slug)}`);
    assert.match(guide.updatedAt, /^\d{4}-\d{2}-\d{2}$/, `${guide.slug}: updatedAt debe ser AAAA-MM-DD`);
    assert.ok(!Number.isNaN(Date.parse(guide.updatedAt)), `${guide.slug}: updatedAt no es una fecha`);
  }
});

test('cada ruta que cubre una guía existe en el panel', async () => {
  for (const guide of GUIDES) {
    for (const cover of guide.covers) {
      const page = `app/(internal)${cover.route}/page.tsx`;
      assert.ok(await exists(page), `${guide.slug}: la ruta ${cover.route} ya no existe (${page})`);
      if (cover.section) assert.ok(guide.sections.some((section) => section.id === cover.section), `${guide.slug}: ${cover.route} apunta a la sección inexistente #${cover.section}`);
    }
  }
});

test('las secciones del registro coinciden con los encabezados del MDX', async () => {
  for (const guide of GUIDES) {
    const ids = headings(await read(guideFile(guide.slug)));
    const registered = guide.sections.map((section) => section.id);
    for (const id of registered) assert.ok(ids.includes(id), `${guide.slug}: la sección #${id} no tiene su «##» en el MDX`);
    for (const id of ids) assert.ok(registered.includes(id), `${guide.slug}: el «##» #${id} no está en el registro (no sale en el índice ni en ⌘K)`);
  }
});

test('los enlaces entre guías llevan a una guía y una sección que existen', async () => {
  for (const guide of GUIDES) {
    const mdx = await read(guideFile(guide.slug));
    for (const [, slug, section] of mdx.matchAll(/\]\(\/internal\/guides\/([\w-]+)(?:#([\w-]+))?\)/g)) {
      const target = GUIDES.find((item) => item.slug === slug);
      assert.ok(target, `${guide.slug}: enlaza a la guía inexistente «${slug}»`);
      if (section) assert.ok(target.sections.some((item) => item.id === section), `${guide.slug}: enlaza a ${slug}#${section}, que no existe`);
    }
  }
});

test('los enlaces del MDX a pantallas internas apuntan a rutas que existen', async () => {
  for (const guide of GUIDES) {
    const mdx = await read(guideFile(guide.slug));
    for (const [, path] of mdx.matchAll(/(?:\]\(|href: ')(\/internal\/[\w/-]*)/g)) {
      if (path.startsWith('/internal/guides/')) continue;
      assert.ok(await exists(`app/(internal)${path.replace(/\/$/, '')}/page.tsx`), `${guide.slug}: el enlace ${path} no lleva a ninguna página`);
    }
  }
});
