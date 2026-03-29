alter table public.chat_sessions
add column if not exists flow_state text not null default 'idle';

alter table public.chat_sessions
add column if not exists journal_mood text null;

alter table public.chat_sessions
add column if not exists journal_entry_id uuid null;
