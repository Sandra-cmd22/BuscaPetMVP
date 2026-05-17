-- Salva um snapshot de contato do autor no momento da publicação do pet
ALTER TABLE public.pets
ADD COLUMN IF NOT EXISTS contato_nome text,
ADD COLUMN IF NOT EXISTS contato_telefone text;
