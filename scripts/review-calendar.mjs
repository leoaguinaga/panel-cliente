import {chromium} from '@playwright/test';
import {createHmac} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url);
if(!process.env.TEST_DATABASE_URL||process.env.TEST_DATABASE_URL!==process.env.DATABASE_URL)throw new Error('Temporary database required');
const base='http://localhost:3503';const out='../docs/calendar-validation-2026-10-20';mkdirSync(out,{recursive:true});
async function ready(url){for(let i=0;i<90;i++){try{if((await fetch(url)).status<500)return}catch{}await new Promise(r=>setTimeout(r,1000))}throw new Error('Server unavailable')}
await ready('http://localhost:3504/auth/session');await ready(base+'/login');
const browser=await chromium.launch({headless:true});const report={screens:[],checks:[]};

async function reviewPanelMotion(page, role) {
  const reminder = page.getByRole('button', { name: 'Crear recordatorio', exact: true });
  const meeting = page.getByRole('button', { name: 'Crear reunión', exact: true });
  const close = page.getByRole('button', { name: 'Cerrar formulario', exact: true });
  const title = page.getByLabel('Título', { exact: true });
  const dayButtons = page.getByRole('button', { name: /, \d+ pendientes$/ });
  const settle = () => page.evaluate(async () => {
    await Promise.all(document.getAnimations().map(a => a.finished.catch(() => {})));
  });
  const calendarWidth = () => page.locator('[class*=calendar]').filter({ has: dayButtons.first() }).last().evaluate(el => el.getBoundingClientRect().width);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const width = await calendarWidth();
  for (const button of [reminder, meeting]) {
    await button.click();
    await title.waitFor();
    assert.ok(Math.abs(await calendarWidth() - width) < 1);
    await settle();
    await close.click();
    await page.waitForFunction(() => !document.querySelector('input[name=title]'));
    assert.equal(await button.evaluate(el => document.activeElement === el), true);
  }
  // Interrupt entry, then replace the outgoing form with the latest request.
  await reminder.click();
  await close.evaluate(el => el.click());
  await meeting.evaluate(el => el.click());
  await page.getByRole('heading', { name: 'Crear reunión', exact: true }).waitFor();
  await title.fill('Borrador temporal de movimiento');
  await settle();
  assert.equal(await title.inputValue(), 'Borrador temporal de movimiento');
  // Several selections while a form is leaving must resolve to the last day.
  const lastLabel = await dayButtons.nth(17).getAttribute('aria-label');
  await dayButtons.evaluateAll(buttons => { buttons[15].click(); buttons[16].click(); buttons[17].click(); });
  await page.waitForFunction(() => !document.querySelector('input[name=title]'));
  assert.equal(await dayButtons.nth(17).getAttribute('aria-pressed'), 'true');
  assert.equal(await page.getByRole('heading', { name: lastLabel.replace(/, \d+ pendientes$/, ''), exact: true }).count(), 1);
  await settle();
  // Keyboard navigation is immediate and restores the trigger on cancellation.
  await reminder.focus();
  await page.keyboard.press('Enter');
  assert.equal(await title.evaluate(el => document.activeElement === el), true);
  assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.target?.matches?.('[data-calendar-panel-content], [data-calendar-day-content]')).length), 0);
  await close.focus();
  await page.keyboard.press('Enter');
  assert.equal(await title.count(), 0);
  assert.equal(await reminder.evaluate(el => document.activeElement === el), true);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  for (const button of [reminder, meeting]) {
    await button.click();
    assert.equal(await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running' && a.effect?.target?.matches?.('[data-calendar-panel-content], [data-calendar-day-content]')).length), 0);
    await close.click();
    assert.equal(await title.count(), 0);
  }
  report.checks.push({ role, panelMotion: true, rapidSelection: true, stableCalendarWidth: true, keyboard: true, reducedMotion: true });
}
try{for(const role of ['ADMIN','WORKER']){const context=await browser.newContext({reducedMotion:'reduce'});const token=`calendar-${role}`;const sig=createHmac('sha256',process.env.BETTER_AUTH_SECRET).update(token).digest('base64');await context.addCookies([{name:'better-auth.session_token',value:encodeURIComponent(`${token}.${sig}`),url:base,httpOnly:true,sameSite:'Lax'}]);const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'/internal/calendar');await page.getByRole('heading',{name:'Calendario',exact:true}).waitFor();await page.getByRole('button',{name:'Crear recordatorio',exact:true}).waitFor();await page.locator('[aria-busy=false]').waitFor();for(const width of [1440,768,390]){await page.setViewportSize({width,height:1000});await page.screenshot({path:`${out}/${role}-${width}.png`,fullPage:true});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);await page.addScriptTag({content:readFileSync(require.resolve('axe-core/axe.min.js'),'utf8')});const violations=await page.evaluate(async()=>{const r=await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}});return r.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)}))});report.screens.push({role,width,violations});assert.deepEqual(violations,[])}await page.setViewportSize({width:1440,height:1000});await reviewPanelMotion(page,role);await page.getByRole('button',{name:'Crear recordatorio',exact:true}).click();await page.getByLabel('Título',{exact:true}).fill(`Recordatorio visual ${role}`);await page.getByRole('button',{name:'Guardar recordatorio',exact:true}).click();await page.getByRole('status').filter({hasText:'Pendiente guardado.'}).waitFor();await page.locator('[aria-busy=false]').waitFor();await page.getByRole('button',{name:new RegExp(`Recordatorio visual ${role}`)}).last().click();await page.getByRole('button',{name:'Marcar completado'}).click();await page.getByRole('status').filter({hasText:'Recordatorio completado.'}).waitFor();await page.getByRole('button',{name:'Crear reunión',exact:true}).click();await page.getByLabel('Título',{exact:true}).fill(`Reunión visual ${role}`);await page.locator('textarea[name=attendees]').fill('cliente@example.test');await page.screenshot({path:`${out}/${role}-meeting-desktop.png`,fullPage:true});await page.setViewportSize({width:390,height:1000});await page.screenshot({path:`${out}/${role}-meeting-mobile.png`,fullPage:true});await page.getByRole('button',{name:'Guardar reunión',exact:true}).click();await page.locator('[aria-busy=false]').waitFor();await page.getByRole('button',{name:'Agenda',exact:true}).click();await page.getByRole('button',{name:new RegExp(`Reunión visual ${role}`)}).first().click();await page.getByRole('button',{name:'Reintentar sincronización'}).waitFor();await page.getByRole('button',{name:'Editar',exact:true}).click();await page.getByLabel('Título',{exact:true}).fill(`Reunión editada ${role}`);await page.getByRole('button',{name:'Guardar reunión',exact:true}).click();await page.locator('[aria-busy=false]').waitFor();await page.getByRole('button',{name:new RegExp(`Reunión editada ${role}`)}).first().click();page.once('dialog',d=>d.accept());await page.getByRole('button',{name:'Cancelar reunión',exact:true}).click();await page.getByRole('status').filter({hasText:/Pendiente cancelado|Cancelación guardada/}).waitFor();assert.deepEqual(errors,[]);report.checks.push({role,createReminder:true,completeReminder:true,createMeeting:true,editMeeting:true,cancelMeeting:true,failedSyncRecoverable:true,errors});await context.close()}}finally{await browser.close();writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2))}
console.log(JSON.stringify(report,null,2));
