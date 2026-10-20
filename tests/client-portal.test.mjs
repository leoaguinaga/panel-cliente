import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const read = (path) => readFile(new URL(path, root), 'utf8');

test('all client navigation destinations exist', async () => {
  await Promise.all(['app/(client)/client/dashboard/page.tsx', 'app/(client)/client/projects/page.tsx', 'app/(client)/client/documents/page.tsx', 'app/(client)/client/payments/page.tsx', 'app/(client)/client/profile/page.tsx', 'app/(client)/client/help/page.tsx'].map((path) => access(new URL(path, root))));
});

test('client navigation and document actions are in Spanish and accessible', async () => {
  const navigation = await read('components/layout/ClientNavbar.tsx');
  assert.match(navigation, /Resumen/); assert.match(navigation, /Mis proyectos/); assert.match(navigation, /aria-label/); assert.match(navigation, /aria-expanded/);
  assert.doesNotMatch(navigation, /<aside/);
  assert.match(navigation, /aria-current/);
  assert.doesNotMatch(await read('app/(client)/client/layout.tsx'), /lg:pl-64/);
  const documents = await read('app/(client)/client/documents/page.tsx');
  assert.match(documents, /Descargar/); assert.match(documents, /\/api\/backend\/documents\//);
});

test('async client routes use the named Boneyard fallback', async () => {
  const loading = await read('components/client/ClientPortalLoading.tsx');
  assert.match(loading, /Skeleton name="client-portal"/); assert.match(loading, /fixture=/); assert.match(loading, /fallback=/);
  const config = JSON.parse(await read('boneyard.config.json'));
  assert.deepEqual(config.breakpoints, [375, 768, 1280]);
  assert.ok(config.routes.includes('/boneyard-fixtures/client-portal'));
});

test('frontend domain proxy preserves cookies and does not access PostgreSQL', async () => {
  const route = await read('app/api/backend/[...path]/route.ts');
  assert.match(route, /proxyBackend/);
  const proxy = await read('src/lib/api/proxy.ts');
  assert.match(proxy, /getSetCookie/);
  assert.doesNotMatch(proxy, /prisma|DATABASE_URL/);
});

test('root document declares Spanish language and reduced motion support', async () => {
  assert.match(await read('app/layout.tsx'), /lang="es"/);
  assert.match(await read('app/globals.css'), /prefers-reduced-motion: reduce/);
});
