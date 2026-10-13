// Reporte de competencias y guía en blanco en texto (copiar / .txt) y en HTML para imprimir o guardar como PDF.
import {
  BEHAVIORAL,
  GUIDES,
  INSTRUCTIONS,
  RECOMMENDATION_HINT,
  RECOMMENDATION_LABEL,
  SCALE,
  STORY,
  choiceQuestionsFor,
  competenciesFor,
  fmt1,
  type CompetencyResult,
  type EvaluationResult,
  type GuideRole,
  type InterviewEvaluation,
} from '../../core/interviewGuide';

export interface ReportContext {
  ev: InterviewEvaluation;
  result: EvaluationResult;
  /** Lectura del mismo candidato con los pesos de Vendedor (solo cuando se entrevistó como Jefe de Tienda). */
  asSeller?: EvaluationResult | null;
  candidateName: string;
  jobTitle: string;
  interviewerName: string;
}

/** "Asesor de Ventas (guía de Vendedor)"; si el puesto ya se llama como la guía, solo el puesto. */
export function guideNote(jobTitle: string, role: GuideRole): string {
  return jobTitle.toLowerCase() === GUIDES[role].label.toLowerCase() ? jobTitle : `${jobTitle} (guía de ${GUIDES[role].label})`;
}

export function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function behavioralCell(c: CompetencyResult): string {
  return c.behavioral.map((s) => (s == null ? '—' : String(s))).join(' y ');
}

/** "(4.5 × 0.30) + (3.5 × 0.20) + … = 4.18 ≈ 4.2" */
export function indexFormula(r: EvaluationResult): string {
  if (r.index == null) return '';
  const parts = r.competencies.map((c) => `(${fmt1(c.score!)} × ${c.weight.toFixed(2)})`);
  const raw = r.competencies.reduce((s, c) => s + c.score! * c.weight, 0);
  return `${parts.join(' + ')} = ${raw.toFixed(2)} ≈ ${fmt1(r.index)}`;
}

export function reportText({ ev, result: r, asSeller, candidateName, jobTitle, interviewerName }: ReportContext): string {
  const L: string[] = [];
  L.push('REPORTE DE COMPETENCIAS DEL CANDIDATO');
  L.push(`Candidato: ${candidateName}`);
  L.push(`Puesto aplicado: ${guideNote(jobTitle, ev.role)}`);
  L.push(`Fecha de la entrevista: ${fmtDate(ev.date)}`);
  L.push(`Entrevistador: ${interviewerName}`);
  L.push('');
  L.push('Competencia — Conductuales | Historia | Opción múltiple | Puntaje');
  for (const c of r.competencies) {
    L.push(`• ${c.label} — ${behavioralCell(c)} | ${c.storyApplies ? (c.story ?? '—') : 'No aplica'} | ${c.choice ?? '—'} | ${c.score != null ? fmt1(c.score) : '—'}`);
  }
  L.push('');
  if (r.index != null && r.level) {
    L.push(`Índice General: ${fmt1(r.index)} (${r.percent} %)`);
    L.push(`  ${indexFormula(r)}`);
    L.push(`Recomendación: ${RECOMMENDATION_LABEL[r.level]}. ${RECOMMENDATION_HINT[r.level]}`);
    r.reasons.forEach((x) => L.push(`  - ${x}`));
    if (asSeller?.index != null && asSeller.level) {
      L.push(`Leído como Vendedor: Índice ${fmt1(asSeller.index)} (${asSeller.percent} %) — ${RECOMMENDATION_LABEL[asSeller.level]}.`);
    }
  } else {
    L.push(`Evaluación incompleta: faltan ${r.missing} de ${r.total} puntajes.`);
  }
  if (r.strengths.length) {
    L.push('');
    L.push('Fortalezas:');
    r.strengths.forEach((c) => L.push(`  - ${c.label} (${fmt1(c.score!)})`));
  }
  if (r.improvements.length) {
    L.push('Áreas de mejora:');
    r.improvements.forEach((c) => L.push(`  - ${c.label} (${fmt1(c.score!)})`));
  }
  const obs = r.competencies.filter((c) => ev.observations[c.key]?.trim());
  if (obs.length) {
    L.push('');
    L.push('Observaciones por competencia:');
    obs.forEach((c) => L.push(`  - ${c.label}: ${ev.observations[c.key]!.trim()}`));
  }
  L.push('');
  L.push('— Guía de Entrevista por competencias · TALENTIA · RR.HH.');
  return L.join('\n');
}

