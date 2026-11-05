import React from 'react';
import {
  Archive,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { IconRenderer } from '../common/IconRenderer';

export const ArchiveView: React.FC = () => {
  const {
    notebooks,
    notes,
    unarchiveNotebook,
    unarchiveNote,
    setActiveNotebookId,
    setActiveNoteId,
    setActiveView,
  } = useVault();

  const archivedNotebooks = notebooks.filter(n => !n.isDeleted && n.isArchived);
  const archivedNotes = notes.filter(n => !n.isDeleted && n.isArchived);

  const totalArchived = archivedNotebooks.length + archivedNotes.length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0a0b10] text-slate-100 p-6 sm:p-10">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        <div className="pb-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Archive className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Archived Knowledge</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Archived notebooks and pages are hidden from primary navigation but safely retained and searchable.
          </p>
        </div>

        {totalArchived > 0 ? (
          <div className="space-y-6">
            {/* Archived Notebooks */}
            {archivedNotebooks.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Archived Notebooks ({archivedNotebooks.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {archivedNotebooks.map(nb => (
                    <div
                      key={nb.id}
                      className="p-4 bg-[#12141f] border border-white/10 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 truncate mr-2">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${nb.color}25`, color: nb.color }}
                        >
                          <IconRenderer name={nb.icon} className="w-5 h-5" />
                        </div>
                        <div className="truncate">
                          <h4 className="text-sm font-semibold text-white truncate">{nb.name}</h4>
                          <p className="text-xs text-slate-400 truncate">{nb.description || 'Archived'}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => unarchiveNotebook(nb.id)}
                        className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Unarchive</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Archived Notes */}
            {archivedNotes.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Archived Pages ({archivedNotes.length})
                </h3>
                <div className="space-y-2">
                  {archivedNotes.map(note => {
                    const nb = notebooks.find(n => n.id === note.notebookId);
                    return (
                      <div
                        key={note.id}
                        className="p-3.5 bg-[#12141f] border border-white/10 rounded-2xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 truncate mr-3">
                          <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <h4
                              onClick={() => {
                                setActiveNotebookId(note.notebookId);
                                setActiveNoteId(note.id);
                                setActiveView('notebook');
                              }}
                              className="text-sm font-semibold text-white hover:text-purple-300 cursor-pointer truncate"
                            >
                              {note.title || 'Untitled Page'}
                            </h4>
                            {nb && (
                              <p className="text-xs text-slate-400">Notebook: {nb.name}</p>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => unarchiveNote(note.id)}
                          className="px-3 py-1.5 bg-amber-500/15 hover:bg-amber-500/30 text-amber-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#12141f] border border-white/5 rounded-2xl p-8">
            <Archive className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No archived content</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              You can archive completed notebooks or reference notes from their settings menu to keep your active workspace uncluttered.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
