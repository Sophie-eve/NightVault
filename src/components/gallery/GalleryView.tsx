import React, { useState, useMemo } from 'react';
import {
  Upload,
  Search,
  Filter,
  Maximize2,
  Trash2,
  Download,
  Folder,
} from 'lucide-react';
import { useVault } from '../../context/VaultContext';
import { formatFileSize } from '../../lib/storage';
import { ImageLightbox } from './ImageLightbox';
import { ImageUploadModal } from './ImageUploadModal';
import { ConfirmModal } from '../common/ConfirmModal';
import type { ImageAttachment } from '../../types';

export const GalleryView: React.FC = () => {
  const { images, notebooks, deleteImage } = useVault();

  const [selectedNotebookFilter, setSelectedNotebookFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLightboxImage, setActiveLightboxImage] = useState<ImageAttachment | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [imageToDelete, setImageToDelete] = useState<ImageAttachment | null>(null);

  // Filter active (non-deleted) images
  const filteredImages = useMemo(() => {
    let list = images.filter(i => !i.isDeleted);

    if (selectedNotebookFilter !== 'all') {
      list = list.filter(i => i.notebookId === selectedNotebookFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i =>
        i.filename.toLowerCase().includes(q) ||
        (i.caption && i.caption.toLowerCase().includes(q)) ||
        (i.description && i.description.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [images, selectedNotebookFilter, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0a0b10] overflow-y-auto">
      {/* Gallery Header */}
      <div className="sticky top-0 z-10 px-6 sm:px-8 py-5 border-b border-white/10 bg-[#0d0f17]/90 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Screenshots & Media Vault</h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {filteredImages.length} {filteredImages.length === 1 ? 'image' : 'images'} stored securely in your vault
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-purple-900/30 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Images</span>
            </button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mt-4">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search images by filename, caption, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-[#141624] border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedNotebookFilter}
              onChange={(e) => setSelectedNotebookFilter(e.target.value)}
              className="w-full sm:w-auto text-xs sm:text-sm bg-[#141624] border border-white/10 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="all">All Notebooks</option>
              {notebooks.filter(n => !n.isDeleted).map(nb => (
                <option key={nb.id} value={nb.id}>{nb.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="p-6 sm:p-8 flex-1">
        {filteredImages.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((image) => {
              const nb = notebooks.find(n => n.id === image.notebookId);
              return (
                <div
                  key={image.id}
                  className="group relative bg-[#12141f] border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 transition-all duration-200 shadow-md flex flex-col"
                >
                  {/* Thumbnail */}
                  <div
                    onClick={() => setActiveLightboxImage(image)}
                    className="relative aspect-video bg-[#0a0b12] overflow-hidden cursor-pointer"
                  >
                    <img
                      src={image.fileUrl}
                      alt={image.caption || image.filename}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <div className="p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/30 transition-colors">
                        <Maximize2 className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Notebook Badge */}
                    {nb && (
                      <div
                        className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-medium backdrop-blur-md"
                        style={{ backgroundColor: `${nb.color}30`, color: nb.color }}
                      >
                        {nb.name}
                      </div>
                    )}
                  </div>

                  {/* Info & Actions */}
                  <div className="p-3 flex flex-col flex-1 justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white truncate" title={image.filename}>
                        {image.filename}
                      </h4>
                      {image.caption && (
                        <p className="text-[11px] text-slate-400 truncate mt-0.5" title={image.caption}>
                          {image.caption}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-white/5 text-[11px] text-slate-500">
                      <span>{formatFileSize(image.fileSize)}</span>
                      <div className="flex items-center gap-1">
                        <a
                          href={image.fileUrl}
                          download={image.filename}
                          title="Download Image"
                          className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/10 transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          type="button"
                          onClick={() => setImageToDelete(image)}
                          title="Move to Recycle Bin"
                          className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Folder className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-white">No images found</h3>
            <p className="text-sm text-slate-400 max-w-sm mt-1">
              {searchQuery
                ? `No images match your search for "${searchQuery}"`
                : 'Upload screenshots, architecture diagrams, or reference pictures to save them permanently in your vault.'}
            </p>
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(true)}
              className="mt-5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload First Image</span>
            </button>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {activeLightboxImage && (
        <ImageLightbox
          image={activeLightboxImage}
          onClose={() => setActiveLightboxImage(null)}
        />
      )}

      {/* Upload Modal */}
      {isUploadModalOpen && (
        <ImageUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
        />
      )}

      {/* Delete Confirmation */}
      {imageToDelete && (
        <ConfirmModal
          isOpen={Boolean(imageToDelete)}
          onClose={() => setImageToDelete(null)}
          onConfirm={() => {
            if (imageToDelete) deleteImage(imageToDelete.id);
          }}
          title="Move Image to Recycle Bin?"
          message={`Are you sure you want to delete "${imageToDelete?.filename}"?`}
          confirmText="Move to Bin"
          isDestructive={true}
        />
      )}
    </div>
  );
};
