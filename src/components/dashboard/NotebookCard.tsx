import React, { useState } from 'react';
import {
  Star,
  MoreVertical,
  Edit2,
  Trash2,
  ArrowRight,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { IconRenderer } from '../common/IconRenderer';
import { NotebookSettingsModal } from '../notebook/NotebookSettingsModal';
import { ConfirmModal } from '../common/ConfirmModal';
import { useVault } from '../../context/VaultContext';
import type { Notebook } from '../../types';

interface NotebookCardProps {
  notebook: Notebook;
  layout?: 'grid' | 'list';
  onOpen: () => void;
}

export const NotebookCard: React.FC<NotebookCardProps> = ({
  notebook,
  layout = 'grid',
  onOpen,
}) => {
  const { notes, images, toggleFavoriteNotebook, deleteNotebook } = useVault();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Compute counts
  const pageCount = notes.filter(n => n.notebookId === notebook.id && !n.isDeleted).length;
  const imageCount = images.filter(i => i.notebookId === notebook.id && !i.isDeleted).length;

  if (layout === 'list') {
    return (
      <div className="group flex items-center justify-between p-3.5 bg-[#12141f] border border-white/10 hover:border-purple-500/40 rounded-2xl transition-all duration-200">
        <div
          onClick={onOpen}
          className="flex items-center gap-3.5 flex-1 min-w-0 cursor-pointer"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-md transition-transform group-hover:scale-105"
            style={{ backgroundColor: `${notebook.color}25`, color: notebook.color }}
          >
            <IconRenderer name={notebook.icon} className="w-5 h-5" />
          </div>

          <div className="truncate flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white group-hover:text-purple-300 transition-colors truncate">
                {notebook.name}
              </h3>
              {notebook.isFavorite && (
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
              )}
            </div>
            {notebook.description && (
              <p className="text-xs text-slate-400 truncate mt-0.5">{notebook.description}</p>
            )}
          </div>
        </div>

        {/* Stats and actions */}
        <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0 ml-4">
          <div className="hidden sm:flex items-center gap-3">
            <span className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              {pageCount} {pageCount === 1 ? 'page' : 'pages'}
            </span>
            {imageCount > 0 && (
              <span className="flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                {imageCount}
              </span>
            )}
            <span className="text-slate-500 text-[11px]">
              {new Date(notebook.updatedAt).toLocaleDateString()}
            </span>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="px-3 py-1.5 bg-white/5 hover:bg-purple-600/20 text-slate-300 hover:text-purple-300 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>Open</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          {/* Menu button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 top-full mt-1.5 p-1.5 bg-[#171926] border border-white/10 rounded-xl shadow-xl z-20 min-w-36 text-xs space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    toggleFavoriteNotebook(notebook.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1 text-slate-200 hover:bg-white/5 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  <span>{notebook.isFavorite ? 'Unfavorite' : 'Favorite'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1 text-slate-200 hover:bg-white/5 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-purple-400" />
                  <span>Customize</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1 text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {isSettingsOpen && (
          <NotebookSettingsModal
            notebook={notebook}
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
          />
        )}
        {isDeleteModalOpen && (
          <ConfirmModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={() => deleteNotebook(notebook.id)}
            title="Move Notebook to Recycle Bin?"
            message={`Are you sure you want to delete "${notebook.name}"?`}
            confirmText="Move to Bin"
            isDestructive={true}
          />
        )}
      </div>
    );
  }

  // Grid layout (Default card)
  return (
    <div className="group relative bg-[#12141f] border border-white/10 hover:border-purple-500/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-black/40 min-h-52">
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between">
          {/* Icon with accent glow */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:scale-110"
            style={{
              backgroundColor: `${notebook.color}25`,
              color: notebook.color,
              boxShadow: `0 0 16px ${notebook.color}25`,
            }}
          >
            <IconRenderer name={notebook.icon} className="w-6 h-6" />
          </div>

          {/* Quick star and menu */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => toggleFavoriteNotebook(notebook.id)}
              className="p-1.5 text-slate-400 hover:text-amber-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
              title={notebook.isFavorite ? 'Unfavorite' : 'Favorite'}
            >
              <Star
                className={`w-4 h-4 ${
                  notebook.isFavorite ? 'text-amber-400 fill-amber-400' : ''
                }`}
              />
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                title="Notebook Options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 p-1.5 bg-[#171926] border border-white/10 rounded-xl shadow-xl z-20 min-w-36 text-xs space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSettingsOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1 text-slate-200 hover:bg-white/5 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>Customize</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleteModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-2.5 py-1 text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notebook Name and Description */}
        <div className="mt-4">
          <h3
            onClick={onOpen}
            className="text-base font-bold text-white group-hover:text-purple-300 transition-colors cursor-pointer truncate"
            title={notebook.name}
          >
            {notebook.name}
          </h3>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
            {notebook.description || 'No description provided.'}
          </p>
        </div>
      </div>

      {/* Footer Info & Quick Open Button */}
      <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-medium">
            <FileText className="w-3.5 h-3.5 text-slate-500" />
            {pageCount} {pageCount === 1 ? 'page' : 'pages'}
          </span>
          {imageCount > 0 && (
            <span className="flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              {imageCount}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={onOpen}
          className="px-3 py-1.5 bg-white/5 hover:bg-purple-600 hover:text-white text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-sm"
        >
          <span>Open</span>
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {isSettingsOpen && (
        <NotebookSettingsModal
          notebook={notebook}
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
      {isDeleteModalOpen && (
        <ConfirmModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => deleteNotebook(notebook.id)}
          title="Move Notebook to Recycle Bin?"
          message={`Are you sure you want to delete "${notebook.name}"?`}
          confirmText="Move to Bin"
          isDestructive={true}
        />
      )}
    </div>
  );
};
