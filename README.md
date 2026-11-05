# NIGHTVAULT 🌑
### Personal Digital Notebook & Knowledge Management System

[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TipTap](https://img.shields.io/badge/Editor-TipTap-black?logo=markdown&logoColor=white)](https://tiptap.dev/)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**NIGHTVAULT** is a private, production-grade personal knowledge management application inspired by Microsoft OneNote and Notion, engineered with a premium dark-mode interface (deep charcoal, midnight black, electric violet, and silver accents).

Repository: [https://github.com/Sophie-eve/NightVault](https://github.com/Sophie-eve/NightVault)

---

## 🏛️ System Architecture

```
                                  N I G H T V A U L T
                                           │
          ┌────────────────────────────────┴────────────────────────────────┐
          ▼                                                                 ▼
┌──────────────────┐                                              ┌──────────────────┐
│   LOCAL VAULT    │                                              │  SUPABASE CLOUD  │
│  (IndexedDB API) │                                              │   (PostgreSQL)   │
├──────────────────┤                                              ├──────────────────┤
│ • Offline-First  │ ◄────────── Debounced Two-Way Sync ────────► │ • Row Level Sec  │
│ • Zero Latency   │                 (800ms Auto)                 │ • Cloud Backup   │
│ • Local Media    │                                              │ • Storage Bucket │
└──────────────────┘                                              └──────────────────┘
```

---

## 🌟 Key Architecture & Capabilities

### 1. Dual Local-First & Cloud Engine
- **Zero Keystroke Loss**: Real-time debounced auto-save (800ms) with persistent IndexedDB storage.
- **Offline Resilient**: Continues to function completely offline. Edits and uploads are queued and automatically synchronized.
- **Persistent Sessions**: You remain logged in across page reloads, browser restarts, and reboots until you explicitly click **Log Out**.
- **Supabase Cloud Sync**: Connects to Supabase PostgreSQL, Row Level Security (RLS), and Supabase Storage for multi-device sync.

### 2. Notebook Management System
- **Automatic Alphabetical Sorting (A–Z)**: All notebooks are automatically sorted alphabetically (case-insensitive) by default.
- **Alternative Sorting Options**: Alphabetical Z–A, Recently Modified, Date Created, and Custom Order.
- **Custom Visual Identity**: Unique Lucide icons and curated accent color palettes for every notebook.
- **Safe Lifecycle**: Archive notebooks to declutter the workspace or soft-delete them to the **Recycle Bin** with full restoration.

### 3. TipTap Rich Note Editor
- **Rich Typography**: H1, H2, H3 headings, bold, italic, underline, strikethrough, inline code, and blockquotes.
- **Interactive Checklists / Task Lists**: Live checkboxes with persistent checked state.
- **Tables & Dividers**: 3x3 table builder with add/delete row and column controls.
- **Highlighter & Text Colors**: Multi-color highlighting and text color palettes.
- **Live Sync Indicators**: `Saving...`, `Saved (time)`, `Offline (Saved locally)`, `Sync error`.
- **Export Formats**: One-click export to Markdown (`.md`), HTML (`.html`), or Print-to-PDF.

### 4. Screenshot & Image Media Vault
- **Flexible Ingestion**: Drag-and-drop onto the dropzone, clipboard paste (`Ctrl+V`), or multi-file device picker.
- **Formats Supported**: PNG, JPG, JPEG, WEBP, GIF, SVG.
- **Fullscreen Lightbox**: Interactive zoom in (`+`), zoom out (`-`), reset zoom (`0`), and pan.
- **Management**: Rename images, add captions and descriptions, move between notebooks, or download original files.

### 5. Unique Superpowers
- **Quick Capture (`Ctrl+Q`)**: Floating speed-dial to quickly capture a note, create a notebook, upload a screenshot, save a bookmark link, or build a checklist.
- **Global Search (`Ctrl+K`)**: Instant full-vault search across notebook names, page titles, text content, image captions, and tags.
- **Daily Journal**: Date-stamped reflections with mood tracking and writing prompts.
- **Tags & Labels**: Custom-colored tags to organize and filter notes across different notebooks.
- **Recycle Bin**: Recovery chamber for deleted notebooks, pages, and photos with one-click restore or permanent wipe.
- **Backup & Portability**: Full vault export as a single `.ZIP` archive containing all notebooks, Markdown pages, and metadata.

---

## 🚀 Supabase Cloud Configuration Guide

Nightvault functions immediately out-of-the-box using its internal high-performance IndexedDB engine. To enable cloud synchronization across multiple devices:

### Step 1: Create a Supabase Project
1. Log in to [supabase.com](https://supabase.com) and create a new project.
2. Choose your preferred region and database password.

### Step 2: Run Database Migrations
1. In the Supabase project dashboard, navigate to the **SQL Editor**.
2. Open the file [`supabase/schema.sql`](supabase/schema.sql) in this repository.
3. Paste the entire SQL script into the editor and click **Run**.
   - This sets up all tables (`profiles`, `notebooks`, `notes`, `images`, `tags`, `journal_entries`, `activity_logs`).
   - Configures Row Level Security (RLS) policies so you have exclusive access to your data.
   - Creates the storage bucket `nightvault-media` with upload and read policies.

### Step 3: Configure Environment Variables
You have two easy ways to connect:

**Option A (Direct in UI)**:
1. Open Nightvault in your browser.
2. Go to **Settings → Supabase Cloud Sync & Storage**.
3. Paste your **Project URL** and **anon public API key** (from Supabase: *Project Settings → API*).
4. Click **Save & Connect**.

**Option B (`.env.local`)**:
Create a `.env.local` file in the project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-api-key-here
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` | Open Global Vault Search |
| `Ctrl + Q` | Open Quick Capture Modal |
| `Ctrl + N` | Create New Page in current notebook |
| `Ctrl + Shift + N` | Create New Notebook |
| `Ctrl + S` | Force Instant Save / Cloud Sync |
| `Ctrl + B` | Bold text in editor |
| `Ctrl + I` | Italic text in editor |
| `Ctrl + U` | Underline text in editor |
| `Esc` | Close active modal or exit Focus Mode |
| `?` | View all Keyboard Shortcuts |

---

## 🛠️ Development & Production Build

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run production build
npm run build

# Preview production build locally
npm run preview
```

---

## 📄 License

MIT License. Designed and built for private personal knowledge management.
