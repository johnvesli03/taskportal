-- ============================================================
-- Migration v2 — run this AFTER the original schema.sql
-- Adds: subtasks/checklists, comment-vs-update distinction,
-- @mentions, and the close-approval workflow.
-- ============================================================

-- 1. Allow a new 'pending_approval' status (member requests close,
--    admin approves -> 'done', or rejects -> back to previous status)
alter table public.tasks drop constraint if exists tasks_status_check;
alter table public.tasks add constraint tasks_status_check
  check (status in ('todo', 'in_progress', 'blocked', 'review', 'pending_approval', 'done'));

-- Remember what status a task was in before it entered pending_approval,
-- so a rejection can restore it correctly.
alter table public.tasks add column if not exists status_before_approval text;

-- 2. Comments vs. status updates, + @mentions on any update/comment
alter table public.task_updates add column if not exists kind text not null default 'update'
  check (kind in ('update', 'comment'));
alter table public.task_updates add column if not exists mentions uuid[] not null default '{}';

-- 3. Subtasks / checklists
create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index if not exists idx_subtasks_task on public.subtasks(task_id);

alter table public.subtasks enable row level security;

create policy "subtasks_select_admin_or_own" on public.subtasks
  for select using (
    public.is_admin() or exists (
      select 1 from public.tasks t where t.id = subtasks.task_id
      and (t.assigned_to = auth.uid() or t.created_by = auth.uid())
    )
  );
create policy "subtasks_insert_admin_or_own" on public.subtasks
  for insert with check (
    public.is_admin() or exists (
      select 1 from public.tasks t where t.id = subtasks.task_id
      and (t.assigned_to = auth.uid() or t.created_by = auth.uid())
    )
  );
create policy "subtasks_update_admin_or_own" on public.subtasks
  for update using (
    public.is_admin() or exists (
      select 1 from public.tasks t where t.id = subtasks.task_id
      and (t.assigned_to = auth.uid() or t.created_by = auth.uid())
    )
  );
create policy "subtasks_delete_admin_or_own" on public.subtasks
  for delete using (
    public.is_admin() or exists (
      select 1 from public.tasks t where t.id = subtasks.task_id
      and (t.assigned_to = auth.uid() or t.created_by = auth.uid())
    )
  );
