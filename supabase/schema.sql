-- ============================================================
-- NIGHTVAULT DATABASE SCHEMA & POLICIES (Supabase PostgreSQL)
-- ============================================================

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  avatar_url text,
  theme text default 'midnight',
  default_sort text default 'alphabetical-asc',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. NOTEBOOKS TABLE
create table if not exists public.notebooks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text default '',
  icon text default 'BookOpen',
  color text default '#8B5CF6',
  is_favorite boolean default false,
  is_archived boolean default false,
  is_deleted boolean default false,
  deleted_at timestamptz,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notebooks enable row level security;

create policy "Users can manage own notebooks"
  on public.notebooks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notebooks_user_id_idx on public.notebooks(user_id);
create index if not exists notebooks_name_idx on public.notebooks(lower(name));

-- 3. NOTES TABLE
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  notebook_id uuid references public.notebooks on delete cascade not null,
  title text not null default 'Untitled Note',
  content text default '',
  content_html text default '',
  is_pinned boolean default false,
  is_favorite boolean default false,
  is_archived boolean default false,
  is_deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.notes enable row level security;

create policy "Users can manage own notes"
  on public.notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists notes_user_id_idx on public.notes(user_id);
create index if not exists notes_notebook_id_idx on public.notes(notebook_id);
create index if not exists notes_title_idx on public.notes(lower(title));

-- 4. IMAGES AND ATTACHMENTS TABLE
create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  notebook_id uuid references public.notebooks on delete set null,
  note_id uuid references public.notes on delete set null,
  filename text not null,
  file_url text not null,
  storage_path text,
  mime_type text,
  file_size bigint default 0,
  caption text default '',
  description text default '',
  is_deleted boolean default false,
  deleted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.images enable row level security;

create policy "Users can manage own images"
  on public.images for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists images_user_id_idx on public.images(user_id);
create index if not exists images_notebook_id_idx on public.images(notebook_id);

-- 5. TAGS TABLE
create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  color text default '#8B5CF6',
  created_at timestamptz default now()
);

alter table public.tags enable row level security;

create policy "Users can manage own tags"
  on public.tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists tags_user_id_idx on public.tags(user_id);

-- 6. NOTE_TAGS JUNCTION TABLE
create table if not exists public.note_tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  note_id uuid references public.notes on delete cascade not null,
  tag_id uuid references public.tags on delete cascade not null,
  created_at timestamptz default now(),
  unique(note_id, tag_id)
);

alter table public.note_tags enable row level security;

create policy "Users can manage own note tags"
  on public.note_tags for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 7. DAILY JOURNAL TABLE
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  date text not null, -- 'YYYY-MM-DD'
  mood text default 'neutral',
  prompt text default '',
  title text default '',
  content text default '',
  content_html text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, date)
);

alter table public.journal_entries enable row level security;

create policy "Users can manage own journal entries"
  on public.journal_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 8. ACTIVITY LOGS TABLE
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  action text not null,
  entity_type text not null,
  entity_id uuid not null,
  entity_title text not null,
  details text default '',
  created_at timestamptz default now()
);

alter table public.activity_logs enable row level security;

create policy "Users can manage own activity logs"
  on public.activity_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 9. SUPABASE STORAGE BUCKET CREATION & POLICIES
-- Create storage bucket 'nightvault-media' if not exists
insert into storage.buckets (id, name, public)
values ('nightvault-media', 'nightvault-media', true)
on conflict (id) do nothing;

create policy "Allow authenticated uploads to nightvault-media"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'nightvault-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Allow users to read their own media in nightvault-media"
  on storage.objects for select
  to public
  using (bucket_id = 'nightvault-media');

create policy "Allow users to update own files in nightvault-media"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'nightvault-media' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Allow users to delete own files in nightvault-media"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'nightvault-media' and auth.uid()::text = (storage.foldername(name))[1]);

-- 10. TRIGGER TO CREATE PROFILE ON USER SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
