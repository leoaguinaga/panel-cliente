import { chromium, expect } from '@playwright/test';
import { createHmac, createHash, randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(new URL('../../backend/package.json', import.meta.url));
const frontendRequire = createRequire(import.meta.url);
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
if (!process.env.TEST_DATABASE_URL || process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL) throw new Error('Temporary database required');
const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.TEST_DATABASE_URL }) });
const base = 'http://localhost:3503';
const out = '../docs/client-users-validation-2026-10-20';
mkdirSync(out, { recursive: true });
async function ready(url) {
  for (let i = 0; i < 90; i++) {
    try { if ((await fetch(url)).status < 500) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Server unavailable');
}
await ready('http://localhost:3504/auth/session');
await ready(`${base}/login`);
const client = await db.client.findFirstOrThrow({ where: { name: 'Client A' } });
await db.client.update({ where: { id: client.id }, data: { businessName: 'Empresa de demostración', email: 'contacto@example.test' } });
await db.lead.create({ data: { name: 'Origen comercial', companyName: 'Lead de demostración', status: 'WON', clientId: client.id } });
await db.project.create({ data: { name: 'Sistema de reservas', clientId: client.id, type: 'SYSTEM', status: 'IN_PROGRESS', progress: 45 } });
await db.project.create({ data: { name: 'Sitio web entregado', clientId: client.id, type: 'WEBSITE', status: 'DELIVERED', progress: 100 } });
await db.paymentSchedule.create({ data: { concept: 'Cuota cancelada de prueba', clientId: client.id, amount: 500, status: 'CANCELLED', currency: 'PEN' } });
const browser = await chromium.launch({ headless: true });
const report = { checks: [], screens: [] };
try {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const token = 'client-users-admin';
  const signature = createHmac('sha256', process.env.BETTER_AUTH_SECRET).update(token).digest('base64');
  await context.addCookies([{ name: 'better-auth.session_token', value: encodeURIComponent(`${token}.${signature}`), url: base, httpOnly: true, sameSite: 'Lax' }]);
  const page = await context.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  for (const width of [1280, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto(`${base}/internal/clients/${client.id}`);
    await expect(page.getByRole('link', { name: /Proviene de un lead/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Sistema de reservas/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Sitio web entregado/ })).toHaveCount(0);
    await page.screenshot({ path: `${out}/summary-${width}.png`, fullPage: true });
    await page.getByRole('navigation', { name: 'Secciones del cliente' }).getByRole('link', { name: /^Proyectos/ }).click();
    await expect(page.getByRole('link', { name: /Sitio web entregado/ })).toBeVisible();
    await page.getByRole('link', { name: /^Usuarios/ }).click();
    await expect(page.getByRole('heading', { name: 'Usuarios del cliente' })).toBeVisible();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.addScriptTag({ content: readFileSync(frontendRequire.resolve('axe-core/axe.min.js'), 'utf8') });
    const violations = await page.locator('main').evaluate(async el => (await window.axe.run(el, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })));
    await page.screenshot({ path: `${out}/users-${width}.png`, fullPage: true });
    report.screens.push({ width, violations });
    await page.getByRole('button', { name: 'Invitar usuario', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel('Nombre', { exact: true }).fill('Persona de prueba');
    await page.getByLabel('Correo electrónico', { exact: true }).fill('persona@example.test');
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await page.getByRole('link', { name: /^Pagos/ }).click();
    await page.getByRole('link', { name: /Cuota cancelada de prueba/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('dialog').getByText('Cuota cancelada de prueba', { exact: true })).toBeVisible();
  }
  report.checks.push('Resumen con origen y activos; historial; usuarios y sidebar; pago cancelado abre su detalle; sin overflow desktop/mobile');
  // Exercise real Better Auth hashing and login through the compiled server, with no email delivery.
  const user = await db.user.create({ data: { name: 'Portal test', email: 'portal@example.test', role: 'CLIENT', status: 'INVITED', clientId: client.id } });
  const raw = randomBytes(32).toString('hex');
  await db.verification.create({ data: { identifier: `client-password:${user.id}`, value: createHash('sha256').update(raw).digest('hex'), expiresAt: new Date(Date.now() + 3600000) } });
  const publicContext = await browser.newContext(); const publicPage = await publicContext.newPage();
  await publicPage.goto(`${base}/set-password#token=${raw}`);
  await publicPage.getByLabel('Nueva contraseña', { exact: true }).fill('Browser-test-password-2026');
  await publicPage.getByLabel('Repetir contraseña', { exact: true }).fill('Browser-test-password-2026');
  await publicPage.getByRole('button', { name: 'Guardar contraseña', exact: true }).click();
  await expect(publicPage.getByRole('heading', { name: 'Tu contraseña está lista' })).toBeVisible();
  await publicPage.getByRole('link', { name: 'Ir a iniciar sesión' }).click();
  await publicPage.waitForLoadState('networkidle');
  await publicPage.getByLabel('Correo', { exact: true }).fill('portal@example.test');
  await publicPage.getByLabel('Contraseña', { exact: true }).fill('Browser-test-password-2026');
  await publicPage.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await publicPage.waitForURL('**/client/dashboard');
  report.checks.push('Contraseña creada con hash real; inicio de sesión cliente y acceso al portal');
  assert.deepEqual(errors, []);
  writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} finally { await browser.close(); await db.$disconnect(); }
