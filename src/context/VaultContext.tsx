import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type {
  Notebook,
  Note,
  ImageAttachment,
  Tag,
  JournalEntry,
  ActivityLog,
  SortOption,
  SyncStatus,
  ActiveView,
  VaultStats,
} from '../types';
import {
  getAllFromStore,
  putToStore,
  deleteFromStore,
  seedInitialVaultData,
  clearStore,
} from '../lib/db';
import { getSupabase } from '../lib/supabase';
import { uploadImageFile, deleteImagePermanent } from '../lib/storage';
import { exportVaultAsZip } from '../lib/export';
import type { FullVaultBackup } from '../lib/export';
import { useAuth } from './AuthContext';

interface VaultContextType {
  // State
  notebooks: Notebook[];
  notes: Note[];
  images: ImageAttachment[];
  tags: Tag[];
  journalEntries: JournalEntry[];
  activityLogs: ActivityLog[];
  stats: VaultStats;

  // View & UI Navigation
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  activeNotebookId: string | null;
  setActiveNotebookId: (id: string | null) => void;
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;
  activeNotebook: Notebook | null;
  activeNote: Note | null;
  sortOption: SortOption;
  setSortOption: (sort: SortOption) => void;
  isFocusMode: boolean;
  setIsFocusMode: (val: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (val: boolean) => void;
  isQuickCaptureOpen: boolean;
  setIsQuickCaptureOpen: (val: boolean) => void;

  // Auto-Save & Sync status
  syncStatus: SyncStatus;
  lastSavedAt: Date | null;
  triggerManualSync: () => Promise<void>;

  // Notebook Operations
  createNotebook: (name: string, icon?: string, color?: string, description?: string) => Promise<Notebook>;
  updateNotebook: (id: string, updates: Partial<Notebook>) => Promise<void>;
  deleteNotebook: (id: string) => Promise<void>;
  restoreNotebook: (id: string) => Promise<void>;
  permanentlyDeleteNotebook: (id: string) => Promise<void>;
  archiveNotebook: (id: string) => Promise<void>;
  unarchiveNotebook: (id: string) => Promise<void>;
  toggleFavoriteNotebook: (id: string) => Promise<void>;

  // Note Operations
  createNote: (notebookId: string, title?: string, content?: string, contentHtml?: string, tagIds?: string[]) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>, immediate?: boolean) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  permanentlyDeleteNote: (id: string) => Promise<void>;
  archiveNote: (id: string) => Promise<void>;
  unarchiveNote: (id: string) => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;
  toggleFavoriteNote: (id: string) => Promise<void>;
  moveNote: (noteId: string, targetNotebookId: string) => Promise<void>;

  // Image Operations
  uploadImage: (file: File, options?: { notebookId?: string | null; noteId?: string | null; caption?: string; description?: string }) => Promise<ImageAttachment>;
  updateImage: (id: string, updates: Partial<ImageAttachment>) => Promise<void>;
  deleteImage: (id: string) => Promise<void>;
  restoreImage: (id: string) => Promise<void>;
  permanentlyDeleteImage: (id: string) => Promise<void>;
  moveImage: (imageId: string, targetNotebookId: string | null) => Promise<void>;

  // Tag Operations
  createTag: (name: string, color?: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;

  // Journal Operations
  saveJournalEntry: (date: string, mood: JournalEntry['mood'], title: string, content: string, contentHtml: string, prompt?: string) => Promise<JournalEntry>;
  getJournalEntryForDate: (date: string) => JournalEntry | null;

  // Recycle Bin & Vault Operations
  emptyRecycleBin: () => Promise<void>;
  exportVaultBackupZip: () => Promise<void>;
  importVaultBackup: (backup: FullVaultBackup) => Promise<void>;
  resetVaultToDefault: () => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export const VaultProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  // Primary Collections
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Navigation & Views
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [activeNotebookId, setActiveNotebookId] = useState<string | null>(null);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  // Default sorting must ALWAYS be alphabetical A-Z (case-insensitive) as required!
  const [sortOption, setSortOption] = useState<SortOption>('alphabetical-asc');
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isQuickCaptureOpen, setIsQuickCaptureOpen] = useState<boolean>(false);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('saved');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(new Date());

