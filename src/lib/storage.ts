import type { ImageAttachment } from '../types';
import { getSupabase } from './supabase';
import { putToStore, deleteFromStore } from './db';

const BUCKET_NAME = 'nightvault-media';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

export async function uploadImageFile(
  file: File,
  userId: string,
  options?: {
    notebookId?: string | null;
    noteId?: string | null;
    caption?: string;
    description?: string;
  }
): Promise<ImageAttachment> {
  const imageId = 'img-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
  const now = new Date().toISOString();
  const safeFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${userId}/${Date.now()}_${safeFilename}`;

  let fileUrl = '';
  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (!error && data) {
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath);
        fileUrl = urlData.publicUrl;
      } else {
        console.warn('Supabase upload warning, falling back to local storage:', error?.message);
      }
    } catch (err) {
      console.warn('Error during Supabase upload, saving locally:', err);
    }
  }

  // Fallback to local Data URL if Supabase is unconfigured or failed
  if (!fileUrl) {
    fileUrl = await fileToBase64(file);
  }

  const attachment: ImageAttachment = {
    id: imageId,
    userId,
    notebookId: options?.notebookId || null,
    noteId: options?.noteId || null,
    filename: file.name,
    fileUrl,
    storagePath,
    mimeType: file.type || 'image/png',
    fileSize: file.size,
    caption: options?.caption || '',
    description: options?.description || '',
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
  };

  // Always save to local IndexedDB store
  await putToStore('images', attachment);

  // If Supabase is connected, insert record into database table as well
  if (supabase) {
    try {
      await supabase.from('images').insert({
        id: attachment.id,
        user_id: attachment.userId,
        notebook_id: attachment.notebookId,
        note_id: attachment.noteId,
        filename: attachment.filename,
        file_url: attachment.fileUrl,
        storage_path: attachment.storagePath,
        mime_type: attachment.mimeType,
        file_size: attachment.fileSize,
        caption: attachment.caption,
        description: attachment.description,
        is_deleted: false,
        created_at: attachment.createdAt,
        updated_at: attachment.updatedAt,
      });
    } catch (dbErr) {
      console.warn('Could not sync image record to Supabase images table:', dbErr);
    }
  }

  return attachment;
}

export async function deleteImagePermanent(image: ImageAttachment): Promise<void> {
  // Delete from local store
  await deleteFromStore('images', image.id);

  // Delete from Supabase storage and table if online
  const supabase = getSupabase();
  if (supabase && image.storagePath) {
    try {
      await supabase.storage.from(BUCKET_NAME).remove([image.storagePath]);
      await supabase.from('images').delete().eq('id', image.id);
    } catch (err) {
      console.warn('Could not delete image from Supabase:', err);
    }
  }
}
