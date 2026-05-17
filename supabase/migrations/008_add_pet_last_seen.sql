-- Armazena o campo "última vez visto" dos anúncios de pets
ALTER TABLE public.pets
ADD COLUMN IF NOT EXISTS last_seen text;
