// Graba el video "Gestión: Métricas RR.HH. y Configuración" sobre la app compilada (vite preview en :4179).
// Uso: node record.mjs <carpeta de trabajo con narration.json y audio/durations.json> [url base, por defecto http://localhost:4179]
// Receta completa en docs/video/README.md.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const S = process.argv[2]; const base = process.argv[3] || 'http://localhost:4179';
const NARR = JSON.parse(fs.readFileSync(path.join(S, 'narration.json'), 'utf8'));
const DUR = JSON.parse(fs.readFileSync(path.join(S, 'audio/durations.json'), 'utf8'));
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: path.join(S, 'video'), size: { width: 1280, height: 720 } }, locale: 'es-GT' });
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
async function scrollTo(sel, block = 'center') { await p.evaluate(({ sel, block }) => document.querySelector(sel)?.scrollIntoView({ block, behavior: 'smooth' }), { sel, block }); }
/** Marco dorado temporal para señalar un elemento en el video (como el tour). `inset` si el contenedor recorta lo de afuera. */
async function spot(sel, ms = 2500, inset = false) {
  await p.evaluate(({ sel, ms, inset }) => {
    const el = document.querySelector(sel);
    if (!el) return;
    const prev = el.style.boxShadow;
    el.style.transition = 'box-shadow .3s';
    el.style.boxShadow = inset ? 'inset 0 0 0 3px #d4a24c' : '0 0 0 3px #d4a24c, 0 0 0 9px rgba(212,162,76,.25)';
    el.style.borderRadius = el.style.borderRadius || '12px';
    setTimeout(() => { el.style.boxShadow = prev; }, ms);
  }, { sel, ms, inset });
}

// 1. Intro: menú Gestión
await p.goto(base + '/metricas'); await p.waitForSelector('[role=dialog][aria-label="Bienvenida"]');
await p.click('button:has-text("Explorar por mi cuenta")'); await wait(400);
await seg('intro'); await spot('[data-tour="nav:/metricas"]', 4500); await wait(4500);
await p.hover('nav a:has-text("Configuración")'); await spot('[data-tour="nav:/configuracion"]', 3000); await endSeg();

// 2. Filtros + cuatro números
await seg('kpis'); await spot('[data-tour="metrics:filters"]', 4000); await wait(3200);
await p.selectOption('[data-tour="metrics:filters"] select >> nth=1', { label: 'Jessica Ventura' }); await wait(2200);
await p.selectOption('[data-tour="metrics:filters"] select >> nth=1', 'all'); await wait(400);
await spot('[data-tour="metrics:kpis"]', 9000); await endSeg();

// 3. Cada quien
await seg('cadaquien'); await scrollTo('[data-tour="metrics:people"]', 'start'); await wait(700); await spot('[data-tour="metrics:people"]', 9000, true);
await wait(7000); await p.evaluate(() => document.querySelector('main')?.scrollBy({ top: 260, behavior: 'smooth' })); await endSeg();

// 4. Etapas, embudo y por vacante
await seg('etapas'); await scrollTo('[data-tour="metrics:stages"]'); await wait(700); await spot('[data-tour="metrics:stages"] > div:first-child', 6000);
await wait(6500); await spot('[data-tour="metrics:stages"] > div:last-child', 4000); await wait(4300);
await scrollTo('[data-tour="metrics:jobs"]'); await wait(600); await spot('[data-tour="metrics:jobs"]', 4000, true); await endSeg();

// 5. Pendientes
await seg('pendientes'); await scrollTo('[data-tour="metrics:pending"]'); await wait(700); await spot('[data-tour="metrics:pending"]', 8000, true); await endSeg();

// 6. Configuración: equipo
await seg('equipo'); await p.click('nav a:has-text("Configuración")'); await p.waitForSelector('h1:has-text("Configuración")'); await wait(1200);
await spot('[data-tour="settings:team"]', 6000, true); await wait(2500);
await p.fill('input[placeholder="Nombre y apellido"]', 'Ana Castillo'); await p.fill('input[placeholder="Reclutador/a"]', 'Reclutadora'); await wait(500);
await p.click('[data-tour="settings:team"] button:has-text("Agregar")'); await endSeg();

// 7. Metas
await seg('metas'); await scrollTo('[data-tour="settings:goals"]'); await wait(700); await spot('[data-tour="settings:goals"]', 7000, true);
await wait(2500); await p.fill('input[aria-label="Meta: Revisar el CV"]', '3'); await wait(2000);
await p.click('[data-tour="settings:goals"] button:has-text("Restablecer")'); await endSeg();

// 8. Módulos
await seg('modulos'); await scrollTo('[data-tour="settings:modules"]'); await wait(700); await spot('[data-tour="settings:modules"]', 7000, true); await endSeg();

// 9. Preguntas al chat
await seg('preguntas'); await scrollTo('[data-tour="settings:questions"]'); await wait(700); await spot('[data-tour="settings:questions"]', 7000, true); await endSeg();

// 10. Restablecer / software opinado
await seg('reset'); await scrollTo('[data-tour="settings:reset"]'); await wait(700); await spot('[data-tour="settings:reset"]', 9000); await endSeg();

// 11. Ayuda
await seg('help'); await p.click('button[aria-label="Abrir ayuda"]'); await wait(600);
await p.click('[role=dialog][aria-label="Centro de ayuda"] button:has-text("Guía")'); await wait(700);
await p.evaluate(() => document.querySelector('[data-tour="help:section:management"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' })); await wait(2800);
await p.click('[role=dialog][aria-label="Centro de ayuda"] button:has-text("Chat")'); await wait(400);
await p.fill('input[aria-label="Pregunta de ayuda"]', '¿qué son los pendientes fuera de meta?'); await p.keyboard.press('Enter');
await endSeg();
await seg('end'); await endSeg(1.5);
const total = now();

const video = p.video();
await ctx.close();
const src = await video.path();
const dest = path.join(S, 'video', 'raw.webm');
fs.renameSync(src, dest);
fs.writeFileSync(path.join(S, 'video', 'marks.json'), JSON.stringify({ total, marks }, null, 2));
console.log('total', Math.round(total), 's');
console.log(marks.map((m) => `${Math.round(m.start)}s ${m.id}`).join(' | '));
await b.close();
