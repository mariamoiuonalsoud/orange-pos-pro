-- Link application users with Supabase Auth users.
alter table if exists public.users
add column if not exists auth_id uuid;

-- Prevent duplicate links to the same auth user.
create unique index if not exists users_auth_id_unique_idx
on public.users(auth_id)
where auth_id is not null;
