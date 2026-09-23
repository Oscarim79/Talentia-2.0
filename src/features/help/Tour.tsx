import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X, Check } from 'lucide-react';
import { useHelp } from './HelpContext';
import { TOURS, TOUR_LABELS } from './tourSteps';
import { Button } from '../../components/ui/primitives';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 6;
const GAP = 12;
const CARD_W = 340;
const EDGE = 16;

/** Tour guiado: navega a cada pantalla, resalta el elemento y explica el paso. */
export function Tour() {
  const { tour, tourStep, setTourStep, endTour } = useHelp();
  const navigate = useNavigate();
  const location = useLocation();
  const [rect, setRect] = useState<Rect | null>(null);
  // Alto real de la tarjeta: los pasos con más texto no deben salirse de la pantalla.
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(260);

  const steps = TOURS[tour];
  const step = tourStep != null ? steps[tourStep] ?? null : null;

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
        // En móvil la tarjeta ocupa el ancho: el elemento sube para que la tarjeta no lo tape.
        el.scrollIntoView({ block: window.innerWidth < 640 ? 'start' : 'center', inline: 'nearest' });
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

  useLayoutEffect(() => {
    const h = cardRef.current?.offsetHeight;
    if (h && h !== cardH) setCardH(h);
  });

  useEffect(() => {
    if (!step) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Solo cierra el tour: no debe llegar a los modales de la página que quedan debajo.
        e.stopImmediatePropagation();
        endTour();
      }
      if (e.key === 'ArrowRight' && tourStep! < steps.length - 1) setTourStep(tourStep! + 1);
      if (e.key === 'ArrowLeft' && tourStep! > 0) setTourStep(tourStep! - 1);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [step, steps, tourStep, setTourStep, endTour]);

  if (!step || tourStep == null) return null;

  const last = tourStep === steps.length - 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const mobile = vw < 640;

  // Posición de la tarjeta sin tapar el elemento: a la derecha, debajo, arriba o a la izquierda (lo que quepa).
  // En móvil ocupa el ancho: abajo, o arriba si el elemento quedó en la mitad inferior.
  let cardStyle: React.CSSProperties;
  if (!rect) {
    cardStyle = { left: EDGE, right: EDGE, bottom: EDGE };
  } else if (mobile) {
    cardStyle = rect.top + rect.height / 2 > vh / 2 ? { left: EDGE, right: EDGE, top: EDGE } : { left: EDGE, right: EDGE, bottom: EDGE };
  } else {
    const clampTop = (t: number) => Math.min(Math.max(EDGE, t), Math.max(EDGE, vh - cardH - EDGE));
    const clampLeft = (l: number) => Math.min(Math.max(EDGE, l), vw - CARD_W - EDGE);
    const right = rect.left + rect.width + PAD + EDGE;
    const below = rect.top + rect.height + PAD + GAP;
    const above = rect.top - PAD - GAP - cardH;
    const leftSide = rect.left - PAD - EDGE - CARD_W;
    if (right + CARD_W + EDGE <= vw) cardStyle = { left: right, top: clampTop(rect.top) };
    else if (below + cardH + EDGE <= vh) cardStyle = { left: clampLeft(rect.left), top: below };
    else if (above >= EDGE) cardStyle = { left: clampLeft(rect.left + rect.width - CARD_W), top: above };
    else if (leftSide >= EDGE) cardStyle = { left: leftSide, top: clampTop(rect.top) };
    else cardStyle = { left: clampLeft(rect.left), top: clampTop(below) };
    cardStyle.width = CARD_W;
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

      <div ref={cardRef} className="absolute max-h-[calc(100vh-32px)] overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl" style={cardStyle}>
        <div className="mb-2 flex items-start justify-between gap-3">
          <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-brand-600">
            {tour !== 'main' && `${TOUR_LABELS[tour]} · `}Paso {tourStep + 1} de {steps.length}
          </p>
          <button onClick={() => endTour()} aria-label="Salir del tour" className="rounded-lg p-1 text-stone-400 hover:bg-stone-100 hover:text-stone-700">
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="font-display text-lg font-semibold leading-tight text-ink">{step.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-stone-600">{step.body}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === tourStep ? 'bg-brand-600' : i < tourStep ? 'bg-brand-300' : 'bg-stone-200'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setTourStep(tourStep - 1)} disabled={tourStep === 0}>
              <ChevronLeft className="h-4 w-4" /> Atrás
            </Button>
            {last ? (
              <Button onClick={() => endTour(true)}>
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
