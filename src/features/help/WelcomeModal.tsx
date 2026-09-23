import { Compass, PlayCircle, MessageCircleQuestion, X } from 'lucide-react';
import { useHelp } from './HelpContext';
import { TOUR_STEPS } from './tourSteps';
import { useEscape } from '../../lib/useEscape';
import { APP } from '../../core/config';

/** Primera visita: ofrece el tour, el video o explorar por cuenta propia. */
export function WelcomeModal() {
  const { showWelcome, dismissWelcome, startTour, openPanel } = useHelp();
  useEscape(dismissWelcome);
  if (!showWelcome) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-950/60 p-4 backdrop-blur-sm" onClick={dismissWelcome}>
      <div role="dialog" aria-modal="true" aria-label="Bienvenida" onClick={(e) => e.stopPropagation()} className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="bg-brand-950 px-6 py-6 text-white">
          <div className="flex items-start justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-500 font-display text-xl font-bold text-brand-950">T</div>
            <button onClick={dismissWelcome} aria-label="Cerrar" className="rounded-lg p-1.5 text-brand-300 hover:bg-white/10 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
          <h2 className="mt-4 font-display text-2xl font-semibold leading-tight">Bienvenido a {APP.name} {APP.version}</h2>
          <p className="mt-1 text-sm text-brand-200">Reclutamiento con IA para el equipo de RR.HH. En 2 minutos sabrás usarla.</p>
        </div>
        <div className="grid gap-2 p-4 sm:p-5">
          <ChoiceButton icon={Compass} title="Iniciar el tour guiado" desc={`Te lleva pantalla por pantalla, en el orden real del trabajo. ${TOUR_STEPS.length} pasos.`} onClick={() => startTour()} primary />
          <ChoiceButton icon={PlayCircle} title="Ver el video (3½ min)" desc="Recorrido completo narrado, con subtítulos y capítulos." onClick={() => { dismissWelcome(); openPanel('video', { video: 'tour' }); }} />
          <ChoiceButton icon={MessageCircleQuestion} title="Explorar por mi cuenta" desc="El botón de ayuda queda abajo a la derecha: pregunta lo que sea, cuando sea." onClick={dismissWelcome} />
        </div>
      </div>
    </div>
  );
}

function ChoiceButton({ icon: Icon, title, desc, onClick, primary }: { icon: typeof Compass; title: string; desc: string; onClick: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors ${
        primary ? 'border-brand-600 bg-brand-50 hover:bg-brand-100' : 'border-stone-200 bg-white hover:bg-stone-50'
      }`}
    >
      <div className={`rounded-lg p-2 ${primary ? 'bg-brand-600 text-white' : 'bg-stone-100 text-stone-600'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-bold text-stone-800">{title}</p>
        <p className="mt-0.5 text-xs text-stone-500">{desc}</p>
      </div>
    </button>
  );
}
