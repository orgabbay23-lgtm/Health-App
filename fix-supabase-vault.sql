-- 0. Clean up any conflicting function names to prevent overloading
drop function if exists public.set_user_api_key(text);
drop function if exists public.set_gemini_api_key(text);

-- 1. Create or replace the SET function to properly store the key using built-in Vault functions
create or replace function public.set_user_api_key(secret_key text)
returns void
language plpgsql
security definer -- Elevates privileges so it can safely interact with vault
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
        -- CRITICAL FIX: Use vault.update_secret() instead of direct UPDATE 
        -- Direct updates to vault.secrets table with plain text can fail or bypass encryption
        perform vault.update_secret(v_key_id, secret_key, 'gemini_api_key_' || v_user_id, 'Gemini API Key for user ' || v_user_id);
        
        -- Update mapping timestamp
        update public.user_api_keys
        set updated_at = now()
        where user_id = v_user_id;
    else
        -- CRITICAL FIX: Use vault.create_secret() which properly encrypts and returns the UUID
        select vault.create_secret(secret_key, 'gemini_api_key_' || v_user_id, 'Gemini API Key for user ' || v_user_id) into v_key_id;

        -- Create mapping
        insert into public.user_api_keys (user_id, key_id)
        values (v_user_id, v_key_id);
    end if;
end;
$$;

-- 2. Create or replace the GET function to properly retrieve the DECRYPTED key
create or replace function public.get_user_api_key()
returns text
language plpgsql
security definer -- Needs to be security definer to read the vault
set search_path = public, vault
as $$
declare
    v_user_id uuid;
    v_key_id uuid;
    v_decrypted_secret text;
begin
    -- Get the authenticated user's ID
    v_user_id := auth.uid();
    
    if v_user_id is null then
        return null;
    end if;

    -- Get the vault key ID for this user
    select key_id into v_key_id from public.user_api_keys where user_id = v_user_id;

    if v_key_id is null then
        return null;
    end if;

    -- CRITICAL FIX: Select from decrypted_secrets to get the actual raw string!
    select decrypted_secret into v_decrypted_secret 
    from vault.decrypted_secrets 
    where id = v_key_id;

    return v_decrypted_secret;
end;
$$;
