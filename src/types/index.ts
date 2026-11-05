export type SyncStatus = 'saved' | 'saving' | 'offline' | 'error';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  theme?: string;
  defaultSort?: SortOption;
  createdAt: string;
}

export type SortOption =
  | 'alphabetical-asc'
  | 'alphabetical-desc'
  | 'recently-modified'
  | 'date-created'
  | 'custom';

export interface Notebook {
  id: string;
  userId: string;
  name: string;
  description?: string;
  icon: string; // Lucide icon name, e.g. 'BookOpen'
  color: string; // Hex color, e.g. '#8B5CF6'
  isFavorite: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  userId: string;
  notebookId: string;
  title: string;
  content: string; // JSON or plaintext content
  contentHtml: string; // HTML rendered content
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  isDeleted: boolean;
  deletedAt?: string | null;
  tagIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ImageAttachment {
  id: string;
  userId: string;
  notebookId?: string | null;
  noteId?: string | null;
  filename: string;
  fileUrl: string; // Supabase public URL or base64/blob URL
  storagePath?: string;
  mimeType: string;
  fileSize: number;
  caption?: string;
  description?: string;
  isDeleted: boolean;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mood: 'great' | 'good' | 'neutral' | 'tired' | 'stressed' | 'inspired';
  prompt?: string;
  title: string;
  content: string;
  contentHtml: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: 'created' | 'updated' | 'deleted' | 'restored' | 'archived' | 'pinned' | 'uploaded';
  entityType: 'notebook' | 'note' | 'image' | 'tag' | 'journal';
  entityId: string;
  entityTitle: string;
  details?: string;
  createdAt: string;
}

export interface VaultStats {
  totalNotebooks: number;
  totalNotes: number;
  totalImages: number;
  totalPinnedNotes: number;
  storageBytesUsed: number;
}

export type ActiveView =
  | 'dashboard'
  | 'notebook'
  | 'journal'
  | 'gallery'
  | 'tags'
  | 'archive'
  | 'recycle-bin'
  | 'settings';
