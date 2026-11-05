import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableHeader from '@tiptap/extension-table-header';
import TableCell from '@tiptap/extension-table-cell';
import Highlight from '@tiptap/extension-highlight';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';

import {
  Star,
  Pin,
  Trash2,
  Calendar,
  CloudCheck,
  CloudOff,
  RefreshCw,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { EditorToolbar } from './EditorToolbar';
import { useVault } from '../../context/VaultContext';
import { ImageUploadModal } from '../gallery/ImageUploadModal';
import { ConfirmModal } from '../common/ConfirmModal';
import type { Note, Notebook } from '../../types';

interface TipTapEditorProps {
  note: Note;
  notebook: Notebook | null;
}

export const TipTapEditor: React.FC<TipTapEditorProps> = ({ note, notebook }) => {
  const {
    updateNote,
    deleteNote,
    togglePinNote,
    toggleFavoriteNote,
    tags,
    syncStatus,
    lastSavedAt,
    isFocusMode,
    setIsFocusMode,
  } = useVault();

  const [title, setTitle] = useState(note.title);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);

  // Keep track of active note id to reset editor content on note switch
  const activeNoteIdRef = useRef(note.id);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: 'Write your thoughts, paste screenshots (Ctrl+V), or format your knowledge...',
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Highlight.configure({
        multicolor: true,
      }),
      TextStyle,
      Color,
    ],
    content: note.contentHtml || (note.content ? `<p>${note.content}</p>` : ''),
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[420px] max-w-none text-slate-200 leading-relaxed py-4',
      },
      handlePaste: (_view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.onload = (e) => {
                const src = e.target?.result as string;
                if (src && editor) {
                  editor.chain().focus().setImage({ src }).run();
                }
              };
              reader.readAsDataURL(file);
              return true; // handled clipboard image paste
            }
          }
        }
        return false;
      },
      handleDrop: (_view, event) => {
        const hasFiles = event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files.length;
        if (!hasFiles) return false;

        const file = event.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const src = e.target?.result as string;
            if (src && editor) {
              editor.chain().focus().setImage({ src }).run();
            }
          };
          reader.readAsDataURL(file);
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      const html = currentEditor.getHTML();
      const text = currentEditor.getText();
      // Debounced note save
      updateNote(note.id, {
        content: text,
        contentHtml: html,
      });
    },
  });

  // When note.id changes, reset title and editor content
  useEffect(() => {
    if (note.id !== activeNoteIdRef.current) {
      activeNoteIdRef.current = note.id;
      setTitle(note.title);
      if (editor) {
        editor.commands.setContent(note.contentHtml || (note.content ? `<p>${note.content}</p>` : ''));
      }
    }
  }, [note.id, note.title, note.contentHtml, note.content, editor]);

  // Handle title edit
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    updateNote(note.id, { title: newTitle });
  };

  // Toggle tag attachment
  const handleToggleTag = (tagId: string) => {
    const currentTags = note.tagIds || [];
    const newTags = currentTags.includes(tagId)
      ? currentTags.filter(id => id !== tagId)
      : [...currentTags, tagId];
    updateNote(note.id, { tagIds: newTags }, true);
  };

  // Insert image from upload modal callback
  const handleInsertImage = useCallback((url: string) => {
    if (editor && url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  // Status Indicator helper
  const renderSyncBadge = () => {
    switch (syncStatus) {
      case 'saving':
        return (
          <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Saving...</span>
          </span>
        );
      case 'offline':
        return (
          <span className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-400/10 px-2 py-0.5 rounded-full border border-slate-400/20" title="Offline changes queued">
            <CloudOff className="w-3 h-3" />
            <span>Offline (Saved locally)</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center gap-1.5 text-xs text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full border border-rose-400/20">
            <AlertCircle className="w-3 h-3" />
            <span>Sync error</span>
          </span>
        );
      case 'saved':
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
            <CloudCheck className="w-3 h-3" />
            <span>Saved {lastSavedAt ? `(${lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})` : ''}</span>
          </span>
        );
    }
  };

  const noteTags = tags.filter(t => (note.tagIds || []).includes(t.id));

  return (
    <div className={`flex flex-col flex-1 h-full overflow-hidden bg-[#0c0d14] ${isFocusMode ? 'max-w-4xl mx-auto w-full' : ''}`}>
      {/* Editor Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 border-b border-white/5 bg-[#10121b]">
        {/* Breadcrumb info */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          {notebook && (
            <span
              className="px-2 py-0.5 rounded-md font-medium text-xs flex items-center gap-1"
              style={{ backgroundColor: `${notebook.color}20`, color: notebook.color }}
            >
              {notebook.name}
            </span>
          )}
          <span>/</span>
          <span className="text-slate-300 font-medium truncate max-w-48 sm:max-w-xs">{title || 'Untitled'}</span>
        </div>

        {/* Action icons & Sync Status */}
        <div className="flex items-center gap-2">
          {renderSyncBadge()}

          <div className="w-px h-4 bg-white/10 mx-1" />

          {/* Pin note */}
          <button
            type="button"
            onClick={() => togglePinNote(note.id)}
            title={note.isPinned ? 'Unpin page' : 'Pin page to top'}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              note.isPinned ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Pin className="w-4 h-4" />
          </button>

          {/* Star note */}
          <button
            type="button"
            onClick={() => toggleFavoriteNote(note.id)}
            title={note.isFavorite ? 'Remove from Favourites' : 'Add to Favourites'}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              note.isFavorite ? 'text-amber-400 bg-amber-400/10' : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Star className={`w-4 h-4 ${note.isFavorite ? 'fill-amber-400' : ''}`} />
          </button>

          {/* Delete note */}
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            title="Delete page"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Formatting Toolbar */}
      <EditorToolbar
        editor={editor}
        note={note}
        notebook={notebook}
        isFocusMode={isFocusMode}
        onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
        onOpenImageUpload={() => setIsImageModalOpen(true)}
      />

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto px-6 sm:px-12 py-6">
        {/* Page Title */}
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="Untitled Page"
            className="w-full text-2xl sm:text-3xl font-bold text-white bg-transparent border-none outline-none placeholder:text-slate-600 focus:ring-0"
          />

          {/* Metadata & Tag Bar */}
          <div className="flex flex-wrap items-center gap-3 mt-3 pt-2 text-xs text-slate-400 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Created {new Date(note.createdAt).toLocaleDateString()}</span>
            </div>

            <div className="w-px h-3 bg-white/10" />

            {/* Tags list */}
            <div className="flex flex-wrap items-center gap-1.5">
              {noteTags.map(t => (
                <span
                  key={t.id}
                  className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                  style={{ backgroundColor: `${t.color}25`, color: t.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.name}
                </span>
              ))}

              {/* Add tag button & dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowTagMenu(!showTagMenu)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1"
                  title="Add Tag"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tag</span>
                </button>
                {showTagMenu && (
                  <div className="absolute left-0 top-full mt-1 p-2 bg-[#171926] border border-white/10 rounded-xl shadow-xl z-30 min-w-44 space-y-1">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">Assign Tags</p>
                    {tags.map(t => {
                      const isAssigned = (note.tagIds || []).includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleToggleTag(t.id)}
                          className="w-full text-left px-2 py-1 text-xs rounded-lg flex items-center justify-between text-slate-300 hover:bg-white/5 cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                            {t.name}
                          </span>
                          {isAssigned && <span className="text-purple-400 font-bold">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TipTap Rich Content */}
        <div className="prose prose-invert max-w-none">
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Image Upload Modal */}
      {isImageModalOpen && (
        <ImageUploadModal
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
          notebookId={notebook?.id || null}
          noteId={note.id}
          onImageUploaded={(attachment) => {
            handleInsertImage(attachment.fileUrl);
            setIsImageModalOpen(false);
          }}
        />
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={() => deleteNote(note.id)}
        title="Move Page to Recycle Bin?"
        message={`Are you sure you want to delete "${note.title}"? You can restore it later from the Recycle Bin.`}
        confirmText="Move to Bin"
        isDestructive={true}
      />
    </div>
  );
};
