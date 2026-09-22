import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type HelpTab = 'chat' | 'guide' | 'video';

interface HelpState {
  welcomeSeen: boolean;
  tourDone: boolean;
}

interface HelpCtxValue {
  panelOpen: boolean;
  tab: HelpTab;
  openPanel: (tab?: HelpTab) => void;
  closePanel: () => void;
  /** Índice del paso del tour en curso, o null si no está corriendo. */
  tourStep: number | null;
  startTour: () => void;
  setTourStep: (i: number) => void;
  endTour: () => void;
  showWelcome: boolean;
  dismissWelcome: () => void;
  tourDone: boolean;
}

const STORAGE_KEY = 'talentia.help.v1';

function load(): HelpState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { welcomeSeen: false, tourDone: false, ...JSON.parse(raw) } : { welcomeSeen: false, tourDone: false };
  } catch {
    return { welcomeSeen: false, tourDone: false };
  }
}

const HelpContext = createContext<HelpCtxValue | null>(null);

export function HelpProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HelpState>(load);
  const [panelOpen, setPanelOpen] = useState(false);
  const [tab, setTab] = useState<HelpTab>('chat');
  const [tourStep, setTourStepState] = useState<number | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* sin almacenamiento: la sesión sigue en memoria */
    }
  }, [state]);

  const openPanel = useCallback((t?: HelpTab) => {
    if (t) setTab(t);
    setPanelOpen(true);
  }, []);
  const closePanel = useCallback(() => setPanelOpen(false), []);

  const startTour = useCallback(() => {
    setPanelOpen(false);
    setState((s) => ({ ...s, welcomeSeen: true }));
    setTourStepState(0);
  }, []);
  const endTour = useCallback(() => {
    setTourStepState(null);
    setState((s) => ({ ...s, tourDone: true }));
  }, []);

  const value = useMemo<HelpCtxValue>(
    () => ({
      panelOpen,
      tab,
      openPanel,
      closePanel,
      tourStep,
      startTour,
      setTourStep: setTourStepState,
      endTour,
      showWelcome: !state.welcomeSeen && tourStep === null,
      dismissWelcome: () => setState((s) => ({ ...s, welcomeSeen: true })),
      tourDone: state.tourDone,
    }),
    [panelOpen, tab, openPanel, closePanel, tourStep, startTour, endTour, state],
  );

  return <HelpContext.Provider value={value}>{children}</HelpContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useHelp() {
  const ctx = useContext(HelpContext);
  if (!ctx) throw new Error('useHelp debe usarse dentro de <HelpProvider>');
  return ctx;
}
