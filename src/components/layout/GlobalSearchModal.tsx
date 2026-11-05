import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  FileText,
  Image as ImageIcon,
  Tag as TagIcon,
  ArrowRight,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { IconRenderer } from '../common/IconRenderer';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchFilter = 'all' | 'notebooks' | 'notes' | 'images' | 'recent' | 'archived';

interface SearchResultItem {
  id: string;
  type: 'notebook' | 'note' | 'image' | 'tag';
  title: string;
  subtitle?: string;
  snippet?: string;
  notebookName?: string;
  notebookColor?: string;
  notebookIcon?: string;
  updatedAt: string;
  onSelect: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const {
    notebooks,
    notes,
    images,
    setActiveNotebookId,
    setActiveNoteId,
    setActiveView,
  } = useVault();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilter>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setFilter('all');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const notebookMap = useMemo(() => {
    const map = new Map<string, { name: string; color: string; icon: string }>();
    for (const nb of notebooks) {
      map.set(nb.id, { name: nb.name, color: nb.color, icon: nb.icon });
    }
    return map;
  }, [notebooks]);

  // Aggregate results across vault
  const results = useMemo((): SearchResultItem[] => {
    const q = query.trim().toLowerCase();
    const items: SearchResultItem[] = [];

    // 1. Notebooks
    if (filter === 'all' || filter === 'notebooks' || (filter === 'archived')) {
      for (const nb of notebooks) {
        if (nb.isDeleted) continue;
        if (filter === 'archived' && !nb.isArchived) continue;
        if (filter !== 'archived' && nb.isArchived) continue;

        const match = !q || nb.name.toLowerCase().includes(q) || (nb.description && nb.description.toLowerCase().includes(q));
        if (match) {
          items.push({
            id: nb.id,
            type: 'notebook',
            title: nb.name,
            subtitle: nb.description || 'Notebook',
            notebookName: nb.name,
            notebookColor: nb.color,
            notebookIcon: nb.icon,
            updatedAt: nb.updatedAt,
            onSelect: () => {
              setActiveNotebookId(nb.id);
              const related = notes.filter(n => n.notebookId === nb.id && !n.isDeleted);
              setActiveNoteId(related.length > 0 ? related[0].id : null);
              setActiveView('notebook');
              onClose();
            },
          });
        }
      }
    }

    // 2. Notes
    if (filter === 'all' || filter === 'notes' || filter === 'recent' || filter === 'archived') {
      for (const note of notes) {
        if (note.isDeleted) continue;
        if (filter === 'archived' && !note.isArchived) continue;
        if (filter !== 'archived' && note.isArchived) continue;

        const nbInfo = notebookMap.get(note.notebookId);
        const textContent = note.content || (note.contentHtml ? note.contentHtml.replace(/<[^>]*>/g, '') : '');
        const titleMatch = !q || note.title.toLowerCase().includes(q);
        const bodyMatch = !q || textContent.toLowerCase().includes(q);

        if (titleMatch || bodyMatch) {
          let snippet = '';
          if (q && bodyMatch) {
            const idx = textContent.toLowerCase().indexOf(q);
            const start = Math.max(0, idx - 40);
            const end = Math.min(textContent.length, idx + q.length + 60);
            snippet = (start > 0 ? '...' : '') + textContent.substring(start, end).trim() + (end < textContent.length ? '...' : '');
          } else {
            snippet = textContent.substring(0, 90).trim();
          }

          items.push({
            id: note.id,
            type: 'note',
            title: note.title || 'Untitled Page',
            subtitle: nbInfo?.name || 'Notebook',
            snippet,
            notebookName: nbInfo?.name,
            notebookColor: nbInfo?.color,
            notebookIcon: nbInfo?.icon,
            updatedAt: note.updatedAt,
            onSelect: () => {
              setActiveNotebookId(note.notebookId);
              setActiveNoteId(note.id);
              setActiveView('notebook');
              onClose();
            },
          });
        }
      }
    }

    // 3. Images
    if (filter === 'all' || filter === 'images') {
      for (const img of images) {
        if (img.isDeleted) continue;

        const match = !q || img.filename.toLowerCase().includes(q) ||
          (img.caption && img.caption.toLowerCase().includes(q)) ||
          (img.description && img.description.toLowerCase().includes(q));

        if (match) {
          const nbInfo = img.notebookId ? notebookMap.get(img.notebookId) : null;
          items.push({
            id: img.id,
            type: 'image',
            title: img.filename,
            subtitle: img.caption || 'Image attachment',
            snippet: img.description || '',
            notebookName: nbInfo?.name,
            notebookColor: nbInfo?.color,
            notebookIcon: nbInfo?.icon,
            updatedAt: img.createdAt,
            onSelect: () => {
              setActiveView('gallery');
              onClose();
            },
          });
        }
      }
    }

    // Sort by recent if 'recent' filter is active, or by match relevance
    if (filter === 'recent') {
      return items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 15);
    }

    return items;
  }, [query, filter, notebooks, notes, images, notebookMap, setActiveNotebookId, setActiveNoteId, setActiveView, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Search Container */}
      <div className="relative w-full max-w-2xl bg-[#11131c] border border-white/10 rounded-2xl shadow-2xl shadow-black overflow-hidden z-10 flex flex-col max-h-[80vh]">
        {/* Search Header Input */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#151724]">
          <Search className="w-5 h-5 text-purple-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search notebooks, pages, text inside notes, images, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 outline-none"
          />
          <kbd className="hidden sm:inline px-2 py-0.5 text-xs font-mono font-semibold bg-[#1f2233] border border-white/10 rounded-md text-slate-400">
            Esc
          </kbd>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-white/5 bg-[#0e1017] overflow-x-auto select-none">
          {(
            [
              { id: 'all', label: 'All Results' },
              { id: 'notebooks', label: 'Notebooks' },
              { id: 'notes', label: 'Pages & Notes' },
              { id: 'images', label: 'Screenshots & Images' },
              { id: 'recent', label: 'Recently Modified' },
              { id: 'archived', label: 'Archived' },
            ] as const
          ).map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => setFilter(chip.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                filter === chip.id
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 divide-y divide-white/5">
          {results.length > 0 ? (
            results.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                onClick={item.onSelect}
                className="group p-3 rounded-xl hover:bg-white/5 transition-colors cursor-pointer flex items-start gap-3"
              >
                {/* Type Icon */}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                  style={{
                    backgroundColor: item.notebookColor ? `${item.notebookColor}20` : 'rgba(139, 92, 246, 0.15)',
                    color: item.notebookColor || '#8B5CF6',
                  }}
                >
                  {item.type === 'notebook' && (
                    <IconRenderer name={item.notebookIcon || 'BookOpen'} className="w-4 h-4" />
                  )}
                  {item.type === 'note' && <FileText className="w-4 h-4" />}
                  {item.type === 'image' && <ImageIcon className="w-4 h-4 text-emerald-400" />}
                  {item.type === 'tag' && <TagIcon className="w-4 h-4 text-amber-400" />}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    {item.notebookName && (
                      <span className="text-purple-400 font-medium truncate">{item.notebookName}</span>
                    )}
                    {item.subtitle && (
                      <>
                        <span className="text-slate-600">&bull;</span>
                        <span className="truncate">{item.subtitle}</span>
                      </>
                    )}
                  </div>

                  {item.snippet && (
                    <p className="text-xs text-slate-400/90 line-clamp-1 mt-1 font-serif italic">
                      "{item.snippet}"
                    </p>
                  )}
                </div>

                <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all self-center" />
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-xs text-slate-500">
              No results found in your vault matching "{query}"
            </div>
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="px-4 py-2.5 bg-[#0d0f17] border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
          <span>{results.length} matching vault items</span>
          <span>Press Esc to close</span>
        </div>
      </div>
    </div>
  );
};
