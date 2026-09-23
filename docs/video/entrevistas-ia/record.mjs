// Graba el video "Entrevistas IA por videollamada" sobre la app compilada (vite preview en :4179).
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
async function scrollMain(y) { await p.evaluate((y) => document.querySelector('main')?.scrollTo({ top: y, behavior: 'smooth' }), y); }
async function scrollTo(sel) { await p.evaluate((sel) => document.querySelector(sel)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), sel); }
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
async function answer(text) {
  const box = p.locator('input[placeholder="Escribe la respuesta del candidato…"]');
  await box.click(); await box.pressSequentially(text, { delay: 22 }); await p.keyboard.press('Enter');
  await wait(1300);
}

// 1. Intro: Configuración → Módulos opcionales
await p.goto(base + '/configuracion'); await p.waitForSelector('[role=dialog][aria-label="Bienvenida"]');
await p.click('button:has-text("Explorar por mi cuenta")'); await wait(300);
await scrollTo('[data-tour="settings:module:interviewsAi"]'); await wait(600);
await seg('intro'); await spot('[data-tour="settings:module:interviewsAi"]', 6000, true); await endSeg();

// 2. Activar → se abre la ayuda guiada
await seg('act'); await wait(2500);
await p.click('button[role=switch][aria-label="Activar Entrevistas IA"]');
await p.waitForSelector('[role=dialog][aria-label^="Ayuda guiada"]'); await wait(4200);
await p.evaluate(() => document.querySelector('[role=dialog][aria-label^="Ayuda guiada"] .overflow-y-auto')?.scrollTo({ top: 400, behavior: 'smooth' }));
await endSeg();

// 3. Nueva sección en el menú
await seg('menu'); await p.click('[role=dialog][aria-label^="Ayuda guiada"] button:has-text("Lo veo después")'); await wait(500);
await p.hover('nav a:has-text("Entrevistas IA")'); await spot('[data-tour="nav:/entrevistas"]', 4000); await endSeg();

// 4. Preguntas de la vacante
await seg('preg'); await p.click('nav a:has-text("Vacantes")'); await p.waitForSelector('h1:has-text("Vacantes")'); await wait(1800);
await spot('[data-tour="jobs:questions"]', 6000); await p.hover('[data-tour="jobs:questions"]'); await endSeg();

// 5. Agendar por videollamada y avisar en Indicaciones
await seg('agenda'); await p.click('nav a:has-text("Respuestas a CVs")'); await p.waitForSelector('h1'); await wait(1500);
await scrollTo('[data-tour="reply:template"]'); await wait(1200); await spot('[data-tour="reply:template"]', 9000);
const ind = p.locator('[data-tour="reply:template"] label:has-text("Indicaciones") input');
await ind.click(); await ind.fill('');
await ind.pressSequentially('Te entrevistará el asistente de IA de RR.HH. por videollamada; la entrevista se grabará para evaluarla.', { delay: 28 });
await endSeg();

// 6. La videollamada (canales)
await seg('llamada'); await p.click('nav a:has-text("Entrevistas IA")'); await p.waitForSelector('h1:has-text("Entrevistas IA")'); await wait(1200);
await spot('[data-tour="interviews:channels"] > div:first-child', 6000); await endSeg();

// 7. Probar en la demo: chat simulado
await seg('demo'); await scrollTo('[data-tour="interviews:chat"]'); await wait(2000);
await p.click('button:has-text("Iniciar entrevista")'); await wait(1800);
await answer('Tengo 3 años vendiendo motos y electrodomésticos al crédito, con metas cada mes.');
await answer('Lo escucho, le explico las opciones de crédito y le doy seguimiento por WhatsApp.');
await endSeg(0.2);

// 8. Evaluación (se queda en pantalla mientras se narra)
await seg('eval');
await answer('Sí, tengo disponibilidad de horario rotativo y fines de semana.');
await p.waitForSelector('text=Puntaje global IA', { timeout: 10000 }); await wait(300);
await scrollTo('[data-tour="interviews:evaluation"]'); await spot('[data-tour="interviews:evaluation"]', 7000);
await endSeg(2.5);

// 9. RR.HH. decide
await seg('decide'); await p.click('nav a:has-text("Candidatos")'); await p.waitForSelector('h1:has-text("Candidatos")'); await wait(1500);
await spot('[data-tour="candidates:board"]', 5000, true); await endSeg();

// 10. Ayuda: Guía, chat y video
await seg('help'); await p.click('button[aria-label="Abrir ayuda"]'); await wait(600);
await p.click('[role=dialog][aria-label="Centro de ayuda"] button:has-text("Guía")'); await wait(700);
await p.evaluate(() => document.querySelector('[role=dialog][aria-label="Centro de ayuda"] .overflow-y-auto')?.scrollTo({ top: 260, behavior: 'smooth' })); await wait(2600);
await p.click('[role=dialog][aria-label="Centro de ayuda"] button:has-text("Chat")'); await wait(400);
await p.fill('input[aria-label="Pregunta de ayuda"]', '¿se graba la entrevista?'); await p.keyboard.press('Enter');
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
