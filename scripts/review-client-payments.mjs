import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const out = '../docs/propuestas/pagos-cliente/implementation-review';
mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ reducedMotion: 'reduce' });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
const checks = [];
const assert = (value, name) => { if (!value) throw Error(name); checks.push(name); };
try {
 await page.goto('http://localhost:3003/boneyard-fixtures/client-payments');
 await page.getByRole('heading', { name: 'Mis cuotas' }).first().waitFor();
 await page.addScriptTag({ content: readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8') });
 for (const [name,width] of [['desktop',1440],['mobile',390]]) {
  await page.setViewportSize({width,height:960});
  await page.screenshot({path:`${out}/${name}.png`,fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`No overflow ${name}`);
 }
 assert(await page.getByText('USD 400.00',{exact:true}).count()===2,'Partial balance 400');
 assert(await page.getByText('USD 380.00',{exact:true}).count()===1,'Confirmed includes partial plus paid');
 await page.getByRole('button',{name:'Ver condición',exact:true}).click();
 assert(await page.getByRole('dialog').getByText('Se habilita al aprobar «Entrega final»').isVisible(),'Milestone condition');
 assert(await page.getByRole('dialog').getByRole('button',{name:'Reportar pago',exact:true}).count()===0,'Scheduled cannot report');
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Reportar pago',exact:true}).click();
 await page.getByRole('dialog').waitFor();
 await page.screenshot({path:`${out}/report-mobile.png`,fullPage:false});
 const a11y = await page.evaluate(async()=> (await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
 writeFileSync(`${out}/accessibility.json`,JSON.stringify(a11y,null,2));
 assert(a11y.length===0,'Report accessibility');
 await page.route('**/api/backend/payments/fixture-pending/report', async route => {
  assert(route.request().method()==='POST','Report POST');
  await route.fulfill({status:200,contentType:'application/json',body:'{}'});
 });
 await page.locator('input[type=file]').setInputFiles({name:'test.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4 demo')});
 await page.getByRole('button',{name:'Confirmar y enviar comprobante'}).click();
 await page.getByText('¡Comprobante enviado con éxito!').waitFor();
 assert(true,'Report success (API mocked)');
 await page.getByRole('dialog').waitFor({state:'hidden'});
 await page.getByRole('button',{name:'Consultar cuentas de pago',exact:true}).last().click();
 assert(await page.getByText('No hay cuentas de pago publicadas. Contacta al equipo antes de transferir.').isVisible(),'Empty accounts recovery');
 await page.keyboard.press('Escape');
 assert(errors.length===0,'No browser errors');
 writeFileSync(`${out}/checks.json`,JSON.stringify({checks,errors},null,2));
 console.log(JSON.stringify({checks,errors}));
} finally { await browser.close(); }
