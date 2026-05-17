-- Preenche contato dos pets antigos com base no perfil de quem publicou
UPDATE public.pets AS p
SET
  contato_nome = COALESCE(NULLIF(TRIM(p.contato_nome), ''), NULLIF(TRIM(pr.nome), '')),
  contato_telefone = COALESCE(NULLIF(TRIM(p.contato_telefone), ''), NULLIF(TRIM(pr.telefone), ''))
FROM public.profiles AS pr
WHERE pr.id = p.user_id
  AND (
    p.contato_nome IS NULL OR TRIM(p.contato_nome) = '' OR
    p.contato_telefone IS NULL OR TRIM(p.contato_telefone) = ''
  );
