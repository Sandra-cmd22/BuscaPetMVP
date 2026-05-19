-- Coordenadas geograficas do pet para filtro de proximidade e ordenacao por distancia
ALTER TABLE public.pets
ADD COLUMN IF NOT EXISTS latitude double precision,
ADD COLUMN IF NOT EXISTS longitude double precision;

-- Ajuda consultas por proximidade e ordenacao
CREATE INDEX IF NOT EXISTS pets_latitude_longitude_idx
ON public.pets (latitude, longitude);
