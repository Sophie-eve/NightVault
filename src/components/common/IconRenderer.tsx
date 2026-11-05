import React from 'react';
import * as Icons from 'lucide-react';

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

// Map of common Lucide icon names for easy picker catalog
export const ICON_CATALOG: { category: string; icons: string[] }[] = [
  {
    category: 'Knowledge & Notes',
    icons: [
      'BookOpen', 'Book', 'Bookmark', 'FileText', 'Notebook', 'Library',
      'Sparkles', 'GraduationCap', 'Scroll', 'Compass', 'Lightbulb', 'Brain'
    ],
  },
  {
    category: 'Engineering & Code',
    icons: [
      'Code', 'Terminal', 'Cpu', 'Database', 'Server', 'Layers',
      'GitBranch', 'Bug', 'Binary', 'Wrench', 'Shield', 'Key'
    ],
  },
  {
    category: 'Work & Projects',
    icons: [
      'Briefcase', 'CheckSquare', 'Calendar', 'Clock', 'Target', 'Flag',
      'TrendingUp', 'BarChart2', 'Kanban', 'Inbox', 'Folder', 'Archive'
    ],
  },
  {
    category: 'Creative & Media',
    icons: [
      'Palette', 'Image', 'Camera', 'Film', 'Music', 'PenTool',
      'Brush', 'Type', 'Sliders', 'Zap', 'Flame', 'Compass'
    ],
  },
  {
    category: 'Personal & Lifestyle',
    icons: [
      'User', 'Heart', 'Smile', 'Coffee', 'Sun', 'Moon',
      'Globe', 'MapPin', 'Activity', 'Award', 'Star', 'Feather'
    ],
  },
  {
    category: 'Finance & Systems',
    icons: [
      'DollarSign', 'CreditCard', 'PieChart', 'Vault', 'Lock', 'Coins',
      'Wallet', 'ShoppingBag', 'Tag', 'Box', 'Pocket', 'Anchor'
    ],
  },
];

export const IconRenderer: React.FC<IconRendererProps> = ({
  name,
  className = 'w-5 h-5',
  size = 20,
  style,
}) => {
  // Dynamically resolve icon from lucide-react exports
  const IconComponent = ((Icons as unknown) as Record<string, React.ElementType>)[name] || Icons.BookOpen;
  return <IconComponent className={className} size={size} style={style} />;
};
