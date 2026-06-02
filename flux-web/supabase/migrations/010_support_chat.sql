-- Support chat: conversations + messages
-- Replaces the single-reply support_tickets model with a proper multi-message thread

create table if not exists support_conversations (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  status          text not null default 'open' check (status in ('open', 'closed')),
  last_message_at timestamptz not null default now(),
  unread_admin    int not null default 0,
  unread_user     int not null default 0,
  created_at      timestamptz not null default now()
);

create table if not exists support_messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references support_conversations(id) on delete cascade not null,
  sender          text not null check (sender in ('user', 'admin')),
  body            text not null,
  created_at      timestamptz not null default now()
);

create index if not exists support_conversations_user_idx on support_conversations(user_id);
create index if not exists support_messages_conv_idx      on support_messages(conversation_id, created_at);

-- RLS
alter table support_conversations enable row level security;
alter table support_messages      enable row level security;

-- Users see only their own conversations
create policy "conv_own" on support_conversations
  for all using (auth.uid() = user_id);

-- Users can read messages in their own conversations
create policy "msg_own_read" on support_messages
  for select using (
    exists (
      select 1 from support_conversations
      where id = support_messages.conversation_id
        and user_id = auth.uid()
    )
  );

-- Users can insert their own messages
create policy "msg_own_insert" on support_messages
  for insert with check (
    sender = 'user'
    and exists (
      select 1 from support_conversations
      where id = support_messages.conversation_id
        and user_id = auth.uid()
    )
  );

-- Enable realtime
alter publication supabase_realtime add table support_messages;
alter publication supabase_realtime add table support_conversations;
