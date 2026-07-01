-- ============================================================
-- AeroHydroRobo — new features migration
-- Run this ONCE in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1) Profile additions: avatar + bio (skills already existed)
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists bio text;

-- 2) Posts (Feed)
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references profiles(id) on delete cascade,
  content text,
  image_url text,
  created_at timestamptz not null default now()
);

create index if not exists posts_created_at_idx on posts (created_at desc);

alter table posts enable row level security;

create policy "Posts are readable by everyone"
  on posts for select
  using (true);

create policy "Users can create their own posts"
  on posts for insert
  with check (auth.uid() = author_id);

create policy "Users can delete their own posts"
  on posts for delete
  using (auth.uid() = author_id);

-- 3) Post likes
create table if not exists post_likes (
  post_id uuid not null references posts(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table post_likes enable row level security;

create policy "Likes are readable by everyone"
  on post_likes for select
  using (true);

create policy "Users can like as themselves"
  on post_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can unlike their own like"
  on post_likes for delete
  using (auth.uid() = user_id);

-- 4) Storage buckets (avatars + post images)
-- Run these in the SQL editor too — they create public buckets.
insert into storage.buckets (id, name, public)
  values ('avatars', 'avatars', true)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
  values ('post-images', 'post-images', true)
  on conflict (id) do nothing;

-- Storage policies: anyone can view (public bucket), only the owner
-- (folder named after their user id) can upload/update/delete their own files.
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Post images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'post-images');

create policy "Users can upload their own post images"
  on storage.objects for insert
  with check (bucket_id = 'post-images' and auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================
-- Done. After running this:
-- 1. Go to Authentication → Users, find your account, copy your email.
-- 2. Put that exact email into src/config/index.js -> CONFIG.adminEmails.
-- 3. Redeploy (git push). Only that email will be able to see /admin.
-- ============================================================
