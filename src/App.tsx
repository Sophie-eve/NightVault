import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VaultProvider, useVault } from './context/VaultContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardView } from './components/dashboard/DashboardView';
import { NotebookWorkspace } from './components/notebook/NotebookWorkspace';
import { GalleryView } from './components/gallery/GalleryView';
import { DailyJournalView } from './components/journal/DailyJournalView';
import { TagsManagerView } from './components/tags/TagsManagerView';
import { ArchiveView } from './components/archive/ArchiveView';
import { RecycleBinView } from './components/recycle/RecycleBinView';
import { SettingsView } from './components/settings/SettingsView';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';
import { QuickCaptureModal } from './components/layout/QuickCaptureModal';
import { AuthModal } from './components/auth/AuthModal';
import { Shield, Plus } from 'lucide-react';

const VaultAppContent: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const {
    activeView,
    isFocusMode,
    setIsFocusMode,
    isSearchOpen,
    setIsSearchOpen,
    isQuickCaptureOpen,
    setIsQuickCaptureOpen,
    createNote,
    createNotebook,
    triggerManualSync,
    activeNotebookId,
    notebooks,
    setActiveNotebookId,
    setActiveNoteId,
    setActiveView,
  } = useVault();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Global Keyboard Shortcuts handler
  useEffect(() => {
    const handleGlobalShortcuts = async (e: KeyboardEvent) => {
      // Ignore if user is actively typing in a standard input or textarea (unless Ctrl is pressed)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Ctrl + K: Global Search
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
        return;
      }

      // Ctrl + Q: Quick Capture
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
        e.preventDefault();
        setIsQuickCaptureOpen(true);
        return;
      }

      // Ctrl + S: Force Sync
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        await triggerManualSync();
        return;
      }

      // Ctrl + Shift + N: New Notebook
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        const nbName = window.prompt('Enter new notebook name:');
        if (nbName?.trim()) {
          const nb = await createNotebook(nbName.trim());
          setActiveNotebookId(nb.id);
          setActiveView('notebook');
        }
        return;
      }

      // Ctrl + N: New Note / Page
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'n' && !isInput) {
        e.preventDefault();
        let targetNb = activeNotebookId || (notebooks.length > 0 ? notebooks[0].id : '');
        if (!targetNb) {
          const created = await createNotebook('General Notes');
          targetNb = created.id;
        }
        const note = await createNote(targetNb, 'Untitled Page');
        setActiveNotebookId(targetNb);
        setActiveNoteId(note.id);
        setActiveView('notebook');
        return;
      }

      // Escape: Exit Focus Mode
      if (e.key === 'Escape' && isFocusMode) {
        setIsFocusMode(false);
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [
    isFocusMode,
    activeNotebookId,
    notebooks,
    setIsFocusMode,
    setIsSearchOpen,
    setIsQuickCaptureOpen,
    createNote,
    createNotebook,
    triggerManualSync,
    setActiveNotebookId,
    setActiveNoteId,
    setActiveView,
  ]);

  // Loading spinner during session restoration
  if (authLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#0a0b10] text-slate-100">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-400 p-0.5 shadow-2xl shadow-purple-900/40 animate-pulse">
          <div className="w-full h-full bg-[#0a0b10] rounded-[14px] flex items-center justify-center">
            <Shield className="w-7 h-7 text-purple-400" />
          </div>
        </div>
        <h2 className="text-sm font-semibold tracking-wider text-slate-300 mt-4 uppercase">
          Restoring Nightvault Session...
        </h2>
      </div>
    );
  }

  // If not logged in, show Auth modal
  if (!user) {
    return <AuthModal />;
  }

  // Render view by activeView
  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView />;
      case 'notebook':
        return <NotebookWorkspace />;
      case 'journal':
        return <DailyJournalView />;
      case 'gallery':
        return <GalleryView />;
      case 'tags':
        return <TagsManagerView />;
      case 'archive':
        return <ArchiveView />;
      case 'recycle-bin':
        return <RecycleBinView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0a0b10] text-slate-100">
      {/* Sidebar (collapsible / hidden in Focus Mode) */}
      {!isFocusMode && (
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top Header */}
        <Header onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)} />

        {/* View Content */}
        <main className="flex-1 overflow-hidden flex flex-col min-h-0 relative">
          {renderActiveView()}

          {/* Floating Action Button (FAB) for Quick Capture */}
          {!isFocusMode && (
            <button
              type="button"
              onClick={() => setIsQuickCaptureOpen(true)}
              className="fixed bottom-6 right-6 z-30 w-12 h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-950/50 flex items-center justify-center transition-all duration-200 transform hover:scale-110 cursor-pointer group"
              title="Quick Capture (Ctrl+Q)"
            >
              <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          )}
        </main>
      </div>

      {/* Global Modals */}
      {isSearchOpen && (
        <GlobalSearchModal
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />
      )}

      {isQuickCaptureOpen && (
        <QuickCaptureModal
          isOpen={isQuickCaptureOpen}
          onClose={() => setIsQuickCaptureOpen(false)}
        />
      )}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <VaultProvider>
        <VaultAppContent />
      </VaultProvider>
    </AuthProvider>
  );
};

export default App;
