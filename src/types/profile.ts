export interface Profile {
  id: string;
  nome: string | null;
  email: string | null;
  avatar_url: string | null;
  telefone: string | null;
  cidade: string | null;
  bairro: string | null;
  created_at: string | null;
}

export interface ProfileLocationInput {
  telefone: string;
  cidade: string;
  bairro: string;
}

export interface ProfileUpsertPayload {
  id: string;
  nome?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  telefone?: string | null;
  cidade?: string | null;
  bairro?: string | null;
}
