-- VibeShelf Supabase setup
-- Run this entire file once in Supabase Dashboard > SQL Editor.
-- This script intentionally grants no direct access to customer orders.

create extension if not exists pgcrypto;

create table if not exists public.books (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  subtitle text not null default '',
  description text not null,
  long_description text not null default '',
  price integer not null check (price >= 0),
  image_path text not null,
  file_path text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key check (id ~ '^VIBE-[0-9]{6}-[0-9]{4}$'),
  book_id uuid not null references public.books(id),
  customer_name text not null check (char_length(customer_name) between 2 and 120),
  customer_email text not null check (char_length(customer_email) between 5 and 180),
  total integer not null check (total >= 0),
  status text not null default 'PENDING' check (status in ('PENDING', 'PAID')),
  email_status text not null default 'NOT_SENT' check (email_status in ('NOT_SENT', 'SENT', 'FAILED', 'SENT_DEMO')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  email_sent_at timestamptz,
  download_token_hash text,
  download_expires_at timestamptz
);

create index if not exists orders_customer_email_idx on public.orders (lower(customer_email));
create index if not exists orders_created_at_idx on public.orders (created_at desc);

alter table public.books enable row level security;
alter table public.orders enable row level security;

revoke all on table public.books from anon, authenticated;
revoke all on table public.orders from anon, authenticated;
grant select on table public.books to anon, authenticated;

drop policy if exists "Public can read active books" on public.books;
create policy "Public can read active books"
on public.books
for select
to anon, authenticated
using (active = true);

-- Customer orders contain names and emails. They are deliberately unavailable
-- through direct browser table access. Create/update/track operations must go
-- through a server or Supabase Edge Function that validates order ID + email.

insert into public.books (
  slug, title, subtitle, description, long_description, price, image_path, file_path, active
)
values
  (
    'tarot-app',
    'Tarot App',
    'ไพ่ทาโรต์ 3 กาล',
    'คู่มือสร้างแอปเปิดไพ่ 3 กาล พร้อมภาพและเสียง',
    'คู่มือพัฒนา Desktop Application สำหรับสุ่มไพ่ Major Arcana 3 ใบ พร้อมภาพ ความหมายภาษาไทย และระบบเสียงประกอบ',
    199,
    'tarot-app.png',
    'tarot-app-ebook.pdf',
    true
  ),
  (
    'task-manager-pro',
    'Task Manager PRO',
    'จัดการงานด้วย SQLite',
    'สร้างระบบจัดการงาน พร้อม Dashboard และฐานข้อมูล',
    'คู่มือสร้างระบบจัดการงาน มี Priority, Category, Dashboard, Search, CSV, Reminder และ Backup',
    249,
    'task-manager-pro.png',
    'task-manager-pro-ebook.pdf',
    true
  ),
  (
    'media-player-pro',
    'Media Player PRO',
    'เครื่องเล่นเพลงสมัยใหม่',
    'สร้างเครื่องเล่นเพลง พร้อม Playlist และระบบควบคุมเสียง',
    'คู่มือสร้างเครื่องเล่นเพลง Desktop ด้วย Python และ PyQt6 รองรับ Playlist การเล่น พัก กรอเพลง และปรับเสียง',
    179,
    'media-player-pro.png',
    'media-player-pro-ebook.pdf',
    true
  )
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  long_description = excluded.long_description,
  price = excluded.price,
  image_path = excluded.image_path,
  file_path = excluded.file_path,
  active = excluded.active,
  updated_at = now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ebooks', 'ebooks', false, 26214400, array['application/pdf'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- No storage.objects policy is created for anon/authenticated users.
-- PDF upload and signed-download URL creation must be server-side only.

