import { Routes, Route, Navigate } from 'react-router-dom';
import { TenantProvider } from './context/TenantContext';
import { AppShell } from './components/layout/AppShell';
import DashboardPage from './features/dashboard/DashboardPage';
import JobsPage from './features/jobs/JobsPage';
import ScreeningPage from './features/screening/ScreeningPage';
import CandidatesPage from './features/candidates/CandidatesPage';
import InterviewsPage from './features/interviews/InterviewsPage';
import TalentPage from './features/talent/TalentPage';
import AdminPage from './features/admin/AdminPage';

export default function App() {
  return (
    <TenantProvider>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/vacantes" element={<JobsPage />} />
          <Route path="/screening" element={<ScreeningPage />} />
          <Route path="/candidatos" element={<CandidatesPage />} />
          <Route path="/entrevistas" element={<InterviewsPage />} />
          <Route path="/talento" element={<TalentPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </TenantProvider>
  );
}
