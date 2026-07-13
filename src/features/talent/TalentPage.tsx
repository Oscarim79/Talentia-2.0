import { useMemo, useState } from 'react';
import { useTenant } from '../../context/TenantContext';
import { NINE_BOX, CULTURE_DIMENSIONS } from '../../data/seed';
import { NineBoxMatrix } from '../../components/NineBoxMatrix';
import { Card, PageHeader, Badge } from '../../components/ui/primitives';
import type { CultureGroup } from '../../types';
import { PersonProfileModal } from './PersonProfileModal';

const GROUPS: CultureGroup[] = ['Liderazgo', 'Comunicación y Soporte', 'Inteligencia Emocional'];

function scoreColor(v: number) {
  if (v >= 4.0) return 'bg-green-500';
  if (v >= 3.0) return 'bg-amber-500';
  return 'bg-red-500';
}

type BadgeVariant = 'green' | 'amber' | 'red' | 'brand' | 'stone' | 'blue';
function quadrantVariant(q: string): BadgeVariant {
  if (['Superestrella', 'Estrella', 'Futuro Líder'].includes(q)) return 'green';
  if (['Crítico o Inadecuado'].includes(q)) return 'red';
  if (['Profesional', 'Diamante en Bruto'].includes(q)) return 'blue';
  return 'amber';
}

export default function TalentPage() {
  const { tenant } = useTenant();
  const hasData = tenant.id === 't_americana';

  const [dept, setDept] = useState('Todos');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const departments = useMemo(
    () => ['Todos', ...Array.from(new Set(NINE_BOX.map((p) => p.department))).sort()],
    [],
  );
  const people = useMemo(
    () => (dept === 'Todos' ? NINE_BOX : NINE_BOX.filter((p) => p.department === dept)),
    [dept],
  );
  const selected = NINE_BOX.find((p) => p.id === selectedId) ?? null;

  // Promedios 360° del equipo (responden al filtro de departamento).
  const teamGroups = GROUPS.map((g) => {
    const dims = CULTURE_DIMENSIONS.filter((d) => d.group === g).map((d) => ({
      ...d,
      score: people.length
        ? people.reduce((s, p) => s + (p.cultureScores[d.key] ?? 0), 0) / people.length
        : d.score,
    }));
    const avg = dims.reduce((s, d) => s + d.score, 0) / dims.length;
    return { group: g, dims, avg };
  });

  if (!hasData) {
    return (
      <div>
        <PageHeader
          eyebrow="Talento"
          title="Matriz 9-Box"
          subtitle="Del candidato al colaborador: desempeño vs. cultura/potencial (escala 1–5)."
        />
        <Card className="p-12 text-center text-sm text-stone-400">
          El módulo de Talento se activa cuando hay colaboradores contratados y evaluados.
          <br />
          (Datos de demostración disponibles en la empresa <b>Americana 2000</b>.)
        </Card>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Talento"
        title="Matriz 9-Box"
        subtitle="Del candidato al colaborador: desempeño vs. cultura/potencial (escala 1–5). Haz clic en una persona para ver su perfil."
        actions={<Badge variant="gold">Módulo heredado de Americana 2000</Badge>}
      />

      {/* Filtro por departamento */}
      <Card className="mb-5 flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">Departamento</span>
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-stone-500">{people.length} colaboradores</span>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Matriz */}
        <Card className="p-6 xl:col-span-2">
          <NineBoxMatrix dataPoints={people} onPointClick={setSelectedId} />
          <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] font-medium text-stone-500">
            <Legend color="bg-green-300/60" label="Ideal / Superestrella" />
            <Legend color="bg-yellow-200/60" label="Desarrollo / Futuro Líder" />
            <Legend color="bg-red-300/60" label="Riesgo / Crítico" />
          </div>
        </Card>

        {/* Lista de colaboradores (nombres clicables → perfil) */}
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-bold text-stone-700">
            Colaboradores {dept !== 'Todos' && <span className="text-stone-400">· {dept}</span>}
          </h2>
          <ul className="space-y-1">
            {people.map((p) => (
              <li key={p.id}>
                <button
                  onClick={() => setSelectedId(p.id)}
                  className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-stone-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {p.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug text-stone-800">{p.name}</p>
                      <span className="shrink-0 text-[11px] font-medium text-stone-400">
                        {(p.refinedPerformanceScore || p.performanceScore).toFixed(1)} ·{' '}
                        {(p.refinedCultureScore || p.cultureScore).toFixed(1)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <p className="truncate text-xs text-stone-500">{p.role}</p>
                      <Badge variant={quadrantVariant(p.quadrant)} className="shrink-0 whitespace-nowrap text-[10px]">
                        {p.quadrant}
                      </Badge>
                    </div>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Cultura 360° del equipo (promedio, responde al filtro) */}
      <Card className="mt-6 p-6">
        <h2 className="mb-4 text-sm font-bold text-stone-700">
          Cultura 360° del equipo · 10 dimensiones {dept !== 'Todos' && <span className="text-stone-400">· {dept}</span>}
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {teamGroups.map(({ group, dims, avg }) => (
            <div key={group}>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wide text-stone-500">{group}</span>
                <Badge variant={avg >= 4 ? 'green' : avg >= 3 ? 'amber' : 'red'}>{avg.toFixed(2)}/5</Badge>
              </div>
              <div className="space-y-2">
                {dims.map((d) => (
                  <div key={d.key} className="flex items-center gap-2">
                    <span className="w-40 shrink-0 truncate text-xs text-stone-600">{d.label}</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100">
                      <div className={`h-full rounded-full ${scoreColor(d.score)}`} style={{ width: `${(d.score / 5) * 100}%` }} />
                    </div>
                    <span className="w-8 shrink-0 text-right text-xs font-semibold text-stone-700">
                      {d.score.toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {selected && <PersonProfileModal person={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-3 w-3 rounded ${color}`} />
      <span>{label}</span>
    </div>
  );
}
