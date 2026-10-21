import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
const require=createRequire(import.meta.url), out=resolve('../docs/propuestas/trabajadores-assets');mkdirSync(out,{recursive:true});
const browser=await chromium.launch(), context=await browser.newContext({reducedMotion:'reduce',acceptDownloads:true}), page=await context.newPage(), errors=[], checks=[];
page.on('pageerror',e=>errors.push(e.message));
const check=(ok,name)=>{if(!ok)throw new Error(name);checks.push(name)};
try{
 await page.setViewportSize({width:1440,height:1000});await page.goto('http://127.0.0.1:8766/PROPUESTA-TRABAJADORES-2026-10-20.html');
 const f=page.frameLocator('#prototype');await f.getByRole('heading',{name:'Trabajadores',exact:true}).waitFor();
 await f.getByRole('searchbox',{name:'Buscar trabajadores'}).fill('nadie-xyz');await f.getByRole('heading',{name:'No hay coincidencias'}).waitFor();check(true,'Search empty state');await f.getByRole('button',{name:'Limpiar filtros',exact:true}).click();
 await f.getByLabel('Filtrar por estado').selectOption('INACTIVE');check(await f.getByRole('link',{name:/Diego Torres/}).isVisible(),'Status filter');await f.getByLabel('Filtrar por estado').selectOption('ALL');
 await f.getByRole('link',{name:/Ana Rojas Frontend/}).click();await f.getByRole('heading',{name:'Ana Rojas',exact:true}).waitFor();
 await f.getByRole('button',{name:/Preparar entrega/}).click();await f.getByLabel('Estado de la tarea').selectOption('REVIEW');await f.getByRole('button',{name:'Simular actualización'}).click();
 await f.getByRole('link',{name:'Auditoría',exact:true}).click();await f.getByRole('heading',{name:'FOX-148 · En progreso → En revisión',exact:true}).waitFor();check(true,'Task changes appear in performed audit');
 await f.getByRole('link',{name:'Siguiente',exact:true}).click();await f.getByText(/Página 2 de 2/).waitFor();check(true,'Audit pagination');
 await f.getByRole('link',{name:'Datos personales',exact:true}).click();await f.getByLabel('Cargo o especialidad').fill('Frontend Lead');await f.getByRole('button',{name:'Guardar cambios',exact:true}).click();await f.getByRole('status').filter({hasText:'Cambios guardados'}).waitFor();
 await f.getByRole('link',{name:'Auditoría',exact:true}).click();await f.getByRole('button',{name:'Cambios sobre su cuenta',exact:true}).click();await f.getByRole('heading',{name:'Colaborador actualizado · cargo',exact:true}).waitFor();check(true,'Account audit tracks edited fields');
 await f.getByLabel('Tipo de acción').selectOption('CREATED');await f.getByRole('button',{name:'Aplicar filtros',exact:true}).click();await f.getByText('1 evento registrado',{exact:true}).waitFor();check(true,'Action filter');
 await f.getByRole('link',{name:'Acceso',exact:true}).click();await f.getByLabel('Contraseña temporal',{exact:true}).fill('Demo-pass-2026');await f.getByRole('button',{name:'Restablecer contraseña',exact:true}).click();await f.getByRole('button',{name:'Cancelar',exact:true}).click();check(await f.getByLabel('Contraseña temporal',{exact:true}).inputValue()==='Demo-pass-2026','Cancel reset preserves form');await f.getByRole('button',{name:'Restablecer contraseña',exact:true}).click();await f.getByRole('button',{name:'Confirmar',exact:true}).click();await f.getByRole('status').filter({hasText:'Restablecimiento simulado'}).waitFor();
 await f.getByRole('link',{name:'Auditoría',exact:true}).click();await f.getByRole('button',{name:'Cambios sobre su cuenta',exact:true}).click();check(await f.getByRole('heading',{name:'Contraseña restablecida por una administradora',exact:true}).count()===2,'Password reset audit');
 let frame=page.frames().find(f=>f.url()==='about:srcdoc');check(!await frame.evaluate(()=>JSON.stringify(localStorage).includes('Demo-pass-2026')),'No passwords persisted');
 await page.reload();await f.getByRole('heading',{name:'Ana Rojas',exact:true}).waitFor();frame=page.frames().find(f=>f.url()==='about:srcdoc');check(await f.getByText(/Frontend Lead ·/).isVisible(),'Prototype state survives reload');
 await page.getByLabel('Escenario de prueba').selectOption('noWork');await f.getByRole('heading',{name:'Camila Paredes',exact:true}).waitFor();check(await f.getByText(/No tiene tareas asignadas/).isVisible(),'No assignment state');
 await page.getByLabel('Escenario de prueba').selectOption('empty');await f.getByRole('heading',{name:'Tu equipo empieza aquí',exact:true}).waitFor();check(true,'Empty team scenario');await page.getByRole('button',{name:'Restablecer demo',exact:true}).click();
 await f.getByRole('link',{name:'Crear trabajador',exact:true}).click();await f.getByLabel('Nombre completo').fill('Persona de prueba');await f.getByLabel('Correo de acceso').fill('persona@example.test');await f.getByLabel('Contraseña inicial').fill('Create-pass-2026');await f.getByRole('button',{name:'Crear trabajador',exact:true}).click();await f.getByRole('heading',{name:'Persona de prueba',exact:true}).waitFor();check(true,'Create worker flow');
 await page.getByRole('button',{name:'Restablecer demo',exact:true}).click();await f.getByRole('heading',{name:'Trabajadores',exact:true}).waitFor();
 await page.getByLabel('Comentarios sobre la propuesta').fill('Probar priorización de tareas bloqueadas.');const download=page.waitForEvent('download');await page.getByRole('button',{name:'Descargar observaciones'}).click();check((await download).suggestedFilename()==='observaciones-trabajadores-foxcode.txt','Feedback export');
 const captures=[];
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:1000});
  for(const [name,route] of [['directory','#/workers'],['profile','#/workers/ana?section=work'],['audit','#/workers/ana?section=audit&scope=account'],['data','#/workers/ana?section=data'],['access','#/workers/ana?section=access']]){
   await page.evaluate(hash=>document.getElementById('prototype').contentWindow.postMessage({type:'go-prototype',hash},'*'),route);await page.waitForFunction(hash=>location.hash===hash,route);await frame.evaluate(()=>document.fonts.ready);
   await frame.addScriptTag({content:readFileSync(require.resolve('axe-core/axe.min.js'),'utf8')});
   const violations=await frame.evaluate(async()=>(await window.axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
   const innerOverflow=await frame.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),outerOverflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);check(!innerOverflow&&!outerOverflow,`${name} fits ${width}`);check(!violations.length,`${name} accessibility ${width}: ${JSON.stringify(violations)}`);
   await page.locator('#prototype').screenshot({path:resolve(out,`${name}-${width}.png`)});captures.push({name,width,violations,innerOverflow,outerOverflow});
  }
  await page.getByRole('button',{name:'Directorio',exact:true}).click();await f.getByRole('heading',{name:'Trabajadores',exact:true}).waitFor();await page.screenshot({path:resolve(out,`proposal-${width}.png`),fullPage:true});
 }
 check(errors.length===0,`No browser errors ${errors.join(',')}`);writeFileSync(resolve(out,'validation.json'),JSON.stringify({result:'passed',checks,captures},null,2));console.log(JSON.stringify({result:'passed',checks:checks.length,captures:captures.length}));
}catch(error){writeFileSync(resolve(out,'failure.json'),JSON.stringify({message:error.message,checks,errors},null,2));await page.screenshot({path:resolve(out,'failure.png'),fullPage:true});throw error}finally{await browser.close()}
