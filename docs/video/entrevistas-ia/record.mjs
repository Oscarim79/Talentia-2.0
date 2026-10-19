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
async function answer(text, typed = true) {
  const box = p.locator('input[placeholder="Escribe la respuesta del candidato…"]');
  await box.click();
  if (typed) await box.pressSequentially(text, { delay: 18 });
  else await box.fill(text);
  await p.keyboard.press('Enter');
  await wait(typed ? 1300 : 950);
}
const LONG = [
  'Yo atendí a una clienta molesta por una refrigeradora con un golpe: la escuché sin interrumpir, revisé su caso y gestioné el cambio con el encargado; al final compró también una estufa y la venta del día subió 30 %.',
  'Una vez un cliente se quejó de una entrega atrasada; yo asumí la queja, llamé a bodega, le di una fecha concreta y le di seguimiento hasta que recibió su moto; volvió a comprar al mes siguiente.',
  'Le expliqué a un señor mayor el crédito con un ejemplo con sus propias cuotas, confirmé que me entendiera y cerré la venta de un televisor sin presionarlo.',
  'A un cliente indeciso le pregunté para qué quería la lavadora, le mostré dos opciones y le recomendé la que le convenía; compró ese mismo día y regresó por una secadora.',
  'En el inventario de fin de año organicé con mis compañeros el conteo de línea blanca; yo armé el plan por pasillos y terminamos en un día, sin diferencias.',
  'Apoyé a un compañero nuevo enseñándole el sistema de crédito en mis tiempos libres; en dos semanas ya cumplía su meta y yo seguí revisando sus cierres.',
  'Un día falló el sistema de cobro; yo anoté las ventas a mano, avisé al encargado y al reabrir el sistema ingresé todo; no perdimos ninguna venta.',
  'En hora pico atendí primero a los clientes, pedí apoyo para el teléfono y acomodé la mercadería al bajar la afluencia; cumplí la meta del día.',
  'Para la meta de diciembre llamé a mis clientes de crédito al día, ofrecí combos de motos con casco y superé mi meta en 15 %.',
  'Aprendí por mi cuenta las características de las motos eléctricas y en un mes vendí 8 unidades, cuando antes no vendía ninguna.',
  'Una señora buscaba un regalo para su hijo; yo le pregunté qué le gustaba, le mostré una laptop dentro de su presupuesto, le expliqué el crédito y cerré la venta; ella me recomendó con dos vecinas que también compraron.',
];

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

// 4. La guía de cada vacante
await seg('preg'); await p.click('nav a:has-text("Vacantes")'); await p.waitForSelector('h1:has-text("Vacantes")'); await wait(1800);
await spot('[data-tour="jobs:guide"]', 7000); await p.hover('[data-tour="jobs:guide"]'); await endSeg();

// 5. Agendar por Zoom con horario por candidato y la casilla del aviso de IA
await seg('agenda'); await p.click('nav a:has-text("Respuestas a CVs")'); await p.waitForSelector('h1'); await wait(1200);
await p.locator('main ul li input[type=checkbox]').first().check(); await wait(800);
await spot('[data-tour="reply:slot"]', 3500, true); await wait(2500);
await scrollTo('[data-tour="reply:ai-notice"]'); await wait(900); await spot('[data-tour="reply:ai-notice"]', 6000); await wait(4500);
await p.locator('main ul li').first().locator('button[aria-label="Vista previa del mensaje"]').click(); await wait(5000);
await p.keyboard.press('Escape');
await endSeg();

// 6. La videollamada (canales)
await seg('llamada'); await p.click('nav a:has-text("Entrevistas IA")'); await p.waitForSelector('h1:has-text("Entrevistas IA")'); await wait(1200);
await spot('[data-tour="interviews:channels"] > div:first-child', 6000); await endSeg();

// 7. Probar en la demo: chat simulado (guía de Vendedor: 10 conductuales + historia + 5 opción múltiple)
await seg('demo'); await scrollTo('[data-tour="interviews:chat"]'); await wait(2000);
await p.click('button:has-text("Iniciar entrevista")'); await wait(2200);
await answer(LONG[0]);
await endSeg(0.2);

// 8. Las demás respuestas, rápido
await seg('resp');
for (const t of LONG.slice(1)) await answer(t, false);
for (const l of ['B', 'C', 'B', 'A', 'C']) await answer(l, false);
await endSeg(0.2);

// 9. Transcripción y sugerencia (se queda en pantalla mientras se narra)
await seg('eval');
await p.waitForSelector('text=Transcripción en Entrevistas', { timeout: 10000 }); await wait(300);
await scrollTo('[data-tour="interviews:saved"]'); await spot('[data-tour="interviews:saved"]', 4000); await wait(4500);
await p.evaluate(() => document.querySelector('main')?.scrollBy({ top: 330, behavior: 'smooth' })); await spot('[data-tour="interviews:evaluation"]', 6000, true);
await endSeg(1.5);

// 10. RR.HH. puntúa y decide (Entrevistas por competencias)
await seg('decide'); await scrollTo('[data-tour="interviews:saved"]'); await wait(600);
await p.click('button:has-text("Puntuar en Entrevistas")'); await p.waitForSelector('h1:has-text("Entrevista por competencias")'); await wait(2500);
await spot('[data-tour="competencias:steps"]', 5000); await wait(4000);
await p.click('[data-tour="competencias:steps"] [role=tab]:has-text("Puntuar")'); await wait(2500);
await p.evaluate(() => document.querySelector('main')?.scrollBy({ top: 420, behavior: 'smooth' })); await endSeg();

// 10. Ayuda: Guía, chat y video
await seg('help'); await p.click('button[aria-label="Abrir ayuda"]'); await wait(600);
await p.click('[role=dialog][aria-label="Centro de ayuda"] button:has-text("Guía")'); await wait(700);
await p.evaluate(() => document.querySelector('[role=dialog][aria-label="Centro de ayuda"] .overflow-y-auto')?.scrollTo({ top: 260, behavior: 'smooth' })); await wait(2600);
await p.click('[role=dialog][aria-label="Centro de ayuda"] button:has-text("Chat")'); await wait(400);
await p.fill('input[aria-label="Pregunta de ayuda"]', '¿la IA usa la guía de competencias?'); await p.keyboard.press('Enter');
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
