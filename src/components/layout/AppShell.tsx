import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { HelpProvider } from '../../features/help/HelpContext';
import { HelpLauncher } from '../../features/help/HelpLauncher';
import { Tour } from '../../features/help/Tour';
import { WelcomeModal } from '../../features/help/WelcomeModal';

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <HelpProvider>
    <div className="flex h-screen overflow-hidden bg-canvas">
      {/* Sidebar fija en escritorio */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Drawer móvil */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="absolute inset-0 bg-brand-950/60 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative z-10 h-full">
            <Sidebar onClose={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar onMenuClick={() => setMenuOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
      <HelpLauncher />
      <Tour />
      <WelcomeModal />
    </div>
    </HelpProvider>
  );
}
