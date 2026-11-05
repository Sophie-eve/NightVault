import React, { useState } from 'react';
import {
  LayoutDashboard,
  BookOpen,
  Star,
  Calendar,
  Image as ImageIcon,
  Tag as TagIcon,
  Archive,
  Trash2,
  Settings,
  ChevronDown,
  ChevronRight,
  Plus,
  LogOut,
  Shield,
  HelpCircle,
  X,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { useAuth } from '../../context/AuthContext';
import { IconRenderer } from '../common/IconRenderer';
import { Modal } from '../common/Modal';
import { ColorPicker } from '../common/ColorPicker';
import { IconPicker } from '../common/IconPicker';
import { KeyboardShortcutsModal } from '../common/KeyboardShortcutsModal';
import type { ActiveView, Notebook, Note } from '../../types';

interface SidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const {
    activeView,
    setActiveView,
    notebooks,
    notes,
    activeNotebookId,
    setActiveNotebookId,
    setActiveNoteId,
    createNotebook,
  } = useVault();

  const { user, signOut, isSupabaseAuth } = useAuth();

  const [isNotebooksExpanded, setIsNotebooksExpanded] = useState(true);
  const [isFavoritesExpanded, setIsFavoritesExpanded] = useState(true);
  const [isNewNotebookOpen, setIsNewNotebookOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // New notebook modal state
  const [newNbName, setNewNbName] = useState('');
  const [newNbDesc, setNewNbDesc] = useState('');
  const [newNbIcon, setNewNbIcon] = useState('BookOpen');
  const [newNbColor, setNewNbColor] = useState('#8B5CF6');

  // Filter non-deleted notebooks
  const activeNotebooks = notebooks.filter(n => !n.isDeleted && !n.isArchived);
  const favoriteNotebooks = activeNotebooks.filter(n => n.isFavorite);
  const favoriteNotes = notes.filter(n => !n.isDeleted && !n.isArchived && n.isFavorite);
  const deletedCount = notebooks.filter(n => n.isDeleted).length + notes.filter(n => n.isDeleted).length;

  const handleNavClick = (view: ActiveView) => {
    setActiveView(view);
    onCloseMobile();
  };

  const handleNotebookSelect = (nb: Notebook) => {
    setActiveNotebookId(nb.id);
    const related = notes.filter(n => n.notebookId === nb.id && !n.isDeleted);
    if (related.length > 0) {
      setActiveNoteId(related[0].id);
    } else {
      setActiveNoteId(null);
    }
    setActiveView('notebook');
    onCloseMobile();
  };

  const handleNoteSelect = (note: Note) => {
    setActiveNotebookId(note.notebookId);
    setActiveNoteId(note.id);
    setActiveView('notebook');
    onCloseMobile();
  };

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNbName.trim()) return;

    const created = await createNotebook(newNbName.trim(), newNbIcon, newNbColor, newNbDesc.trim());
    setIsNewNotebookOpen(false);
    setNewNbName('');
    setNewNbDesc('');
    handleNotebookSelect(created);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 sm:w-72 bg-[#0c0d14] border-r border-white/10 flex flex-col justify-between transition-transform duration-300 ease-in-out select-none ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Header / Brand Logo */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-400 p-0.5 shadow-lg shadow-purple-900/30">
              <div className="w-full h-full bg-[#0c0d14] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold tracking-wider text-white">NIGHTVAULT</span>
                <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Personal Knowledge Core</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 lg:hidden cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu (Scrollable) */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Main Views */}
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => handleNavClick('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeView === 'dashboard'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-purple-400" />
              <span>Dashboard</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('journal')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeView === 'journal'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Calendar className="w-4 h-4 text-sky-400" />
              <span>Daily Journal</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('gallery')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeView === 'gallery'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>Image Gallery</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('tags')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeView === 'tags'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <TagIcon className="w-4 h-4 text-amber-400" />
              <span>Tags & Labels</span>
            </button>
          </div>

          {/* Favourites Collapsible */}
          {(favoriteNotebooks.length > 0 || favoriteNotes.length > 0) && (
            <div>
              <div
                onClick={() => setIsFavoritesExpanded(!isFavoritesExpanded)}
                className="flex items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500 cursor-pointer hover:text-slate-300"
              >
                <div className="flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                  <span>Favourites</span>
                </div>
                {isFavoritesExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>

              {isFavoritesExpanded && (
                <div className="mt-1 space-y-0.5">
                  {favoriteNotebooks.map(nb => (
                    <button
                      key={nb.id}
                      type="button"
                      onClick={() => handleNotebookSelect(nb)}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors cursor-pointer truncate"
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: nb.color }} />
                      <span className="truncate">{nb.name}</span>
                    </button>
                  ))}
                  {favoriteNotes.map(nt => (
                    <button
                      key={nt.id}
                      type="button"
                      onClick={() => handleNoteSelect(nt)}
                      className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer truncate"
                    >
                      <Star className="w-3 h-3 text-amber-400 shrink-0" />
                      <span className="truncate">{nt.title || 'Untitled'}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Notebooks (A-Z) Tree */}
          <div>
            <div className="flex items-center justify-between px-2 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <div
                onClick={() => setIsNotebooksExpanded(!isNotebooksExpanded)}
                className="flex items-center gap-1.5 cursor-pointer hover:text-slate-300"
              >
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Notebooks ({activeNotebooks.length})</span>
                {isNotebooksExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </div>

              <button
                type="button"
                onClick={() => setIsNewNotebookOpen(true)}
                className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors cursor-pointer"
                title="Create Notebook"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {isNotebooksExpanded && (
              <div className="mt-1 space-y-0.5">
                {activeNotebooks.map(nb => {
                  const isCurrent = activeView === 'notebook' && activeNotebookId === nb.id;
                  const count = notes.filter(n => n.notebookId === nb.id && !n.isDeleted).length;

                  return (
                    <button
                      key={nb.id}
                      type="button"
                      onClick={() => handleNotebookSelect(nb)}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate flex-1 mr-2">
                        <IconRenderer
                          name={nb.icon}
                          className="w-3.5 h-3.5 shrink-0"
                          style={{ color: nb.color }}
                        />
                        <span className="truncate">{nb.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* System & Utilities */}
          <div className="pt-2 border-t border-white/5 space-y-1">
            <button
              type="button"
              onClick={() => handleNavClick('archive')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeView === 'archive'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Archive className="w-4 h-4 text-amber-400" />
              <span>Archive</span>
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('recycle-bin')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeView === 'recycle-bin'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-rose-400" />
                <span>Recycle Bin</span>
              </div>
              {deletedCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-full bg-rose-500/20 text-rose-300">
                  {deletedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleNavClick('settings')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                activeView === 'settings'
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        {/* User Account / Footer */}
        <div className="p-3 border-t border-white/10 bg-[#0e1017]">
          <div className="flex items-center justify-between">
            <div
              onClick={() => handleNavClick('settings')}
              className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
            >
              <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/40 flex items-center justify-center text-xs font-bold text-purple-300 shrink-0">
                {(user?.displayName || 'V')[0].toUpperCase()}
              </div>
              <div className="truncate flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.displayName || 'Vault Keeper'}</p>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isSupabaseAuth ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span className="text-[10px] text-slate-400 truncate">
                    {isSupabaseAuth ? 'Cloud Synced' : 'Local Vault'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsShortcutsOpen(true)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="Keyboard Shortcuts (?)"
              >
                <HelpCircle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={signOut}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Log Out of Nightvault"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* New Notebook Modal */}
      {isNewNotebookOpen && (
        <Modal
          isOpen={isNewNotebookOpen}
          onClose={() => setIsNewNotebookOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <span>Create New Notebook</span>
            </div>
          }
          description="Create a dedicated notebook in your personal workspace."
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateNotebook} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Notebook Name *</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Distributed Systems, Personal Diary, College Physics"
                value={newNbName}
                onChange={(e) => setNewNbName(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Description (Optional)</label>
              <input
                type="text"
                placeholder="Brief purpose or summary..."
                value={newNbDesc}
                onChange={(e) => setNewNbDesc(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-2">Accent Colour</label>
              <ColorPicker selectedColor={newNbColor} onSelectColor={setNewNbColor} />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-2">Icon</label>
              <IconPicker selectedIcon={newNbIcon} onSelectIcon={setNewNbIcon} accentColor={newNbColor} />
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewNotebookOpen(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newNbName.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-purple-900/30 cursor-pointer"
              >
                Create Notebook
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Keyboard Shortcuts Modal */}
      {isShortcutsOpen && (
        <KeyboardShortcutsModal
          isOpen={isShortcutsOpen}
          onClose={() => setIsShortcutsOpen(false)}
        />
      )}
    </>
  );
};
