import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useVault } from '../../context/VaultContext';
import { formatFileSize } from '../../lib/storage';
import type { ImageAttachment } from '../../types';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  notebookId?: string | null;
  noteId?: string | null;
  onImageUploaded?: (attachment: ImageAttachment) => void;
}

interface FileWithMeta {
  file: File;
  previewUrl: string;
  caption: string;
  description: string;
}

export const ImageUploadModal: React.FC<ImageUploadModalProps> = ({
  isOpen,
  onClose,
  notebookId: defaultNotebookId,
  noteId: defaultNoteId,
  onImageUploaded,
}) => {
  const { uploadImage, notebooks } = useVault();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedNotebookId, setSelectedNotebookId] = useState<string>(defaultNotebookId || '');
  const [filesToUpload, setFilesToUpload] = useState<FileWithMeta[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);

  const handleFiles = (incomingFiles: FileList | File[]) => {
    const list = Array.from(incomingFiles).filter(f => f.type.startsWith('image/'));
    const mapped: FileWithMeta[] = list.map(file => ({
      file,
      previewUrl: URL.createObjectURL(file),
      caption: '',
      description: '',
    }));
    setFilesToUpload(prev => [...prev, ...mapped]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const removeFile = (index: number) => {
    setFilesToUpload(prev => {
      const copy = [...prev];
      URL.revokeObjectURL(copy[index].previewUrl);
      copy.splice(index, 1);
      return copy;
    });
  };

  const updateCaption = (index: number, caption: string) => {
    setFilesToUpload(prev => {
      const copy = [...prev];
      copy[index].caption = caption;
      return copy;
    });
  };

  const handleUploadAll = async () => {
    if (filesToUpload.length === 0) return;
    setIsUploading(true);

    try {
      for (const item of filesToUpload) {
        const attachment = await uploadImage(item.file, {
          notebookId: selectedNotebookId || null,
          noteId: defaultNoteId || null,
          caption: item.caption,
          description: item.description,
        });
        if (onImageUploaded) {
          onImageUploaded(attachment);
        }
      }
      onClose();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-400" />
          <span>Upload Screenshots & Images</span>
        </div>
      }
      description="Save visual notes, diagrams, and screenshots securely to your vault."
      maxWidth="max-w-xl"
    >
      <div className="space-y-4">
        {/* Notebook Target Selection */}
        <div>
          <label className="text-xs text-slate-400 font-medium block mb-1">Destination Notebook</label>
          <select
            value={selectedNotebookId}
            onChange={(e) => setSelectedNotebookId(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-[#171926] border border-white/10 rounded-xl text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="">Global Vault (Unassigned)</option>
            {notebooks.filter(n => !n.isDeleted).map(nb => (
              <option key={nb.id} value={nb.id}>{nb.name}</option>
            ))}
          </select>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-purple-500 bg-purple-500/10 scale-[1.01]'
              : 'border-white/15 bg-[#141624]/50 hover:border-purple-500/50 hover:bg-[#141624]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
            }}
          />
          <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto mb-3">
            <Upload className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-white">Drag & drop images here, or click to browse</p>
          <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, WEBP, GIF, SVG (multiple files supported)</p>
        </div>

        {/* Upload Previews */}
        {filesToUpload.length > 0 && (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            <p className="text-xs font-semibold text-slate-300">Selected Files ({filesToUpload.length})</p>
            {filesToUpload.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-2 bg-[#171926] border border-white/10 rounded-xl"
              >
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white truncate">{item.file.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{formatFileSize(item.file.size)}</p>
                  <input
                    type="text"
                    placeholder="Add caption (optional)..."
                    value={item.caption}
                    onChange={(e) => updateCaption(idx, e.target.value)}
                    className="w-full mt-1 px-2 py-0.5 text-xs bg-[#10121a] border border-white/10 rounded text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-white/5 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleUploadAll}
            disabled={filesToUpload.length === 0 || isUploading}
            className="px-5 py-2 text-xs font-medium text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-all shadow-lg shadow-purple-900/30 flex items-center gap-1.5 cursor-pointer"
          >
            {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isUploading ? 'Uploading to Vault...' : `Upload ${filesToUpload.length > 0 ? `(${filesToUpload.length})` : ''}`}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
