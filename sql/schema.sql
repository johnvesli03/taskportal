-- ============================================================
-- Euodoo Task & Project Portal — Supabase Schema
-- Run this in your new Supabase project's SQL Editor
-- ============================================================

-- 1. PROFILES (extends auth.users, holds role + display info)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  avatar_color text default '#6366f1',
  created_at timestamptz not null default now()
);

-- 2. PROJECTS
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'on_hold', 'completed', 'archived')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. TASKS (project_id is nullable -> standalone tasks allowed)
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'blocked', 'review', 'done')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid references public.profiles(id),
  due_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. TASK_UPDATES (the history log — every status change / progress note)
create table public.task_updates (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid references public.profiles(id),
  update_text text not null,
  old_status text,
  new_status text,
  created_at timestamptz not null default now()
);

-- Indexes for common lookups
create index idx_tasks_project on public.tasks(project_id);
create index idx_tasks_assigned on public.tasks(assigned_to);
create index idx_task_updates_task on public.task_updates(task_id);

-- Keep updated_at fresh
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();
create trigger trg_tasks_touch before update on public.tasks
  for each row execute function public.touch_updated_at();

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)), new.email);
  return new;
end;
$$;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_updates enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- PROFILES: everyone can read all profiles (needed for assignee names/avatars)
create policy "profiles_select_all" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());
create policy "profiles_update_admin" on public.profiles
  for update using (public.is_admin());

-- PROJECTS: everyone can see all projects (for context); only admins create/edit
create policy "projects_select_all" on public.projects
  for select using (auth.role() = 'authenticated');
create policy "projects_insert_admin" on public.projects
  for insert with check (public.is_admin());
create policy "projects_update_admin" on public.projects
  for update using (public.is_admin());
create policy "projects_delete_admin" on public.projects
  for delete using (public.is_admin());

-- TASKS: admins see everything; members see tasks assigned to them or created by them
create policy "tasks_select_admin_or_own" on public.tasks
  for select using (
    public.is_admin() or assigned_to = auth.uid() or created_by = auth.uid()
  );
create policy "tasks_insert_any_authenticated" on public.tasks
  for insert with check (auth.role() = 'authenticated');
create policy "tasks_update_admin_or_own" on public.tasks
  for update using (
    public.is_admin() or assigned_to = auth.uid() or created_by = auth.uid()
  );
create policy "tasks_delete_admin" on public.tasks
  for delete using (public.is_admin());

-- TASK_UPDATES: visibility follows the parent task's visibility
create policy "task_updates_select_admin_or_own" on public.task_updates
  for select using (
    public.is_admin() or exists (
      select 1 from public.tasks t
      where t.id = task_updates.task_id
      and (t.assigned_to = auth.uid() or t.created_by = auth.uid())
    )
  );
create policy "task_updates_insert_admin_or_own" on public.task_updates
  for insert with check (
    public.is_admin() or exists (
      select 1 from public.tasks t
      where t.id = task_updates.task_id
      and (t.assigned_to = auth.uid() or t.created_by = auth.uid())
    )
  );
