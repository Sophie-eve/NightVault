import React, { useState } from 'react';
import {
  BookOpen,
  FileText,
  Image as ImageIcon,
  Pin,
  Plus,
  Search,
  LayoutGrid,
  List as ListIcon,
  Clock,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { useAuth } from '../../context/AuthContext';
import { NotebookCard } from './NotebookCard';
import { Modal } from '../common/Modal';
import { ColorPicker } from '../common/ColorPicker';
import { IconPicker } from '../common/IconPicker';
import type { SortOption } from '../../types';

export const DashboardView: React.FC = () => {
  const {
    notebooks,
    notes,
    stats,
    sortOption,
    setSortOption,
    createNotebook,
    createNote,
    setActiveView,
    setActiveNotebookId,
    setActiveNoteId,
    setIsSearchOpen,
    setIsQuickCaptureOpen,
  } = useVault();

  const { user } = useAuth();

  const [layout, setLayout] = useState<'grid' | 'list'>('grid');
  const [isNewNotebookModalOpen, setIsNewNotebookModalOpen] = useState(false);
  const [newNbName, setNewNbName] = useState('');
  const [newNbDesc, setNewNbDesc] = useState('');
  const [newNbIcon, setNewNbIcon] = useState('BookOpen');
  const [newNbColor, setNewNbColor] = useState('#8B5CF6');

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // "Continue Where You Left Off" - 4 most recently modified active notes
  const recentNotes = notes
    .filter(n => !n.isDeleted && !n.isArchived)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  // Active notebooks (excluding deleted and archived)
  const activeNotebooks = notebooks.filter(n => !n.isDeleted && !n.isArchived);

  const handleOpenNotebook = (id: string) => {
    setActiveNotebookId(id);
    const related = notes.filter(n => n.notebookId === id && !n.isDeleted);
    if (related.length > 0) {
      setActiveNoteId(related[0].id);
    } else {
      setActiveNoteId(null);
    }
    setActiveView('notebook');
  };

  const handleOpenNote = (noteId: string, notebookId: string) => {
    setActiveNotebookId(notebookId);
    setActiveNoteId(noteId);
    setActiveView('notebook');
  };

  const handleCreateNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNbName.trim()) return;

    const created = await createNotebook(newNbName.trim(), newNbIcon, newNbColor, newNbDesc.trim());
    setIsNewNotebookModalOpen(false);
    setNewNbName('');
    setNewNbDesc('');
    handleOpenNotebook(created.id);
  };

  const handleQuickCreateNote = async () => {
    let targetNbId = activeNotebooks.length > 0 ? activeNotebooks[0].id : '';
    if (!targetNbId) {
      const createdNb = await createNotebook('General Notes');
      targetNbId = createdNb.id;
    }
    const newNote = await createNote(targetNbId, 'Untitled Page');
    handleOpenNote(newNote.id, targetNbId);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0a0b10] text-slate-100">
      {/* Top Banner / Welcome Section */}
      <div className="relative px-6 sm:px-10 pt-8 pb-6 border-b border-white/5 bg-gradient-to-b from-[#11131f] to-[#0a0b10]">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-purple-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{formattedDate}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight mt-1">
                {getGreeting()}, {user?.displayName || 'Vault Keeper'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Welcome back to your private knowledge vault. Everything is encrypted, synced, and organized.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsNewNotebookModalOpen(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-purple-900/30 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Notebook</span>
              </button>

              <button
                type="button"
                onClick={handleQuickCreateNote}
                className="px-4 py-2 bg-[#171926] hover:bg-[#1e2233] border border-white/10 text-slate-200 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileText className="w-4 h-4 text-purple-400" />
                <span>New Page</span>
              </button>

              <button
                type="button"
                onClick={() => setIsQuickCaptureOpen(true)}
                className="px-3.5 py-2 bg-[#171926] hover:bg-[#1e2233] border border-white/10 text-slate-300 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Quick Capture (+)"
              >
                <Plus className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Quick Capture</span>
              </button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-[#12141f] border border-white/10 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-white leading-none">{stats.totalNotebooks}</p>
                <p className="text-xs text-slate-400 mt-1">Notebooks</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#12141f] border border-white/10 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-white leading-none">{stats.totalNotes}</p>
                <p className="text-xs text-slate-400 mt-1">Total Pages</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#12141f] border border-white/10 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-white leading-none">{stats.totalImages}</p>
                <p className="text-xs text-slate-400 mt-1">Visual Media</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#12141f] border border-white/10 shadow-sm flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                <Pin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xl font-bold text-white leading-none">{stats.totalPinnedNotes}</p>
                <p className="text-xs text-slate-400 mt-1">Pinned Notes</p>
              </div>
            </div>
          </div>

          {/* Global Search Bar */}
          <div
            onClick={() => setIsSearchOpen(true)}
            className="w-full flex items-center justify-between p-3.5 bg-[#141624] hover:bg-[#181a2b] border border-white/10 rounded-2xl cursor-pointer transition-all shadow-inner group"
          >
            <div className="flex items-center gap-3 text-slate-400 group-hover:text-slate-300">
              <Search className="w-4 h-4 text-purple-400" />
              <span className="text-xs sm:text-sm">Search notebooks, pages, text, tags, or screenshots...</span>
            </div>
            <div className="flex items-center gap-1.5">
              <kbd className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-[#1f2233] border border-white/10 rounded-md text-slate-400">Ctrl</kbd>
              <kbd className="px-2 py-0.5 text-[11px] font-mono font-semibold bg-[#1f2233] border border-white/10 rounded-md text-slate-400">K</kbd>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto w-full p-6 sm:p-10 space-y-10 flex-1">
        {/* Continue Where You Left Off */}
        {recentNotes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-400" />
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Continue Where You Left Off
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentNotes.map((note) => {
                const nb = notebooks.find(n => n.id === note.notebookId);
                const snippet = note.content || (note.contentHtml ? note.contentHtml.replace(/<[^>]*>/g, '') : '');

                return (
                  <div
                    key={note.id}
                    onClick={() => handleOpenNote(note.id, note.notebookId)}
                    className="p-4 bg-[#12141f] border border-white/10 hover:border-purple-500/50 rounded-2xl transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-md"
                  >
                    <div>
                      {nb && (
                        <div
                          className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold mb-2"
                          style={{ backgroundColor: `${nb.color}20`, color: nb.color }}
                        >
                          {nb.name}
                        </div>
                      )}
                      <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                        {note.title || 'Untitled Page'}
                      </h4>
                      {snippet && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {snippet}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                      <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-purple-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Notebooks Section */}
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">All Notebooks</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically sorted alphabetically A–Z by default.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Sorting Picker */}
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="text-xs bg-[#141624] border border-white/10 rounded-xl px-3 py-1.5 text-slate-300 focus:outline-none focus:border-purple-500 cursor-pointer"
              >
                <option value="alphabetical-asc">Alphabetical A–Z (Default)</option>
                <option value="alphabetical-desc">Alphabetical Z–A</option>
                <option value="recently-modified">Recently Modified</option>
                <option value="date-created">Date Created</option>
                <option value="custom">Custom Order</option>
              </select>

              {/* View Layout Toggle */}
              <div className="flex items-center bg-[#141624] border border-white/10 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setLayout('grid')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    layout === 'grid' ? 'bg-purple-600/30 text-purple-300' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLayout('list')}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    layout === 'list' ? 'bg-purple-600/30 text-purple-300' : 'text-slate-400 hover:text-white'
                  }`}
                  title="List View"
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Notebooks Grid / List */}
          {activeNotebooks.length > 0 ? (
            <div
              className={
                layout === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5'
                  : 'space-y-3'
              }
            >
              {activeNotebooks.map((nb) => (
                <NotebookCard
                  key={nb.id}
                  notebook={nb}
                  layout={layout}
                  onOpen={() => handleOpenNotebook(nb.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#12141f] border border-white/5 rounded-2xl p-8">
              <BookOpen className="w-10 h-10 text-purple-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-semibold text-white">No active notebooks</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Create a notebook to organize your research, knowledge, and notes.
              </p>
              <button
                type="button"
                onClick={() => setIsNewNotebookModalOpen(true)}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                Create Notebook
              </button>
            </div>
          )}
        </div>
      </div>

      {/* New Notebook Modal */}
      {isNewNotebookModalOpen && (
        <Modal
          isOpen={isNewNotebookModalOpen}
          onClose={() => setIsNewNotebookModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <span>Create New Notebook</span>
            </div>
          }
          description="Give your new notebook a unique name, icon, and accent color."
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
                onClick={() => setIsNewNotebookModalOpen(false)}
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
    </div>
  );
};
