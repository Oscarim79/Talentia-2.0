import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ConfirmProvider } from './components/ui/ConfirmDialog';
import { Notices } from './components/Notices';
import { AuthGate } from './features/auth/AuthGate';
import { DataReadyGate } from './components/DataReadyGate';
import { TenantProvider } from './context/TenantContext';
import { JobsProvider } from './context/JobsContext';
import { SettingsProvider } from './context/SettingsContext';
import { OutreachProvider } from './context/OutreachContext';
import { CandidatesProvider } from './context/CandidatesContext';
import { EvaluationsProvider } from './context/EvaluationsContext';
import { TalentActionsProvider } from './context/TalentActionsContext';
import { ModuleGate } from './components/ModuleGate';
import { AppShell } from './components/layout/AppShell';
import DashboardPage from './features/dashboard/DashboardPage';
import JobsPage from './features/jobs/JobsPage';
import ScreeningPage from './features/screening/ScreeningPage';
import CandidatesPage from './features/candidates/CandidatesPage';
import InterviewsPage from './features/interviews/InterviewsPage';
import CvReplyPage from './features/outreach/CvReplyPage';
import CompetencyInterviewPage from './features/evaluation/CompetencyInterviewPage';
import SettingsPage from './features/settings/SettingsPage';
import PilotGuidePage from './features/help/PilotGuidePage';
import TalentPage from './features/talent/TalentPage';
import ActionsPage from './features/talent/ActionsPage';
import MetricsPage from './features/metrics/MetricsPage';
import AdminPage from './features/admin/AdminPage';

export default function App() {
  return (
    <ConfirmProvider>
    <Notices />
    <AuthProvider>
    <AuthGate>
    <TenantProvider>
      <SettingsProvider>
      <JobsProvider>
      <CandidatesProvider>
      <OutreachProvider>
      <EvaluationsProvider>
      <TalentActionsProvider>
      <DataReadyGate>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/vacantes" element={<JobsPage />} />
          <Route path="/screening" element={<ScreeningPage />} />
          <Route path="/candidatos" element={<CandidatesPage />} />
          <Route path="/respuestas" element={<CvReplyPage />} />
          <Route path="/competencias" element={<CompetencyInterviewPage />} />
          <Route
            path="/entrevistas"
            element={
              <ModuleGate module="interviewsAi">
                <InterviewsPage />
              </ModuleGate>
            }
          />
          <Route path="/talento" element={<TalentPage />} />
          <Route path="/acciones" element={<ActionsPage />} />
          <Route path="/metricas" element={<MetricsPage />} />
          <Route path="/configuracion" element={<SettingsPage />} />
          <Route path="/ronda-de-prueba" element={<PilotGuidePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </DataReadyGate>
      </TalentActionsProvider>
      </EvaluationsProvider>
      </OutreachProvider>
      </CandidatesProvider>
      </JobsProvider>
      </SettingsProvider>
    </TenantProvider>
    </AuthGate>
    </AuthProvider>
    </ConfirmProvider>
  );
}
