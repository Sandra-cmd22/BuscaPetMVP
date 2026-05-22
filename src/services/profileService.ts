import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import type { Profile, ProfileUpsertPayload } from "@/types/profile";

const PROFILE_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PROFILE_IMAGE_MAX_MB = 5;

function isProfilesTableMissing(error: { code?: string; message?: string } | null) {
  if (!error) return false;
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("public.profiles") === true
  );
}

function profileFromAuthMetadata(authUser: User): Profile {
  const meta = authUser.user_metadata ?? {};
  return {
    id: authUser.id,
    nome:
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      null,
    email: authUser.email ?? null,
    avatar_url:
      (typeof meta.avatar_url === "string" && meta.avatar_url) ||
      (typeof meta.picture === "string" && meta.picture) ||
      null,
    telefone: (typeof meta.telefone === "string" && meta.telefone) || null,
    cidade: (typeof meta.cidade === "string" && meta.cidade) || null,
    bairro: (typeof meta.bairro === "string" && meta.bairro) || null,
    created_at: null,
  };
}

export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.telefone?.trim() &&
      profile.cidade?.trim() &&
      profile.bairro?.trim(),
  );
}

export function isProfileCompleteFromAuth(authUser: User | null): boolean {
  const meta = authUser?.user_metadata ?? {};
  return Boolean(
    (typeof meta.telefone === "string" && meta.telefone.trim()) &&
      (typeof meta.cidade === "string" && meta.cidade.trim()) &&
      (typeof meta.bairro === "string" && meta.bairro.trim()),
  );
}

export async function getProfile(userId: string): Promise<{
  data: Profile | null;
  error: { code?: string; message?: string } | null;
}> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (isProfilesTableMissing(error)) {
    return { data: null, error: null };
  }

  return { data, error };
}

export async function upsertProfile(payload: ProfileUpsertPayload) {
  return supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();
}

export async function ensureProfileFromAuth(authUser: User) {
  const meta = authUser.user_metadata ?? {};
  const { data, error } = await upsertProfile({
    id: authUser.id,
    nome:
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      null,
    email: authUser.email ?? null,
    avatar_url:
      (typeof meta.avatar_url === "string" && meta.avatar_url) ||
      (typeof meta.picture === "string" && meta.picture) ||
      null,
  });

  if (isProfilesTableMissing(error)) {
    return { data: profileFromAuthMetadata(authUser), error: null };
  }

  return { data, error };
}

export async function saveProfileLocation(
  authUser: User,
  fields: { telefone: string; cidade: string; bairro: string },
) {
  const meta = authUser.user_metadata ?? {};
  const payload = {
    id: authUser.id,
    nome:
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      null,
    email: authUser.email ?? null,
    avatar_url:
      (typeof meta.avatar_url === "string" && meta.avatar_url) ||
      (typeof meta.picture === "string" && meta.picture) ||
      null,
    telefone: fields.telefone.trim(),
    cidade: fields.cidade.trim(),
    bairro: fields.bairro.trim(),
  };

  const { data, error } = await upsertProfile(payload);
  if (!isProfilesTableMissing(error)) {
    return { data, error };
  }

  const { data: updatedAuth, error: updateError } = await supabase.auth.updateUser({
    data: {
      ...meta,
      telefone: fields.telefone.trim(),
      cidade: fields.cidade.trim(),
      bairro: fields.bairro.trim(),
    },
  });

  if (updateError) {
    return { data: null, error: updateError };
  }

  const effectiveUser = updatedAuth.user ?? authUser;
  return { data: profileFromAuthMetadata(effectiveUser), error: null };
}

export async function uploadProfileAvatar(
  file: File,
  userId: string,
): Promise<{ url: string | null; error: { message: string } | null }> {
  if (!PROFILE_IMAGE_TYPES.includes(file.type)) {
    return {
      url: null,
      error: { message: "Formato inválido. Use JPG, PNG ou WebP." },
    };
  }

  if (file.size > PROFILE_IMAGE_MAX_MB * 1024 * 1024) {
    return {
      url: null,
      error: { message: `A imagem deve ter no máximo ${PROFILE_IMAGE_MAX_MB}MB.` },
    };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `avatars/${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("pets")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) {
    return { url: null, error: { message: error.message } };
  }

  const { data } = supabase.storage.from("pets").getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}

export async function saveProfileAvatar(authUser: User, avatarUrl: string) {
  const meta = authUser.user_metadata ?? {};
  const payload = {
    id: authUser.id,
    nome:
      (typeof meta.full_name === "string" && meta.full_name) ||
      (typeof meta.name === "string" && meta.name) ||
      null,
    email: authUser.email ?? null,
    avatar_url: avatarUrl,
    telefone: (typeof meta.telefone === "string" && meta.telefone) || null,
    cidade: (typeof meta.cidade === "string" && meta.cidade) || null,
    bairro: (typeof meta.bairro === "string" && meta.bairro) || null,
  };

  const { data, error } = await upsertProfile(payload);
  if (!isProfilesTableMissing(error)) {
    return { data, error };
  }

  const { data: updatedAuth, error: updateError } = await supabase.auth.updateUser({
    data: {
      ...meta,
      avatar_url: avatarUrl,
    },
  });

  if (updateError) {
    return { data: null, error: updateError };
  }

  const effectiveUser = updatedAuth.user ?? authUser;
  return { data: profileFromAuthMetadata(effectiveUser), error: null };
}
