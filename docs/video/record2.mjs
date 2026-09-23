import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const S = process.argv[2]; const base = 'http://localhost:4179';
const NARR = JSON.parse(fs.readFileSync(path.join(S, 'narration.json'), 'utf8'));
const DUR = JSON.parse(fs.readFileSync(path.join(S, 'audio/durations.json'), 'utf8'));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: path.join(S, 'video2'), size: { width: 1280, height: 720 } }, locale: 'es-GT' });
const p = await ctx.newPage();
p.on('dialog', (d) => d.accept());
const t0 = Date.now();
const marks = [];
let cur = null;
const now = () => (Date.now() - t0) / 1000;
const wait = (ms) => p.waitForTimeout(ms);
async function caption(text) {
  await p.evaluate((text) => {
    let el = document.getElementById('cap-talentia');
    if (!el) {
      el = document.createElement('div'); el.id = 'cap-talentia';
      Object.assign(el.style, { position: 'fixed', left: '50%', bottom: '28px', transform: 'translateX(-50%)', maxWidth: '960px', padding: '12px 20px', background: 'rgba(5,42,32,0.92)', color: '#fff', font: '600 18px/1.35 "Instrument Sans Variable", system-ui, sans-serif', borderRadius: '14px', zIndex: 99999, boxShadow: '0 8px 30px rgba(0,0,0,.35)', textAlign: 'center', pointerEvents: 'none' });
      document.body.appendChild(el);
    }
    el.textContent = text;
  }, text);
}
async function seg(id) {
  const n = NARR.find((x) => x.id === id);
  cur = { id, start: now() };
  marks.push(cur);
  await caption(n.text);
}
/** Espera hasta que el segmento haya durado al menos lo que dura su audio (+ margen). */
async function endSeg(extra = 0.6) {
  const target = cur.start + DUR[cur.id] + extra;
  const left = target - now();
  if (left > 0) await wait(left * 1000);
}
async function scrollMain(y) { await p.evaluate((y) => document.querySelector('main')?.scrollTo({ top: y, behavior: 'smooth' }), y); }
async function type(sel, text) { await p.click(sel); await p.type(sel, text, { delay: 45 }); }

await p.goto(base + '/'); await p.waitForSelector('[role=dialog][aria-label="Bienvenida"]');
await seg('intro'); await endSeg();
await p.click('button:has-text("Explorar por mi cuenta")'); await wait(300);
await seg('menu');
for (const l of ['Vacantes', 'Screening IA', 'Respuestas a CVs', 'Candidatos', 'Métricas RR.HH.']) { await p.hover(`nav a:has-text("${l}")`); await wait(1400); }
await endSeg();

await seg('vac'); await p.click('nav a:has-text("Vacantes")'); await p.waitForSelector('h1:has-text("Vacantes")'); await wait(4500);
await p.click('button:has-text("Nueva vacante")'); await p.waitForSelector('[role=dialog]'); await endSeg();
await seg('vac1'); await type('[role=dialog] input[placeholder*="Asesor"]', 'Jefe de Tienda'); await p.selectOption('[role=dialog] label:has-text("Marca") select', 'Abiq'); await type('[role=dialog] input[placeholder="Ventas"]', 'Operaciones de tienda'); await endSeg();
await seg('vac2'); await p.click('[role=dialog] button:has-text("Siguiente")'); await wait(800); await p.click('[role=dialog] button:has-text("Generar con IA")'); await p.waitForSelector('[role=dialog] button:has-text("Regenerar")', { timeout: 15000 }); await endSeg();
await seg('vac3'); await p.click('[role=dialog] button:has-text("Siguiente")'); await wait(800);
for (const f of ['Gestión de tienda', 'Liderazgo de equipo']) { await type('[role=dialog] input[placeholder*="Ventas, Inglés"]', f); await p.keyboard.press('Enter'); await wait(500); }
await endSeg();
await seg('vac4'); await p.click('[role=dialog] button:has-text("Siguiente")'); await wait(600); await p.click('[role=dialog] button:has-text("Generar")').catch(() => {}); await endSeg(1.2);
await seg('vac5'); await p.click('[role=dialog] button:has-text("Siguiente")'); await endSeg(0.2); await p.click('[role=dialog] button:has-text("Crear vacante")'); await wait(800);

await seg('scr'); await p.click('nav a:has-text("Screening IA")'); await p.waitForSelector('h1'); await wait(1500);
await p.selectOption('main select', { label: 'Asesor de Ventas' }).catch(() => {}); await wait(4500);
const files = ['Carla_Mendez.pdf', 'Jose_Perez.pdf', 'Ana_Ruiz.pdf', 'Luis_Gomez_scan.pdf'].map((n) => path.join(S, 'cvs', n));
await p.setInputFiles('input[type=file]', files); await endSeg();
await seg('scr2'); await endSeg();
await seg('scr3'); await scrollMain(420); await endSeg();

await seg('rep'); await p.click('nav a:has-text("Respuestas a CVs")'); await p.waitForSelector('h1'); await wait(3500);
await p.locator('input[aria-label="Score mínimo"]').fill('75'); await endSeg();
await seg('rep2'); await p.click('input[aria-label="Seleccionar todos"]'); await wait(2200);
// Cada candidato trae su horario de la agenda; se cambia uno para mostrar que se puede.
const slot2 = p.locator('input[aria-label^="Horario de la entrevista"]').nth(1);
await slot2.fill((await slot2.inputValue()).slice(0, 11) + '15:30'); await wait(1800);
await p.locator('button[aria-label="Vista previa del mensaje"]').first().click(); await wait(5000); await p.keyboard.press('Escape'); await wait(400);
await p.locator('button', { hasText: 'Responder a' }).click(); await endSeg();
await seg('rep3'); await wait(3500); await scrollMain(900); await endSeg();

await seg('cand'); await p.click('nav a:has-text("Candidatos")'); await p.waitForSelector('h1'); await endSeg();

await seg('met'); await p.click('nav a:has-text("Métricas")'); await p.waitForSelector('h1'); await wait(4000); await scrollMain(300); await endSeg();
await seg('met2'); await scrollMain(700); await wait(4500); await scrollMain(1500); await endSeg();

await seg('conf'); await p.click('nav a:has-text("Configuración")'); await p.waitForSelector('h1'); await wait(3500);
await scrollMain(520); await wait(1500); await p.fill('input[aria-label="Meta: Revisar el CV"]', '1'); await endSeg();

await seg('help'); await p.click('button[aria-label="Abrir ayuda"]'); await wait(1500);
await p.fill('input[aria-label="Pregunta de ayuda"]', '¿cómo subo los CVs?'); await p.keyboard.press('Enter'); await endSeg();
await seg('end'); await endSeg(1.5);
const total = now();

const video = p.video();
await ctx.close();
const src = await video.path();
const dest = path.join(S, 'video2', 'raw.webm');
fs.renameSync(src, dest);
fs.writeFileSync(path.join(S, 'video2', 'marks.json'), JSON.stringify({ total, marks }, null, 2));
console.log('total', Math.round(total), 's');
console.log(marks.map((m) => `${Math.round(m.start)}s ${m.id}`).join(' | '));
await b.close();
