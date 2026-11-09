// Genera supabase/migrations/0004_seed_functions.sql a partir del seed de TypeScript.
// Uso: npm run gen:seed-sql
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { membersSql, resetDemoFunctionSql, seedTenantFunctionSql, tenantsSql } from './seed-sql-lib.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmp = path.join(root, 'node_modules', '.cache', 'seed-sql');
fs.mkdirSync(tmp, { recursive: true });
const entry = path.join(tmp, 'entry.ts');
fs.writeFileSync(
  entry,
  `export { DEMO_NOW, TENANTS, USERS, JOBS, CANDIDATES } from ${JSON.stringify(path.join(root, 'src/data/seed'))};\n` +
    `export { SEED_EVALUATIONS } from ${JSON.stringify(path.join(root, 'src/data/seedEvaluations'))};\n`,
);
const outfile = path.join(tmp, 'bundle.mjs');
await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile, logLevel: 'warning', define: { 'import.meta.env': '{"BASE_URL":"/"}' } });
const { DEMO_NOW, TENANTS, USERS, JOBS, CANDIDATES, SEED_EVALUATIONS } = await import(pathToFileURL(outfile).href + `?t=${Date.now()}`);

const sql = [
  '-- GENERADO por scripts/gen-seed-sql.mjs — no editar a mano',
  '-- TALENTIA 2.0 — Migración 0004: datos de ejemplo (fechas relativas a hoy), seed_tenant y reset_demo',
  '',
  tenantsSql(TENANTS),
  '',
  membersSql(USERS),
  '',
  seedTenantFunctionSql(JOBS, CANDIDATES, SEED_EVALUATIONS, DEMO_NOW, USERS),
  '',
  resetDemoFunctionSql(),
  '',
  'revoke all on function public.seed_tenant(text) from public, anon, authenticated;',
  'revoke all on function public.reset_demo(text) from public, anon;',
  'grant execute on function public.reset_demo(text) to authenticated;',
  '',
  'select public.seed_tenant(id) from public.tenants;',
  '',
].join('\n');
const out = path.join(root, 'supabase', 'migrations', '0004_seed_functions.sql');
fs.writeFileSync(out, sql);
console.log(`Escrito ${path.relative(root, out)}: ${JOBS.length} vacantes, ${CANDIDATES.length} candidatos, ${SEED_EVALUATIONS.length} evaluaciones.`);
