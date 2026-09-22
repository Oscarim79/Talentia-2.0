import { Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider } from './context/TenantContext';
import { JobsProvider } from './context/JobsContext';
import { SettingsProvider } from './context/SettingsContext';
import { OutreachProvider } from './context/OutreachContext';
import { ModuleGate } from './components/ModuleGate';
import { AppShell } from './components/layout/AppShell';
import DashboardPage from './features/dashboard/DashboardPage';
import JobsPage from './features/jobs/JobsPage';
import ScreeningPage from './features/screening/ScreeningPage';
import CandidatesPage from './features/candidates/CandidatesPage';
import InterviewsPage from './features/interviews/InterviewsPage';
import CvReplyPage from './features/outreach/CvReplyPage';
import SettingsPage from './features/settings/SettingsPage';
import TalentPage from './features/talent/TalentPage';
import ActionsPage from './features/talent/ActionsPage';
import MetricsPage from './features/metrics/MetricsPage';
import AdminPage from './features/admin/AdminPage';

export default function App() {
  return (
    <TenantProvider>
      <SettingsProvider>
      <JobsProvider>
      <OutreachProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/vacantes" element={<JobsPage />} />
          <Route path="/screening" element={<ScreeningPage />} />
          <Route path="/candidatos" element={<CandidatesPage />} />
          <Route path="/respuestas" element={<CvReplyPage />} />
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
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      </OutreachProvider>
      </JobsProvider>
      </SettingsProvider>
    </TenantProvider>
  );
}