  // Debounce timer reference for note updates
  const debounceTimersRef = useRef<{ [noteId: string]: NodeJS.Timeout }>({});

  const currentUserId = user ? user.id : 'guest-vault';

  // Helper to log activity
  const logActivity = useCallback(async (
    action: ActivityLog['action'],
    entityType: ActivityLog['entityType'],
    entityId: string,
    entityTitle: string,
    details: string = ''
  ) => {
    const log: ActivityLog = {
      id: 'act-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      userId: currentUserId,
      action,
      entityType,
      entityId,
      entityTitle,
      details,
      createdAt: new Date().toISOString(),
    };

    setActivityLogs(prev => [log, ...prev].slice(0, 50));
    await putToStore('activity', log);

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('activity_logs').insert({
          id: log.id,
          user_id: user.id,
          action: log.action,
          entity_type: log.entityType,
          entity_id: log.entityId,
          entity_title: log.entityTitle,
          details: log.details,
          created_at: log.createdAt,
        });
      } catch (err) {
        console.warn('Could not sync activity log to Supabase:', err);
      }
    }
  }, [currentUserId, user]);

  // Load vault data on user load or app startup
  const loadVaultData = useCallback(async () => {
    try {
      const [localNb, localNotes, localImgs, localTags, localJournals, localActs] = await Promise.all([
        getAllFromStore<Notebook>('notebooks'),
        getAllFromStore<Note>('notes'),
        getAllFromStore<ImageAttachment>('images'),
        getAllFromStore<Tag>('tags'),
        getAllFromStore<JournalEntry>('journal'),
        getAllFromStore<ActivityLog>('activity'),
      ]);

      // If IndexedDB is empty for this user, seed starter content!
      if (localNb.length === 0) {
        const seeded = await seedInitialVaultData(currentUserId);
        setNotebooks(seeded.notebooks);
        setNotes(seeded.notes);
        setTags(seeded.tags);
        setJournalEntries(seeded.journal);
        setActivityLogs(seeded.activity);
      } else {
        setNotebooks(localNb);
        setNotes(localNotes);
        setImages(localImgs);
        setTags(localTags);
        setJournalEntries(localJournals);
        setActivityLogs(localActs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      }

      // Check if Supabase is connected and pull cloud updates
      const supabase = getSupabase();
      if (supabase && user) {
        try {
          const [sbNb, sbNotes, sbImgs, sbTags, sbJournal] = await Promise.all([
            supabase.from('notebooks').select('*').eq('user_id', user.id),
            supabase.from('notes').select('*').eq('user_id', user.id),
            supabase.from('images').select('*').eq('user_id', user.id),
            supabase.from('tags').select('*').eq('user_id', user.id),
            supabase.from('journal_entries').select('*').eq('user_id', user.id),
          ]);

          if (sbNb.data && sbNb.data.length > 0) {
            const mappedNotebooks: Notebook[] = sbNb.data.map(n => ({
              id: n.id,
              userId: n.user_id,
              name: n.name,
              description: n.description,
              icon: n.icon || 'BookOpen',
              color: n.color || '#8B5CF6',
              isFavorite: Boolean(n.is_favorite),
              isArchived: Boolean(n.is_archived),
              isDeleted: Boolean(n.is_deleted),
              deletedAt: n.deleted_at,
              sortOrder: n.sort_order,
              createdAt: n.created_at,
              updatedAt: n.updated_at,
            }));
            setNotebooks(mappedNotebooks);
            for (const nb of mappedNotebooks) {
              await putToStore('notebooks', nb);
            }
          }

          if (sbNotes.data && sbNotes.data.length > 0) {
            const mappedNotes: Note[] = sbNotes.data.map(n => ({
              id: n.id,
              userId: n.user_id,
              notebookId: n.notebook_id,
              title: n.title,
              content: n.content,
              contentHtml: n.content_html,
              isPinned: Boolean(n.is_pinned),
              isFavorite: Boolean(n.is_favorite),
              isArchived: Boolean(n.is_archived),
              isDeleted: Boolean(n.is_deleted),
              deletedAt: n.deleted_at,
              createdAt: n.created_at,
              updatedAt: n.updated_at,
            }));
            setNotes(mappedNotes);
            for (const note of mappedNotes) {
              await putToStore('notes', note);
            }
          }

          if (sbImgs.data && sbImgs.data.length > 0) {
            const mappedImgs: ImageAttachment[] = sbImgs.data.map(i => ({
              id: i.id,
              userId: i.user_id,
              notebookId: i.notebook_id,
              noteId: i.note_id,
              filename: i.filename,
              fileUrl: i.file_url,
              storagePath: i.storage_path,
              mimeType: i.mime_type,
              fileSize: Number(i.file_size || 0),
              caption: i.caption,
              description: i.description,
              isDeleted: Boolean(i.is_deleted),
              deletedAt: i.deleted_at,
              createdAt: i.created_at,
              updatedAt: i.updated_at,
            }));
            setImages(mappedImgs);
            for (const img of mappedImgs) {
              await putToStore('images', img);
            }
          }

          if (sbTags.data && sbTags.data.length > 0) {
            const mappedTags: Tag[] = sbTags.data.map(t => ({
              id: t.id,
              userId: t.user_id,
              name: t.name,
              color: t.color || '#8B5CF6',
              createdAt: t.created_at,
            }));
            setTags(mappedTags);
            for (const t of mappedTags) {
              await putToStore('tags', t);
            }
          }

          if (sbJournal.data && sbJournal.data.length > 0) {
            const mappedJournals: JournalEntry[] = sbJournal.data.map(j => ({
              id: j.id,
              userId: j.user_id,
              date: j.date,
              mood: j.mood || 'neutral',
              prompt: j.prompt || '',
              title: j.title || '',
              content: j.content || '',
              contentHtml: j.content_html || '',
              createdAt: j.created_at,
              updatedAt: j.updated_at,
            }));
            setJournalEntries(mappedJournals);
            for (const j of mappedJournals) {
              await putToStore('journal', j);
            }
          }
        } catch (cloudErr) {
          console.warn('Supabase sync warning (running with local cache):', cloudErr);
        }
      }
    } catch (err) {
      console.error('Failed to load vault data:', err);
    }
  }, [currentUserId, user]);

  useEffect(() => {
    loadVaultData();
  }, [loadVaultData]);

  // Online / Offline connectivity listener
  useEffect(() => {
    const handleOnline = () => setSyncStatus('saved');
    const handleOffline = () => setSyncStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Compute live statistics
  const stats: VaultStats = useMemo(() => {
    const activeNbs = notebooks.filter(n => !n.isDeleted);
    const activeNts = notes.filter(n => !n.isDeleted);
    const activeImgs = images.filter(i => !i.isDeleted);
    const pinnedNts = activeNts.filter(n => n.isPinned);
    const bytes = activeImgs.reduce((acc, img) => acc + (img.fileSize || 0), 0) +
      activeNts.reduce((acc, n) => acc + (n.content?.length || 0) * 2, 0);

    return {
      totalNotebooks: activeNbs.length,
      totalNotes: activeNts.length,
      totalImages: activeImgs.length,
      totalPinnedNotes: pinnedNts.length,
      storageBytesUsed: bytes,
    };
  }, [notebooks, notes, images]);

  // Sorted notebooks
  const sortedNotebooks = useMemo(() => {
    const nbs = [...notebooks];
    return nbs.sort((a, b) => {
      if (sortOption === 'alphabetical-asc') {
        return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
      }
      if (sortOption === 'alphabetical-desc') {
        return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
      }
      if (sortOption === 'recently-modified') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (sortOption === 'date-created') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return (a.sortOrder || 0) - (b.sortOrder || 0);
    });
  }, [notebooks, sortOption]);

  const activeNotebook = useMemo(() => {
    return notebooks.find(n => n.id === activeNotebookId) || null;
  }, [notebooks, activeNotebookId]);

  const activeNote = useMemo(() => {
    return notes.find(n => n.id === activeNoteId) || null;
  }, [notes, activeNoteId]);

  // Sync with Supabase manually
  const triggerManualSync = useCallback(async () => {
    setSyncStatus('saving');
    try {
      await loadVaultData();
      setSyncStatus('saved');
      setLastSavedAt(new Date());
    } catch {
      setSyncStatus('error');
    }
  }, [loadVaultData]);

  // ----------------------------------------------------
  // NOTEBOOK ACTIONS
  // ----------------------------------------------------
  const createNotebook = async (
    name: string,
    icon: string = 'BookOpen',
    color: string = '#8B5CF6',
    description: string = ''
  ): Promise<Notebook> => {
    const now = new Date().toISOString();
    const newNotebook: Notebook = {
      id: 'nb-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      userId: currentUserId,
      name: name.trim() || 'Untitled Notebook',
      description: description.trim(),
      icon,
      color,
      isFavorite: false,
      isArchived: false,
      isDeleted: false,
      sortOrder: notebooks.length + 1,
      createdAt: now,
      updatedAt: now,
    };

    setNotebooks(prev => [...prev, newNotebook]);
    await putToStore('notebooks', newNotebook);
    await logActivity('created', 'notebook', newNotebook.id, newNotebook.name);

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('notebooks').insert({
          id: newNotebook.id,
          user_id: user.id,
          name: newNotebook.name,
          description: newNotebook.description,
          icon: newNotebook.icon,
          color: newNotebook.color,
          is_favorite: newNotebook.isFavorite,
          is_archived: newNotebook.isArchived,
          is_deleted: newNotebook.isDeleted,
          sort_order: newNotebook.sortOrder,
          created_at: newNotebook.createdAt,
          updated_at: newNotebook.updatedAt,
        });
      } catch (err) {
        console.warn('Could not sync notebook creation to Supabase:', err);
      }
    }

    return newNotebook;
  };

  const updateNotebook = async (id: string, updates: Partial<Notebook>): Promise<void> => {
    const now = new Date().toISOString();
    let updatedTarget: Notebook | null = null;

    setNotebooks(prev =>
      prev.map(nb => {
        if (nb.id === id) {
          updatedTarget = { ...nb, ...updates, updatedAt: now };
          return updatedTarget;
        }
        return nb;
      })
    );

    if (updatedTarget) {
      await putToStore('notebooks', updatedTarget);
      await logActivity('updated', 'notebook', id, (updatedTarget as Notebook).name);

      const supabase = getSupabase();
      if (supabase && user) {
        try {
          await supabase.from('notebooks').update({
            name: updates.name,
            description: updates.description,
            icon: updates.icon,
            color: updates.color,
            is_favorite: updates.isFavorite,
            is_archived: updates.isArchived,
            is_deleted: updates.isDeleted,
            deleted_at: updates.deletedAt,
            sort_order: updates.sortOrder,
            updated_at: now,
          }).eq('id', id);
        } catch (err) {
          console.warn('Could not sync notebook update to Supabase:', err);
        }
      }
    }
  };

  const deleteNotebook = async (id: string): Promise<void> => {
    const now = new Date().toISOString();
    const target = notebooks.find(n => n.id === id);
    if (!target) return;

    // Soft delete: move to recycle bin
    await updateNotebook(id, { isDeleted: true, deletedAt: now });

    // Also mark its notes as deleted
    const relatedNotes = notes.filter(n => n.notebookId === id && !n.isDeleted);
    for (const note of relatedNotes) {
      await updateNote(note.id, { isDeleted: true, deletedAt: now }, true);
    }

    if (activeNotebookId === id) {
      setActiveNotebookId(null);
      setActiveNoteId(null);
      setActiveView('dashboard');
    }

    await logActivity('deleted', 'notebook', id, target.name, 'Moved to Recycle Bin');
  };

  const restoreNotebook = async (id: string): Promise<void> => {
    const target = notebooks.find(n => n.id === id);
    if (!target) return;

    await updateNotebook(id, { isDeleted: false, deletedAt: null });

    // Restore related notes
    const relatedNotes = notes.filter(n => n.notebookId === id && n.isDeleted);
    for (const note of relatedNotes) {
      await updateNote(note.id, { isDeleted: false, deletedAt: null }, true);
    }

    await logActivity('restored', 'notebook', id, target.name);
  };

  const permanentlyDeleteNotebook = async (id: string): Promise<void> => {
    const target = notebooks.find(n => n.id === id);
    setNotebooks(prev => prev.filter(n => n.id !== id));
    await deleteFromStore('notebooks', id);

    // Delete associated notes permanently
    const relatedNotes = notes.filter(n => n.notebookId === id);
    for (const note of relatedNotes) {
      await permanentlyDeleteNote(note.id);
    }

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('notebooks').delete().eq('id', id);
      } catch (err) {
        console.warn('Could not delete notebook from Supabase:', err);
      }
    }

    if (target) {
      await logActivity('deleted', 'notebook', id, target.name, 'Permanently deleted');
    }
  };

  const archiveNotebook = async (id: string): Promise<void> => {
    await updateNotebook(id, { isArchived: true });
  };

  const unarchiveNotebook = async (id: string): Promise<void> => {
    await updateNotebook(id, { isArchived: false });
  };

  const toggleFavoriteNotebook = async (id: string): Promise<void> => {
    const target = notebooks.find(n => n.id === id);
    if (target) {
      await updateNotebook(id, { isFavorite: !target.isFavorite });
    }
  };

  // ----------------------------------------------------
  // NOTE ACTIONS
  // ----------------------------------------------------
  const createNote = async (
    notebookId: string,
    title: string = 'Untitled Page',
    content: string = '',
    contentHtml: string = '<p></p>',
    tagIds: string[] = []
  ): Promise<Note> => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: 'note-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      userId: currentUserId,
      notebookId,
      title: title.trim() || 'Untitled Page',
      content,
      contentHtml,
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      isDeleted: false,
      tagIds,
      createdAt: now,
      updatedAt: now,
    };

    setNotes(prev => [newNote, ...prev]);
    await putToStore('notes', newNote);
    await logActivity('created', 'note', newNote.id, newNote.title);

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('notes').insert({
          id: newNote.id,
          user_id: user.id,
          notebook_id: newNote.notebookId,
          title: newNote.title,
          content: newNote.content,
          content_html: newNote.contentHtml,
          is_pinned: newNote.isPinned,
          is_favorite: newNote.isFavorite,
          is_archived: newNote.isArchived,
          is_deleted: newNote.isDeleted,
          created_at: newNote.createdAt,
          updated_at: newNote.updatedAt,
        });
      } catch (err) {
        console.warn('Could not sync note creation to Supabase:', err);
      }
    }

    setActiveNoteId(newNote.id);
    return newNote;
  };

  const saveNoteToDiskAndCloud = async (note: Note) => {
    setSyncStatus('saving');
    try {
      await putToStore('notes', note);
      const supabase = getSupabase();
      if (supabase && user) {
        await supabase.from('notes').update({
          title: note.title,
          content: note.content,
          content_html: note.contentHtml,
          is_pinned: note.isPinned,
          is_favorite: note.isFavorite,
          is_archived: note.isArchived,
          is_deleted: note.isDeleted,
          deleted_at: note.deletedAt,
          updated_at: note.updatedAt,
        }).eq('id', note.id);
      }
      setSyncStatus('saved');
      setLastSavedAt(new Date());
    } catch (err) {
      console.warn('Auto-save error:', err);
      setSyncStatus(navigator.onLine ? 'error' : 'offline');
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>, immediate: boolean = false): Promise<void> => {
    const now = new Date().toISOString();
    let currentUpdatedNote: Note | null = null;

    setNotes(prev =>
      prev.map(n => {
        if (n.id === id) {
          currentUpdatedNote = { ...n, ...updates, updatedAt: now };
          return currentUpdatedNote;
        }
        return n;
      })
    );

    if (!currentUpdatedNote) return;

    if (immediate) {
      // Clear any pending debounce
      if (debounceTimersRef.current[id]) {
        clearTimeout(debounceTimersRef.current[id]);
        delete debounceTimersRef.current[id];
      }
      await saveNoteToDiskAndCloud(currentUpdatedNote);
    } else {
      // Debounce auto-save by 800ms
      setSyncStatus('saving');
      if (debounceTimersRef.current[id]) {
        clearTimeout(debounceTimersRef.current[id]);
      }

      debounceTimersRef.current[id] = setTimeout(() => {
        if (currentUpdatedNote) {
          saveNoteToDiskAndCloud(currentUpdatedNote);
        }
        delete debounceTimersRef.current[id];
      }, 800);
    }
  };

  const deleteNote = async (id: string): Promise<void> => {
    const target = notes.find(n => n.id === id);
    if (!target) return;

    const now = new Date().toISOString();
    await updateNote(id, { isDeleted: true, deletedAt: now }, true);

    if (activeNoteId === id) {
      // Select another note in this notebook if available
      const remaining = notes.filter(n => n.notebookId === target.notebookId && n.id !== id && !n.isDeleted);
      setActiveNoteId(remaining.length > 0 ? remaining[0].id : null);
    }

    await logActivity('deleted', 'note', id, target.title, 'Moved to Recycle Bin');
  };

  const restoreNote = async (id: string): Promise<void> => {
    const target = notes.find(n => n.id === id);
    if (!target) return;
    await updateNote(id, { isDeleted: false, deletedAt: null }, true);
    await logActivity('restored', 'note', id, target.title);
  };

  const permanentlyDeleteNote = async (id: string): Promise<void> => {
    const target = notes.find(n => n.id === id);
    setNotes(prev => prev.filter(n => n.id !== id));
    await deleteFromStore('notes', id);

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('notes').delete().eq('id', id);
      } catch (err) {
        console.warn('Could not delete note from Supabase:', err);
      }
    }

    if (target) {
      await logActivity('deleted', 'note', id, target.title, 'Permanently deleted');
    }
  };

  const archiveNote = async (id: string): Promise<void> => {
    await updateNote(id, { isArchived: true }, true);
  };

  const unarchiveNote = async (id: string): Promise<void> => {
    await updateNote(id, { isArchived: false }, true);
  };

  const togglePinNote = async (id: string): Promise<void> => {
    const target = notes.find(n => n.id === id);
    if (target) {
      await updateNote(id, { isPinned: !target.isPinned }, true);
    }
  };

  const toggleFavoriteNote = async (id: string): Promise<void> => {
    const target = notes.find(n => n.id === id);
    if (target) {
      await updateNote(id, { isFavorite: !target.isFavorite }, true);
    }
  };

  const moveNote = async (noteId: string, targetNotebookId: string): Promise<void> => {
    await updateNote(noteId, { notebookId: targetNotebookId }, true);
  };

  // ----------------------------------------------------
  // IMAGE ACTIONS
  // ----------------------------------------------------
  const uploadImage = async (
    file: File,
    options?: { notebookId?: string | null; noteId?: string | null; caption?: string; description?: string }
  ): Promise<ImageAttachment> => {
    const attachment = await uploadImageFile(file, currentUserId, options);
    setImages(prev => [attachment, ...prev]);
    await logActivity('uploaded', 'image', attachment.id, attachment.filename);
    return attachment;
  };

  const updateImage = async (id: string, updates: Partial<ImageAttachment>): Promise<void> => {
    const now = new Date().toISOString();
    let updatedImg: ImageAttachment | null = null;

    setImages(prev =>
      prev.map(img => {
        if (img.id === id) {
          updatedImg = { ...img, ...updates, updatedAt: now };
          return updatedImg;
        }
        return img;
      })
    );

    if (updatedImg) {
      await putToStore('images', updatedImg);
      const supabase = getSupabase();
      if (supabase && user) {
        try {
          await supabase.from('images').update({
            filename: updates.filename,
            caption: updates.caption,
            description: updates.description,
            notebook_id: updates.notebookId,
            note_id: updates.noteId,
            is_deleted: updates.isDeleted,
            deleted_at: updates.deletedAt,
            updated_at: now,
          }).eq('id', id);
        } catch (err) {
          console.warn('Could not sync image update to Supabase:', err);
        }
      }
    }
  };

  const deleteImage = async (id: string): Promise<void> => {
    const target = images.find(i => i.id === id);
    if (!target) return;
    const now = new Date().toISOString();
    await updateImage(id, { isDeleted: true, deletedAt: now });
    await logActivity('deleted', 'image', id, target.filename, 'Moved to Recycle Bin');
  };

  const restoreImage = async (id: string): Promise<void> => {
    const target = images.find(i => i.id === id);
    if (!target) return;
    await updateImage(id, { isDeleted: false, deletedAt: null });
    await logActivity('restored', 'image', id, target.filename);
  };

  const permanentlyDeleteImage = async (id: string): Promise<void> => {
    const target = images.find(i => i.id === id);
    if (!target) return;
    setImages(prev => prev.filter(i => i.id !== id));
    await deleteImagePermanent(target);
    await logActivity('deleted', 'image', id, target.filename, 'Permanently deleted');
  };

  const moveImage = async (imageId: string, targetNotebookId: string | null): Promise<void> => {
    await updateImage(imageId, { notebookId: targetNotebookId });
  };

  // ----------------------------------------------------
  // TAG ACTIONS
  // ----------------------------------------------------
  const createTag = async (name: string, color: string = '#8B5CF6'): Promise<Tag> => {
    const newTag: Tag = {
      id: 'tag-' + Date.now(),
      userId: currentUserId,
      name: name.trim(),
      color,
      createdAt: new Date().toISOString(),
    };
    setTags(prev => [...prev, newTag]);
    await putToStore('tags', newTag);

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('tags').insert({
          id: newTag.id,
          user_id: user.id,
          name: newTag.name,
          color: newTag.color,
          created_at: newTag.createdAt,
        });
      } catch (err) {
        console.warn('Could not sync tag to Supabase:', err);
      }
    }
    return newTag;
  };

  const deleteTag = async (id: string): Promise<void> => {
    setTags(prev => prev.filter(t => t.id !== id));
    await deleteFromStore('tags', id);
  };

  // ----------------------------------------------------
  // JOURNAL ACTIONS
  // ----------------------------------------------------
  const saveJournalEntry = async (
    date: string,
    mood: JournalEntry['mood'],
    title: string,
    content: string,
    contentHtml: string,
    prompt: string = ''
  ): Promise<JournalEntry> => {
    const now = new Date().toISOString();
    const entryId = `journal-${date}`;
    const entry: JournalEntry = {
      id: entryId,
      userId: currentUserId,
      date,
      mood,
      title: title.trim() || `Journal: ${date}`,
      content,
      contentHtml,
      prompt,
      createdAt: now,
      updatedAt: now,
    };

    setJournalEntries(prev => {
      const idx = prev.findIndex(j => j.date === date);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = entry;
        return copy;
      }
      return [entry, ...prev];
    });

    await putToStore('journal', entry);
    await logActivity('updated', 'journal', entry.id, entry.title);

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('journal_entries').upsert({
          id: entry.id,
          user_id: user.id,
          date: entry.date,
          mood: entry.mood,
          title: entry.title,
          content: entry.content,
          content_html: entry.contentHtml,
          prompt: entry.prompt,
          updated_at: entry.updatedAt,
        });
      } catch (err) {
        console.warn('Could not sync journal entry to Supabase:', err);
      }
    }

    return entry;
  };

  const getJournalEntryForDate = useCallback((date: string): JournalEntry | null => {
    return journalEntries.find(j => j.date === date) || null;
  }, [journalEntries]);

  // ----------------------------------------------------
  // RECYCLE BIN & VAULT OPERATIONS
  // ----------------------------------------------------
  const emptyRecycleBin = async (): Promise<void> => {
    const deletedNbs = notebooks.filter(n => n.isDeleted);
    const deletedNts = notes.filter(n => n.isDeleted);
    const deletedImgs = images.filter(i => i.isDeleted);

    for (const nb of deletedNbs) {
      await permanentlyDeleteNotebook(nb.id);
    }
    for (const nt of deletedNts) {
      await permanentlyDeleteNote(nt.id);
    }
    for (const img of deletedImgs) {
      await permanentlyDeleteImage(img.id);
    }
  };

  const exportVaultBackupZip = async (): Promise<void> => {
    const backup: FullVaultBackup = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user: user || null,
      notebooks,
      notes,
      images,
      tags,
      journal: journalEntries,
    };
    await exportVaultAsZip(backup);
  };

  const importVaultBackup = async (backup: FullVaultBackup): Promise<void> => {
    // Clear and restore
    await clearStore('notebooks');
    await clearStore('notes');
    await clearStore('images');
    await clearStore('tags');
    await clearStore('journal');

    for (const nb of backup.notebooks) await putToStore('notebooks', nb);
    for (const n of backup.notes) await putToStore('notes', n);
    for (const img of backup.images) await putToStore('images', img);
    for (const t of backup.tags) await putToStore('tags', t);
    for (const j of backup.journal) await putToStore('journal', j);

    setNotebooks(backup.notebooks);
    setNotes(backup.notes);
    setImages(backup.images);
    setTags(backup.tags);
    setJournalEntries(backup.journal);
    setActiveView('dashboard');
  };

  const resetVaultToDefault = async (): Promise<void> => {
    await clearStore('notebooks');
    await clearStore('notes');
    await clearStore('images');
    await clearStore('tags');
    await clearStore('journal');
    await clearStore('activity');

    const seeded = await seedInitialVaultData(currentUserId);
    setNotebooks(seeded.notebooks);
    setNotes(seeded.notes);
    setTags(seeded.tags);
    setJournalEntries(seeded.journal);
    setActivityLogs(seeded.activity);
    setImages([]);
    setActiveNotebookId(null);
    setActiveNoteId(null);
    setActiveView('dashboard');
  };

  return (
    <VaultContext.Provider
      value={{
        notebooks: sortedNotebooks,
        notes,
        images,
        tags,
        journalEntries,
        activityLogs,
        stats,

        activeView,
        setActiveView,
        activeNotebookId,
        setActiveNotebookId,
        activeNoteId,
        setActiveNoteId,
        activeNotebook,
        activeNote,
        sortOption,
        setSortOption,
        isFocusMode,
        setIsFocusMode,
        isSearchOpen,
        setIsSearchOpen,
        isQuickCaptureOpen,
        setIsQuickCaptureOpen,

        syncStatus,
        lastSavedAt,
        triggerManualSync,

        createNotebook,
        updateNotebook,
        deleteNotebook,
        restoreNotebook,
        permanentlyDeleteNotebook,
        archiveNotebook,
        unarchiveNotebook,
        toggleFavoriteNotebook,

        createNote,
        updateNote,
        deleteNote,
        restoreNote,
        permanentlyDeleteNote,
        archiveNote,
        unarchiveNote,
        togglePinNote,
        toggleFavoriteNote,
        moveNote,

        uploadImage,
        updateImage,
        deleteImage,
        restoreImage,
        permanentlyDeleteImage,
        moveImage,

        createTag,
        deleteTag,

        saveJournalEntry,
        getJournalEntryForDate,

        emptyRecycleBin,
        exportVaultBackupZip,
        importVaultBackup,
        resetVaultToDefault,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
};

export const useVault = (): VaultContextType => {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
};