// ---------- HTML para imprimir / guardar como PDF ----------

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const PRINT_CSS = `
  *{box-sizing:border-box} body{font-family:"Segoe UI",Arial,sans-serif;color:#1c1917;margin:32px;font-size:12.5px;line-height:1.45}
  h1{font-size:20px;margin:0 0 2px} h2{font-size:14px;margin:20px 0 6px;color:#14532d;border-bottom:1px solid #d6d3d1;padding-bottom:3px}
  h3{font-size:12.5px;margin:12px 0 4px} .muted{color:#78716c} .meta{display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;margin:10px 0}
  table{border-collapse:collapse;width:100%;margin:6px 0} th,td{border:1px solid #d6d3d1;padding:5px 7px;text-align:left;vertical-align:top} th{background:#f5f5f4;font-size:11.5px}
  td.n{text-align:center;white-space:nowrap} .big{font-size:22px;font-weight:700} .pill{display:inline-block;border-radius:999px;padding:2px 10px;font-weight:700}
  .recommended{background:#dcfce7;color:#166534} .reservations{background:#fef3c7;color:#92400e} .not{background:#fee2e2;color:#991b1b}
  ul{margin:4px 0;padding-left:18px} li{margin:2px 0} .q{margin:8px 0 2px;font-weight:600} .look{color:#57534e;font-size:11.5px}
  .lines{border-bottom:1px dotted #a8a29e;height:22px} .opt{margin:2px 0 2px 14px}
  .foot{margin-top:24px;font-size:10.5px;color:#a8a29e} @media print{body{margin:14mm}}
`;

/** Abre una ventana con el documento y el diálogo de impresión (desde ahí se puede "Guardar como PDF"). */
export function printDocument(title: string, bodyHtml: string): boolean {
  const w = window.open('', '_blank');
  if (!w) return false;
  w.document.write(
    `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${esc(title)}</title><style>${PRINT_CSS}</style></head><body>${bodyHtml}</body></html>`,
  );
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 250);
  return true;
}

export function reportHtml({ ev, result: r, asSeller, candidateName, jobTitle, interviewerName }: ReportContext): string {
  const rows = r.competencies
    .map(
      (c) =>
        `<tr><td>${esc(c.label)}</td><td class="n">${behavioralCell(c)}</td><td class="n">${c.storyApplies ? (c.story ?? '—') : 'No aplica'}</td><td class="n">${c.choice ?? '—'}</td><td class="n"><b>${c.score != null ? fmt1(c.score) : '—'}</b></td><td class="n">${Math.round(c.weight * 100)} %</td></tr>`,
    )
    .join('');
  const verdict =
    r.index != null && r.level
      ? `<p><span class="big">${fmt1(r.index)}</span> <span class="muted">de 5 · ${r.percent} %</span> &nbsp; <span class="pill ${r.level}">${RECOMMENDATION_LABEL[r.level]}</span></p>
         <p class="muted">${esc(indexFormula(r))}</p>
         <p>${esc(RECOMMENDATION_HINT[r.level])}</p><ul>${r.reasons.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>
         ${asSeller?.index != null && asSeller.level ? `<p class="muted">Leído como Vendedor (mismos puntajes, pesos de Vendedor): Índice ${fmt1(asSeller.index)} (${asSeller.percent} %) — ${RECOMMENDATION_LABEL[asSeller.level]}.</p>` : ''}`
      : `<p><b>Evaluación incompleta:</b> faltan ${r.missing} de ${r.total} puntajes.</p>`;
  const list = (xs: CompetencyResult[]) => (xs.length ? `<ul>${xs.map((c) => `<li>${esc(c.label)} (${fmt1(c.score!)})</li>`).join('')}</ul>` : '<p class="muted">—</p>');
  const obs = r.competencies.filter((c) => ev.observations[c.key]?.trim());
  return `
    <h1>Reporte de Competencias del Candidato</h1>
    <p class="muted">Guía de Entrevista por competencias · ${esc(GUIDES[ev.role].label)}</p>
    <div class="meta">
      <div><b>Candidato:</b> ${esc(candidateName)}</div><div><b>Puesto aplicado:</b> ${esc(guideNote(jobTitle, ev.role))}</div>
      <div><b>Fecha de la entrevista:</b> ${esc(fmtDate(ev.date))}</div><div><b>Entrevistador:</b> ${esc(interviewerName)}</div>
    </div>
    <h2>Puntajes por competencia</h2>
    <table><thead><tr><th>Competencia</th><th>Conductuales</th><th>Historia</th><th>Opción múltiple</th><th>Puntaje</th><th>Peso</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="muted">Puntaje de la competencia = (promedio conductual × 0.8) + (opción múltiple × 0.2). El promedio conductual incluye el criterio de la historia cuando aplica.</p>
    <h2>Índice General y recomendación</h2>${verdict}
    <h2>Resumen final</h2>
    <div class="meta"><div><h3>Fortalezas</h3>${list(r.strengths)}</div><div><h3>Áreas de mejora</h3>${list(r.improvements)}</div></div>
    ${obs.length ? `<h2>Observaciones por competencia</h2><ul>${obs.map((c) => `<li><b>${esc(c.label)}:</b> ${esc(ev.observations[c.key]!.trim())}</li>`).join('')}</ul>` : ''}
    <p class="foot">Generado por TALENTIA · RR.HH. La recomendación apoya la decisión; la decisión es de RR.HH.</p>`;
}

