import React from 'react';
import { Check } from 'lucide-react';

export const ACCENT_PALETTE = [
  { name: 'Electric Violet', hex: '#8B5CF6' },
  { name: 'Cyber Purple', hex: '#A855F7' },
  { name: 'Deep Indigo', hex: '#6366F1' },
  { name: 'Neon Cyan', hex: '#06B6D4' },
  { name: 'Muted Sky Blue', hex: '#38BDF8' },
  { name: 'Emerald Glow', hex: '#10B981' },
  { name: 'Amber Gold', hex: '#F59E0B' },
  { name: 'Crimson Rose', hex: '#F43F5E' },
  { name: 'Silver Platinum', hex: '#94A3B8' },
  { name: 'Midnight Charcoal', hex: '#475569' },
];

interface ColorPickerProps {
  selectedColor: string;
  onSelectColor: (color: string) => void;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onSelectColor,
  className = '',
}) => {
  return (
    <div className={`flex flex-wrap gap-2.5 items-center ${className}`}>
      {ACCENT_PALETTE.map((color) => {
        const isSelected = selectedColor.toLowerCase() === color.hex.toLowerCase();
        return (
          <button
            key={color.hex}
            type="button"
            title={color.name}
            onClick={() => onSelectColor(color.hex)}
            className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 transform hover:scale-110 cursor-pointer ${
              isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0d0e15] scale-110 shadow-lg' : 'opacity-80 hover:opacity-100'
            }`}
            style={{
              backgroundColor: color.hex,
              boxShadow: isSelected ? `0 0 12px ${color.hex}80` : undefined,
            }}
          >
            {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
          </button>
        );
      })}
    </div>
  );
};
