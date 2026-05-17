import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/profile";

export interface UserData {
  id: string;
  name: string;
  handle: string;
  city: string;
  bairro: string;
  phone: string;
  email: string;
  avatar: string;
}

function avatarFallback(name: string): string {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=00866f&color=fff&size=128`;
}

export function mapProfileToUserData(
  user: User,
  profile: Profile | null,
): UserData {
  const meta = user.user_metadata ?? {};
  const email = user.email ?? profile?.email ?? "";
  const name =
    profile?.nome?.trim() ||
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    (email ? email.split("@")[0] : "") ||
    "Usuário";
  const avatar =
    profile?.avatar_url?.trim() ||
    (typeof meta.avatar_url === "string" && meta.avatar_url) ||
    (typeof meta.picture === "string" && meta.picture) ||
    avatarFallback(name);
  const handle = email
    ? `@${email.split("@")[0]}`
    : `@${name.replace(/\s+/g, "").toLowerCase() || "usuario"}`;

  return {
    id: user.id,
    name,
    handle,
    email: email || "Não informado",
    city:
      profile?.cidade?.trim() ||
      (typeof meta.cidade === "string" ? meta.cidade.trim() : "") ||
      "",
    bairro:
      profile?.bairro?.trim() ||
      (typeof meta.bairro === "string" ? meta.bairro.trim() : "") ||
      "",
    phone:
      profile?.telefone?.trim() ||
      (typeof meta.telefone === "string" ? meta.telefone.trim() : "") ||
      "",
    avatar,
  };
}

export function formatUserLocation(user: UserData): string {
  if (user.city && user.bairro) return `${user.city} · ${user.bairro}`;
  return user.city || user.bairro || "Não informado";
}

export function formatUserPhone(user: UserData): string {
  return user.phone || "Não informado";
}

/** @deprecated Use mapProfileToUserData */
export function mapAuthUserToUserData(user: User): UserData {
  return mapProfileToUserData(user, null);
}