/** Guía impresa en blanco: escala, preguntas con "Busca", historia y opción múltiple (sin puntajes), con espacio para notas. */
export function blankGuideHtml(role: GuideRole): string {
  const g = GUIDES[role];
  const qs = BEHAVIORAL[role];
  const blocks = competenciesFor(role)
    .map((c) => {
      const items = qs
        .filter((q) => q.competency === c.key)
        .map((q) => `<p class="q">${q.id}. ${esc(q.text)}</p><p class="look">Busca: ${esc(q.lookFor)}</p><div class="lines"></div><div class="lines"></div><p class="muted">Puntaje: 1 · 2 · 3 · 4 · 5</p>`)
        .join('');
      return `<h3>${esc(c.label)}</h3>${items}`;
    })
    .join('');
  const choices = choiceQuestionsFor(role)
    .map((q) => `<p class="q">${q.n}. ${esc(q.prompt)}</p>${q.options.map((o) => `<p class="opt">☐ ${o.letter}) ${esc(o.text)}</p>`).join('')}`)
    .join('');
  return `
    <h1>Guía de Entrevista · ${esc(g.label)}</h1>
    <p class="muted">Preguntas conductuales y de competencias · duración aproximada ${g.minutes} minutos</p>
    <div class="meta"><div><b>Candidato:</b> ____________________</div><div><b>Fecha:</b> ____________________</div><div><b>Entrevistador:</b> ____________________</div></div>
    <h2>Cómo aplicar la entrevista</h2><ul>${INSTRUCTIONS.map((i) => `<li><b>${esc(i.title)}:</b> ${esc(i.text)}</li>`).join('')}</ul>
    <h2>Escala de 1 a 5</h2><table><tbody>${SCALE.map((s) => `<tr><td class="n"><b>${s.score}</b></td><td>${s.level}</td><td>${esc(s.description)}</td></tr>`).join('')}</tbody></table>
    <p class="muted">Si el candidato habla solo en plural ("hicimos", "logramos"), pregunta "¿Qué hiciste tú específicamente?". Si no describe acciones propias, el puntaje máximo es 3.</p>
    <h2>1. Preguntas conductuales (${qs.length})</h2>${blocks}
    <h2>2. Pregunta basada en una historia</h2>
    <p class="q">${esc(STORY.main)}</p><p class="look">Alterna: ${esc(STORY.alternate)} ${esc(STORY.alternateWhen)}</p><div class="lines"></div><div class="lines"></div><div class="lines"></div>
    <ul>${STORY.criteria.map((c) => `<li>${esc(c.text)} &nbsp; 1 · 2 · 3 · 4 · 5</li>`).join('')}</ul>
    <h2>3. Opción múltiple (el candidato elige una; no mostrar puntajes)</h2>${choices}
    <p class="foot">TALENTIA · Guía de Entrevista por competencias. Los puntajes se capturan en la app (Reclutamiento → Entrevistas), que calcula el reporte.</p>`;
}
