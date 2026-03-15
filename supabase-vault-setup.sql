-- 1. Enable the supabase_vault extension
create extension if not exists supabase_vault with schema vault;

-- 2. Create a secure table to map users to their vault secrets
create table if not exists public.user_api_keys (
    user_id uuid references auth.users on delete cascade primary key,
    key_id uuid references vault.secrets(id) on delete set null,
    created_at timestamptz default timezone('utc'::text, now()) not null,
    updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- Enable RLS on the mapping table (strict: users can't read their own vault key_id to prevent enumeration, backend only)
alter table public.user_api_keys enable row level security;

-- 3. Create a secure RPC function for users to insert/update their personal Gemini API key
create or replace function public.set_gemini_api_key(api_key text)
returns void
language plpgsql
security definer -- Elevates privileges so it can safely interact with vault.secrets
set search_path = public, vault
as $$
declare
    v_user_id uuid;
    v_key_id uuid;
begin
    -- Get the authenticated user's ID
    v_user_id := auth.uid();
    
    if v_user_id is null then
        raise exception 'Not authenticated';
    end if;

    -- Check if user already has an API key mapping
    select key_id into v_key_id from public.user_api_keys where user_id = v_user_id;

    if v_key_id is not null then
        -- Update existing secret in vault
        update vault.secrets
        set secret = api_key, updated_at = now()
        where id = v_key_id;
        
        -- Update mapping timestamp
        update public.user_api_keys
        set updated_at = now()
        where user_id = v_user_id;
    else
        -- Insert new secret into vault
        insert into vault.secrets (secret, name, description)
        values (api_key, 'gemini_api_key_' || v_user_id, 'Gemini API Key for user ' || v_user_id)
        returning id into v_key_id;

        -- Create mapping
        insert into public.user_api_keys (user_id, key_id)
        values (v_user_id, v_key_id);
    end if;
end;
$$;
