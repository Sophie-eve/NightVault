import React from 'react';
import {
  Search,
  Plus,
  Maximize2,
  Minimize2,
  Menu,
  CloudCheck,
  CloudOff,
  RefreshCw,
  AlertCircle,
  Command,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';

interface HeaderProps {
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileSidebar }) => {
  const {
    activeView,
    activeNotebook,
    activeNote,
    syncStatus,
    lastSavedAt,
    triggerManualSync,
    isFocusMode,
    setIsFocusMode,
    setIsSearchOpen,
    setIsQuickCaptureOpen,
  } = useVault();

  // Render view title / breadcrumb
  const renderBreadcrumb = () => {
    if (activeView === 'notebook' && activeNotebook) {
      return (
        <div className="flex items-center gap-2 text-xs sm:text-sm truncate">
          <span
            className="px-2 py-0.5 rounded-md font-medium text-xs"
            style={{ backgroundColor: `${activeNotebook.color}25`, color: activeNotebook.color }}
          >
            {activeNotebook.name}
          </span>
          {activeNote && (
            <>
              <span className="text-slate-500">/</span>
              <span className="text-slate-300 font-medium truncate max-w-44 sm:max-w-xs">{activeNote.title}</span>
            </>
          )}
        </div>
      );
    }

    const titles: Record<string, string> = {
      dashboard: 'Dashboard',
      journal: 'Daily Journal',
      gallery: 'Screenshots & Media Gallery',
      tags: 'Tags & Organisation',
      archive: 'Archived Notebooks & Notes',
      'recycle-bin': 'Recycle Bin',
      settings: 'Settings & Security',
    };

    return (
      <span className="text-sm font-semibold text-white tracking-tight">
        {titles[activeView] || 'Nightvault'}
      </span>
    );
  };

  const renderSyncBadge = () => {
    switch (syncStatus) {
      case 'saving':
        return (
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 px-2.5 py-1 rounded-xl border border-amber-400/20 transition-colors"
            title="Saving changes..."
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span className="hidden sm:inline">Saving...</span>
          </button>
        );
      case 'offline':
        return (
          <button
            type="button"
            onClick={triggerManualSync}
            className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-400/10 hover:bg-slate-400/20 px-2.5 py-1 rounded-xl border border-slate-400/20 transition-colors cursor-pointer"
            title="Offline - changes stored in encrypted local vault. Click to retry sync."
          >
            <CloudOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline (Saved)</span>
          </button>
        );
      case 'error':
        return (
          <button
            type="button"
            onClick={triggerManualSync}
            className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-400/10 hover:bg-rose-400/20 px-2.5 py-1 rounded-xl border border-rose-400/20 transition-colors cursor-pointer"
            title="Sync error. Click to retry."
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sync error (Retry)</span>
          </button>
        );
      case 'saved':
      default:
        return (
          <button
            type="button"
            onClick={triggerManualSync}
            className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 hover:bg-emerald-400/20 px-2.5 py-1 rounded-xl border border-emerald-400/20 transition-colors cursor-pointer"
            title={`Synced ${lastSavedAt ? `at ${lastSavedAt.toLocaleTimeString()}` : ''}. Click to force sync.`}
          >
            <CloudCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Saved</span>
          </button>
        );
    }
  };

  return (
    <header className="h-14 px-4 sm:px-6 bg-[#0e1017]/95 backdrop-blur-md border-b border-white/10 flex items-center justify-between shrink-0 z-30 select-none">
      {/* Left: Mobile hamburger & Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors lg:hidden cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="truncate">{renderBreadcrumb()}</div>
      </div>

      {/* Right: Search, Sync status, Quick Capture, Focus mode */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Global Search Button */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#141624] hover:bg-[#1a1c2d] border border-white/10 text-slate-400 hover:text-slate-200 rounded-xl text-xs transition-colors cursor-pointer"
          title="Search Vault (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">Search...</span>
          <span className="hidden md:flex items-center gap-0.5 text-[10px] text-slate-500 font-mono">
            <Command className="w-3 h-3" />K
          </span>
        </button>

        {/* Sync Status Badge */}
        {renderSyncBadge()}

        {/* Quick Capture Button */}
        <button
          type="button"
          onClick={() => setIsQuickCaptureOpen(true)}
          className="p-2 sm:px-3 sm:py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md shadow-purple-900/30 cursor-pointer"
          title="Quick Capture (+)"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Capture</span>
        </button>

        {/* Focus Mode Toggle */}
        <button
          type="button"
          onClick={() => setIsFocusMode(!isFocusMode)}
          className={`p-2 rounded-xl transition-colors cursor-pointer ${
            isFocusMode
              ? 'bg-purple-600/30 text-purple-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title={isFocusMode ? 'Exit Focus Mode (Esc)' : 'Distraction-free Focus Mode'}
        >
          {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
