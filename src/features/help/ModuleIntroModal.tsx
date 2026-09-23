import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, Compass, PlayCircle, MessageCircleQuestion, X, CheckCircle2, ArrowRight, Info, Settings, Check } from 'lucide-react';
import { useHelp } from './HelpContext';
import { useSettings } from '../../context/SettingsContext';
import { MODULE_GUIDES } from './moduleGuides';
import { TOURS } from './tourSteps';
import { Badge, Button } from '../../components/ui/primitives';

/**
 * Ayuda guiada de un módulo opcional: se abre sola al activarlo en Configuración
 * (y a pedido con "Cómo funciona" desde Ayuda → Guía, Configuración o la pantalla del módulo).
 * Explica cómo funciona, qué le toca hacer a RR.HH. y ofrece el recorrido guiado paso a paso.
 */
export function ModuleIntroModal() {
  const { moduleIntro, closeModuleIntro, startTour, openPanel, isTourDone } = useHelp();
  const { isModuleEnabled } = useSettings();
  const navigate = useNavigate();
  const dialogRef = useRef<HTMLDivElement>(null);
  const open = moduleIntro !== null;

  useEffect(() => {
    if (!open) return;
    // El foco entra a la ventana (si se queda en el interruptor, un Enter apagaría el módulo).
    dialogRef.current?.focus();
    // Escape cierra solo esta ventana, no los modales de la página que quedan debajo.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopImmediatePropagation();
      closeModuleIntro();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, closeModuleIntro]);

  if (!moduleIntro) return null;

  const { module, justActivated } = moduleIntro;
  const guide = MODULE_GUIDES[module];
  const on = isModuleEnabled(module);
  const go = (route: string) => {
    closeModuleIntro();
    navigate(route);
  };
  /** Lleva al interruptor del módulo en Configuración. */
  const goToSwitch = () => {
    go('/configuracion');
    window.setTimeout(() => {
      document.querySelector(`[data-tour="settings:module:${module}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, 150);
  };
  const activatedNow = justActivated && on;
  const eyebrow = activatedNow ? 'Módulo activado' : on ? 'Módulo opcional · activo' : 'Módulo opcional · desactivado';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-950/60 p-4 backdrop-blur-sm" onClick={closeModuleIntro}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Ayuda guiada: ${guide.title}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl outline-none"
      >
        <div className="shrink-0 bg-brand-950 px-5 py-5 text-white sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-500 text-brand-950">
                <Video className="h-5 w-5" />
              </div>
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-gold-300">{eyebrow}</p>
            </div>
            <button onClick={closeModuleIntro} aria-label="Cerrar" className="rounded-lg p-1.5 text-brand-300 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-3 font-display text-2xl font-semibold leading-tight">
            {activatedNow ? `Activaste ${guide.title}` : guide.title}
          </h2>
          <p className="mt-1 text-sm text-brand-200">{guide.summary}</p>
        </div>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          <div className="mb-5 flex gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs leading-relaxed text-amber-900">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <p>
              <b>Demo:</b> {guide.demoNote}
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <section>
              <h3 className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-brand-600">Cómo funciona</h3>
              <ol className="space-y-3">
                {guide.howItWorks.map((s, i) => (
                  <li key={s.title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[11px] font-bold text-white">{i + 1}</span>
                    <span>
                      <span className="block text-sm font-semibold text-stone-800">{s.title}</span>
                      <span className="block text-xs leading-relaxed text-stone-500">{s.body}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </section>
            <section>
              <h3 className="mb-3 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-brand-600">Qué debes hacer</h3>
              <ul className="space-y-3">
                {guide.todo.map((t) => (
                  <li key={t.text} className="flex gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <span className="text-xs leading-relaxed text-stone-600">
                      {t.text}
                      {t.route && on && (
                        <button onClick={() => go(t.route!)} className="ml-1 inline-flex items-center gap-0.5 font-semibold text-brand-600 hover:underline">
                          {t.routeLabel ?? 'Ir'} <ArrowRight className="h-3 w-3" />
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        <div className="shrink-0 border-t border-stone-100 bg-stone-50/60 px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2">
            {on ? (
              <Button onClick={() => startTour(module)}>
                <Compass className="h-4 w-4" /> {isTourDone(module) ? 'Repetir el recorrido guiado' : 'Iniciar el recorrido guiado'} ({TOURS[module].length} pasos)
              </Button>
            ) : (
              <Button onClick={goToSwitch}>
                <Settings className="h-4 w-4" /> Activar el módulo en Configuración
              </Button>
            )}
            <Button
              variant="secondary"
              onClick={() => {
                closeModuleIntro();
                openPanel('video', { video: guide.video });
              }}
            >
              <PlayCircle className="h-4 w-4" /> Ver el video
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                closeModuleIntro();
                openPanel('chat', { topic: module });
              }}
            >
              <MessageCircleQuestion className="h-4 w-4" /> Preguntar en el chat
            </Button>
            <Button variant="ghost" className="sm:ml-auto" onClick={closeModuleIntro}>
              Lo veo después
            </Button>
          </div>
          <p className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[11px] text-stone-400">
            {isTourDone(module) && (
              <Badge variant="green" className="shrink-0 whitespace-nowrap">
                <Check className="h-3 w-3" /> Recorrido visto
              </Badge>
            )}
            Esta ayuda siempre está en el botón Ayuda → Guía.
          </p>
        </div>
      </div>
    </div>
  );
}
