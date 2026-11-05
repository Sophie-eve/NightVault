import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Pin,
  Star,
  Settings,
  ChevronLeft,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { IconRenderer } from '../common/IconRenderer';
import { TipTapEditor } from '../editor/TipTapEditor';
import { NotebookSettingsModal } from './NotebookSettingsModal';
import type { Note } from '../../types';

export const NotebookWorkspace: React.FC = () => {
  const {
    activeNotebook,
    notes,
    activeNoteId,
    setActiveNoteId,
    createNote,
    setActiveView,
    isFocusMode,
  } = useVault();

  const [pageSearch, setPageSearch] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPagesSidebarOpen, setIsPagesSidebarOpen] = useState(true);

  // Filter notes belonging to this notebook (excluding deleted/archived)
  const notebookNotes = useMemo(() => {
    if (!activeNotebook) return [];
    let list = notes.filter(n => n.notebookId === activeNotebook.id && !n.isDeleted && !n.isArchived);

    if (pageSearch.trim()) {
      const q = pageSearch.toLowerCase();
      list = list.filter(n =>
        n.title.toLowerCase().includes(q) ||
        (n.content && n.content.toLowerCase().includes(q))
      );
    }

    // Sort: Pinned notes first, then recently modified
    return list.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, activeNotebook, pageSearch]);

  // Ensure an active note is selected
  React.useEffect(() => {
    if (notebookNotes.length > 0 && !activeNoteId) {
      setActiveNoteId(notebookNotes[0].id);
    }
  }, [notebookNotes, activeNoteId, setActiveNoteId]);

  if (!activeNotebook) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#0a0b10]">
        <p className="text-slate-400">No notebook selected.</p>
        <button
          type="button"
          onClick={() => setActiveView('dashboard')}
          className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const activeNote = notes.find(n => n.id === activeNoteId && !n.isDeleted) || (notebookNotes.length > 0 ? notebookNotes[0] : null);

  const handleCreateNewPage = async () => {
    const newNote = await createNote(activeNotebook.id, 'Untitled Page');
    setActiveNoteId(newNote.id);
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#0a0b10]">
      {/* Notebook Pages Left Column (Collapsible) */}
      {!isFocusMode && isPagesSidebarOpen && (
        <div className="w-72 sm:w-80 flex flex-col border-r border-white/10 bg-[#0e1018] shrink-0 h-full">
          {/* Notebook Title & Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setActiveView('dashboard')}
                title="Back to Dashboard"
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md"
                style={{ backgroundColor: `${activeNotebook.color}25`, color: activeNotebook.color }}
              >
                <IconRenderer name={activeNotebook.icon} className="w-4 h-4" />
              </div>

              <div className="truncate">
                <h2 className="text-sm font-bold text-white truncate" title={activeNotebook.name}>
                  {activeNotebook.name}
                </h2>
                <p className="text-[11px] text-slate-400">
                  {notebookNotes.length} {notebookNotes.length === 1 ? 'page' : 'pages'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                title="Notebook Settings"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsPagesSidebarOpen(false)}
                title="Hide Pages Sidebar"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer sm:hidden"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search inside notebook & New Page Action */}
          <div className="p-3 border-b border-white/5 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search pages in notebook..."
                value={pageSearch}
                onChange={(e) => setPageSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#141624] border border-white/10 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
              />
            </div>

            <button
              type="button"
              onClick={handleCreateNewPage}
              className="w-full py-1.5 px-3 bg-purple-600/15 hover:bg-purple-600/25 border border-purple-500/30 text-purple-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Page</span>
            </button>
          </div>

          {/* Pages List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {notebookNotes.length > 0 ? (
              notebookNotes.map((note: Note) => {
                const isSelected = activeNote?.id === note.id;
                // Strip HTML for plain preview snippet
                const snippet = note.content || (note.contentHtml ? note.contentHtml.replace(/<[^>]*>/g, '') : '');

                return (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => setActiveNoteId(note.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer flex flex-col gap-1 border ${
                      isSelected
                        ? 'bg-[#181a29] border-purple-500/40 text-white shadow-md'
                        : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        {note.isPinned && (
                          <Pin className="w-3 h-3 text-amber-400 shrink-0" />
                        )}
                        <span className="text-xs font-semibold truncate">
                          {note.title || 'Untitled Page'}
                        </span>
                      </div>
                      {note.isFavorite && (
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                      )}
                    </div>

                    {snippet && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-tight">
                        {snippet}
                      </p>
                    )}

                    <span className="text-[10px] text-slate-500 pt-1">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                {pageSearch ? `No pages found for "${pageSearch}"` : 'No pages in this notebook yet.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pages Sidebar Toggle Button when closed */}
      {!isFocusMode && !isPagesSidebarOpen && (
        <div className="p-2 border-r border-white/10 bg-[#0e1018] flex flex-col items-center">
          <button
            type="button"
            onClick={() => setIsPagesSidebarOpen(true)}
            title="Show Pages Sidebar"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 cursor-pointer"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Rich Text Editor Pane */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {activeNote ? (
          <TipTapEditor note={activeNote} notebook={activeNotebook} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white">This notebook has no pages</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-1">
              Create your first page to start recording your thoughts, notes, and research.
            </p>
            <button
              type="button"
              onClick={handleCreateNewPage}
              className="mt-5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create First Page</span>
            </button>
          </div>
        )}
      </div>

      {/* Notebook Settings Modal */}
      {isSettingsOpen && (
        <NotebookSettingsModal
          notebook={activeNotebook}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </div>
  );
};
