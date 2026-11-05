import React, { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Highlighter,
  Palette,
  Link as LinkIcon,
  Table as TableIcon,
  Minus,
  Image as ImageIcon,
  Undo2,
  Redo2,
  Maximize2,
  Minimize2,
  Download,
  Printer,
  ChevronDown,
} from 'lucide-react';
import { exportNoteAsMarkdown, exportNoteAsHTML, printNoteToPDF } from '../../lib/export';
import type { Note, Notebook } from '../../types';

interface EditorToolbarProps {
  editor: Editor | null;
  note: Note;
  notebook: Notebook | null;
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  onOpenImageUpload: () => void;
}

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', color: '#fef08a' },
  { name: 'Green', color: '#bbf7d0' },
  { name: 'Blue', color: '#bae6fd' },
  { name: 'Purple', color: '#e9d5ff' },
  { name: 'Rose', color: '#fecdd3' },
];

const TEXT_COLORS = [
  { name: 'White', color: '#f8fafc' },
  { name: 'Muted Slate', color: '#94a3b8' },
  { name: 'Electric Violet', color: '#c084fc' },
  { name: 'Cyan Blue', color: '#38bdf8' },
  { name: 'Emerald', color: '#34d399' },
  { name: 'Amber', color: '#fbbf24' },
  { name: 'Rose', color: '#fb7185' },
];

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  editor,
  note,
  notebook,
  isFocusMode,
  onToggleFocusMode,
  onOpenImageUpload,
}) => {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlightPicker, setShowHighlightPicker] = useState(false);
  const [showTableMenu, setShowTableMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('Enter web address (URL):', previousUrl);

    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    setShowTableMenu(false);
  };

  return (
    <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-1 p-2 bg-[#10121a]/90 backdrop-blur-md border-b border-white/10 select-none">
      {/* Left Formatting Tools */}
      <div className="flex flex-wrap items-center gap-0.5">
        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo (Ctrl+Z)"
          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo (Ctrl+Y)"
          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded hover:bg-white/5 transition-colors cursor-pointer"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Headings */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-purple-600/30 text-purple-300 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-purple-600/30 text-purple-300 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-purple-600/30 text-purple-300 font-bold'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Inline formatting */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('bold')
              ? 'bg-purple-600/30 text-purple-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('italic')
              ? 'bg-purple-600/30 text-purple-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('underline')
              ? 'bg-purple-600/30 text-purple-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('strike')
              ? 'bg-purple-600/30 text-purple-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCode().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('code')
              ? 'bg-purple-600/30 text-purple-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Inline Code"
        >
          <Code className="w-4 h-4" />
        </button>

        {/* Text Color Picker Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowColorPicker(!showColorPicker);
              setShowHighlightPicker(false);
              setShowTableMenu(false);
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-0.5"
            title="Text Color"
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          {showColorPicker && (
            <div className="absolute left-0 top-full mt-1.5 p-2 bg-[#151724] border border-white/10 rounded-xl shadow-xl z-30 flex gap-1.5">
              {TEXT_COLORS.map(tc => (
                <button
                  key={tc.color}
                  type="button"
                  title={tc.name}
                  onClick={() => {
                    editor.chain().focus().setColor(tc.color).run();
                    setShowColorPicker(false);
                  }}
                  className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-125 cursor-pointer"
                  style={{ backgroundColor: tc.color }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Highlight Color Picker */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowHighlightPicker(!showHighlightPicker);
              setShowColorPicker(false);
              setShowTableMenu(false);
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-0.5"
            title="Highlight Text"
          >
            <Highlighter className="w-4 h-4 text-amber-400" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          {showHighlightPicker && (
            <div className="absolute left-0 top-full mt-1.5 p-2 bg-[#151724] border border-white/10 rounded-xl shadow-xl z-30 flex gap-1.5">
              {HIGHLIGHT_COLORS.map(hc => (
                <button
                  key={hc.color}
                  type="button"
                  title={hc.name}
                  onClick={() => {
                    editor.chain().focus().toggleHighlight({ color: hc.color }).run();
                    setShowHighlightPicker(false);
                  }}
                  className="w-5 h-5 rounded-full border border-white/20 transition-transform hover:scale-125 cursor-pointer"
                  style={{ backgroundColor: hc.color }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Lists & Tasks */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('bulletList')
              ? 'bg-purple-600/30 text-purple-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('orderedList')
              ? 'bg-purple-600/30 text-purple-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('taskList')
              ? 'bg-purple-600/30 text-purple-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Checklist / Task List"
        >
          <CheckSquare className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/10 mx-1" />

        {/* Link, Table, Image, Divider */}
        <button
          type="button"
          onClick={setLink}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            editor.isActive('link')
              ? 'bg-purple-600/30 text-purple-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title="Insert Hyperlink"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        {/* Table Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowTableMenu(!showTableMenu);
              setShowColorPicker(false);
              setShowHighlightPicker(false);
            }}
            className={`p-1.5 rounded transition-colors cursor-pointer flex items-center gap-0.5 ${
              editor.isActive('table')
                ? 'bg-purple-600/30 text-purple-300'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
            title="Tables"
          >
            <TableIcon className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          {showTableMenu && (
            <div className="absolute left-0 top-full mt-1.5 p-2 bg-[#151724] border border-white/10 rounded-xl shadow-xl z-30 min-w-44 text-xs space-y-1">
              <button
                type="button"
                onClick={insertTable}
                className="w-full text-left px-2.5 py-1.5 text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 rounded-lg transition-colors cursor-pointer"
              >
                Insert 3x3 Table
              </button>
              {editor.isActive('table') && (
                <>
                  <div className="border-t border-white/10 my-1" />
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().addRowAfter().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-2.5 py-1 text-slate-300 hover:bg-white/5 rounded transition-colors cursor-pointer"
                  >
                    Add Row Below
                  </button>
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().deleteRow().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-2.5 py-1 text-slate-300 hover:bg-white/5 rounded transition-colors cursor-pointer"
                  >
                    Delete Row
                  </button>
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().addColumnAfter().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-2.5 py-1 text-slate-300 hover:bg-white/5 rounded transition-colors cursor-pointer"
                  >
                    Add Column Right
                  </button>
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().deleteColumn().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-2.5 py-1 text-slate-300 hover:bg-white/5 rounded transition-colors cursor-pointer"
                  >
                    Delete Column
                  </button>
                  <button
                    type="button"
                    onClick={() => { editor.chain().focus().deleteTable().run(); setShowTableMenu(false); }}
                    className="w-full text-left px-2.5 py-1 text-rose-400 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
                  >
                    Delete Table
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onOpenImageUpload}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
          title="Insert Image or Screenshot"
        >
          <ImageIcon className="w-4 h-4 text-sky-400" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer"
          title="Insert Horizontal Divider"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Right Controls: Export & Focus Mode */}
      <div className="flex items-center gap-1">
        {/* Export Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors cursor-pointer flex items-center gap-1 text-xs"
            title="Export Note"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
            <ChevronDown className="w-3 h-3 opacity-60" />
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-full mt-1.5 p-1.5 bg-[#151724] border border-white/10 rounded-xl shadow-xl z-30 min-w-40 text-xs space-y-1">
              <button
                type="button"
                onClick={() => {
                  exportNoteAsMarkdown(note, notebook?.name || 'Notebook');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 rounded transition-colors cursor-pointer"
              >
                Export as Markdown (.md)
              </button>
              <button
                type="button"
                onClick={() => {
                  exportNoteAsHTML(note, notebook?.name || 'Notebook');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 rounded transition-colors cursor-pointer"
              >
                Export as HTML (.html)
              </button>
              <button
                type="button"
                onClick={() => {
                  printNoteToPDF(note, notebook?.name || 'Notebook');
                  setShowExportMenu(false);
                }}
                className="w-full text-left px-2.5 py-1.5 text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 rounded transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print / Save as PDF
              </button>
            </div>
          )}
        </div>

        {/* Focus Mode Toggle */}
        <button
          type="button"
          onClick={onToggleFocusMode}
          className={`p-1.5 rounded transition-colors cursor-pointer ${
            isFocusMode
              ? 'bg-purple-600/30 text-purple-300'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
          title={isFocusMode ? 'Exit Focus Mode (Esc)' : 'Enter Focus Mode'}
        >
          {isFocusMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
