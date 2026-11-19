import type { NineBoxDataPoint } from '../types';
import { NINE_BOX_QUADRANTS, NINE_BOX_MIN, NINE_BOX_MAX, quadrantFromScores } from '../core/nineBox';

interface Props {
  dataPoints?: NineBoxDataPoint[];
  onPointClick?: (id: string) => void;
}

/** Zona de cada cuadrante: el color acompaña, la leyenda y el conteo lo dicen con palabras. */
type Zone = 'high' | 'develop' | 'inconsistent' | 'attention';
const CELL_ZONE: Record<string, Zone> = {
  'Diamante en Bruto': 'develop',
  'Futuro Líder': 'high',
  'Superestrella': 'high',
  'Colaborador Inconsistente': 'inconsistent',
  'Colaborador Clave': 'develop',
  'Estrella': 'high',
  'Crítico o Inadecuado': 'attention',
  'Buen Colaborador': 'attention',
  'Profesional': 'attention',
};
const ZONE_META: Record<Zone, { label: string; cell: string; dot: string }> = {
  high: { label: 'Potencial alto: desarrollar y retener', cell: 'bg-green-100/50 border-green-200', dot: 'bg-green-400' },
  develop: { label: 'En desarrollo: acompañar', cell: 'bg-yellow-50/70 border-yellow-200', dot: 'bg-yellow-300' },
  inconsistent: { label: 'Inconsistente: dar seguimiento', cell: 'bg-amber-100/50 border-amber-200', dot: 'bg-amber-400' },
  attention: { label: 'Requiere atención', cell: 'bg-red-100/50 border-red-200', dot: 'bg-red-400' },
};

// Celdas en orden de dibujo (fila superior = cultura alta), desde la fuente única.
const gridCells = [...NINE_BOX_QUADRANTS].reverse().flat();

const MIN_SCORE = NINE_BOX_MIN;
const MAX_SCORE = NINE_BOX_MAX;

/**
 * Matriz 9-Box portada del HRIS Americana 2000 (la joya).
 * Eje X = Desempeño/Ventas, Eje Y = Cultura/Potencial. Escala 1–5.
 */
export function NineBoxMatrix({ dataPoints, onPointClick }: Props) {
  const getPixelX = (score: number) => {
    const s = Math.min(Math.max(score, MIN_SCORE), MAX_SCORE);
    const rawPercent = ((s - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100;
    return 2 + rawPercent * 0.96;
  };

  const getPixelY = (score: number) => {
    const s = Math.min(Math.max(score, MIN_SCORE), MAX_SCORE);
    const rawPercent = 100 - ((s - MIN_SCORE) / (MAX_SCORE - MIN_SCORE)) * 100;
    return 2 + rawPercent * 0.96;
  };

  const points = (dataPoints ?? []).map((p) => ({
    ...p,
    rx: p.refinedPerformanceScore || p.performanceScore,
    ry: p.refinedCultureScore || p.cultureScore,
  }));
  const countByCell = new Map<string, number>();
  for (const p of points) {
    const q = quadrantFromScores(p.rx, p.ry);
    countByCell.set(q, (countByCell.get(q) ?? 0) + 1);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
      <div className="flex w-full gap-2 sm:gap-4">
        {/* Eje Y */}
        <div className="relative w-12 shrink-0">
          <div className="absolute top-1/2 -left-10 -translate-y-1/2 -rotate-90 whitespace-nowrap text-xs font-bold uppercase tracking-widest text-neutral-500">
            Cultura / Potencial
          </div>
          <div className="flex h-full flex-col justify-between py-4 sm:py-8">
            <span className="pr-2 text-right text-xs font-bold text-neutral-500">5.0</span>
            <div className="flex-1" />
            <span className="pr-2 text-right text-xs font-bold text-neutral-500">1.0</span>
          </div>
        </div>

        {/* Matriz */}
        <div className="relative flex-1">
          <div className="relative aspect-square rounded-lg border-2 border-neutral-200 bg-white shadow-sm sm:aspect-video">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {gridCells.map((label) => {
                const n = countByCell.get(label) ?? 0;
                const zone = ZONE_META[CELL_ZONE[label]];
                return (
                  <div
                    key={label}
                    role="group"
                    aria-label={`${label}: ${n} ${n === 1 ? 'persona' : 'personas'}`}
                    className={`${zone.cell} flex items-start justify-between gap-1 border border-neutral-100/50 p-2`}
                  >
                    <span className="text-xs font-semibold leading-tight text-neutral-600">{label}</span>
                    <span
                      aria-hidden="true"
                      className={`shrink-0 rounded-full px-1.5 text-xs font-bold ${n > 0 ? 'bg-white/90 text-neutral-800 ring-1 ring-neutral-200' : 'text-neutral-500'}`}
                    >
                      {n}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="absolute top-0 bottom-0 left-[33.3%] z-10 w-px bg-neutral-200/80" />
            <div className="absolute top-0 bottom-0 left-[66.6%] z-10 w-px bg-neutral-200/80" />
            <div className="absolute right-0 left-0 top-[33.3%] z-10 h-px bg-neutral-200/80" />
            <div className="absolute right-0 left-0 top-[66.6%] z-10 h-px bg-neutral-200/80" />

            {points.map((p, idx) => {
              const jitterX = ((idx % 3) - 1) * 0.8;
              const jitterY = ((Math.floor(idx / 3) % 3) - 1) * 0.8;
              const x = getPixelX(p.rx) + jitterX;
              const y = getPixelY(p.ry) + jitterY;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPointClick?.(p.id)}
                  aria-label={`${p.name}: desempeño ${p.rx.toFixed(1)}, cultura ${p.ry.toFixed(1)}`}
                  className="group absolute z-30 h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <span className="relative block">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-brand-500 text-xs font-bold text-white shadow-xl ring-1 ring-neutral-200 transition-transform group-hover:scale-125 group-focus-visible:scale-125">
                      {p.initials}
                    </span>
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 flex -translate-x-1/2 scale-90 flex-col items-center whitespace-nowrap rounded border border-neutral-700/50 bg-neutral-900 px-2 py-1 text-xs text-white opacity-0 shadow-2xl transition-all group-hover:scale-100 group-hover:opacity-100 group-focus-visible:scale-100 group-focus-visible:opacity-100"
                    >
                      <span className="font-bold">{p.name}</span>
                      <span className="font-medium text-neutral-300">
                        {p.rx.toFixed(2)} - {p.ry.toFixed(2)}
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Eje X */}
          <div className="relative mt-2 flex h-8 w-full items-center justify-between px-4 sm:mt-4">
            <span className="text-xs font-bold text-neutral-500">1.0</span>
            <div className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs font-bold uppercase tracking-widest text-neutral-500">
              Desempeño (Ventas)
            </div>
            <span className="text-xs font-bold text-neutral-500">5.0</span>
          </div>
        </div>
      </div>

      {/* Leyenda: los colores explicados con palabras */}
      <dl className="mt-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1.5 pl-12 text-xs text-neutral-600 sm:pl-16">
        <dt className="font-semibold text-neutral-700">Leyenda:</dt>
        {(Object.keys(ZONE_META) as Zone[]).map((z) => (
          <dd key={z} className="flex items-center gap-1.5">
            <span aria-hidden="true" className={`inline-block h-2.5 w-2.5 rounded-full ${ZONE_META[z].dot}`} />
            {ZONE_META[z].label}
          </dd>
        ))}
      </dl>
    </div>
  );
}
