// Prueba el chat de ayuda (mock por palabras clave) contra el banco de preguntas.
// Uso: npm run check:help   → sale con error si alguna pregunta cae en la respuesta equivocada.
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { CASES } from './help-chat-cases.mjs';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const tmp = path.join(root, 'node_modules', '.cache', 'help-chat');
fs.mkdirSync(tmp, { recursive: true });
const entry = path.join(tmp, 'entry.ts');
fs.writeFileSync(
  entry,
  `export { mockHelpReply } from ${JSON.stringify(path.join(root, 'src/core/adapters/mock'))};\n` +
    `export { HELP_FAQ } from ${JSON.stringify(path.join(root, 'src/data/helpFaq'))};\n`,
);
const outfile = path.join(tmp, 'bundle.mjs');
await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'warning', define: { 'import.meta.env': '{"BASE_URL":"/"}' } });

// El mock simula la espera de la IA con setTimeout: aquí responde al instante.
globalThis.setTimeout = (fn) => {
  fn();
  return 0;
};
const { mockHelpReply, HELP_FAQ } = await import(pathToFileURL(outfile).href + `?t=${Date.now()}`);
const idOf = new Map(HELP_FAQ.map((f) => [f.answer, f.id]));

const all = [
  ...['/', '/entrevistas', '/configuracion'].flatMap((route) => HELP_FAQ.map((f) => [f.question, f.id, route])),
  ...CASES,
];
const fails = [];
for (const [question, want, route, topic] of all) {
  const r = await mockHelpReply({ question, route, topic });
  const got = r.matched ? idOf.get(r.answer) : '(sin respuesta)';
  const ok = Array.isArray(want) ? want.includes(got) : got === want;
  if (!ok) fails.push(`  [${route}${topic ? ` · tema ${topic}` : ''}] "${question}" → ${got} (esperado ${[want].flat().join(' | ')})`);
}
console.log(`Chat de ayuda: ${all.length - fails.length}/${all.length} preguntas con la respuesta esperada.`);
if (fails.length) {
  console.log(fails.join('\n'));
  process.exit(1);
}
