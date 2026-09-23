import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CircleHelp, X, Send, Bot, User, Compass, PlayCircle, MessageCircle, ArrowRight, Check, ClipboardList, Video, Info } from 'lucide-react';
import { TEAM_PILOT } from '../../core/config';
import { useHelp } from './HelpContext';
import { TOUR_STEPS, HELP_VIDEOS, helpVideo } from './tourSteps';
import { MODULE_GUIDES } from './moduleGuides';
import { HELP_FAQ } from '../../data/helpFaq';
import { providers } from '../../core/providers';
import { useSettings } from '../../context/SettingsContext';
import { MODULES, type ModuleId } from '../../core/modules';
import { Button, Badge } from '../../components/ui/primitives';
import { cn } from '../../lib/utils';

interface ChatMsg {
  role: 'user' | 'bot';
  text: string;
  route?: string;
  routeLabel?: string;
  related?: string[];
}

/** Botón flotante de ayuda + panel con Chat, Guía y Video. */
export function HelpLauncher() {
  const { panelOpen, tab, openPanel, closePanel, startTour, tourDone, tourStep, chatTopic } = useHelp();
  const location = useLocation();

  // Durante el tour el panel se cierra; el botón sigue visible para poder resaltarlo.
  return (
    <>
      <button
        data-tour="help:launcher"
        onClick={() => (panelOpen ? closePanel() : openPanel())}
        aria-label={panelOpen ? 'Cerrar ayuda' : 'Abrir ayuda'}
        className={cn(
          'fixed bottom-5 right-5 z-[55] flex h-13 items-center gap-2 rounded-full bg-brand-600 pl-4 pr-5 text-sm font-semibold text-white shadow-[0_6px_20px_-6px_rgba(5,42,32,0.6)] transition-colors hover:bg-brand-700',
          tourStep != null && 'pointer-events-none',
        )}
      >
        {panelOpen ? <X className="h-5 w-5" /> : <CircleHelp className="h-5 w-5" />}
        Ayuda
      </button>

      {panelOpen && (
        <div className="fixed bottom-20 right-5 z-[55] flex max-h-[min(640px,calc(100vh-110px))] w-[min(400px,calc(100vw-40px))] flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl" role="dialog" aria-label="Centro de ayuda">
          <div className="border-b border-stone-100 bg-brand-950 px-4 pb-0 pt-4 text-white">
            <p className="font-display text-base font-semibold">Centro de ayuda</p>
            <p className="text-xs text-brand-300">Pregunta cómo hacer algo, repite el tour o mira los videos.</p>
            <div className="mt-3 flex gap-1">
              <TabBtn active={tab === 'chat'} onClick={() => openPanel('chat')} icon={MessageCircle} label="Chat" />
              <TabBtn active={tab === 'guide'} onClick={() => openPanel('guide')} icon={Compass} label="Guía" />
              <TabBtn active={tab === 'video'} onClick={() => openPanel('video')} icon={PlayCircle} label="Video" />
            </div>
          </div>
          {tab === 'chat' && <ChatTab route={location.pathname} topic={chatTopic} />}
          {tab === 'guide' && <GuideTab onStart={() => startTour()} done={tourDone} />}
          {tab === 'video' && <VideoTab />}
        </div>
      )}
    </>
  );
}

function TabBtn({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Compass; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-semibold transition-colors',
        active ? 'bg-white text-brand-800' : 'text-brand-200 hover:bg-white/10 hover:text-white',
      )}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

// ---------- Chat ----------

