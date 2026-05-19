-- Campos opcionais para ultima localizacao vista no alerta
ALTER TABLE public.pets
ADD COLUMN IF NOT EXISTS last_seen_city text,
ADD COLUMN IF NOT EXISTS last_seen_neighborhood text,
ADD COLUMN IF NOT EXISTS last_seen_at timestamptz;
