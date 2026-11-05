import React, { useState } from 'react';
import {
  FileText,
  BookOpen,
  Image as ImageIcon,
  Link as LinkIcon,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { useVault } from '../../context/VaultContext';
import { ImageUploadModal } from '../gallery/ImageUploadModal';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type CaptureTab = 'note' | 'notebook' | 'link' | 'checklist';

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({ isOpen, onClose }) => {
  const { notebooks, createNote, createNotebook, setActiveNotebookId, setActiveNoteId, setActiveView } = useVault();

  const [activeTab, setActiveTab] = useState<CaptureTab>('note');
  const [isImageUploadOpen, setIsImageUploadOpen] = useState(false);

  // Quick note fields
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [targetNotebookId, setTargetNotebookId] = useState(notebooks[0]?.id || '');

  // Quick notebook fields
  const [nbName, setNbName] = useState('');

  // Quick link fields
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [linkNote, setLinkNote] = useState('');

  // Quick checklist fields
  const [checklistTitle, setChecklistTitle] = useState('');
  const [checklistItems, setChecklistItems] = useState(['', '', '']);

  const activeNotebooks = notebooks.filter(n => !n.isDeleted && !n.isArchived);

  // Submit quick note
  const handleSaveQuickNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim()) return;

    let nbId = targetNotebookId;
    if (!nbId && activeNotebooks.length > 0) {
      nbId = activeNotebooks[0].id;
    } else if (!nbId) {
      const created = await createNotebook('Quick Notes');
      nbId = created.id;
    }

    const html = `<p>${noteContent.replace(/\n/g, '<br/>')}</p>`;
    const createdNote = await createNote(nbId, noteTitle.trim(), noteContent, html);

    setActiveNotebookId(nbId);
    setActiveNoteId(createdNote.id);
    setActiveView('notebook');
    onClose();
  };

  // Submit quick notebook
  const handleSaveQuickNotebook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nbName.trim()) return;

    const created = await createNotebook(nbName.trim());
    setActiveNotebookId(created.id);
    setActiveView('notebook');
    onClose();
  };

  // Submit quick link bookmark
  const handleSaveQuickLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl.trim()) return;

    let nbId = targetNotebookId || (activeNotebooks.length > 0 ? activeNotebooks[0].id : '');
    if (!nbId) {
      const created = await createNotebook('Bookmarks & Links');
      nbId = created.id;
    }

    const title = linkTitle.trim() || linkUrl.trim();
    const html = `
      <p><strong>Link:</strong> <a href="${linkUrl.trim()}" target="_blank" rel="noopener noreferrer">${linkUrl.trim()}</a></p>
      ${linkNote ? `<blockquote>${linkNote}</blockquote>` : ''}
    `;

    const createdNote = await createNote(nbId, `🔗 ${title}`, `${linkUrl}\n${linkNote}`, html);
    setActiveNotebookId(nbId);
    setActiveNoteId(createdNote.id);
    setActiveView('notebook');
    onClose();
  };

  // Submit quick checklist
  const handleSaveQuickChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = checklistItems.filter(i => i.trim().length > 0);
    if (items.length === 0) return;

    let nbId = targetNotebookId || (activeNotebooks.length > 0 ? activeNotebooks[0].id : '');
    if (!nbId) {
      const created = await createNotebook('Tasks & To-Dos');
      nbId = created.id;
    }

    const title = checklistTitle.trim() || 'Checklist';
    const taskHtml = `
      <h2>${title}</h2>
      <ul data-type="taskList">
        ${items.map(item => `<li><label><input type="checkbox"><span></span></label><div>${item}</div></li>`).join('')}
      </ul>
    `;

    const createdNote = await createNote(nbId, `☑️ ${title}`, items.join('\n'), taskHtml);
    setActiveNotebookId(nbId);
    setActiveNoteId(createdNote.id);
    setActiveView('notebook');
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>Quick Capture</span>
          </div>
        }
        description="Rapidly capture thoughts, links, screenshots, or task lists from anywhere in Nightvault."
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          {/* Action Tabs */}
          <div className="grid grid-cols-5 gap-1.5 p-1 bg-[#151726] border border-white/10 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('note')}
              className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'note' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Note</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('notebook')}
              className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'notebook' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Notebook</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsImageUploadOpen(true);
                onClose();
              }}
              className="py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-emerald-400" />
              <span>Image</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('link')}
              className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'link' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-4 h-4" />
              <span>Link</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('checklist')}
              className={`py-2 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-colors cursor-pointer ${
                activeTab === 'checklist' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>Tasks</span>
            </button>
          </div>

          {/* Form Content by Tab */}
          {activeTab === 'note' && (
            <form onSubmit={handleSaveQuickNote} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Title</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Quick note title..."
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Content</label>
                <textarea
                  rows={4}
                  placeholder="Write your thought, idea, or quick memo..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Destination Notebook</label>
                <select
                  value={targetNotebookId}
                  onChange={(e) => setTargetNotebookId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#171926] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {activeNotebooks.map(nb => (
                    <option key={nb.id} value={nb.id}>{nb.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!noteTitle.trim()}
                  className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl shadow-md shadow-purple-900/30 cursor-pointer"
                >
                  Save Note
                </button>
              </div>
            </form>
          )}

          {activeTab === 'notebook' && (
            <form onSubmit={handleSaveQuickNotebook} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Notebook Name</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="e.g. Algorithms, Work Log, Recipes..."
                  value={nbName}
                  onChange={(e) => setNbName(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!nbName.trim()}
                  className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl shadow-md shadow-purple-900/30 cursor-pointer"
                >
                  Create Notebook
                </button>
              </div>
            </form>
          )}

          {activeTab === 'link' && (
            <form onSubmit={handleSaveQuickLink} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">URL (Web Address)</label>
                <input
                  type="url"
                  required
                  autoFocus
                  placeholder="https://example.com/article"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Title (Optional)</label>
                <input
                  type="text"
                  placeholder="Page title or description..."
                  value={linkTitle}
                  onChange={(e) => setLinkTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Notes / Why Save This?</label>
                <textarea
                  rows={2}
                  placeholder="Key takeaway or reference note..."
                  value={linkNote}
                  onChange={(e) => setLinkNote(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!linkUrl.trim()}
                  className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl shadow-md shadow-purple-900/30 cursor-pointer"
                >
                  Save Bookmark
                </button>
              </div>
            </form>
          )}

          {activeTab === 'checklist' && (
            <form onSubmit={handleSaveQuickChecklist} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Checklist Title</label>
                <input
                  type="text"
                  placeholder="e.g. Today's Must-Dos, Launch Checklist"
                  value={checklistTitle}
                  onChange={(e) => setChecklistTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Tasks / Items</label>
                <div className="space-y-2">
                  {checklistItems.map((item, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Task ${idx + 1}...`}
                      value={item}
                      onChange={(e) => {
                        const copy = [...checklistItems];
                        copy[idx] = e.target.value;
                        setChecklistItems(copy);
                      }}
                      className="w-full px-3 py-1.5 text-xs bg-[#171926] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => setChecklistItems(prev => [...prev, ''])}
                    className="text-xs text-purple-400 hover:text-purple-300 font-medium py-1 cursor-pointer"
                  >
                    + Add another task
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={checklistItems.filter(i => i.trim()).length === 0}
                  className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 rounded-xl shadow-md shadow-purple-900/30 cursor-pointer"
                >
                  Create Checklist
                </button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Embedded Image Upload if triggered */}
      {isImageUploadOpen && (
        <ImageUploadModal
          isOpen={isImageUploadOpen}
          onClose={() => setIsImageUploadOpen(false)}
        />
      )}
    </>
  );
};
