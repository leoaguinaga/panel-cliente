import { chromium } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
const require = createRequire(import.meta.url);
if (!process.env.TEST_DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL)
  throw new Error('Run only through backend test:postgres -- --review');
const base = 'http://localhost:3403';
const api = 'http://localhost:3404';
const out = resolve('../docs/validation-2026-10-19');
mkdirSync(out, { recursive: true });
async function ready(url) {
  for (let i = 0; i < 90; i++) {
    try { if ((await fetch(url)).status < 500) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`Server unavailable: ${url}`);
}
await ready(`${api}/auth/session`);
await ready(`${base}/login`);
execFileSync('pnpm', ['exec', 'boneyard-js', 'build', ...['project-summary', 'client-portal', 'product-demos'].map(name => `${base}/boneyard-fixtures/${name}`)], { stdio: 'inherit' });
const browser = await chromium.launch({ headless: true });
const report = { date: '2026-10-19', environment: 'Ephemeral PostgreSQL, real persisted role sessions, Chromium', pages: [], checks: [] };
let failed = false;
const axe = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
async function apiJson(path) {
  const response = await fetch(`${api}${path}`, { headers: { Authorization: 'Bearer test-session-ADMIN' } });
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}
const { products } = await apiJson('/catalogs');
const product = products.find(item => item.slug === 'demo-product');
const projects = await apiJson('/projects');
const projectId = projects.items[0].id;
const routes = {
  ADMIN: ['/internal/dashboard', '/internal/clients', '/internal/projects', `/internal/projects/${projectId}`, '/internal/documents', '/internal/payments', '/internal/products', `/internal/products/${product.id}/demos`, '/internal/services', '/internal/workers', '/internal/settings'],
  WORKER: ['/internal/dashboard', '/internal/clients', '/internal/projects', '/internal/products', `/internal/products/${product.id}/demos`],
  A: ['/client/dashboard', '/client/projects', '/client/documents', '/client/payments', '/client/profile', '/client/help'],
};
try {
  for (const [role, paths] of Object.entries(routes)) {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const token = `test-session-${role}`;
    const sig = createHmac('sha256', process.env.BETTER_AUTH_SECRET).update(token).digest('base64');
    await context.addCookies([{ name: 'better-auth.session_token', value: encodeURIComponent(`${token}.${sig}`), url: base, httpOnly: true, sameSite: 'Lax' }]);
    const page = await context.newPage();
    for (const width of [375, 768, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of paths) {
        const errors = [];
        const handler = error => errors.push(error.message);
        page.on('pageerror', handler);
        const response = await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
        await page.addScriptTag({ content: axe });
        const accessibility = await page.evaluate(async () => {
          const result = await window.axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } });
          return result.violations.map(item => ({ id: item.id, impact: item.impact, nodes: item.nodes.map(node => ({ target: node.target, summary: node.failureSummary })) }));
        });
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
        const record = { role, width, path, status: response.status(), finalPath: new URL(page.url()).pathname, overflow, errors, accessibility };
        report.pages.push(record);
        if (record.status !== 200 || record.finalPath !== path || overflow || errors.length || accessibility.length) failed = true;
        if (path.endsWith('/demos') || path.endsWith('/dashboard'))
          await page.screenshot({ path: `${out}/${role}-${width}-${path.endsWith('/demos') ? 'demos' : 'dashboard'}.png`, fullPage: true });
        page.off('pageerror', handler);
      }
    }
    if (role === 'WORKER') {
      await page.goto(`${base}/internal/settings`);
      report.checks.push({ name: 'Worker cannot open administration', pass: new URL(page.url()).pathname === '/internal/dashboard' });
    }
    if (role === 'A') {
      await page.goto(`${base}/internal/products`);
      report.checks.push({ name: 'Client cannot open internal pages', pass: new URL(page.url()).pathname === '/client/dashboard' });
    }
    if (role === 'A') {
      await page.setViewportSize({ width: 375, height: 900 });
      const menu = page.getByRole('button', { name: 'Abrir menú', exact: true });
      await menu.focus(); await page.keyboard.press('Enter');
      const navigation = page.getByRole('navigation', { name: 'Navegación móvil', exact: true });
      await navigation.getByRole('link', { name: 'Pagos', exact: true }).click();
      await page.waitForURL(`${base}/client/payments`);
      report.checks.push({ name: 'Client mobile menu opens with keyboard and navigates', pass: new URL(page.url()).pathname === '/client/payments' });
    }
    if (role === 'ADMIN') {
      await page.goto(`${base}/internal/products/${product.id}/demos`);
      await page.getByLabel('Empresa o negocio').last().fill('   ');
      await page.getByRole('button', { name: 'Registrar demo' }).click();
      await page.getByRole('alert').filter({ hasText: 'Empresa obligatoria' }).waitFor();
      report.checks.push({ name: 'Demo server validation shows actionable error', pass: true });
      await page.getByLabel('Empresa o negocio').last().fill('Hotel browser acceptance');
      await page.getByLabel('Correo', { exact: true }).last().fill('browser@example.test');
      await page.getByRole('button', { name: 'Registrar demo' }).click();
      await page.getByRole('heading', { name: 'Hotel browser acceptance', exact: true }).waitFor();
      report.checks.push({ name: 'Create demo through server action', pass: true });
      await page.getByText('Editar seguimiento de Hotel browser acceptance', { exact: true }).click();
      const article = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Hotel browser acceptance', exact: true }) });
      await article.locator('select[name="status"]').selectOption('BETA_USER');
      await article.getByLabel('Notas y próxima acción').fill('Browser verified');
      await article.getByRole('button', { name: 'Guardar seguimiento' }).click();
      await article.locator('span').filter({ hasText: /^Usuario beta$/ }).waitFor();
      report.checks.push({ name: 'Update demo through server action', pass: (await apiJson(`/catalogs/products/${product.id}/demos?status=BETA_USER`)).some(item => item.companyName === 'Hotel browser acceptance' && item.notes === 'Browser verified') });
      await page.getByLabel('Empresa o negocio').last().focus();
      await page.keyboard.press('Tab');
      const focused = await page.evaluate(() => ({ tag: document.activeElement.tagName, outline: getComputedStyle(document.activeElement).outlineStyle }));
      report.checks.push({ name: 'Keyboard focus reaches an interactive control', pass: ['A', 'BUTTON', 'SELECT', 'INPUT', 'SUMMARY', 'TEXTAREA'].includes(focused.tag), focused });
    }
    await context.close();
  }
  const publicContext = await browser.newContext();
  const page = await publicContext.newPage();
  await page.goto(`${base}/internal/dashboard`);
  report.checks.push({ name: 'Unauthenticated users redirected to login', pass: new URL(page.url()).pathname === '/login' });
  for (const fixture of ['project-summary', 'client-portal', 'product-demos']) {
    const response = await page.goto(`${base}/boneyard-fixtures/${fixture}`);
    report.checks.push({ name: `Public safe fixture ${fixture}`, pass: response.status() === 200 && !(await page.content()).includes('@example.test') });
  }
  await publicContext.close();
} catch (error) { report.error = error.message; failed = true; }
finally {
  await browser.close();
  if (report.checks.some(check => !check.pass)) failed = true;
  report.pass = !failed;
  writeFileSync(`${out}/ui-report.json`, JSON.stringify(report, null, 2));
  console.log(`Browser review: ${report.pages.length} route/role/viewport checks, ${report.checks.length} flow checks. Pass: ${report.pass}`);
}
if (failed) process.exitCode = 1;