function ChatTab({ route, topic }: { route: string; topic: ModuleId | null }) {
  const navigate = useNavigate();
  const { closePanel, logQuestion } = useHelp();
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: 'bot',
      text: topic
        ? `Hola, soy la ayuda de TALENTIA. Pregúntame lo que quieras sobre ${MODULE_GUIDES[topic].title}: cómo funciona, qué hacer después de activarla o cómo leer la evaluación.`
        : 'Hola, soy la ayuda de TALENTIA. Pregúntame cómo hacer algo (por ejemplo "¿cómo subo CVs?") y te explico y te llevo a la pantalla.',
    },
  ]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const genRef = useRef(0);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs, thinking]);

  // Sugerencias: las del módulo si se abrió desde su ayuda guiada; si no, las de la pantalla actual.
  const suggestions = topic
    ? MODULE_GUIDES[topic].chatSuggestions.flatMap((id) => HELP_FAQ.filter((f) => f.id === id).map((f) => f.question))
    : HELP_FAQ.filter((f) => f.route === route).slice(0, 3).map((f) => f.question);
  const chips = suggestions.length ? suggestions : HELP_FAQ.slice(0, 3).map((f) => f.question);

  async function ask(q: string) {
    const text = q.trim();
    if (!text || thinking) return;
    const gen = ++genRef.current;
    setMsgs((m) => [...m, { role: 'user', text }]);
    setInput('');
    setThinking(true);
    const res = await providers.llm.helpReply({ question: text, route });
    if (gen !== genRef.current) return;
    setThinking(false);
    logQuestion({ question: text, route, answered: res.matched });
    setMsgs((m) => [...m, { role: 'bot', text: res.answer, route: res.route, routeLabel: res.routeLabel, related: res.related }]);
  }

  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {msgs.map((m, i) => (
          <div key={i} className={cn('flex gap-2', m.role === 'user' && 'flex-row-reverse')}>
            <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full', m.role === 'bot' ? 'bg-brand-100 text-brand-700' : 'bg-stone-200 text-stone-600')}>
              {m.role === 'bot' ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
            </div>
            <div className="max-w-[85%] space-y-2">
              <div className={cn('rounded-2xl px-3.5 py-2 text-sm leading-relaxed', m.role === 'bot' ? 'bg-stone-100 text-stone-700' : 'bg-brand-600 text-white')}>{m.text}</div>
              {m.route && m.route !== route && (
                <button
                  onClick={() => {
                    navigate(m.route!);
                    closePanel();
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-100"
                >
                  {m.routeLabel ?? 'Ir'} <ArrowRight className="h-3 w-3" />
                </button>
              )}
              {m.related && m.related.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {m.related.map((r) => (
                    <button key={r} onClick={() => ask(r)} className="rounded-full border border-stone-200 bg-white px-2.5 py-1 text-[11px] text-stone-600 hover:border-brand-300 hover:text-brand-700">
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
              <Bot className="h-4 w-4" />
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-stone-100 px-3.5 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-stone-400" />
            </div>
          </div>
        )}
        {msgs.length === 1 && (
          <div className="flex flex-wrap gap-1.5 pl-9">
            {chips.map((c) => (
              <button key={c} onClick={() => ask(c)} className="rounded-full border border-brand-200 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700 hover:bg-brand-100">
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2 border-t border-stone-100 p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && ask(input)}
          placeholder="¿Cómo hago para…?"
          aria-label="Pregunta de ayuda"
          className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
        <Button onClick={() => ask(input)} disabled={thinking || !input.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </div>
      <p className="border-t border-stone-100 px-4 py-2 text-[10px] text-stone-400">Tus preguntas se guardan en Configuración → Preguntas al chat, para mejorar la ayuda. Demo: responde desde la guía de uso; en producción, la IA con la guía como contexto.</p>
    </>
  );
}

// ---------- Guía ----------

function GuideTab({ onStart, done }: { onStart: () => void; done: boolean }) {
  const navigate = useNavigate();
  const { closePanel, startTour, openModuleIntro, isTourDone } = useHelp();
  const { isModuleEnabled } = useSettings();
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-4 rounded-xl bg-brand-50 p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-brand-900">Tour guiado</p>
          {done && (
            <Badge variant="green">
              <Check className="h-3 w-3" /> Ya lo viste
            </Badge>
          )}
        </div>
        <p className="mt-1 text-xs text-brand-800">Te lleva por las pantallas en el orden real del trabajo, resaltando dónde hacer clic. Puedes salir con Escape.</p>
        <Button className="mt-3" onClick={onStart}>
          <Compass className="h-4 w-4" /> {done ? 'Repetir el tour' : 'Iniciar el tour'}
        </Button>
      </div>
      {TEAM_PILOT && (
        <button
          onClick={() => {
            navigate('/ronda-de-prueba');
            closePanel();
          }}
          className="mb-4 flex w-full items-center gap-3 rounded-xl border border-gold-300 bg-gold-100/60 p-3 text-left hover:bg-gold-100"
        >
          <ClipboardList className="h-5 w-5 shrink-0 text-gold-700" />
          <span>
            <span className="block text-sm font-bold text-stone-800">Ronda de prueba del equipo</span>
            <span className="block text-xs text-stone-600">El guion de la semana: qué probar cada día y cómo enviar tus comentarios.</span>
          </span>
        </button>
      )}
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Módulos opcionales</p>
      <div className="mb-4 space-y-2">
        {MODULES.map((m) => {
          const guide = MODULE_GUIDES[m.id];
          const on = isModuleEnabled(m.id);
          return (
            <div key={m.id} className="rounded-xl border border-stone-200 p-3.5">
              <div className="flex items-start gap-3">
                <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                  <Video className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-bold text-stone-800">{guide.title}</p>
                    <Badge variant={on ? 'green' : 'stone'}>{on ? 'Activo' : 'Desactivado'}</Badge>
                    {isTourDone(m.id) && (
                      <Badge variant="green">
                        <Check className="h-3 w-3" /> Ya la viste
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-stone-500">{guide.summary}</p>
                  {!on && <p className="mt-1 text-[11px] text-stone-400">Se activa en Configuración → Módulos opcionales. Al activarla se abre esta ayuda guiada.</p>}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {on && (
                      <Button onClick={() => startTour(m.id)}>
                        <Compass className="h-4 w-4" /> {isTourDone(m.id) ? 'Repetir la ayuda guiada' : 'Iniciar la ayuda guiada'}
                      </Button>
                    )}
                    <Button variant="secondary" onClick={() => openModuleIntro(m.id)}>
                      <Info className="h-4 w-4" /> Cómo funciona
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-stone-400">Los pasos del tour</p>
      <ol className="space-y-1">
        {TOUR_STEPS.map((s, i) => (
          <li key={i}>
            <button
              onClick={() => {
                navigate(s.route);
                closePanel();
              }}
              className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-stone-50"
            >
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-stone-100 text-[10px] font-bold text-stone-600">{i + 1}</span>
              <span>
                <span className="block text-sm font-semibold text-stone-800">{s.title}</span>
                <span className="block text-xs text-stone-500 line-clamp-2">{s.body}</span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

// ---------- Video ----------

function VideoTab() {
  const { video: videoId, openPanel } = useHelp();
  const video = helpVideo(videoId);
  const ref = useRef<HTMLVideoElement>(null);
  function seek(t: number) {
    const v = ref.current;
    if (!v) return;
    v.currentTime = t;
    v.play().catch(() => {});
  }
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-3 flex gap-1 rounded-lg bg-stone-100 p-1" role="tablist" aria-label="Videos de ayuda">
        {HELP_VIDEOS.map((v) => (
          <button
            key={v.id}
            role="tab"
            aria-selected={v.id === video.id}
            onClick={() => openPanel('video', { video: v.id })}
            className={cn(
              'flex-1 rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors',
              v.id === video.id ? 'bg-white text-brand-800 shadow-sm' : 'text-stone-500 hover:text-stone-800',
            )}
          >
            {v.tab}
          </button>
        ))}
      </div>
      {/* key: al cambiar de video, el reproductor se vuelve a montar con la nueva fuente. */}
      <video key={video.id} ref={ref} controls preload="metadata" className="w-full rounded-xl bg-brand-950" aria-label={video.title}>
        <source src={video.mp4} type="video/mp4" />
        <source src={video.webm} type="video/webm" />
        Tu navegador no puede reproducir este video.
      </video>
      <p className="mt-2 text-xs text-stone-500">{video.description}</p>
      <ol className="mt-3 space-y-1">
        {video.chapters.map((c) => (
          <li key={c.t}>
            <button onClick={() => seek(c.t)} className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-stone-50">
              <span className="w-10 shrink-0 font-mono text-[11px] text-stone-400">{Math.floor(c.t / 60)}:{String(c.t % 60).padStart(2, '0')}</span>
              <span className="text-stone-700">{c.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
