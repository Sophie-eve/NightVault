import type { Notebook, Note, Tag, JournalEntry, ActivityLog, UserProfile } from '../types';

const DB_NAME = 'Nightvault_DB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('notebooks')) {
        const nbStore = db.createObjectStore('notebooks', { keyPath: 'id' });
        nbStore.createIndex('userId', 'userId', { unique: false });
        nbStore.createIndex('name', 'name', { unique: false });
      }

      if (!db.objectStoreNames.contains('notes')) {
        const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
        noteStore.createIndex('userId', 'userId', { unique: false });
        noteStore.createIndex('notebookId', 'notebookId', { unique: false });
        noteStore.createIndex('isDeleted', 'isDeleted', { unique: false });
      }

      if (!db.objectStoreNames.contains('images')) {
        const imgStore = db.createObjectStore('images', { keyPath: 'id' });
        imgStore.createIndex('userId', 'userId', { unique: false });
        imgStore.createIndex('notebookId', 'notebookId', { unique: false });
      }

      if (!db.objectStoreNames.contains('tags')) {
        const tagStore = db.createObjectStore('tags', { keyPath: 'id' });
        tagStore.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains('journal')) {
        const jStore = db.createObjectStore('journal', { keyPath: 'id' });
        jStore.createIndex('userId', 'userId', { unique: false });
        jStore.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains('activity')) {
        const actStore = db.createObjectStore('activity', { keyPath: 'id' });
        actStore.createIndex('userId', 'userId', { unique: false });
      }

      if (!db.objectStoreNames.contains('sync_queue')) {
        db.createObjectStore('sync_queue', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

// Generic transaction helpers
export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function getFromStore<T>(storeName: string, id: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function putToStore<T>(storeName: string, item: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function putMultipleToStore<T>(storeName: string, items: T[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    for (const item of items) {
      store.put(item);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteFromStore(storeName: string, id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const req = store.clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// User Profile & Session Persistence
export async function saveLocalUser(user: UserProfile): Promise<void> {
  await putToStore('users', user);
  localStorage.setItem('nightvault_active_user_id', user.id);
}

export async function getLocalUser(id?: string): Promise<UserProfile | null> {
  const targetId = id || localStorage.getItem('nightvault_active_user_id');
  if (!targetId) return null;
  return getFromStore<UserProfile>('users', targetId);
}

export async function clearLocalUser(): Promise<void> {
  localStorage.removeItem('nightvault_active_user_id');
}

// Seed Initial Data for Onboarding
export async function seedInitialVaultData(userId: string): Promise<{
  notebooks: Notebook[];
  notes: Note[];
  tags: Tag[];
  journal: JournalEntry[];
  activity: ActivityLog[];
}> {
  const now = new Date().toISOString();

  // Create default tags
  const tags: Tag[] = [
    { id: 'tag-1', userId, name: 'Important', color: '#EF4444', createdAt: now },
    { id: 'tag-2', userId, name: 'Projects', color: '#8B5CF6', createdAt: now },
    { id: 'tag-3', userId, name: 'Personal', color: '#38BDF8', createdAt: now },
    { id: 'tag-4', userId, name: 'Ideas', color: '#F59E0B', createdAt: now },
    { id: 'tag-5', userId, name: 'College', color: '#10B981', createdAt: now },
    { id: 'tag-6', userId, name: 'References', color: '#EC4899', createdAt: now },
    { id: 'tag-7', userId, name: 'To Remember', color: '#A855F7', createdAt: now },
  ];

  // Notebooks
  const notebooks: Notebook[] = [
    {
      id: 'nb-1',
      userId,
      name: 'Getting Started',
      description: 'Welcome to your private Nightvault workspace.',
      icon: 'Sparkles',
      color: '#8B5CF6',
      isFavorite: true,
      isArchived: false,
      isDeleted: false,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'nb-2',
      userId,
      name: 'Engineering & Architecture',
      description: 'System designs, tech stacks, and algorithmic notes.',
      icon: 'Code',
      color: '#38BDF8',
      isFavorite: true,
      isArchived: false,
      isDeleted: false,
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'nb-3',
      userId,
      name: 'Personal Knowledge Vault',
      description: 'Books, learnings, mental models, and reflections.',
      icon: 'BookOpen',
      color: '#10B981',
      isFavorite: false,
      isArchived: false,
      isDeleted: false,
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'nb-4',
      userId,
      name: 'Product Ideas & Strategy',
      description: 'Future ventures, brainstorms, and roadmaps.',
      icon: 'Lightbulb',
      color: '#F59E0B',
      isFavorite: false,
      isArchived: false,
      isDeleted: false,
      sortOrder: 4,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Starter Notes
  const notes: Note[] = [
    {
      id: 'note-1',
      userId,
      notebookId: 'nb-1',
      title: 'Welcome to NIGHTVAULT 🌑',
      content: 'Welcome to your personal digital notebook and knowledge management system.',
      contentHtml: `
        <h1>Welcome to NIGHTVAULT</h1>
        <p>This is your private, high-performance digital workspace inspired by modern knowledge management systems with an elegant dark aesthetic.</p>
        
        <h2>Key Capabilities</h2>
        <ul data-type="taskList">
          <li data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><strong>Alphabetical Notebooks:</strong> Automatically sorted A–Z.</div></li>
          <li data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><strong>TipTap Rich Editor:</strong> Headings, checklists, code blocks, tables, and colors.</div></li>
          <li data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><strong>Cloud & Local Persistence:</strong> Works offline and syncs with Supabase.</div></li>
          <li data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><strong>Screenshots & Images:</strong> Drag-and-drop, clipboard paste, full-screen zoom gallery.</div></li>
          <li data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><strong>Daily Journal:</strong> Date-stamped reflections with mood tracking.</div></li>
          <li data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><strong>Recycle Bin:</strong> Safe recovery for deleted notebooks, notes, and photos.</div></li>
        </ul>

        <blockquote>"Your mind is for having ideas, not holding them." — David Allen</blockquote>

        <h3>Keyboard Shortcuts</h3>
        <p>Press <code>Ctrl + K</code> for Global Search, <code>Ctrl + N</code> for a New Note, or <code>Ctrl + Q</code> for Quick Capture.</p>
      `,
      isPinned: true,
      isFavorite: true,
      isArchived: false,
      isDeleted: false,
      tagIds: ['tag-1', 'tag-7'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'note-2',
      userId,
      notebookId: 'nb-1',
      title: 'Quick Guide: Connecting Supabase Cloud',
      content: 'How to connect your Supabase project for multi-device sync.',
      contentHtml: `
        <h2>Supabase Cloud Setup Guide</h2>
        <p>Nightvault stores everything in your local encrypted IndexedDB cache so you never lose a keystroke. To sync across devices and enable cloud storage:</p>
        <ol>
          <li>Open your Supabase project dashboard at <a href="https://supabase.com" target="_blank">supabase.com</a>.</li>
          <li>Navigate to the <strong>SQL Editor</strong> and execute the script in <code>supabase/schema.sql</code>.</li>
          <li>Go to <strong>Project Settings → API</strong> to copy your <strong>Project URL</strong> and <strong>anon public API key</strong>.</li>
          <li>Open <strong>Settings</strong> in Nightvault and paste the credentials. Click <strong>Test & Save Connection</strong>.</li>
        </ol>
        <p>You can also store them in a <code>.env.local</code> file as <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>.</p>
      `,
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      isDeleted: false,
      tagIds: ['tag-1', 'tag-6'],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'note-3',
      userId,
      notebookId: 'nb-2',
      title: 'System Architecture & Data Flow',
      content: 'Overview of the local-first dual storage engine.',
      contentHtml: `
        <h2>Nightvault Architecture</h2>
        <p>Built with a resilient <em>Local-First / Cloud-Synced</em> architecture:</p>
        <pre><code>[TipTap Editor] 
      │ (Debounced Auto-Save 800ms)
      ▼
[IndexedDB Cache] ──(Online?)──► [Supabase PostgreSQL + Storage]
      ▲                                      │
      └──────────(Bi-directional Sync)───────┘</code></pre>
        <p>All writes commit instantly to IndexedDB and queue to Supabase, guaranteeing zero data loss even on abrupt disconnects.</p>
      `,
      isPinned: true,
      isFavorite: true,
      isArchived: false,
      isDeleted: false,
      tagIds: ['tag-2'],
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Daily Journal starter
  const todayStr = new Date().toISOString().split('T')[0];
  const journal: JournalEntry[] = [
    {
      id: `journal-${todayStr}`,
      userId,
      date: todayStr,
      mood: 'inspired',
      prompt: 'What is the primary breakthrough you want to achieve today?',
      title: 'First Day with Nightvault',
      content: 'Set up my personal knowledge sanctuary. Organized initial notebooks.',
      contentHtml: `
        <h2>First Day with Nightvault</h2>
        <p>Today marks the deployment of my personal digital workspace. Everything is in one secure, elegant vault.</p>
        <p><strong>Highlights:</strong></p>
        <ul>
          <li>Configured high-performance dark theme.</li>
          <li>Verified auto-save and image storage.</li>
          <li>Organized core engineering notebooks.</li>
        </ul>
      `,
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Initial Activity Log
  const activity: ActivityLog[] = [
    {
      id: 'act-1',
      userId,
      action: 'created',
      entityType: 'notebook',
      entityId: 'nb-1',
      entityTitle: 'Getting Started',
      details: 'Vault initialized with starter knowledge base.',
      createdAt: now,
    },
  ];

  // Write to IndexedDB
  await putMultipleToStore('tags', tags);
  await putMultipleToStore('notebooks', notebooks);
  await putMultipleToStore('notes', notes);
  await putMultipleToStore('journal', journal);
  await putMultipleToStore('activity', activity);

  return { notebooks, notes, tags, journal, activity };
}
