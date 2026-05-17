import { supabase } from "@/lib/supabase";
import { PET_STATUS } from "@/lib/petStatus";
import type { Pet, PetInsertPayload } from "@/types/pet";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_MB = 5;

function getStoragePathFromPublicUrl(url: string): string | null {
  if (!url) return null;

  const cleaned = url
    .replace(/^[a-z]+:\/\/[^/]+\/storage\/v1\/object\/public\/pets\//i, "")
    .replace(/^[a-z]+:\/\/[^/]+\/storage\/v1\/object\/pets\//i, "")
    .replace(/^\/storage\/v1\/object\/public\/pets\//i, "")
    .replace(/^\/storage\/v1\/object\/pets\//i, "")
    .replace(/^pets\//i, "")
    .trim();

  return cleaned || null;
}

export async function uploadPetImage(
  file: File,
  userId: string,
): Promise<{ url: string | null; error: { message: string } | null }> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return {
      url: null,
      error: { message: "Formato inválido. Use JPG, PNG ou WebP." },
    };
  }

  if (file.size > MAX_SIZE_MB * 1024 * 1024) {
    return {
      url: null,
      error: { message: `A imagem deve ter no máximo ${MAX_SIZE_MB}MB.` },
    };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("pets")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { url: null, error: { message: error.message } };

  const { data } = supabase.storage.from("pets").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function createPet(payload: PetInsertPayload): Promise<{
  data: Pet | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from("pets")
    .insert(payload)
    .select()
    .single();

  return { data: data as Pet | null, error };
}

export async function getPets(): Promise<{
  data: Pet[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .order("created_at", { ascending: false });

  return { data: data as Pet[] | null, error };
}

export async function getMyPets(userId: string): Promise<{
  data: Pet[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await supabase
    .from("pets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data: data as Pet[] | null, error };
}

export async function updatePet(
  petId: string,
  payload: Partial<PetInsertPayload> & { last_seen?: string | null },
): Promise<{ error: { message: string } | null }> {
  const { error } = await supabase
    .from("pets")
    .update(payload)
    .eq("id", petId);

  return { error };
}

export async function markPetAsFound(petId: string): Promise<{
  error: { message: string } | null;
}> {
  const { error } = await supabase
    .from("pets")
    .update({ status: PET_STATUS.FOUND })
    .eq("id", petId);

  return { error };
}

export async function deletePet(pet: Pet): Promise<{
  error: { message: string } | null;
}> {
  const storagePath = pet.foto_url
    ? getStoragePathFromPublicUrl(pet.foto_url)
    : null;

  if (storagePath) {
    const { error: imageError } = await supabase.storage
      .from("pets")
      .remove([storagePath]);
    if (imageError) {
      return { error: { message: imageError.message } };
    }
  }

  const { error } = await supabase.from("pets").delete().eq("id", pet.id);
  return { error };
}

export async function syncMyPetContactSnapshot(params: {
  userId: string;
  nome: string;
  telefone: string;
}): Promise<{ error: { message: string } | null }> {
  const nome = params.nome.trim();
  const telefone = params.telefone.trim();
  if (!nome && !telefone) return { error: null };

  const { error } = await supabase
    .from("pets")
    .update({
      owner_name: nome || null,
      owner_phone: telefone || null,
    })
    .eq("user_id", params.userId)
    .or("owner_name.is.null,owner_name.eq.,owner_phone.is.null,owner_phone.eq.");

  return { error };
}
