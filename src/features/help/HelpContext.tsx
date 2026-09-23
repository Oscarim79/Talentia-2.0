import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ModuleId } from '../../core/modules';
import { isTourId, type HelpVideoId, type TourId } from './tourSteps';

export type HelpTab = 'chat' | 'guide' | 'video';

/** Pregunta hecha al chat de ayuda (se registra para mejorar la guía). */
export interface HelpQuestion {
  id: string;
  at: string;
  route: string;
  question: string;
  answered: boolean;
}

interface HelpState {
  welcomeSeen: boolean;
  /** Tour general terminado. */
  tourDone: boolean;
  /** Ayudas guiadas de módulos opcionales terminadas. */
  moduleToursDone: ModuleId[];
  questions: HelpQuestion[];
}

/** Ventana "cómo funciona" de un módulo opcional. */
export interface ModuleIntro {
  module: ModuleId;
  /** true cuando se abre porque el módulo se acaba de encender en Configuración. */
  justActivated: boolean;
}

interface PanelOptions {
  /** Video a mostrar en la pestaña Video. */
  video?: HelpVideoId;
  /** Tema del chat: sugiere las preguntas de ese módulo. */
  topic?: ModuleId | null;
}

interface HelpCtxValue {
  panelOpen: boolean;
  tab: HelpTab;
  video: HelpVideoId;
  chatTopic: ModuleId | null;
  openPanel: (tab?: HelpTab, opts?: PanelOptions) => void;
  closePanel: () => void;
  /** Tour en curso (general o de un módulo) y su paso, o null si no está corriendo. */
  tour: TourId;
  tourStep: number | null;
  startTour: (tour?: TourId) => void;
  setTourStep: (i: number) => void;
  /** Cierra el tour; solo se marca como visto si se terminó (botón "Terminar"). */
  endTour: (completed?: boolean) => void;
  isTourDone: (tour: TourId) => boolean;
  showWelcome: boolean;
  dismissWelcome: () => void;
  tourDone: boolean;
  moduleIntro: ModuleIntro | null;
  openModuleIntro: (module: ModuleId, justActivated?: boolean) => void;
  closeModuleIntro: () => void;
  questions: HelpQuestion[];
  logQuestion: (q: Omit<HelpQuestion, 'id' | 'at'>) => void;
  clearQuestions: () => void;
}

const STORAGE_KEY = 'talentia.help.v1';

const EMPTY: HelpState = { welcomeSeen: false, tourDone: false, moduleToursDone: [], questions: [] };

function load(): HelpState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const saved = { ...EMPTY, ...JSON.parse(raw) } as HelpState;
    return { ...saved, moduleToursDone: Array.isArray(saved.moduleToursDone) ? saved.moduleToursDone : [] };
  } catch {
    return EMPTY;
  }
}

const HelpContext = createContext<HelpCtxValue | null>(null);

export function HelpProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HelpState>(load);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState<HelpTab>('chat');
  const [video, setVideo] = useState<HelpVideoId>('tour');
  const [chatTopic, setChatTopic] = useState<ModuleId | null>(null);
  const [tour, setTour] = useState<TourId>('main');
  const [tourStep, setTourStepState] = useState<number | null>(null);
  const [moduleIntro, setModuleIntro] = useState<ModuleIntro | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* sin almacenamiento: la sesión sigue en memoria */
    }
  }, [state]);

  const openPanel = useCallback((t?: HelpTab, opts?: PanelOptions) => {
    if (t) setTab(t);
    if (opts?.video) setVideo(opts.video);
    // El tema del chat se fija al abrir desde la ayuda de un módulo y dura hasta cerrar el panel.
    if (opts && 'topic' in opts) setChatTopic(opts.topic ?? null);
    setPanelOpen(true);
  }, []);
  const closePanel = useCallback(() => {
    setPanelOpen(false);
    setChatTopic(null);
  }, []);

  // Acepta ser usado directo como onClick (recibe el evento): cualquier cosa que no sea un tour conocido = tour general.
  const startTour = useCallback((t?: TourId) => {
    setPanelOpen(false);
    setChatTopic(null);
    setModuleIntro(null);
    setState((s) => ({ ...s, welcomeSeen: true }));
    setTour(isTourId(t) ? t : 'main');
    setTourStepState(0);
  }, []);
  const endTour = useCallback((completed = false) => {
    setTourStepState(null);
    if (completed !== true) return; // salir con la X o Escape no cuenta como visto
    setState((s) =>
      tour === 'main'
        ? { ...s, tourDone: true }
        : s.moduleToursDone.includes(tour)
          ? s
          : { ...s, moduleToursDone: [...s.moduleToursDone, tour] },
    );
  }, [tour]);

  const openModuleIntro = useCallback((module: ModuleId, justActivated = false) => {
    setPanelOpen(false);
    setChatTopic(null);
    setModuleIntro({ module, justActivated });
  }, []);
  const closeModuleIntro = useCallback(() => setModuleIntro(null), []);

  const value = useMemo<HelpCtxValue>(
    () => ({
      panelOpen,
      tab,
      video,
      chatTopic,
      openPanel,
      closePanel,
      tour,
      tourStep,
      startTour,
      setTourStep: setTourStepState,
      endTour,
      isTourDone: (t) => (t === 'main' ? state.tourDone : state.moduleToursDone.includes(t)),
      showWelcome: !state.welcomeSeen && tourStep === null && moduleIntro === null,
      dismissWelcome: () => setState((s) => ({ ...s, welcomeSeen: true })),
      tourDone: state.tourDone,
      moduleIntro,
      openModuleIntro,
      closeModuleIntro,
      questions: state.questions,
      logQuestion: (q) =>
        setState((s) => ({
          ...s,
          questions: [{ id: `q_${Date.now().toString(36)}`, at: new Date().toISOString(), ...q }, ...s.questions].slice(0, 200),
        })),
      clearQuestions: () => setState((s) => ({ ...s, questions: [] })),
    }),
    [panelOpen, tab, video, chatTopic, openPanel, closePanel, tour, tourStep, startTour, endTour, moduleIntro, openModuleIntro, closeModuleIntro, state],
  );

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHelp() {
  const ctx = useContext(HelpContext);
  if (!ctx) throw new Error('useHelp debe usarse dentro de <HelpProvider>');
  return ctx;
}
