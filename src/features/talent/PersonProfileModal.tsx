import { useState } from 'react';
import { X, Sparkles, Loader2, MessageCircle, Target, GraduationCap, Award, Eye, AlertTriangle, Ban } from 'lucide-react';
import { CULTURE_DIMENSIONS } from '../../data/seed';
import { providers } from '../../core/providers';
import type { CultureGroup, NineBoxDataPoint } from '../../types';
import type { GrowthPlanResult } from '../../core/ports';
import { Card, Badge, Button } from '../../components/ui/primitives';
import { periodLight, LIGHT_META, deriveDecision, TONE_STYLES, type DecisionTone } from './talentDecisions';

const TONE_ICON: Record<DecisionTone, typeof Award> = {
  positive: Award,
  neutral: Eye,
  negative: AlertTriangle,
  critical: Ban,
};

const GROUPS: CultureGroup[] = ['Liderazgo', 'Comunicación y Soporte', 'Inteligencia Emocional'];

function scoreColor(v: number) {
  if (v >= 4.0) return 'bg-green-500';
  if (v >= 3.0) return 'bg-amber-500';
  return 'bg-red-500';
}

function waLink(phone: string, text: string) {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
}

export function PersonProfileModal({
  person,
  onClose,
}: {
  person: NineBoxDataPoint;
  onClose: () => void;
}) {
  const [plan, setPlan] = useState<GrowthPlanResult | null>(null);
  const [loading, setLoading] = useState(false);

  const first = person.name.split(' ')[0];
  const perf = person.performanceScore;
  const cult = person.cultureScore;
  const decision = deriveDecision(person.history);
  const DecisionIcon = TONE_ICON[decision.tone];

  async function generate() {
    setLoading(true);
    const res = await providers.llm.generateGrowthPlan({
      name: person.name,
      role: person.role,
      department: person.department,
      performanceScore: perf,
      cultureScore: cult,
      quadrant: person.quadrant,
      cultureScores: person.cultureScores,
    });
    setPlan(res);
    setLoading(false);
  }

  const empText = plan
    ? `Hola ${first} 👋 Gracias por tu trabajo en ${person.department}. Según tu evaluación 360° ` +
      `(Desempeño ${perf.toFixed(1)}/5, Cultura ${cult.toFixed(1)}/5 — ${person.quadrant}), tu plan de crecimiento ` +
      `se enfoca en *${plan.habit}*. ${plan.summary} Primer paso esta semana: ${plan.actions[0]} — TALENTIA`
    : '';
  const mgrText = plan
    ? `Hola ${person.managerName} 👋 Te comparto la recomendación de crecimiento de ${person.name} ` +
      `(${person.role}, ${person.department}). Resultado: Desempeño ${perf.toFixed(1)}/5, Cultura ${cult.toFixed(1)}/5 — ${person.quadrant}. ` +
      `Enfoque: *${plan.habit}*. Acciones sugeridas: ${plan.actions.join(' / ')}. — TALENTIA`
    : '';

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="flex items-start justify-between border-b border-slate-100 p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-lg font-bold text-indigo-700">
              {person.initials}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">{person.name}</h2>
              <p className="text-sm text-slate-500">
                {person.role} · {person.department}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">
                Jefe: {person.managerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {/* Resultados */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Desempeño" value={`${perf.toFixed(1)}`} suffix="/5" />
            <Stat label="Cultura" value={`${cult.toFixed(1)}`} suffix="/5" />
            <Stat label="eNPS" value={String(person.enps)} />
            <div className="rounded-lg border border-slate-100 p-3">
              <p className="text-xs text-slate-500">Cuadrante 9-Box</p>
              <Badge variant="brand" className="mt-1">{person.quadrant}</Badge>
            </div>
          </div>

          {/* Historial de desempeño (semáforo por trimestre) */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-700">
              Historial de desempeño · últimos {person.history.length} trimestres
            </h3>
            <div className="flex items-end gap-2">
              {person.history.map((h) => {
                const light = periodLight(h);
                const avg = (h.performanceScore + h.cultureScore) / 2;
                return (
                  <div key={h.period} className="flex flex-1 flex-col items-center">
                    <span className="mb-1 text-[10px] font-semibold text-slate-500">{avg.toFixed(1)}</span>
                    <div className="flex h-20 w-full items-end">
                      <div
                        className={`w-full rounded-t ${LIGHT_META[light].bar}`}
                        style={{ height: `${(avg / 5) * 100}%` }}
                        title={`${h.period}: desempeño ${h.performanceScore}/5 · cultura ${h.cultureScore}/5`}
                      />
                    </div>
                    <span className="mt-1 text-[9px] text-slate-400">{h.period}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Decisión sugerida de RR.HH. (derivada del historial, reglas de política) */}
          <div className={`rounded-xl border p-5 ${TONE_STYLES[decision.tone].box}`}>
            <div className="flex items-start gap-3">
              <DecisionIcon className={`h-6 w-6 shrink-0 ${TONE_STYLES[decision.tone].title}`} />
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  Decisión sugerida · RR.HH.
                </p>
                <p className={`mt-0.5 text-lg font-bold ${TONE_STYLES[decision.tone].title}`}>
                  {decision.label}
                </p>
                <p className="mt-1 text-sm text-slate-600">{decision.detail}</p>
                <p className="mt-1.5 text-xs text-slate-400">Base: {decision.rationale}</p>
              </div>
            </div>
          </div>

          {/* Cultura 360° por dimensión */}
          <div>
            <h3 className="mb-3 text-sm font-bold text-slate-700">Cultura 360° · 10 dimensiones</h3>
            <div className="space-y-4">
              {GROUPS.map((g) => {
                const dims = CULTURE_DIMENSIONS.filter((d) => d.group === g);
                const avg = dims.reduce((s, d) => s + (person.cultureScores[d.key] ?? 0), 0) / dims.length;
                return (
                  <div key={g}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{g}</span>
                      <Badge variant={avg >= 4 ? 'green' : avg >= 3 ? 'amber' : 'red'}>{avg.toFixed(2)}/5</Badge>
                    </div>
                    <div className="space-y-2">
                      {dims.map((d) => {
                        const v = person.cultureScores[d.key] ?? 0;
                        return (
                          <div key={d.key} className="flex items-center gap-2">
                            <span className="w-44 shrink-0 truncate text-xs text-slate-600">{d.label}</span>
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div className={`h-full rounded-full ${scoreColor(v)}`} style={{ width: `${(v / 5) * 100}%` }} />
                            </div>
                            <span className="w-8 shrink-0 text-right text-xs font-semibold text-slate-700">
                              {v.toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recomendación de crecimiento (IA · 7 Hábitos) */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-indigo-900">
              <Sparkles className="h-4 w-4" /> Recomendación de crecimiento · 7 Hábitos
            </h3>

            {!plan && !loading && (
              <div className="mt-3">
                <p className="mb-3 text-sm text-slate-600">
                  Genera un plan de seguimiento basado en los resultados de {first} y los principios de Franklin Covey.
                </p>
                <Button onClick={generate}>
                  <Sparkles className="h-4 w-4" /> Generar recomendación (IA)
                </Button>
              </div>
            )}

            {loading && (
              <div className="mt-4 flex items-center gap-2 text-sm font-medium text-indigo-700">
                <Loader2 className="h-4 w-4 animate-spin" /> Analizando resultados y generando el plan…
              </div>
            )}

            {plan && (
              <div className="mt-3 space-y-4">
                <Badge variant="brand" className="text-sm">{plan.habit}</Badge>
                <p className="text-sm leading-relaxed text-slate-700">{plan.summary}</p>

                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <Target className="h-3.5 w-3.5" /> Acciones esta semana
                  </p>
                  <ul className="space-y-1.5">
                    {plan.actions.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-slate-700">
                        <span className="font-bold text-indigo-500">{i + 1}.</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-500">
                    <GraduationCap className="h-3.5 w-3.5" /> Cursos recomendados
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {plan.courses.map((c) => (
                      <span key={c} className="rounded-md bg-white px-2.5 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Enviar por WhatsApp a la persona y a su jefe */}
                <div className="flex flex-wrap items-center gap-2 border-t border-indigo-100 pt-4">
                  <span className="text-xs font-semibold text-slate-500">Enviar por WhatsApp:</span>
                  <a
                    href={waLink(person.phone, empText)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700"
                  >
                    <MessageCircle className="h-4 w-4" /> A {first}
                  </a>
                  <a
                    href={waLink(person.managerPhone, mgrText)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-green-600 px-3.5 py-2 text-sm font-semibold text-green-700 transition-colors hover:bg-green-50"
                  >
                    <MessageCircle className="h-4 w-4" /> Al jefe ({person.managerName})
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <Card className="p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-0.5 text-xl font-black text-slate-900">
        {value}
        {suffix && <span className="text-sm font-medium text-slate-400">{suffix}</span>}
      </p>
    </Card>
  );
}
