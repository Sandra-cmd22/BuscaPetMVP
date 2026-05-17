-- Adiciona coluna foto_url na tabela pets
ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS foto_url text;

-- Cria o bucket "pets" no Supabase Storage (público para leitura)
INSERT INTO storage.buckets (id, name, public)
VALUES ('pets', 'pets', true)
ON CONFLICT (id) DO NOTHING;

-- Permite que usuários autenticados façam upload no bucket pets
CREATE POLICY "Authenticated users can upload pet images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'pets');

-- Permite leitura pública das imagens do bucket pets
CREATE POLICY "Public read access to pet images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'pets');

-- Permite que o dono delete sua própria imagem
CREATE POLICY "Owner can delete own pet images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'pets' AND auth.uid()::text = (storage.foldername(name))[1]);
