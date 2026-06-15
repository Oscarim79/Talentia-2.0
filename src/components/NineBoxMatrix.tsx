import type { NineBoxDataPoint } from '../types';

interface Props {
  dataPoints?: NineBoxDataPoint[];
  onPointClick?: (id: string) => void;
}

const quadrants = [
  { id: 'Diamante en Bruto', label: 'Diamante en Bruto', color: 'bg-yellow-100/40 border-yellow-200' },
  { id: 'Futuro Líder', label: 'Futuro Líder', color: 'bg-green-100/40 border-green-200' },
  { id: 'Superestrella', label: 'Superestrella', color: 'bg-green-300/40 border-green-400' },
  { id: 'Colaborador Inconsistente', label: 'Colaborador Inconsistente', color: 'bg-orange-100/40 border-orange-200' },
  { id: 'Colaborador Clave', label: 'Colaborador Clave', color: 'bg-yellow-50/40 border-yellow-100' },
  { id: 'Estrella', label: 'Estrella', color: 'bg-green-100/40 border-green-200' },
  { id: 'Crítico o Inadecuado', label: 'Crítico o Inadecuado', color: 'bg-red-200/40 border-red-300' },
  { id: 'Buen Colaborador', label: 'Buen Colaborador', color: 'bg-red-100/40 border-red-200' },
  { id: 'Profesional', label: 'Profesional', color: 'bg-red-50/40 border-red-100' },
];

const MIN_SCORE = 1.0;
const MAX_SCORE = 5.0;

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

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col items-center">
      <div className="flex w-full gap-2 sm:gap-4">
        {/* Eje Y */}
        <div className="relative w-12 shrink-0">
          <div className="absolute top-1/2 -left-10 -translate-y-1/2 -rotate-90 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-400">
            Cultura / Potencial
          </div>
          <div className="flex h-full flex-col justify-between py-4 sm:py-8">
            <span className="pr-2 text-right text-[10px] font-bold text-slate-300">5.0</span>
            <div className="flex-1" />
            <span className="pr-2 text-right text-[10px] font-bold text-slate-300">1.0</span>
          </div>
        </div>

        {/* Matriz */}
        <div className="relative flex-1">
          <div className="relative aspect-square rounded-lg border-2 border-slate-200 bg-white shadow-sm sm:aspect-video">
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {quadrants.map((q) => (
                <div key={q.id} className={`${q.color} flex items-start border border-slate-100/50 p-2`}>
                  <span className="text-[9px] font-bold uppercase tracking-tighter text-slate-400 opacity-60">
                    {q.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="absolute top-0 bottom-0 left-[33.3%] z-10 w-px bg-slate-200/80" />
            <div className="absolute top-0 bottom-0 left-[66.6%] z-10 w-px bg-slate-200/80" />
            <div className="absolute right-0 left-0 top-[33.3%] z-10 h-px bg-slate-200/80" />
            <div className="absolute right-0 left-0 top-[66.6%] z-10 h-px bg-slate-200/80" />

            {dataPoints?.map((p, idx) => {
              const rx = p.refinedPerformanceScore || p.performanceScore;
              const ry = p.refinedCultureScore || p.cultureScore;
              const jitterX = ((idx % 3) - 1) * 0.8;
              const jitterY = ((Math.floor(idx / 3) % 3) - 1) * 0.8;
              const x = getPixelX(rx) + jitterX;
              const y = getPixelY(ry) + jitterY;

              return (
                <div
                  key={p.id}
                  onClick={() => onPointClick?.(p.id)}
                  className="group absolute z-30 h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div className="relative">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-indigo-500 text-[10px] font-bold text-white shadow-xl ring-1 ring-slate-200 transition-transform hover:scale-125">
                      {p.initials}
                    </div>
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 flex -translate-x-1/2 scale-90 flex-col items-center whitespace-nowrap rounded border border-slate-700/50 bg-slate-900 px-2 py-1 text-[10px] text-white opacity-0 shadow-2xl transition-all group-hover:scale-100 group-hover:opacity-100">
                      <span className="font-bold">{p.name}</span>
                      <span className="text-[9px] font-medium text-slate-400">
                        {rx.toFixed(2)} - {ry.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Eje X */}
          <div className="relative mt-2 flex h-8 w-full items-center justify-between px-4 sm:mt-4">
            <span className="text-[10px] font-bold text-slate-300">1.0</span>
            <div className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Desempeño (Ventas)
            </div>
            <span className="text-[10px] font-bold text-slate-300">5.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
