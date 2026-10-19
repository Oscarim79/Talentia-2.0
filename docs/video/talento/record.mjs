// Graba el video "Talento: Matriz 9-Box y Acciones RR.HH." sobre la app compilada (vite preview en :4179).
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
async function scrollTo(sel) { await p.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), sel); }
/** Desplaza un contenedor con scroll propio (ej. una ventana modal). */
async function scrollIn(sel, y) { await p.evaluate(({ sel, y }) => document.querySelector(sel)?.scrollTo({ top: y, behavior: 'smooth' }), { sel, y }); }
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
const PROFILE = '[role=dialog][aria-label^="Perfil de"]';

// 1. Intro: menú Talento
await p.goto(base + '/talento'); await p.waitForSelector('[role=dialog][aria-label="Bienvenida"]');
await p.click('button:has-text("Explorar por mi cuenta")'); await wait(400);
await seg('intro'); await spot('[data-tour="nav:/talento"]', 4500); await wait(4000);
await p.hover('nav a:has-text("Acciones RR.HH.")'); await spot('[data-tour="nav:/acciones"]', 3000); await endSeg();

// 2. La matriz
await seg('matriz'); await spot('[data-tour="talent:matrix"]', 9000);
await wait(6000); await p.hover('[data-tour="talent:list"] button:has-text("María González")'); await endSeg();

// 3. Filtro por departamento
await seg('filtro'); await spot('[data-tour="talent:filter"]', 4000);
await p.selectOption('[data-tour="talent:filter"] select', 'Ventas'); await wait(2800);
await p.selectOption('[data-tour="talent:filter"] select', 'Todos'); await endSeg();

// 4. Perfil: abrir a María González
await seg('perfil'); await scrollTo('[data-tour="talent:list"]'); await wait(800);
await p.click('[data-tour="talent:list"] button:has-text("María González")'); await p.waitForSelector(PROFILE); await wait(3500);
await scrollIn(PROFILE, 260); await wait(3500);
await scrollIn(PROFILE, 520); await endSeg();

// 5. Cultura 360° (en el perfil)
await seg('cultura'); await scrollIn(PROFILE, 820); await endSeg();

// 6. Recomendación de crecimiento
await seg('crecimiento'); await scrollIn(PROFILE, 1250); await wait(800);
await p.click(`${PROFILE} button:has-text("Generar recomendación")`); await p.waitForSelector(`${PROFILE} :text("Acciones esta semana")`, { timeout: 10000 }); await wait(600);
await scrollIn(PROFILE, 1500); await wait(3500); await scrollIn(PROFILE, 2200); await endSeg();
await p.keyboard.press('Escape'); await wait(400);

// 7. Acciones RR.HH.
await seg('acciones'); await p.click('nav a:has-text("Acciones RR.HH.")'); await p.waitForSelector('h1:has-text("Acciones pendientes")'); await wait(1200);
await spot('[data-tour="actions:summary"]', 7000); await wait(7500);
await scrollTo('[data-tour="actions:list"] > div:first-child'); await wait(600); await spot('[data-tour="actions:list"] > div:first-child', 8000, true); await endSeg();

// 8. Marcar hecha
await seg('hecha'); await spot('[data-tour="actions:list"] > div:first-child > div > div:first-child', 5000); await wait(3200);
await p.locator('[data-tour="actions:list"] button:has-text("Marcar hecha")').first().click(); await wait(1500);
await endSeg();

// 9. Reportes a gerentes
await seg('reportes'); await scrollTo('[data-tour="actions:reports"]'); await wait(600); await spot('[data-tour="actions:reports"]', 5000);
await wait(2500); await p.locator('[data-tour="actions:reports"] button:has-text("Ver / enviar reporte")').first().click();
await p.waitForSelector('[role=dialog][aria-label^="Reporte de equipo"]'); await wait(2500);
await p.evaluate(() => document.querySelector('[role=dialog][aria-label^="Reporte de equipo"]')?.scrollTo({ top: 400, behavior: 'smooth' }));
await endSeg(0.8); await p.keyboard.press('Escape'); await wait(300);

// 10. Ayuda: Guía (secciones), chat
await seg('help'); await p.click('button[aria-label="Abrir ayuda"]'); await wait(600);
await p.click('[role=dialog][aria-label="Centro de ayuda"] button:has-text("Guía")'); await wait(700);
await p.evaluate(() => document.querySelector('[data-tour="help:section:talent"]')?.scrollIntoView({ block: 'center', behavior: 'smooth' })); await wait(2800);
await p.click('[role=dialog][aria-label="Centro de ayuda"] button:has-text("Chat")'); await wait(400);
await p.fill('input[aria-label="Pregunta de ayuda"]', '¿qué significa Diamante en Bruto?'); await p.keyboard.press('Enter');
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
