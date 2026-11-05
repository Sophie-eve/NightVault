import React, { useState } from 'react';
import {
  Tag as TagIcon,
  Plus,
  Trash2,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { ColorPicker } from '../common/ColorPicker';
import { Modal } from '../common/Modal';
import { ConfirmModal } from '../common/ConfirmModal';
import type { Tag, Note } from '../../types';

export const TagsManagerView: React.FC = () => {
  const {
    tags,
    notes,
    notebooks,
    createTag,
    deleteTag,
    setActiveNotebookId,
    setActiveNoteId,
    setActiveView,
  } = useVault();

  const [selectedTagId, setSelectedTagId] = useState<string>(tags[0]?.id || '');
  const [isNewTagModalOpen, setIsNewTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#8B5CF6');
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);

  const selectedTag = tags.find(t => t.id === selectedTagId) || tags[0] || null;

  // Notes that have this tag (excluding deleted)
  const taggedNotes: Note[] = selectedTag
    ? notes.filter(n => !n.isDeleted && !n.isArchived && (n.tagIds || []).includes(selectedTag.id))
    : [];

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;

    const created = await createTag(newTagName.trim(), newTagColor);
    setIsNewTagModalOpen(false);
    setNewTagName('');
    setSelectedTagId(created.id);
  };

  const handleOpenNote = (note: Note) => {
    setActiveNotebookId(note.notebookId);
    setActiveNoteId(note.id);
    setActiveView('notebook');
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[#0a0b10] text-slate-100">
      {/* Left Column: Tags List */}
      <div className="w-full md:w-80 border-r border-white/10 bg-[#0e1017] p-5 flex flex-col justify-between shrink-0 h-full">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-purple-400" />
              <h2 className="text-sm font-bold text-white tracking-tight uppercase">Tags ({tags.length})</h2>
            </div>
            <button
              type="button"
              onClick={() => setIsNewTagModalOpen(true)}
              className="p-1.5 bg-purple-600/20 text-purple-300 hover:bg-purple-600 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Create New Tag"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Tags buttons */}
          <div className="space-y-1 max-h-[75vh] overflow-y-auto pr-1">
            {tags.map(t => {
              const isSelected = selectedTag?.id === t.id;
              const count = notes.filter(n => !n.isDeleted && (n.tagIds || []).includes(t.id)).length;

              return (
                <div
                  key={t.id}
                  className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-600/20 text-white border border-purple-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                  onClick={() => setSelectedTagId(t.id)}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                    <span className="text-xs font-semibold truncate">{t.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-slate-500">{count}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setTagToDelete(t);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                      title="Delete Tag"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsNewTagModalOpen(true)}
          className="w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer mt-4"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom Tag</span>
        </button>
      </div>

      {/* Right Column: Tagged Notes View */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto p-6 sm:p-10">
        {selectedTag ? (
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="w-4 h-4 rounded-full" style={{ backgroundColor: selectedTag.color }} />
                <h1 className="text-2xl font-bold text-white tracking-tight">{selectedTag.name}</h1>
                <span className="text-xs text-slate-400">
                  ({taggedNotes.length} {taggedNotes.length === 1 ? 'note' : 'notes'})
                </span>
              </div>
            </div>

            {taggedNotes.length > 0 ? (
              <div className="space-y-3">
                {taggedNotes.map((note) => {
                  const nb = notebooks.find(n => n.id === note.notebookId);
                  const snippet = note.content || (note.contentHtml ? note.contentHtml.replace(/<[^>]*>/g, '') : '');

                  return (
                    <div
                      key={note.id}
                      onClick={() => handleOpenNote(note)}
                      className="p-4 bg-[#12141f] border border-white/10 hover:border-purple-500/40 rounded-2xl transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0 pr-4">
                        <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                              {note.title || 'Untitled Page'}
                            </h3>
                            {nb && (
                              <span
                                className="px-2 py-0.5 rounded text-[10px] font-medium"
                                style={{ backgroundColor: `${nb.color}20`, color: nb.color }}
                              >
                                {nb.name}
                              </span>
                            )}
                          </div>
                          {snippet && (
                            <p className="text-xs text-slate-400 line-clamp-1 mt-1">{snippet}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-slate-500 font-mono hidden sm:inline">
                          {new Date(note.updatedAt).toLocaleDateString()}
                        </span>
                        <ArrowRight className="w-4 h-4 text-purple-400 opacity-60 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 text-xs text-slate-500">
                No notes have been assigned the tag "{selectedTag.name}" yet. Open a note and click "+ Tag" to label it.
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 text-slate-500">No tag selected.</div>
        )}
      </div>

      {/* New Tag Modal */}
      {isNewTagModalOpen && (
        <Modal
          isOpen={isNewTagModalOpen}
          onClose={() => setIsNewTagModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <TagIcon className="w-5 h-5 text-purple-400" />
              <span>Create New Tag</span>
            </div>
          }
          description="Create a custom label to classify and filter notes across notebooks."
          maxWidth="max-w-md"
        >
          <form onSubmit={handleCreateTag} className="space-y-4">
            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-1">Tag Name</label>
              <input
                type="text"
                required
                autoFocus
                placeholder="e.g. Urgent, Thesis, Finance, Brainstorm"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-300 font-semibold block mb-2">Tag Colour</label>
              <ColorPicker selectedColor={newTagColor} onSelectColor={setNewTagColor} />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewTagModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newTagName.trim()}
                className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl shadow-md shadow-purple-900/30 cursor-pointer"
              >
                Create Tag
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Tag Confirmation */}
      {tagToDelete && (
        <ConfirmModal
          isOpen={Boolean(tagToDelete)}
          onClose={() => setTagToDelete(null)}
          onConfirm={() => {
            if (tagToDelete) deleteTag(tagToDelete.id);
          }}
          title="Delete Tag?"
          message={`Are you sure you want to delete the tag "${tagToDelete?.name}"? Notes with this tag will not be deleted.`}
          confirmText="Delete Tag"
          isDestructive={true}
        />
      )}
    </div>
  );
};
