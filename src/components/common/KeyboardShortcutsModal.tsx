import React from 'react';
import { Command } from 'lucide-react';
import { Modal } from './Modal';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], label: 'Open Global Vault Search' },
  { keys: ['Ctrl', 'N'], label: 'Create New Note / Page' },
  { keys: ['Ctrl', 'Shift', 'N'], label: 'Create New Notebook' },
  { keys: ['Ctrl', 'Q'], label: 'Open Quick Capture Drawer' },
  { keys: ['Ctrl', 'S'], label: 'Force Instant Save / Cloud Sync' },
  { keys: ['Ctrl', 'B'], label: 'Toggle Bold Formatting (in editor)' },
  { keys: ['Ctrl', 'I'], label: 'Toggle Italic Formatting (in editor)' },
  { keys: ['Ctrl', 'U'], label: 'Toggle Underline Formatting (in editor)' },
  { keys: ['Esc'], label: 'Close Active Modal / Exit Focus Mode' },
  { keys: ['?'], label: 'Show this Keyboard Shortcuts reference' },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Command className="w-5 h-5 text-purple-400" />
          <span>Keyboard Shortcuts</span>
        </div>
      }
      description="Navigate and capture knowledge in Nightvault with speed."
      maxWidth="max-w-md"
    >
      <div className="space-y-3">
        {SHORTCUTS.map((sc, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
          >
            <span className="text-xs sm:text-sm text-slate-300">{sc.label}</span>
            <div className="flex items-center gap-1.5">
              {sc.keys.map((k, ki) => (
                <kbd
                  key={ki}
                  className="px-2 py-0.5 text-xs font-mono font-semibold bg-[#1a1c29] border border-white/10 rounded-md text-purple-300 shadow-inner"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
