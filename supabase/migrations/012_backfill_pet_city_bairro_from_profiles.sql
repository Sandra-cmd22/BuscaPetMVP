-- Backfill de cidade/bairro para pets antigos usando o perfil do autor
UPDATE public.pets AS p
SET
  cidade = COALESCE(NULLIF(TRIM(p.cidade), ''), NULLIF(TRIM(pr.cidade), ''), p.cidade),
  bairro = COALESCE(NULLIF(TRIM(p.bairro), ''), NULLIF(TRIM(pr.bairro), ''), p.bairro)
FROM public.profiles AS pr
WHERE pr.id = p.user_id
  AND (
    p.cidade IS NULL OR TRIM(p.cidade) = '' OR
    p.bairro IS NULL OR TRIM(p.bairro) = ''
  );
