import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { ICON_CATALOG, IconRenderer } from './IconRenderer';

interface IconPickerProps {
  selectedIcon: string;
  onSelectIcon: (iconName: string) => void;
  accentColor?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  onSelectIcon,
  accentColor = '#8B5CF6',
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredIcons = useMemo(() => {
    let list: string[] = [];
    if (selectedCategory === 'All') {
      list = ICON_CATALOG.flatMap(c => c.icons);
    } else {
      const cat = ICON_CATALOG.find(c => c.category === selectedCategory);
      list = cat ? cat.icons : [];
    }

    if (!search.trim()) return Array.from(new Set(list));

    const q = search.toLowerCase();
    return Array.from(new Set(list)).filter(icon => icon.toLowerCase().includes(q));
  }, [search, selectedCategory]);

  return (
    <div className="w-full space-y-3">
      {/* Search & Categories */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search icon..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#141622] border border-white/10 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="text-xs bg-[#141622] border border-white/10 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-purple-500"
        >
          <option value="All">All Categories</option>
          {ICON_CATALOG.map(c => (
            <option key={c.category} value={c.category}>{c.category}</option>
          ))}
        </select>
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1 rounded-lg bg-[#0e1017] border border-white/5">
        {filteredIcons.map((iconName) => {
          const isSelected = selectedIcon === iconName;
          return (
            <button
              key={iconName}
              type="button"
              title={iconName}
              onClick={() => onSelectIcon(iconName)}
              className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isSelected
                  ? 'bg-purple-600/20 text-white ring-1 ring-purple-500 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <IconRenderer
                name={iconName}
                className="w-5 h-5 transition-transform hover:scale-110"
                style={{ color: isSelected ? accentColor : undefined }}
              />
            </button>
          );
        })}
      </div>
      {filteredIcons.length === 0 && (
        <p className="text-center text-xs text-slate-500 py-4">No icons found matching "{search}"</p>
      )}
    </div>
  );
};
