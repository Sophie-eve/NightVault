import React, { useState, useEffect } from 'react';
import { Settings, Trash2, Archive, Check } from 'lucide-react';
import { Modal } from '../common/Modal';
import { ColorPicker } from '../common/ColorPicker';
import { IconPicker } from '../common/IconPicker';
import { ConfirmModal } from '../common/ConfirmModal';
import { useVault } from '../../context/VaultContext';
import type { Notebook } from '../../types';

interface NotebookSettingsModalProps {
  notebook: Notebook | null;
  isOpen: boolean;
  onClose: () => void;
}

export const NotebookSettingsModal: React.FC<NotebookSettingsModalProps> = ({
  notebook,
  isOpen,
  onClose,
}) => {
  const { updateNotebook, deleteNotebook, archiveNotebook } = useVault();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('BookOpen');
  const [color, setColor] = useState('#8B5CF6');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (notebook) {
      setName(notebook.name);
      setDescription(notebook.description || '');
      setIcon(notebook.icon || 'BookOpen');
      setColor(notebook.color || '#8B5CF6');
    }
  }, [notebook]);

  if (!notebook) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await updateNotebook(notebook.id, {
      name: name.trim(),
      description: description.trim(),
      icon,
      color,
    });
    onClose();
  };

  const handleArchive = async () => {
    await archiveNotebook(notebook.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          <span>Notebook Settings: {notebook.name}</span>
        </div>
      }
      description="Customize identity, icon, and appearance for this notebook."
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="text-xs text-slate-300 font-semibold block mb-1">Notebook Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-slate-300 font-semibold block mb-1">Description (Optional)</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief purpose of this notebook..."
            className="w-full px-3 py-2 text-xs sm:text-sm bg-[#171926] border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>

        <div>
          <label className="text-xs text-slate-300 font-semibold block mb-2">Accent Colour</label>
          <ColorPicker selectedColor={color} onSelectColor={setColor} />
        </div>

        <div>
          <label className="text-xs text-slate-300 font-semibold block mb-2">Notebook Icon</label>
          <IconPicker selectedIcon={icon} onSelectIcon={setIcon} accentColor={color} />
        </div>

        {/* Danger and Archive Actions */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleArchive}
              className="px-3 py-1.5 text-xs text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>Archive</span>
            </button>
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-3 py-1.5 text-xs text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl transition-all shadow-md shadow-purple-900/30 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={async () => {
          await deleteNotebook(notebook.id);
          onClose();
        }}
        title="Move Notebook to Recycle Bin?"
        message={`Are you sure you want to delete "${notebook.name}" and all its pages? They can be restored from the Recycle Bin.`}
        confirmText="Move to Bin"
        isDestructive={true}
      />
    </Modal>
  );
};
