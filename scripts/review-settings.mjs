import { chromium } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
if (!process.env.TEST_DATABASE_URL || process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) throw new Error('Use isolated PostgreSQL runner');
const require = createRequire(import.meta.url), base = 'http://localhost:3403', out = resolve('../docs/validation-settings-2026-10-20'); mkdirSync(out, { recursive: true });
async function ready(url) { for (let i = 0; i < 90; i++) { try { if ((await fetch(url)).status < 500) return; } catch {} await new Promise(r => setTimeout(r, 700)); } throw new Error('Server unavailable'); }
await ready('http://localhost:3404/health/live'); await ready(base + '/login');
const browser = await chromium.launch(), checks = [], pages = [];
const assert = (ok, name) => { if (!ok) throw new Error(name); checks.push(name); };
async function context(role) { const context = await browser.newContext({ reducedMotion: 'reduce' }); const token = `test-session-${role}`, sig = createHmac('sha256', process.env.BETTER_AUTH_SECRET).update(token).digest('base64'); await context.addCookies([{ name: 'better-auth.session_token', value: encodeURIComponent(`${token}.${sig}`), url: base, httpOnly: true, sameSite: 'Lax' }]); return context; }
try {
 const admin = await context('ADMIN'), page = await admin.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
 await page.goto(base + '/internal/settings?section=portal'); await page.getByRole('heading', { name: 'Métodos de pago aceptados' }).waitFor();
 await page.getByLabel('Razón social', { exact: true }).fill('Empresa actualizada SAC'); await page.getByRole('button', { name: 'Añadir Yape o Plin' }).click();
 await page.getByLabel('Número de celular').last().fill('999222333'); await page.getByLabel('Titular de la billetera').last().fill('Titular nuevo');
 await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'Cambios guardados.' }).waitFor();
 await page.reload(); await page.getByRole('heading', { name: 'Métodos de pago aceptados' }).waitFor(); assert(await page.getByLabel('Razón social', { exact: true }).inputValue() === 'Empresa actualizada SAC', 'Fiscal data survives reload'); assert(await page.getByLabel('Número de celular').last().inputValue() === '999222333', 'Wallet survives reload');
 await page.getByRole('button', { name: 'Empresa y contacto', exact: true }).click(); await page.getByLabel('Nombre de la empresa', { exact: true }).fill('Foxcode prueba UI'); await page.getByRole('button', { name: 'Guardar cambios', exact: true }).click(); await page.getByRole('status').filter({ hasText: 'Cambios guardados.' }).waitFor();
 await page.getByRole('button', { name: 'Portal del cliente', exact: true }).click(); assert(await page.getByLabel('Razón social', { exact: true }).inputValue() === 'Empresa actualizada SAC', 'Section save preserves fiscal data');
 for (const width of [1280, 390]) {
  await page.setViewportSize({ width, height: 900 });
  for (const [id,label] of [['empresa','Empresa y contacto'],['portal','Portal del cliente'],['integraciones','Integraciones'],['operacion','Operación'],['preferencias','Mis preferencias']]) {
   await page.getByRole('button', { name: label, exact: true }).click(); if(id==='integraciones')await page.getByText('Falta preparar la conexión',{exact:true}).waitFor();
   await page.addScriptTag({ content: readFileSync(require.resolve('axe-core/axe.min.js'),'utf8') });
   const a11y=await page.evaluate(async()=>(await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);pages.push({width,section:id,a11y,overflow});assert(!overflow,`${id} fits ${width}`);assert(a11y.length===0,`${id} accessibility ${width}: ${JSON.stringify(a11y)}`);
   await page.screenshot({path:resolve(out,`${id}-${width}.png`),fullPage:true});
  }
 }
 await page.goto(base+'/internal/calendar');assert(await page.locator('h2').filter({hasText:'Google Calendar y Meet'}).count()===0,'Calendar block removed');
 const client=await context('A'),cp=await client.newPage();await cp.goto(base+'/client/payments');await cp.getByRole('button',{name:/Ver cuentas/}).click();assert(await cp.getByText('999222333',{exact:true}).isVisible(),'Client sees saved wallet');assert(await cp.getByText('Empresa actualizada SAC',{exact:true}).isVisible(),'Client sees fiscal data');
 const worker=await context('WORKER'),wp=await worker.newPage();await wp.goto(base+'/internal/settings');await wp.getByRole('heading',{name:'Mis preferencias',exact:true}).waitFor();assert(await wp.getByRole('button',{name:'Empresa y contacto',exact:true}).count()===0,'Worker sees only personal preferences');assert(errors.length===0,'No browser runtime errors');
 console.log(JSON.stringify({checks:checks.length,viewports:pages.length,result:'passed'}));
}finally{writeFileSync(resolve(out,'report.json'),JSON.stringify({checks,pages},null,2));await browser.close()}
