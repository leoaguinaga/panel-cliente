import { chromium, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
if (!process.env.TEST_DATABASE_URL || process.env.TEST_DATABASE_URL !== process.env.DATABASE_URL) throw new Error('Temporary database required');
const base = 'http://localhost:3503';
const apiBase = 'http://localhost:3504';
const out = '../docs/deliverables-validation-2026-10-20';
mkdirSync(out, { recursive: true });
async function ready(url) {
  for (let i = 0; i < 90; i++) {
    try { if ((await fetch(url)).status < 500) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error('Server unavailable');
}
await ready(`${apiBase}/auth/session`);
await ready(`${base}/login`);
async function api(path, method = 'GET', body) {
  const response = await fetch(`${apiBase}${path}`, { method, headers: { Authorization: 'Bearer hitos-session-ADMIN', 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
  assert.ok(response.ok, `${method} ${path}: ${response.status}`);
  return response.json();
}
const projects = await api('/projects');
const project = projects.items.find(p => p.name === 'Landing de prueba');
assert.ok(project);
const h = await api(`/projects/${project.id}/milestones`, 'POST', { title: 'Entrega de diseño y documentación', visibleToClient: true });
const d = await api(`/projects/${project.id}/deliverables`, 'POST', { title: 'Diseño listo para aprobación', milestoneId: h.id });
const task = await api(`/projects/${project.id}/tasks`, 'POST', { title: 'Diseñar flujo de reservas', milestoneId: h.id });
await api(`/projects/${project.id}/tasks/${task.id}/evidences`, 'POST', { kind: 'LINK', title: 'Prototipo de reservas', fileUrl: 'https://example.com/prototipo' });
await api(`/projects/${project.id}/tasks/${task.id}/evidences`, 'POST', { kind: 'NOTE', notes: 'Borrador interno no seleccionado' });
const browser = await chromium.launch({ headless: true });
const report = { screens: [], checks: [] };
async function contextFor(role) {
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const token = `hitos-session-${role}`;
  const signature = createHmac('sha256', process.env.BETTER_AUTH_SECRET).update(token).digest('base64');
  await context.addCookies([{ name: 'better-auth.session_token', value: encodeURIComponent(`${token}.${signature}`), url: base, httpOnly: true, sameSite: 'Lax' }]);
  return context;
}
try {
  const context = await contextFor('ADMIN');
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/internal/projects/${project.id}/planning/milestones`);
  const card = page.locator('li').filter({ has: page.getByRole('heading', { name: h.title, exact: true }) }).first();
  await card.getByText(d.title, { exact: true }).waitFor();
  await card.getByText('Adjuntar material', { exact: true }).click();
  await card.getByLabel('Origen', { exact: true }).selectOption('link');
  await card.getByLabel('Enlace', { exact: true }).fill('https://example.com/entrega');
  await card.getByLabel('Nombre (opcional)', { exact: true }).fill('Documentación final');
  await card.getByRole('button', { name: 'Adjuntar', exact: true }).click();
  await card.getByRole('link', { name: 'Documentación final', exact: true }).waitFor();
  await card.getByLabel('Origen', { exact: true }).selectOption('upload');
  await card.locator('input[type=file]').setInputFiles({ name: 'guia-final.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') });
  await card.getByRole('button', { name: 'Adjuntar', exact: true }).click();
  await card.getByRole('link', { name: 'guia-final.png', exact: true }).waitFor();
  await card.getByLabel('Origen', { exact: true }).selectOption('evidence');
  const evidenceSelect = card.getByLabel('Evidencia', { exact: true });
  const optionValue = await evidenceSelect.locator('option').filter({ hasText: 'Prototipo de reservas' }).getAttribute('value');
  await evidenceSelect.selectOption(optionValue);
  await card.getByRole('button', { name: 'Adjuntar', exact: true }).click();
  await card.getByRole('link', { name: 'Prototipo de reservas', exact: true }).waitFor();
  await card.getByRole('link', { name: 'De tarea: Diseñar flujo de reservas', exact: true }).waitFor();
  await card.getByLabel('Origen', { exact: true }).selectOption('document');
  await card.getByLabel('Archivo existente', { exact: true }).selectOption({ label: 'guia-final.png' });
  await card.getByRole('button', { name: 'Adjuntar', exact: true }).click();
  await card.getByRole('status').filter({ hasText: 'Material adjuntado.' }).waitFor();
  await expect(card.getByRole('link', { name: 'guia-final.png', exact: true })).toHaveCount(2);
  await card.getByRole('button', { name: 'Quitar adjunto guia-final.png', exact: true }).last().click();
  await card.getByRole('status').filter({ hasText: 'Adjunto quitado.' }).waitFor();
  await expect(card.getByRole('link', { name: 'guia-final.png', exact: true })).toHaveCount(1);
  await card.getByLabel('Origen', { exact: true }).selectOption('evidence');
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await card.scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await page.addScriptTag({ content: readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8') });
    const violations = await card.evaluate(async el => (await window.axe.run(el, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => ({ id: v.id, nodes: v.nodes.map(n => n.target) })));
    await card.screenshot({ path: `${out}/internal-${width}.png` });
    report.screens.push({ surface: 'internal', width, violations });

  }
  assert.deepEqual(errors, []);
  report.checks.push('Link, upload, existing document, evidence selection, source link, removal, no overflow, scoped axe');
  const client = await contextFor('A');
  const clientPage = await client.newPage();
  await clientPage.goto(`${base}/client/projects/${project.id}`);
  await clientPage.getByRole('link', { name: 'Documentación final', exact: true }).waitFor();
  await clientPage.getByRole('link', { name: 'Prototipo de reservas', exact: true }).waitFor();
  const download = clientPage.getByRole('link', { name: 'guia-final.png', exact: true });
  const response = await client.request.get(new URL(await download.getAttribute('href'), base).href);
  assert.equal(response.status(), 200);
  assert.equal(await clientPage.getByText('Borrador interno no seleccionado', { exact: true }).count(), 0);
  assert.equal(await clientPage.getByRole('link', { name: /De tarea:/ }).count(), 0);
  for (const width of [1440, 390]) {
    await clientPage.setViewportSize({ width, height: 1000 });
    assert.equal(await clientPage.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
    await clientPage.locator('section[aria-labelledby=deliverables-title]').screenshot({ path: `${out}/client-${width}.png` });
    report.screens.push({ surface: 'client', width });
  }
  report.checks.push('Client sees selected material, authenticated download succeeds, internal evidence and task origin hidden');
  assert.deepEqual(report.screens.flatMap(screen => screen.violations ?? []), []);
  await client.close();
  await context.close();
} finally {
  await browser.close();
  writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2));
}
console.log(JSON.stringify(report, null, 2));
