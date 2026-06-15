import { useTenant } from '../../context/TenantContext';
import { NINE_BOX, CULTURE_DIMENSIONS } from '../../data/seed';
import { NineBoxMatrix } from '../../components/NineBoxMatrix';
import { Card, PageHeader, Badge } from '../../components/ui/primitives';
import type { CultureGroup } from '../../types';

const GROUPS: CultureGroup[] = ['Liderazgo', 'Comunicación y Soporte', 'Inteligencia Emocional'];

function scoreColor(v: number) {
  if (v >= 4.0) return 'bg-green-500';
  if (v >= 3.0) return 'bg-amber-500';
  return 'bg-red-500';
}

export default function TalentPage() {
  const { tenant } = useTenant();
  const hasData = tenant.id === 't_americana';

  return (
    <div>
      <PageHeader
        title="Talento · Matriz 9-Box"
        subtitle="Del candidato al colaborador: desempeño vs. cultura/potencial (escala 1–5). El ciclo completo de TALENTIA."
        actions={<Badge variant="brand">Módulo heredado de Americana 2000</Badge>}
      />

      {!hasData ? (
        <Card className="p-12 text-center text-sm text-slate-400">
          El módulo de Talento se activa cuando hay colaboradores contratados y evaluados.
          <br />
          (Datos de demostración disponibles en la empresa <b>Americana 2000</b>.)
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="p-6 xl:col-span-2">
            <NineBoxMatrix dataPoints={NINE_BOX} />
            <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] font-medium text-slate-500">
              <Legend color="bg-green-300/60" label="Ideal / Superestrella" />
              <Legend color="bg-yellow-200/60" label="Desarrollo / Futuro Líder" />
              <Legend color="bg-red-300/60" label="Riesgo / Crítico" />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 text-sm font-bold text-slate-700">Cultura 360° · 10 dimensiones</h2>
            <div className="space-y-5">
              {GROUPS.map((g) => {
                const dims = CULTURE_DIMENSIONS.filter((d) => d.group === g);
                const avg = dims.reduce((s, d) => s + d.score, 0) / dims.length;
                return (
                  <div key={g}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wide text-slate-500">{g}</span>
                      <Badge variant={avg >= 4 ? 'green' : avg >= 3 ? 'amber' : 'red'}>
                        {avg.toFixed(2)}/5
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {dims.map((d) => (
                        <div key={d.key} className="flex items-center gap-2">
                          <span className="w-44 shrink-0 truncate text-xs text-slate-600">{d.label}</span>
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${scoreColor(d.score)}`}
                              style={{ width: `${(d.score / 5) * 100}%` }}
                            />
                          </div>
                          <span className="w-10 shrink-0 text-right text-xs font-semibold text-slate-700">
                            {d.score.toFixed(1)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
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
