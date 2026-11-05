import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Trash2,
  FolderInput,
  Edit2,
  Check,
  Calendar,
  HardDrive,
} from 'lucide-react';
import { formatFileSize } from '../../lib/storage';
import { useVault } from '../../context/VaultContext';
import { ConfirmModal } from '../common/ConfirmModal';
import type { ImageAttachment } from '../../types';

interface ImageLightboxProps {
  image: ImageAttachment | null;
  onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({ image, onClose }) => {
  const { updateImage, deleteImage, moveImage, notebooks } = useVault();

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isEditingMeta, setIsEditingMeta] = useState<boolean>(false);
  const [filename, setFilename] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [targetNotebookId, setTargetNotebookId] = useState<string>('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  useEffect(() => {
    if (image) {
      setZoomLevel(1);
      setFilename(image.filename);
      setCaption(image.caption || '');
      setDescription(image.description || '');
      setTargetNotebookId(image.notebookId || '');
      setIsEditingMeta(false);
    }
  }, [image]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoomLevel(prev => Math.min(prev + 0.25, 4));
      if (e.key === '-' || e.key === '_') setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
      if (e.key === '0') setZoomLevel(1);
    };

    if (image) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [image, onClose]);

  if (!image) return null;

  const handleSaveMeta = async () => {
    await updateImage(image.id, {
      filename: filename.trim() || image.filename,
      caption: caption.trim(),
      description: description.trim(),
    });
    if (targetNotebookId !== (image.notebookId || '')) {
      await moveImage(image.id, targetNotebookId || null);
    }
    setIsEditingMeta(false);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = image.fileUrl;
    a.download = image.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const currentNotebook = notebooks.find(n => n.id === image.notebookId);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-xl select-none">
      {/* Top Controls Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0d0f18]/80 z-20">
        <div className="flex items-center gap-3 truncate max-w-md">
          <div className="truncate">
            <h3 className="text-sm font-semibold text-white truncate">{image.filename}</h3>
            {currentNotebook && (
              <span className="text-xs text-purple-400 font-medium">{currentNotebook.name}</span>
            )}
          </div>
        </div>

        {/* Toolbar items: Zoom, Download, Edit, Delete, Close */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.25, 0.5))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-300 px-2 font-mono">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.25, 4))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Reset Zoom (0)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          <div className="w-px h-5 bg-white/10 mx-1" />

          {/* Download Original */}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Download Original Image"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Edit Details */}
          <button
            type="button"
            onClick={() => setIsEditingMeta(!isEditingMeta)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isEditingMeta ? 'bg-purple-600/30 text-purple-300' : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10'
            }`}
            title="Edit Title & Caption"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          {/* Delete Image */}
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="p-2 text-slate-400 hover:text-rose-400 bg-white/5 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
            title="Delete Image"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Close Modal */}
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors cursor-pointer ml-2"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Image Stage & Metadata Drawer */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Image Display Area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <img
            src={image.fileUrl}
            alt={image.caption || image.filename}
            style={{
              transform: `scale(${zoomLevel})`,
              transition: 'transform 0.15s ease-out',
            }}
            className="max-h-[82vh] max-w-[85vw] object-contain rounded-xl shadow-2xl border border-white/5"
          />
        </div>

        {/* Side Metadata & Details Panel */}
        {isEditingMeta && (
          <div className="w-80 sm:w-96 bg-[#11131c] border-l border-white/10 p-6 flex flex-col space-y-4 overflow-y-auto z-20">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h4 className="text-sm font-semibold text-white">Image Information</h4>
              <button
                type="button"
                onClick={handleSaveMeta}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Filename</label>
              <input
                type="text"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-[#171926] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Caption</label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Short caption..."
                className="w-full mt-1.5 px-3 py-2 text-xs bg-[#171926] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed notes or context about this image..."
                className="w-full mt-1.5 px-3 py-2 text-xs bg-[#171926] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <FolderInput className="w-3.5 h-3.5 text-purple-400" />
                <span>Assign to Notebook</span>
              </label>
              <select
                value={targetNotebookId}
                onChange={(e) => setTargetNotebookId(e.target.value)}
                className="w-full mt-1.5 px-3 py-2 text-xs bg-[#171926] border border-white/10 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500"
              >
                <option value="">None (Global Unfiled)</option>
                {notebooks.filter(n => !n.isDeleted).map(nb => (
                  <option key={nb.id} value={nb.id}>{nb.name}</option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-white/10 space-y-2 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5" /> File Size:</span>
                <span className="text-slate-200 font-mono">{formatFileSize(image.fileSize)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Uploaded:</span>
                <span className="text-slate-200">{new Date(image.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Caption banner if present and not editing */}
      {!isEditingMeta && (image.caption || image.description) && (
        <div className="p-4 bg-[#0d0f18]/90 border-t border-white/10 text-center max-w-2xl mx-auto rounded-t-xl mb-2">
          {image.caption && <p className="text-sm font-semibold text-white">{image.caption}</p>}
          {image.description && <p className="text-xs text-slate-400 mt-1">{image.description}</p>}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          await deleteImage(image.id);
          onClose();
        }}
        title="Move Image to Recycle Bin?"
        message={`Are you sure you want to delete "${image.filename}"? You can restore it later from the Recycle Bin.`}
        confirmText="Move to Bin"
        isDestructive={true}
      />
    </div>
  );
};
