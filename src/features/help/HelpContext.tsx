import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { GuideId } from '../../core/modules';
import { deleteQuestions, insertQuestion, listQuestions, type HelpQuestion } from '../../core/db/helpQuestions';
import { useTenant } from '../../context/TenantContext';
import { useTenantData } from '../../context/useTenantData';
import { notifyError } from '../../lib/notify';
import { isTourId, type HelpVideoId, type TourId } from './tourSteps';

export type HelpTab = 'chat' | 'guide' | 'video';

export type { HelpQuestion } from '../../core/db/helpQuestions';

interface HelpState {
  welcomeSeen: boolean;
  /** Tour general terminado. */
  tourDone: boolean;
  /** Recorridos terminados de módulos opcionales y secciones (Talento, Gestión). */
  moduleToursDone: Exclude<TourId, 'main'>[];
}

/** Ventana "cómo funciona" de un módulo opcional o de una sección (Talento, Gestión). */
export interface ModuleIntro {
  module: GuideId;
  /** true cuando se abre porque el módulo se acaba de encender en Configuración. */
  justActivated: boolean;
}

interface PanelOptions {
  /** Video a mostrar en la pestaña Video. */
  video?: HelpVideoId;
  /** Tema del chat: sugiere las preguntas de ese módulo o sección. */
  topic?: GuideId | null;
}

interface HelpCtxValue {
  panelOpen: boolean;
  tab: HelpTab;
  video: HelpVideoId;
  chatTopic: GuideId | null;
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
  openModuleIntro: (module: GuideId, justActivated?: boolean) => void;
  closeModuleIntro: () => void;
  questions: HelpQuestion[];
  logQuestion: (q: Omit<HelpQuestion, 'id' | 'at'>) => void;
  clearQuestions: () => void;
}

const STORAGE_KEY = 'talentia.help.v1';

const EMPTY: HelpState = { welcomeSeen: false, tourDone: false, moduleToursDone: [] };
const NO_QUESTIONS: HelpQuestion[] = [];
const SAVE_ERROR = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.';
const MAX_QUESTIONS = 200;

function load(): HelpState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    // Un estado antiguo puede traer `questions`: se ignora (ahora viven en la base de datos).
    const saved = JSON.parse(raw) as Partial<HelpState>;
    return {
      welcomeSeen: saved.welcomeSeen === true,
      tourDone: saved.tourDone === true,
      moduleToursDone: Array.isArray(saved.moduleToursDone) ? saved.moduleToursDone : [],
    };
  } catch {
    return EMPTY;
  }
}

const HelpContext = createContext<HelpCtxValue | null>(null);

export function HelpProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HelpState>(load);
  const { tenant, member } = useTenant();
  const { data: questions, setData: setQuestions, reload: reloadQuestions } = useTenantData(listQuestions, NO_QUESTIONS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState<HelpTab>('chat');
  const [video, setVideo] = useState<HelpVideoId>('tour');
  const [chatTopic, setChatTopic] = useState<GuideId | null>(null);
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

  const openModuleIntro = useCallback((module: GuideId, justActivated = false) => {
    setPanelOpen(false);
    setChatTopic(null);
    setModuleIntro({ module, justActivated });
  }, []);
  const closeModuleIntro = useCallback(() => setModuleIntro(null), []);

  const logQuestion = useCallback(
    (q: Omit<HelpQuestion, 'id' | 'at'>) => {
      const tmpId = `tmp_${Date.now().toString(36)}`;
      const temp: HelpQuestion = { id: tmpId, at: new Date().toISOString(), ...q };
      setQuestions((prev) => [temp, ...prev].slice(0, MAX_QUESTIONS));
      insertQuestion(tenant.id, member.id, q)
        .then((saved) => setQuestions((prev) => prev.map((x) => (x.id === tmpId ? saved : x))))
        .catch(() => {
          setQuestions((prev) => prev.filter((x) => x.id !== tmpId));
          notifyError(SAVE_ERROR);
        });
    },
    [tenant.id, member.id, setQuestions],
  );
  const clearQuestions = useCallback(() => {
    setQuestions([]);
    deleteQuestions(tenant.id).catch(() => {
      reloadQuestions();
      notifyError(SAVE_ERROR);
    });
  }, [tenant.id, setQuestions, reloadQuestions]);

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
      questions,
      logQuestion,
      clearQuestions,
    }),
    [panelOpen, tab, video, chatTopic, openPanel, closePanel, tour, tourStep, startTour, endTour, moduleIntro, openModuleIntro, closeModuleIntro, state, questions, logQuestion, clearQuestions],
  );

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHelp() {
  const ctx = useContext(HelpContext);
  if (!ctx) throw new Error('useHelp debe usarse dentro de <HelpProvider>');
  return ctx;
}
