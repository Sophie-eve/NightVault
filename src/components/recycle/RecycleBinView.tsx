import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  FileText,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { ConfirmModal } from '../common/ConfirmModal';
import { IconRenderer } from '../common/IconRenderer';

type BinTab = 'all' | 'notebooks' | 'notes' | 'images';

export const RecycleBinView: React.FC = () => {
  const {
    notebooks,
    notes,
    images,
    restoreNotebook,
    permanentlyDeleteNotebook,
    restoreNote,
    permanentlyDeleteNote,
    restoreImage,
    permanentlyDeleteImage,
    emptyRecycleBin,
  } = useVault();

  const [activeTab, setActiveTab] = useState<BinTab>('all');
  const [isEmptyBinModalOpen, setIsEmptyBinModalOpen] = useState(false);

  const deletedNotebooks = notebooks.filter(n => n.isDeleted);
  const deletedNotes = notes.filter(n => n.isDeleted);
  const deletedImages = images.filter(i => i.isDeleted);

  const totalDeletedCount = deletedNotebooks.length + deletedNotes.length + deletedImages.length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0a0b10] text-slate-100 p-6 sm:p-10">
      <div className="max-w-5xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Trash2 className="w-6 h-6 text-rose-400" />
              <h1 className="text-2xl font-bold text-white tracking-tight">Recycle Bin</h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Items in the Recycle Bin can be restored at any time or permanently deleted to free storage.
            </p>
          </div>

          {totalDeletedCount > 0 && (
            <button
              type="button"
              onClick={() => setIsEmptyBinModalOpen(true)}
              className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer self-start sm:self-auto"
            >
              <Trash2 className="w-4 h-4" />
              <span>Empty Recycle Bin ({totalDeletedCount})</span>
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 select-none border-b border-white/5 pb-2">
          {(
            [
              { id: 'all', label: `All (${totalDeletedCount})` },
              { id: 'notebooks', label: `Notebooks (${deletedNotebooks.length})` },
              { id: 'notes', label: `Notes (${deletedNotes.length})` },
              { id: 'images', label: `Images (${deletedImages.length})` },
            ] as const
          ).map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-purple-600/25 text-purple-300 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Deleted Content */}
        {totalDeletedCount > 0 ? (
          <div className="space-y-4">
            {/* Deleted Notebooks */}
            {(activeTab === 'all' || activeTab === 'notebooks') && deletedNotebooks.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Notebooks</h3>
                <div className="space-y-2">
                  {deletedNotebooks.map(nb => (
                    <div
                      key={nb.id}
                      className="p-3.5 bg-[#12141f] border border-white/10 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                          style={{ backgroundColor: `${nb.color}25`, color: nb.color }}
                        >
                          <IconRenderer name={nb.icon} className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-white">{nb.name}</h4>
                          <p className="text-xs text-slate-500">Deleted: {nb.deletedAt ? new Date(nb.deletedAt).toLocaleDateString() : 'Recently'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => restoreNotebook(nb.id)}
                          className="px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => permanentlyDeleteNotebook(nb.id)}
                          className="px-3 py-1.5 bg-rose-600/15 hover:bg-rose-600/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Forever</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Deleted Notes */}
            {(activeTab === 'all' || activeTab === 'notes') && deletedNotes.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pages & Notes</h3>
                <div className="space-y-2">
                  {deletedNotes.map(note => {
                    const nb = notebooks.find(n => n.id === note.notebookId);
                    return (
                      <div
                        key={note.id}
                        className="p-3.5 bg-[#12141f] border border-white/10 rounded-2xl flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-semibold text-white">{note.title || 'Untitled Page'}</h4>
                              {nb && (
                                <span className="text-[10px] text-purple-400 font-medium">({nb.name})</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">Deleted: {note.deletedAt ? new Date(note.deletedAt).toLocaleDateString() : 'Recently'}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => restoreNote(note.id)}
                            className="px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => permanentlyDeleteNote(note.id)}
                            className="px-3 py-1.5 bg-rose-600/15 hover:bg-rose-600/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Forever</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deleted Images */}
            {(activeTab === 'all' || activeTab === 'images') && deletedImages.length > 0 && (
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Images & Screenshots</h3>
                <div className="space-y-2">
                  {deletedImages.map(img => (
                    <div
                      key={img.id}
                      className="p-3.5 bg-[#12141f] border border-white/10 rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={img.fileUrl}
                          alt={img.filename}
                          className="w-10 h-10 rounded-xl object-cover border border-white/10"
                        />
                        <div>
                          <h4 className="text-sm font-semibold text-white">{img.filename}</h4>
                          <p className="text-xs text-slate-500">Deleted: {img.deletedAt ? new Date(img.deletedAt).toLocaleDateString() : 'Recently'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => restoreImage(img.id)}
                          className="px-3 py-1.5 bg-emerald-600/15 hover:bg-emerald-600/30 text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Restore</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => permanentlyDeleteImage(img.id)}
                          className="px-3 py-1.5 bg-rose-600/15 hover:bg-rose-600/30 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Forever</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-24 bg-[#12141f] border border-white/5 rounded-2xl">
            <Trash2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">Recycle Bin is empty</h3>
            <p className="text-xs text-slate-400 mt-1">
              When you delete notebooks, pages, or screenshots, they will appear here.
            </p>
          </div>
        )}
      </div>

      {/* Empty Recycle Bin Confirmation Modal */}
      {isEmptyBinModalOpen && (
        <ConfirmModal
          isOpen={isEmptyBinModalOpen}
          onClose={() => setIsEmptyBinModalOpen(false)}
          onConfirm={async () => {
            await emptyRecycleBin();
            setIsEmptyBinModalOpen(false);
          }}
          title="Permanently Empty Recycle Bin?"
          message={`This will permanently remove all ${totalDeletedCount} items from disk and cloud storage. This action cannot be reversed.`}
          confirmText="Empty Bin Forever"
          isDestructive={true}
        />
      )}
    </div>
  );
};
