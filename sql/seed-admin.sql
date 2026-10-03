-- Run this AFTER signing up admin@euodootech.com through the portal's UI.
-- This just flips their role from 'member' to 'admin'.
update public.profiles
set role = 'admin'
where email = 'admin@euodootech.com';

-- Sanity check: view both accounts and their roles
select id, name, email, role, created_at from public.profiles order by created_at;
