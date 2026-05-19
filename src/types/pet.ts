import type { PetStatus } from "@/lib/petStatus";

export interface Pet {
  id: string;
  user_id: string;
  nome: string;
  tipo: "cachorro" | "gato" | "outro";
  descricao: string | null;
  cidade: string;
  bairro: string;
  sexo: "Macho" | "Fêmea" | null;
  porte: "Pequeno" | "Médio" | "Grande" | null;
  recompensa: boolean;
  status: PetStatus;
  foto_url?: string | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  contato_nome?: string | null;
  contato_telefone?: string | null;
  last_seen?: string | null;
  last_seen_city?: string | null;
  last_seen_neighborhood?: string | null;
  last_seen_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at: string;
  updated_at?: string | null;
}

export interface PetInsertPayload {
  user_id: string;
  nome: string;
  tipo: "cachorro" | "gato" | "outro";
  descricao?: string | null;
  cidade: string;
  bairro: string;
  sexo?: "Macho" | "Fêmea" | null;
  porte?: "Pequeno" | "Médio" | "Grande" | null;
  recompensa?: boolean;
  status: PetStatus;
  foto_url?: string | null;
  owner_name?: string | null;
  owner_phone?: string | null;
  last_seen?: string | null;
  last_seen_city?: string | null;
  last_seen_neighborhood?: string | null;
  last_seen_at?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}
