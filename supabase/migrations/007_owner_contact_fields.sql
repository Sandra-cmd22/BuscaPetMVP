-- Canonical contact fields for tutor data on each pet post
ALTER TABLE public.pets
ADD COLUMN IF NOT EXISTS owner_name text,
ADD COLUMN IF NOT EXISTS owner_phone text;

-- Backfill from legacy contato_* fields when available
UPDATE public.pets
SET
  owner_name = COALESCE(NULLIF(TRIM(owner_name), ''), NULLIF(TRIM(contato_nome), '')),
  owner_phone = COALESCE(NULLIF(TRIM(owner_phone), ''), NULLIF(TRIM(contato_telefone), ''))
WHERE
  owner_name IS NULL OR TRIM(owner_name) = '' OR
  owner_phone IS NULL OR TRIM(owner_phone) = '';

-- Backfill remaining missing values from profiles
UPDATE public.pets AS p
SET
  owner_name = COALESCE(NULLIF(TRIM(p.owner_name), ''), NULLIF(TRIM(pr.nome), '')),
  owner_phone = COALESCE(NULLIF(TRIM(p.owner_phone), ''), NULLIF(TRIM(pr.telefone), ''))
FROM public.profiles AS pr
WHERE pr.id = p.user_id
  AND (
    p.owner_name IS NULL OR TRIM(p.owner_name) = '' OR
    p.owner_phone IS NULL OR TRIM(p.owner_phone) = ''
  );
