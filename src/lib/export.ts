import JSZip from 'jszip';
import type { Notebook, Note, ImageAttachment, Tag, JournalEntry, UserProfile } from '../types';

export interface FullVaultBackup {
  version: string;
  exportedAt: string;
  user?: UserProfile | null;
  notebooks: Notebook[];
  notes: Note[];
  images: ImageAttachment[];
  tags: Tag[];
  journal: JournalEntry[];
}

export function downloadFile(content: string | Blob, filename: string, mimeType: string = 'text/plain') {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportNoteAsMarkdown(note: Note, notebookName: string = 'Notebook') {
  // Convert HTML to simple clean Markdown representation
  const dateStr = new Date(note.updatedAt).toLocaleDateString();
  const div = document.createElement('div');
  div.innerHTML = note.contentHtml || '';
  const textContent = div.innerText || note.content;

  const md = `# ${note.title}
*Notebook: ${notebookName} | Last Modified: ${dateStr}*

---

${textContent}
`;
  downloadFile(md, `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`, 'text/markdown');
}

export function exportNoteAsHTML(note: Note, notebookName: string = 'Notebook') {
  const dateStr = new Date(note.updatedAt).toLocaleDateString();
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${note.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1e293b; }
    h1 { color: #0f172a; border-bottom: 2px solid #8b5cf6; padding-bottom: 8px; }
    .meta { color: #64748b; font-size: 0.9em; margin-bottom: 24px; }
    pre { background: #f1f5f9; padding: 16px; border-radius: 8px; overflow-x: auto; }
    blockquote { border-left: 4px solid #8b5cf6; margin: 0; padding-left: 16px; color: #475569; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; }
    th { background: #f8fafc; }
    img { max-width: 100%; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>${note.title}</h1>
  <div class="meta">Notebook: <strong>${notebookName}</strong> &bull; Updated: ${dateStr}</div>
  <div class="content">
    ${note.contentHtml || `<p>${note.content}</p>`}
  </div>
</body>
</html>`;
  downloadFile(html, `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_')}.html`, 'text/html');
}

export function printNoteToPDF(note: Note, notebookName: string = 'Notebook') {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const dateStr = new Date(note.updatedAt).toLocaleDateString();
  printWindow.document.write(`<!DOCTYPE html>
<html>
<head>
  <title>${note.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; padding: 40px; color: #111; }
    h1 { border-bottom: 2px solid #8b5cf6; padding-bottom: 8px; margin-top: 0; }
    .meta { color: #555; font-size: 0.85em; margin-bottom: 24px; }
    blockquote { border-left: 3px solid #8b5cf6; margin: 16px 0; padding-left: 16px; font-style: italic; }
    pre { background: #f5f5f5; padding: 12px; border-radius: 6px; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; }
    th, td { border: 1px solid #ccc; padding: 6px 10px; }
    th { background: #f0f0f0; }
    img { max-width: 100%; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <h1>${note.title}</h1>
  <div class="meta">NIGHTVAULT &bull; Notebook: ${notebookName} &bull; ${dateStr}</div>
  <div>${note.contentHtml || `<p>${note.content}</p>`}</div>
  <script>
    window.onload = function() {
      window.print();
      setTimeout(function() { window.close(); }, 500);
    };
  </script>
</body>
</html>`);
  printWindow.document.close();
}

export async function exportVaultAsZip(backup: FullVaultBackup): Promise<void> {
  const zip = new JSZip();

  // 1. Add raw json manifest
  zip.file('nightvault_backup.json', JSON.stringify(backup, null, 2));

  // 2. Add human-readable Markdown notes organized by notebook folders
  const notesFolder = zip.folder('Notebooks');
  const notebookMap = new Map<string, string>();
  for (const nb of backup.notebooks) {
    notebookMap.set(nb.id, nb.name);
  }

  for (const note of backup.notes) {
    if (note.isDeleted) continue;
    const nbName = (notebookMap.get(note.notebookId) || 'Unfiled').replace(/[^a-zA-Z0-9_-]/g, '_');
    const folder = notesFolder?.folder(nbName) || zip;
    const filename = `${note.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'note'}.md`;

    const div = document.createElement('div');
    div.innerHTML = note.contentHtml || '';
    const plain = div.innerText || note.content;

    const md = `# ${note.title}\n\n*Created: ${note.createdAt}*\n\n---\n\n${plain}`;
    folder.file(filename, md);
  }

  // 3. Add daily journals
  if (backup.journal.length > 0) {
    const journalFolder = zip.folder('Daily_Journal');
    for (const j of backup.journal) {
      const filename = `${j.date}_${j.title.replace(/[^a-zA-Z0-9_-]/g, '_') || 'entry'}.md`;
      const div = document.createElement('div');
      div.innerHTML = j.contentHtml || '';
      const content = div.innerText || j.content;
      journalFolder?.file(filename, `# ${j.title} (${j.date})\n*Mood: ${j.mood}*\n\n${content}`);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const dateStr = new Date().toISOString().split('T')[0];
  downloadFile(blob, `Nightvault_Backup_${dateStr}.zip`, 'application/zip');
}

export function parseVaultBackup(jsonString: string): FullVaultBackup {
  const data = JSON.parse(jsonString);
  if (!data.notebooks || !data.notes) {
    throw new Error('Invalid Nightvault backup format: missing notebooks or notes.');
  }
  return data as FullVaultBackup;
}
