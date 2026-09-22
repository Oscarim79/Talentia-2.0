import { useEffect, useLayoutEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { useHelp } from './HelpContext';
import { TOUR_STEPS } from './tourSteps';
import { Button } from '../../components/ui/primitives';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6;
const CARD_W = 340;

/** Tour guiado: navega a cada pantalla, resalta el elemento y explica el paso. */
export function Tour() {
  const { tourStep, setTourStep, endTour } = useHelp();
  const navigate = useNavigate();
  const location = useLocation();
  const [rect, setRect] = useState<Rect | null>(null);

  const step = tourStep != null ? TOUR_STEPS[tourStep] : null;

  // Cambia de pantalla cuando el paso lo pide.
  useEffect(() => {
    if (step && location.pathname !== step.route) navigate(step.route);
  }, [step, location.pathname, navigate]);

  // Busca el elemento (con reintentos: la pantalla puede estar montándose) y lo mide.
  useLayoutEffect(() => {
    if (!step) return;
    let tries = 0;
    let raf = 0;
    let cancelled = false;
    const measure = () => {
      if (cancelled) return;
      const el = step.target ? document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`) : null;
      if (el) {
        el.scrollIntoView({ block: 'center', inline: 'nearest' });
        const r = el.getBoundingClientRect();
        // Elemento oculto (ej. sidebar en móvil): sin foco, solo tarjeta.
        if (r.width === 0 || r.height === 0) setRect(null);
        else setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        return;
      }
      if (tries++ < 40) raf = requestAnimationFrame(measure);
      else setRect(null);
    };
    setRect(null);
    raf = requestAnimationFrame(measure);
    const onChange = () => {
      tries = 0;
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener('resize', onChange);
    document.querySelector('main')?.addEventListener('scroll', onChange);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onChange);
      document.querySelector('main')?.removeEventListener('scroll', onChange);
    };
  }, [step, location.pathname]);

  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') endTour();
      if (e.key === 'ArrowRight' && tourStep! < TOUR_STEPS.length - 1) setTourStep(tourStep! + 1);
      if (e.key === 'ArrowLeft' && tourStep! > 0) setTourStep(tourStep! - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, tourStep, setTourStep, endTour]);

  if (!step || tourStep == null) return null;

  const last = tourStep === TOUR_STEPS.length - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mobile = vw < 640;

  // Posición de la tarjeta: a la derecha del elemento si cabe, si no debajo; en móvil, abajo fija.
  let cardStyle: React.CSSProperties;
  if (mobile || !rect) {
    cardStyle = { left: 16, right: 16, bottom: 16 };
  } else {
    const fitsRight = rect.left + rect.width + PAD + 16 + CARD_W < vw;
    const left = fitsRight ? rect.left + rect.width + PAD + 16 : Math.min(Math.max(16, rect.left), vw - CARD_W - 16);
    const top = fitsRight ? Math.min(Math.max(16, rect.top), vh - 260) : Math.min(rect.top + rect.height + PAD + 12, vh - 260);
    cardStyle = { left, top, width: CARD_W };
  }

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={`Tour: ${step.title}`}>
      {/* Foco: el recorte se logra con una sombra enorme alrededor del elemento. */}
      {rect ? (
        <div
          className="absolute rounded-xl ring-2 ring-gold-400 transition-all duration-300"
          style={{
            top: rect.top - PAD,
            left: rect.left - PAD,
            width: rect.width + PAD * 2,
            height: rect.height + PAD * 2,
            boxShadow: '0 0 0 9999px rgba(5, 42, 32, 0.62)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-brand-950/62" />
      )}

      <div className="absolute rounded-2xl bg-white p-5 shadow-2xl" style={cardStyle}>
        <div className="mb-2 flex items-start justify-between gap-3">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-brand-600">
            Paso {tourStep + 1} de {TOUR_STEPS.length}
          </p>
          <button onClick={endTour} aria-label="Salir del tour" className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="font-display text-lg font-semibold leading-tight text-ink">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {TOUR_STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === tourStep ? 'bg-brand-600' : i < tourStep ? 'bg-brand-300' : 'bg-stone-200'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setTourStep(tourStep - 1)} disabled={tourStep === 0}>
              <ChevronLeft className="h-4 w-4" /> Atrás
            </Button>
            {last ? (
              <Button onClick={endTour}>
                <Check className="h-4 w-4" /> Terminar
              </Button>
            ) : (
              <Button onClick={() => setTourStep(tourStep + 1)}>
                Siguiente <ChevronRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
