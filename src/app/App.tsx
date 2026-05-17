"use client";

import React, { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { signInWithGoogle } from "@/lib/auth";
import {
  createPet,
  deletePet,
  markPetAsFound,
  updatePet,
  syncMyPetContactSnapshot,
  uploadPetImage,
} from "@/services/petService";
import { usePets } from "@/hooks/usePets";
import { useMyPets } from "@/hooks/useMyPets";
import type { Pet as DbPet } from "@/types/pet";
import {
  formatUserLocation,
  formatUserPhone,
  type UserData,
} from "@/lib/user";
import { PET_STATUS, normalizePetStatus, type PetStatus } from "@/lib/petStatus";
import { useProfile } from "@/hooks/useProfile";
import { CompleteProfileModal } from "@/components/CompleteProfileModal";
import {
  Search,
  MapPin,
  ChevronLeft,
  Camera,
  LogOut,
  Edit,
  Phone,
  Mail,
  Home,
  User,
  PlusCircle,
  Heart,
  MessageCircle,
  PawPrint,
  CheckCircle2,
  Cat,
  Dog,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Screen =
  | "onboarding"
  | "login"
  | "feed"
  | "report"
  | "detail"
  | "profile"
  | "my-pets";

interface Pet {
  id: string;
  name: string;
  type: "cachorro" | "gato" | "outro";
  gender: "Macho" | "Fêmea";
  size: "Pequeno" | "Médio" | "Grande";
  description: string;
  lastSeen: string | null;
  neighborhood: string;
  city: string;
  distance: string;
  status: PetStatus;
  photo: string;
  ownerName: string;
  ownerPhone: string;
  postedAt: string;
  userId: string;
  reward?: boolean;
}

// ─── DB → Display mapper ──────────────────────────────────────────────────────

const DOG_PLACEHOLDER =
  "https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop&auto=format";
const CAT_PLACEHOLDER =
  "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=400&fit=crop&auto=format";

function resolvePetPhotoUrl(dbPet: DbPet): string {
  if (!dbPet.foto_url) {
    return dbPet.tipo === "gato" ? CAT_PLACEHOLDER : DOG_PLACEHOLDER;
  }

  const raw = dbPet.foto_url.trim();

  // Extract object path from any legacy URL/path format and always rebuild a public URL.
  let normalizedPath = raw
    .replace("/storage/v1/object/public/Pets/", "/storage/v1/object/public/pets/")
    .replace(/^[a-z]+:\/\/[^/]+\/storage\/v1\/object\/public\/pets\//i, "")
    .replace(/^[a-z]+:\/\/[^/]+\/storage\/v1\/object\/pets\//i, "")
    .replace(/^\/storage\/v1\/object\/public\/pets\//i, "")
    .replace(/^\/storage\/v1\/object\/pets\//i, "")
    .replace(/^pets\//i, "")
    .trim();

  if (!normalizedPath.includes("/")) {
    normalizedPath = `${dbPet.user_id}/${normalizedPath}`;
  }

  const { data } = supabase.storage.from("pets").getPublicUrl(normalizedPath);
  return data.publicUrl;
}

function mapDbPetToDisplay(dbPet: DbPet): Pet {
  const ownerName =
    dbPet.owner_name?.trim() ||
    dbPet.contato_nome?.trim() ||
    "Nome não informado";
  const ownerPhone =
    dbPet.owner_phone?.trim() ||
    dbPet.contato_telefone?.trim() ||
    "";

  return {
    id: dbPet.id,
    name: dbPet.nome,
    type: dbPet.tipo,
    gender: (dbPet.sexo as "Macho" | "Fêmea") ?? "Macho",
    size: (dbPet.porte as "Pequeno" | "Médio" | "Grande") ?? "Médio",
    description: dbPet.descricao ?? "Sem descrição adicional.",
    lastSeen: dbPet.last_seen ?? null,
    neighborhood: dbPet.bairro,
    city: dbPet.cidade,
    distance: dbPet.cidade,
    status: normalizePetStatus(dbPet.status),
    photo: resolvePetPhotoUrl(dbPet),
    ownerName,
    ownerPhone,
    postedAt: dbPet.created_at,
    userId: dbPet.user_id,
    reward: dbPet.recompensa,
  };
}

function normalizeBrazilPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length >= 10) return `55${digits}`;
  return "";
}

// ─── Shared Components ────────────────────────────────────────────────────────

const IconWhatsApp = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const BuscaPetLogo = ({
  className,
}: {
  className?: string;
}) => (
  <div
    className={`relative ${className || "h-[107px] w-[142px]"}`}
  >
    <div className="absolute inset-[0_64.79%_12.15%_0]">
      <svg
        className="absolute block inset-0 size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 50 94"
      >
        <path
          d="M34.5905 35.7102C34.9751 37.5883 35.8914 41.5666 36.2104 43.5C37.4491 51.0139 34.0505 51.343 33 58C32.1622 63.2976 34.6952 74.0293 36.2104 79.3302C36.4461 80.153 38.1887 83.5676 36.9026 83.9449C35.335 84.405 32.3799 81.6408 31.5373 80.4001C31.3082 80.5334 31.336 80.7399 31.2673 80.9416C30.3444 83.6408 29.5688 91.0067 27.5333 92.6783C27.1553 92.9889 26.6088 93.2555 26.1458 93.4132C24.4293 93.9954 20.2667 94.1173 18.4455 93.8978C15.8455 93.5856 16.5213 90.3807 17.9857 89.0425C19.4502 87.7042 20.8655 88.0197 21.7638 85.805C23.1334 82.4343 23.4639 78.1529 24.4326 74.6244L24.3442 73.8862L18.2033 66.252C17.0825 73.3334 15.8275 80.7481 13.2962 87.475C12.3995 89.8571 11.5143 92.823 8.74572 93.5222C7.30908 93.8848 3.46713 93.8832 1.91595 93.7385C-1.17168 93.4507 0.021155 89.6896 1.67542 88.2831C3.30841 86.8945 5.02813 87.4457 6.0557 85.1562C8.20739 80.3594 9.16133 70.5935 8.88317 65.3512C8.33011 54.9462 2.09267 48.2973 6.13588 37.2679C7.74269 32.8858 11.1216 30.5801 12.2997 25.832C12.802 23.806 13.4222 20.4808 12.0673 18.7685C10.4589 16.736 8.00449 15.3636 8.24011 12.2075C8.49537 8.77819 14.3941 2.383 17.7485 1.48869C19.4436 1.03665 20.3419 1.57161 21.7115 1.36023C22.4674 1.24316 23.6537 0.670791 24.5831 0.475667C28.1289 -0.272309 34.8605 -0.503206 37.3444 2.59439C38.5748 4.12936 38.5339 6.45134 40.7167 6.88549C42.9355 7.32615 45.7957 7.02208 48.021 7.59444C50.711 8.28713 50.0827 11.4189 49.4478 13.4742C48.2124 17.4693 45.385 19.6596 41.4759 20.8369C40.0557 21.2645 37.8238 21.4694 36.6031 22.0109C33.6071 23.341 36.271 27.676 36.8126 29.7914C37.49 32.4402 37.3051 34.4468 34.5954 35.7086L34.5905 35.7102Z"
          fill="currentColor"
        />
      </svg>
    </div>
    <div className="absolute inset-[23.36%_35.21%_0_23.94%]">
      <svg
        className="absolute block inset-0 size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 58 82"
      >
        <path
          d="M22.3322 24.1259C21.553 24.9103 21.6643 27.1114 22.0817 28.0623C22.7922 29.6812 26.5898 30.9508 28.2219 31.8613C37.5573 37.0802 42.6825 45.118 43.7187 55.6885C43.9561 58.1031 43.8382 60.6002 44.1934 62.9824C49.3432 64.9991 58.8161 66.6326 57.9437 73.9459C57.7276 75.754 56.6374 77.2807 55.2558 78.4063C48.5526 83.8662 29.6182 82.4446 22.2405 78.5276C20.5921 77.6526 18.6065 75.7313 20.5528 74.0413C23.4076 71.562 30.0176 74.3615 33.3733 74.968C36.7339 75.5744 45.1478 76.1405 48.091 74.5637C49.1288 74.0073 49.6133 72.7507 48.5231 71.9679C46.5228 70.5302 40.8868 70.7388 38.3921 70.6563C29.5576 70.3604 20.6641 70.6175 11.828 70.3782C9.7769 69.8477 10.615 66.7134 11.8771 65.6331C12.6399 64.9813 14.7483 64.7226 14.7548 63.7813C14.7614 62.9452 13.185 59.5182 12.8265 58.3926C11.4449 54.0486 10.0437 47.5828 13.5991 43.8857C14.4061 43.0463 15.5946 42.5595 16.4589 41.8592C16.7077 41.6587 17.5883 40.8954 17.3608 40.5719C12.1341 38.9077 9.42333 43.6948 8.85367 48.0922C8.08431 54.0243 11.0504 60.5403 9.29564 66.3188C8.63432 68.5005 7.17582 70.1275 4.79735 70.4461C2.23391 70.7889 -1.19546 70.5415 0.413645 67.0854C1.13226 65.5425 3.07857 65.3598 3.84957 64.1727C4.92667 62.5182 4.32591 58.0303 4.08037 56.0362C3.41251 50.6248 1.85087 45.1633 1.18464 39.8134C0.392364 33.4543 3.06875 30.3734 4.71223 24.7534C6.70929 17.9253 5.26551 11.2605 12.3011 7.02166C13.8038 6.11599 15.6289 5.54024 17.0874 4.63457C18.2611 3.9068 19.2073 2.81352 20.322 2.00812C21.5759 1.10245 25.9154 -1.53207 26.49 1.22213C26.9205 3.28577 24.8678 5.64698 25.2541 7.2966C25.3949 7.90145 27.5 8.92518 28.1695 9.75161C29.7 11.6406 29.019 13.1365 29.3841 15.1824C29.6083 16.4325 30.7935 17.2412 30.931 18.6708C31.1831 21.3021 28.235 23.6407 25.7714 23.8865C24.691 23.9949 23.0442 23.4062 22.3289 24.1243L22.3322 24.1259Z"
          fill="currentColor"
        />
      </svg>
    </div>
    <div className="absolute inset-[30.84%_42.25%_49.53%_47.18%]">
      <svg
        className="absolute block inset-0 size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 15 21"
      >
        <path
          d="M0 0.0457057C3.05361 0.22601 6.44823 -0.279167 9.45092 0.248751C12.7915 0.836771 14.4842 2.95982 14.029 6.60976C13.8099 8.36732 12.4104 9.22823 11.2655 10.2776C15.552 10.7698 16.1553 16.9797 13.04 19.5381C12.3826 20.0774 10.278 21 9.49104 21H0.00154451V0.0457057H0ZM4.01182 8.81727H7.79219C7.87397 8.81727 8.66399 8.50052 8.8044 8.42093C10.3536 7.54377 10.5819 4.77098 8.9587 3.85322C8.81829 3.77362 8.02827 3.45687 7.94649 3.45687H4.01182V8.81727ZM4.01182 17.9137H8.25509C8.3199 17.9137 9.33674 17.4849 9.46789 17.4037C11.1914 16.3332 11.0865 13.3103 9.26885 12.2999C9.12535 12.2203 8.33996 11.9036 8.25664 11.9036H3.85906C3.80197 12.079 4.01336 12.2593 4.01336 12.3097V17.9137H4.01182Z"
          fill="currentColor"
        />
      </svg>
    </div>
    <div className="absolute inset-[55.14%_30.28%_25.23%_59.15%]">
      <svg
        className="absolute block inset-0 size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 15 21"
      >
        <path
          d="M4.12771 13.3636V21H0V0H7.85852C7.90615 0 8.12841 0.143178 8.32845 0.165451C9.44293 0.283178 10.0176 0.27523 11.1099 0.719094C16.4934 2.90341 16.1616 10.9216 10.9051 12.9166C9.01586 13.6341 6.09948 13.6245 4.12771 13.3636ZM4.12771 10.3409H8.17603C8.24271 10.3409 9.28892 9.91932 9.42387 9.84136C11.4163 8.6625 11.2591 4.85705 9.08889 3.85955C8.95554 3.7975 8.07443 3.50159 8.01728 3.50159H4.12771V10.3425V10.3409Z"
          fill="currentColor"
        />
      </svg>
    </div>
    <div className="absolute inset-[59.81%_19.72%_24.3%_69.72%]">
      <svg
        className="absolute block inset-0 size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 15 17"
      >
        <path
          d="M14.9983 9.69466H4.47302C4.56809 14.5199 10.3451 14.4409 13.3873 12.2199L14.1257 15.1268C9.75433 18.5246 1.95205 17.2939 0.374953 11.4835C-1.48225 4.64249 3.79058 -2.24731 11.0938 0.699935C12.8236 1.39766 15 3.84893 15 5.74202V9.69298L14.9983 9.69466ZM11.0938 7.00465C11.07 1.89195 4.54093 2.14918 4.47302 7.00465H11.0938Z"
          fill="currentColor"
        />
      </svg>
    </div>
    <div className="absolute inset-[35.51%_30.28%_49.53%_59.86%]">
      <svg
        className="absolute block inset-0 size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 14 16"
      >
        <path
          d="M4.02138 0.00162063V10.1207C4.02138 10.1789 4.3223 11.0791 4.38506 11.2119C5.27011 13.1272 8.12965 12.9993 9.43792 11.6021C9.52321 11.5114 9.97701 10.8168 9.97701 10.7667V0.242857L10.2168 0.0631452L14 0V15.5428H10.2989L10.2168 14.246C8.24069 16.0885 4.94023 16.5256 2.5377 15.3372C1.11357 14.6329 0 12.6609 0 11.0905V0C1.32759 0.207238 2.70506 0.273619 4.02299 0L4.02138 0.00162063Z"
          fill="currentColor"
        />
      </svg>
    </div>
    <div className="absolute inset-[35.51%_0_49.53%_90.85%]">
      <svg
        className="absolute block inset-0 size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 13 16"
      >
        <path
          d="M12.9984 15.5375H9.58815C9.47285 15.322 9.56054 14.1347 9.18379 14.2894C5.52023 18.1432 -1.70783 15.0189 0.367535 9.55757C1.05932 7.73921 3.63486 6.16455 5.60955 6.16455H8.69499C8.72909 6.16455 8.87849 6.39887 8.93695 6.32076C9.36242 2.27945 4.97297 2.73716 2.54521 4.43367C2.24317 4.38525 1.30129 2.44191 1.21523 2.10449C1.04147 1.43119 2.43479 0.875063 2.98367 0.668857C7.18962 -0.908928 12.378 0.195519 12.8344 5.15226C13.1445 8.50467 12.5031 12.1633 13 15.5375H12.9984ZM8.93858 8.82023H6.25911C5.70536 8.82023 4.31204 9.77783 4.14153 10.3761C3.43512 12.8553 6.08536 13.7317 8.01945 12.5444C8.17534 12.4491 8.93858 11.7712 8.93858 11.7102V8.82023Z"
          fill="currentColor"
        />
      </svg>
    </div>
    <div className="absolute inset-[35.51%_20.42%_49.53%_71.13%]">
      <svg
        className="absolute block inset-0 size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 12 16"
      >
        <path
          d="M10.8069 4.42595C9.52686 3.31454 4.09175 2.13375 4.12841 4.66715C4.14841 6.0182 8.10683 6.53528 9.25519 7.07916C11.2352 8.01717 12.1736 9.64725 11.9736 11.7566C11.4802 16.9416 3.62008 16.5964 0 14.8086L0.895018 11.5201C2.53505 12.4108 4.7301 13.1801 6.64514 12.7072C7.9835 12.3761 8.31517 10.9195 7.12515 10.1943C4.80177 8.78019 0.661679 9.27363 0.155002 5.5957C-0.655015 -0.279832 7.8585 -1.27144 11.7286 1.42434L10.8052 4.42595H10.8069Z"
          fill="currentColor"
        />
      </svg>
    </div>
    <div className="absolute inset-[35.51%_9.86%_49.53%_80.28%]">
      <svg
        className="absolute block inset-0 size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 14 16"
      >
        <path
          d="M13.0259 4.56722C12.8726 4.68813 11.4013 3.82287 11.0002 3.70666C7.88253 2.80371 4.85413 3.95321 4.44967 7.17401C3.79073 12.419 8.87683 14.2767 13.1102 11.4783C13.2905 11.4799 14 13.9893 14 14.2563C14 14.7996 11.8884 15.5079 11.3407 15.6366C4.66707 17.2133 -0.577437 13.5355 0.0511619 7.00127C0.458993 2.75503 4.6182 -0.118718 9.07232 0.0037695C9.94023 0.0273248 13.6006 0.710429 13.8449 1.53486L13.0225 4.56408L13.0259 4.56722Z"
          fill="currentColor"
        />
      </svg>
    </div>
    <div className="absolute inset-[57.01%_10.56%_24.3%_80.99%]">
      <svg
        className="absolute block inset-0 size-full"
        fill="none"
        preserveAspectRatio="none"
        viewBox="0 0 12 20"
      >
        <path
          d="M6.84962 4.34333H11.2801V7.40088H6.84962V14.7229C6.84962 14.8549 7.26371 15.8284 7.3847 15.9878C8.58946 17.5407 11.5988 15.896 11.7896 16.0924C11.6806 16.7988 12.3094 18.7573 11.7948 19.2352C11.4931 19.5136 9.65789 19.9191 9.1552 19.961C6.98254 20.1412 4.39239 19.7485 3.35974 17.6984C3.20979 17.4007 2.75992 16.2597 2.75992 16.0119V7.40249H0.033445C0.398111 6.40637 -0.133551 5.39416 0.033445 4.34494H2.75992V0.643694L6.76272 0C7.16657 0.23173 6.84962 0.344377 6.84962 0.402309V4.34494V4.34333Z"
          fill="currentColor"
        />
      </svg>
    </div>
  </div>
);

const SocialButton = ({
  icon,
  onClick,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
}) => (
  <button
    onClick={onClick}
    className="w-[50px] h-[50px] rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.1)] flex items-center justify-center hover:scale-105 transition-transform"
  >
    {icon}
  </button>
);

const RadioCircle = ({
  checked,
  label,
  icon,
  onClick,
}: {
  checked: boolean;
  label?: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 active:scale-95 transition-transform"
  >
    {label && (
      <div
        className={`text-[14px] font-bold ${checked ? "text-primary" : "text-foreground"}`}
      >
        {label}
      </div>
    )}
    {icon && (
      <div
        className={
          checked ? "text-primary" : "text-muted-foreground"
        }
      >
        {icon}
      </div>
    )}
    <div
      className={`w-[26px] h-[26px] rounded-full border-2 ${checked ? "border-primary bg-primary/10" : "border-border bg-white"} relative flex items-center justify-center shrink-0 transition-colors`}
    >
      {checked && (
        <div className="w-[12px] h-[12px] rounded-full bg-primary" />
      )}
    </div>
  </button>
);

function PetCard({
  pet,
  onDetail,
}: {
  pet: Pet;
  onDetail: (pet: Pet) => void;
}) {
  const trimLocationPart = (value: string, maxLength: number) =>
    value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}…` : value;

  const cityRaw = pet.city.trim();
  const neighborhoodRaw = pet.neighborhood.trim();
  const city = trimLocationPart(cityRaw, 14);
  const neighborhood = trimLocationPart(neighborhoodRaw, 14);
  const hasNeighborhood =
    neighborhoodRaw.length > 0 &&
    neighborhoodRaw.toLowerCase() !== cityRaw.toLowerCase();
  const locationTitle = hasNeighborhood
    ? `${cityRaw} · ${neighborhoodRaw}`
    : cityRaw;

  return (
    <div
      onClick={() => onDetail(pet)}
      className="bg-[#f5f4f4] rounded-[10px] shadow-[0px_4px_4px_rgba(0,0,0,0.15)] relative overflow-hidden flex h-[160px] sm:h-[187px] cursor-pointer active:scale-[0.98] transition-transform"
    >
      {/* Ribbons */}
      {pet.status === PET_STATUS.LOST && pet.reward && (
        <div className="absolute -right-8 top-5 bg-[#E53C51] text-white text-[10px] sm:text-[11px] font-bold py-1 w-[120px] rotate-45 z-10 text-center uppercase tracking-wider shadow-sm">
          Recompensa
        </div>
      )}
      {pet.status === PET_STATUS.FOUND && (
        <div className="absolute -right-8 top-5 bg-[#757575] text-white text-[10px] sm:text-[11px] font-bold py-1 w-[120px] rotate-45 z-10 text-center uppercase tracking-wider shadow-sm">
          Encontrado
        </div>
      )}

      {/* Image */}
      <div className="w-[120px] sm:w-[131px] shrink-0 bg-[#a7beb7]">
        <img
          src={pet.photo}
          alt={pet.name}
          onError={(event) => {
            const img = event.currentTarget;
            img.onerror = null;
            img.src = pet.type === "gato" ? CAT_PLACEHOLDER : DOG_PLACEHOLDER;
          }}
          className={`w-full h-full object-cover ${pet.status === PET_STATUS.FOUND ? "opacity-60" : ""}`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 p-3 sm:p-4 flex flex-col relative z-0 min-w-0">
        <h4 className="font-bold text-[16px] text-black mb-1 font-display uppercase truncate">
          {pet.name}
        </h4>

        <div className="self-start bg-[#00866f] rounded-[4px] px-1.5 py-[2px] mb-2 flex items-center max-w-full">
          <span className="text-[10px] leading-none text-white font-body truncate max-w-full">
            {pet.ownerName}
          </span>
        </div>

        <p className="text-[10px] sm:text-[11px] leading-[1.4] text-black font-body mb-2 line-clamp-3">
          {pet.description}
        </p>

        <div className="mt-auto flex items-center gap-1 min-w-0">
          <MapPin size={13} className="text-[#FF9D0B] shrink-0" />
          <p className="text-[13px] font-bold font-display text-black truncate whitespace-nowrap min-w-0" title={locationTitle}>
            <span className="text-[#FF9D0B]">{city}</span>
            {hasNeighborhood && (
              <>
                <span className="mx-1 text-[#00866f]">•</span>
                <span>{neighborhood}</span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function BottomNav({
  screen,
  onNavigate,
  profileComplete,
}: {
  screen: Screen;
  onNavigate: (s: Screen) => void;
  profileComplete: boolean;
}) {
  if (screen === "login" || screen === "onboarding")
    return null;

  if (!profileComplete) return null;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-border/30 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-[70px] px-6">
        <button
          onClick={() => onNavigate("feed")}
          className="flex flex-col items-center gap-1 p-2 w-[60px]"
        >
          <Home
            size={24}
            className={
              screen === "feed"
                ? "text-primary"
                : "text-muted-foreground"
            }
            strokeWidth={screen === "feed" ? 2.5 : 2}
          />
          <span
            className={`text-[10px] font-bold ${screen === "feed" ? "text-primary" : "text-muted-foreground"}`}
          >
            Início
          </span>
        </button>

        <button
          onClick={() => onNavigate("report")}
          className="relative -top-3 flex flex-col items-center"
        >
          <div className="w-[56px] h-[56px] rounded-full bg-primary flex items-center justify-center shadow-lg border-4 border-white text-white hover:scale-105 transition-transform">
            <PlusCircle size={32} strokeWidth={2} />
          </div>
        </button>

        <button
          onClick={() => onNavigate("profile")}
          className="flex flex-col items-center gap-1 p-2 w-[60px]"
        >
          <User
            size={24}
            className={
              screen === "profile" || screen === "my-pets"
                ? "text-primary"
                : "text-muted-foreground"
            }
            strokeWidth={screen === "profile" || screen === "my-pets" ? 2.5 : 2}
          />
          <span
            className={`text-[10px] font-bold ${screen === "profile" || screen === "my-pets" ? "text-primary" : "text-muted-foreground"}`}
          >
            Perfil
          </span>
        </button>
      </div>
    </nav>
  );
}

// ─── Screens ──────────────────────────────────────────────────────────────────

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [view, setView] = useState<
    "choice" | "login" | "register"
  >("choice");
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) {
      console.error(error.message);
      setGoogleLoading(false);
    }
  };

  if (view === "login") {
    return (
      <div className="min-h-screen bg-white relative w-full overflow-y-auto flex flex-col px-[18px] py-12 safe-area-container">
        <button
          onClick={() => setView("choice")}
          className="absolute top-10 left-[18px]"
        >
          <BuscaPetLogo className="w-[45px] h-[34px] text-primary" />
        </button>

        <div className="mt-16 flex-1 flex flex-col">
          <h1 className="text-center font-extrabold text-[30px] font-display text-black mb-10">
            Login
          </h1>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[14px] font-display text-black">
                Email
              </label>
              <input
                type="email"
                className="h-[48px] rounded-[8px] border border-[#a9a7a7] px-4 outline-none focus:border-primary transition-colors text-black"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[14px] font-display text-black">
                Senha
              </label>
              <input
                type="password"
                className="h-[48px] rounded-[8px] border border-[#a9a7a7] px-4 outline-none focus:border-primary transition-colors text-black"
              />
            </div>
          </div>

          <div className="flex justify-end mt-3">
            <button className="text-[#1c5cb5] font-semibold text-[14px] font-display hover:underline">
              Esqueceu sua senha?
            </button>
          </div>

          <button
            onClick={onLogin}
            className="w-full h-[48px] bg-primary text-white rounded-[8px] font-bold text-[16px] font-display mt-12 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center"
          >
            Entrar
          </button>

          <div className="mt-6 flex justify-center gap-1">
            <span className="text-[#757575] font-semibold text-[14px] font-display">
              Ainda não tem uma conta?
            </span>
            <button
              onClick={() => setView("register")}
              className="text-[#1c5cb5] font-semibold text-[14px] font-display hover:underline underline-offset-2"
            >
              Criar Conta
            </button>
          </div>

          <div className="mt-8 flex items-center gap-4 px-4">
            <div className="flex-1 h-px bg-[#5990DE]/50" />
            <span className="text-[#757575] font-semibold text-[14px] font-display">
              Ou continue com
            </span>
            <div className="flex-1 h-px bg-[#5990DE]/50" />
          </div>

          <div className="mt-6 flex justify-center gap-5 pb-8">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              aria-label="Entrar com Google"
              className="w-[52px] h-[52px] rounded-full bg-white border border-border/50 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg
                width="30"
                height="30"
                viewBox="0 0 40 40"
                fill="none"
              >
                <path
                  d="M28.4 20.4c0-.7-.1-1.4-.2-2.1h-8V22h4.7c-.2 1.1-.8 2-1.7 2.7v2.2h2.7c1.6-1.5 2.5-3.6 2.5-6.5z"
                  fill="#4285F4"
                />
                <path
                  d="M20.2 28.7c2.3 0 4.2-.8 5.6-2.1l-2.7-2.2c-.8.5-1.7.8-2.9.8-2.2 0-4-1.5-4.7-3.5h-2.8v2.2c1.4 2.8 4.2 4.8 7.5 4.8z"
                  fill="#34A853"
                />
                <path
                  d="M15.5 21.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7v-2.2h-2.8c-.6 1.1-1 2.3-1 3.9s.4 2.8 1 3.9l2.8-2.2z"
                  fill="#FBBC05"
                />
                <path
                  d="M20.2 15.3c1.2 0 2.3.4 3.2 1.2l2.4-2.4c-1.5-1.4-3.4-2.3-5.6-2.3-3.3 0-6.1 2-7.5 4.8l2.8 2.2c.7-2 2.5-3.5 4.7-3.5z"
                  fill="#EA4335"
                />
              </svg>
            </button>
            <button className="w-[52px] h-[52px] rounded-full bg-white border border-border/50 shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors">
              <svg
                width="30"
                height="30"
                viewBox="0 0 40 40"
                fill="none"
              >
                <path
                  d="M24.5 20h-2.6v9.5h-3.9V20h-1.9v-3.3h1.9v-2.1c0-2.6 1.2-4.1 4.3-4.1h2.7v3.2h-1.9c-1.3 0-1.5.5-1.5 1.5v1.5h3.4l-.5 3.3z"
                  fill="#1877F2"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "register") {
    return (
      <div className="min-h-screen bg-white relative w-full overflow-y-auto flex flex-col px-[18px] py-12 safe-area-container">
        <button
          onClick={() => setView("choice")}
          className="absolute top-10 left-[18px]"
        >
          <BuscaPetLogo className="w-[45px] h-[34px] text-primary" />
        </button>

        <div className="mt-8 flex-1 flex flex-col">
          <h1 className="text-center font-extrabold text-[30px] font-display text-black mb-8">
            Registro
          </h1>

          <div className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[14px] font-display text-black">
                Nome completo
              </label>
              <input
                type="text"
                className="h-[48px] rounded-[8px] border border-[#a9a7a7] px-4 outline-none focus:border-primary transition-colors text-black"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[14px] font-display text-black">
                Email
              </label>
              <input
                type="email"
                className="h-[48px] rounded-[8px] border border-[#a9a7a7] px-4 outline-none focus:border-primary transition-colors text-black"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[14px] font-display text-black">
                Cidade
              </label>
              <input
                type="text"
                className="h-[48px] rounded-[8px] border border-[#a9a7a7] px-4 outline-none focus:border-primary transition-colors text-black"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[14px] font-display text-black">
                Telefone
              </label>
              <input
                type="tel"
                className="h-[48px] rounded-[8px] border border-[#a9a7a7] px-4 outline-none focus:border-primary transition-colors text-black"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[14px] font-display text-black">
                Senha
              </label>
              <input
                type="password"
                className="h-[48px] rounded-[8px] border border-[#a9a7a7] px-4 outline-none focus:border-primary transition-colors text-black"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-[14px] font-display text-black">
                Confirmar senha
              </label>
              <input
                type="password"
                className="h-[48px] rounded-[8px] border border-[#a9a7a7] px-4 outline-none focus:border-primary transition-colors text-black"
              />
            </div>
          </div>

          <button
            onClick={onLogin}
            className="w-full h-[48px] bg-primary text-white rounded-[8px] font-bold text-[16px] font-display mt-8 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center"
          >
            Criar conta
          </button>

          <div className="mt-6 flex justify-center gap-1 pb-8">
            <span className="text-[#757575] font-semibold text-[16px] font-display">
              Ja tenho conta?
            </span>
            <button
              onClick={() => setView("login")}
              className="text-[#1c5cb5] font-semibold text-[16px] font-display hover:underline underline-offset-2"
            >
              Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative w-full overflow-hidden flex flex-col">
      <div className="h-[62vh] w-full bg-primary rounded-bl-[150px] relative flex flex-col items-center justify-center shrink-0">
        <BuscaPetLogo className="w-[180px] h-[135px] text-white" />
      </div>

      <div className="flex-1 flex flex-col justify-end px-[18px] pb-12 gap-4">
        <button
          onClick={() => setView("login")}
          className="w-full h-[48px] bg-primary text-white rounded-[8px] font-extrabold text-[16px] font-display hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center"
        >
          Login
        </button>
        <button
          onClick={() => setView("register")}
          className="w-full h-[48px] bg-white border-2 border-primary text-primary rounded-[8px] font-extrabold text-[16px] font-display hover:bg-primary/5 active:scale-[0.98] transition-all flex items-center justify-center"
        >
          Registrar
        </button>
      </div>
    </div>
  );
}

function FeedScreen({
  pets,
  petsLoading,
  onDetail,
  onOpenProfile,
  onEditLocation,
  user,
}: {
  pets: Pet[];
  petsLoading: boolean;
  onDetail: (pet: Pet) => void;
  onOpenProfile: () => void;
  onEditLocation: () => void;
  user: UserData;
}) {
  const [activeFilter, setActiveFilter] = useState<
    "Todos" | "Perdidos" | "Encontrados" | "Cachorros" | "Gatos"
  >("Todos");
  const [search, setSearch] = useState("");

  const filteredPets = pets.filter((pet) => {
    if (activeFilter === "Todos") return true;
    if (activeFilter === "Perdidos")
      return pet.status === PET_STATUS.LOST;
    if (activeFilter === "Encontrados")
      return pet.status === PET_STATUS.FOUND;
    if (activeFilter === "Cachorros")
      return pet.type === "cachorro";
    if (activeFilter === "Gatos") return pet.type === "gato";
    return true;
  }).filter((pet) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;

    const animalTerms =
      pet.type === "cachorro"
        ? "cachorro cao cão dog canino"
        : pet.type === "gato"
          ? "gato cat felino"
          : "pet animal";

    return (
      pet.name.toLowerCase().includes(q) ||
      pet.type.toLowerCase().includes(q) ||
      animalTerms.includes(q) ||
      pet.description.toLowerCase().includes(q) ||
      pet.neighborhood.toLowerCase().includes(q) ||
      pet.city.toLowerCase().includes(q)
    );
  });

  const renderFilterContent = (
    filter: "Todos" | "Perdidos" | "Encontrados" | "Cachorros" | "Gatos",
  ) => {
    if (filter === "Todos") {
      return (
        <>
          <PawPrint size={14} strokeWidth={2.2} />
          <span>Todos</span>
        </>
      );
    }
    if (filter === "Perdidos") {
      return (
        <>
          <Search size={14} strokeWidth={2.2} />
          <span>Perdidos</span>
        </>
      );
    }
    if (filter === "Encontrados") {
      return (
        <>
          <CheckCircle2 size={14} strokeWidth={2.2} />
          <span>Achados</span>
        </>
      );
    }
    if (filter === "Cachorros") {
      return (
        <>
          <Dog size={14} strokeWidth={2.2} />
          <span>Cachorros</span>
        </>
      );
    }

    return (
      <>
        <Cat size={14} strokeWidth={2.2} />
        <span>Gatos</span>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-0 safe-area-top">
      <div className="px-3 sm:px-5 pt-6 sm:pt-8 safe-area-left safe-area-right">
        {/* Header - Responsive spacing */}
        <div className="flex justify-between items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={onEditLocation}
              className="flex items-center gap-2 sm:gap-3 text-left shrink-0"
            >
              <div className="w-10 sm:w-[44px] h-10 sm:h-[44px] bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                <MapPin size={18} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[12px] text-muted-foreground font-semibold font-display uppercase tracking-wider">
                  Localização
                </p>
                <div className="flex items-center gap-1 text-[13px] sm:text-[15px] font-extrabold text-foreground font-display h-5 truncate">
                  {formatUserLocation(user)}
                </div>
              </div>
            </button>
          </div>
          <button type="button" onClick={onOpenProfile} className="shrink-0">
            <img
              src={user.avatar}
              className="w-10 sm:w-[44px] h-10 sm:h-[44px] rounded-full object-cover border-2 border-primary/20"
              alt={user.name}
            />
          </button>
        </div>

        {/* Search - Responsive height */}
        <div className="relative mb-4 sm:mb-6">
          <Search
            className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={18}
            strokeWidth={2}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Procurar por animal ou raça..."
            className="w-full h-12 bg-white rounded-lg border border-stone-300 pl-10 pr-3 text-[13px] sm:text-[14px] text-foreground outline-none font-body shadow-sm focus:border-primary transition-colors"
          />
        </div>

        {/* Hero */}
        <div className="relative h-[160px] bg-primary rounded-[16px] overflow-hidden mb-8 flex shadow-md">
          <div className="flex-[1.3] p-5 flex flex-col justify-center z-10 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/40 z-0" />
            <div className="relative z-10">
              <BuscaPetLogo className="w-[85px] h-[64px] text-white mb-3" />
              <p className="text-[11px] text-primary-foreground/90 font-body leading-snug w-[95%]">
                Ajude a reunir famílias e seus melhores amigos.
              </p>
            </div>
          </div>
          <div className="flex-[0.7] relative flex justify-end h-full items-end overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-[140px] h-[140px] bg-white/10 rounded-full blur-xl" />
            <img
              src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&h=300&fit=crop"
              className="relative z-10 w-full h-full object-cover scale-110 -translate-x-2 translate-y-2 opacity-90 mix-blend-luminosity"
              alt="Dog"
            />
          </div>
        </div>

        {/* List Header - Responsive typography */}
        <div className="flex flex-col mb-3 sm:mb-4">
          <div className="flex justify-between items-end px-0 sm:px-1 mb-3 sm:mb-4">
            <div>
              <h3 className="text-foreground text-base sm:text-lg md:text-[18px] font-extrabold font-display">
                Últimos registrados
              </h3>
              <p className="text-[11px] sm:text-[13px] text-muted-foreground mt-0.5 font-body">
                Perto de você
              </p>
            </div>
          </div>

          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 px-0 sm:px-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {(
              [
                "Todos",
                "Perdidos",
                "Encontrados",
                "Cachorros",
                "Gatos",
              ] as const
            ).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full font-bold text-[11px] sm:text-[13px] font-display whitespace-nowrap transition-colors inline-flex items-center gap-1 sm:gap-1.5 ${
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-border/30"
                }`}
              >
                {renderFilterContent(filter)}
              </button>
            ))}
          </div>
        </div>

        {/* Pets List - Responsive gap */}
        <div className="space-y-3 sm:space-y-4 mb-8">
          {petsLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filteredPets.length > 0 ? (
            filteredPets.map((pet) => (
              <PetCard
                key={pet.id}
                pet={pet}
                onDetail={onDetail}
              />
            ))
          ) : (
            <div className="bg-card rounded-[12px] sm:rounded-[16px] border border-dashed border-border p-4 sm:p-8 flex flex-col items-center justify-center text-center mt-4 sm:mt-6">
              <div className="w-16 sm:w-[80px] h-16 sm:h-[80px] bg-primary/10 rounded-full flex items-center justify-center text-primary mb-3 sm:mb-4">
                <Search size={32} strokeWidth={1.5} className="sm:w-10 sm:h-10" />
              </div>
              <h4 className="font-extrabold text-base sm:text-lg md:text-[18px] font-display text-foreground mb-1.5 sm:mb-2">
                {activeFilter === "Todos"
                  ? "Nenhum pet publicado ainda."
                  : "Nenhum pet encontrado"}
              </h4>
              <p className="text-xs sm:text-sm md:text-[14px] text-muted-foreground font-body leading-relaxed max-w-xs sm:max-w-[250px]">
                {activeFilter === "Todos"
                  ? "Seja o primeiro a publicar um alerta de pet perdido!"
                  : "Não encontramos nenhum amiguinho com esses filtros na sua região."}
              </p>
              {activeFilter !== "Todos" && (
                <button
                  onClick={() => setActiveFilter("Todos")}
                  className="mt-4 sm:mt-6 font-bold text-primary text-xs sm:text-sm md:text-[14px] font-display underline"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailScreen({
  pet,
  onBack,
}: {
  pet: Pet;
  onBack: () => void;
}) {
  const normalizedPhone = normalizeBrazilPhone(pet.ownerPhone);
  const canContact = normalizedPhone.length > 0;
  const whatsappLink = canContact ? `https://wa.me/${normalizedPhone}` : "";

  return (
    <div className="min-h-screen bg-background pb-0 relative safe-area-top">
      {/* Header Image - Responsive height */}
      <div className="relative h-[240px] sm:h-[300px] md:h-[340px] bg-muted w-full">
        <img
          src={pet.photo}
          className="w-full h-full object-cover"
          alt={pet.name}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />
        <button
          onClick={onBack}
          className="absolute top-6 sm:top-8 md:top-10 left-3 sm:left-4 w-9 sm:w-10 h-9 sm:h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white z-20 hover:bg-white/30 active:scale-90 transition-all"
        >
          <ChevronLeft size={20} strokeWidth={2.5} className="sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Content Sheet - Responsive padding */}
      <div className="bg-background rounded-t-[24px] sm:rounded-t-[32px] -mt-[30px] sm:-mt-[40px] relative z-10 pt-6 sm:pt-8 px-4 sm:px-6 shadow-[0_-8px_20px_rgba(0,0,0,0.08)] min-h-[500px] safe-area-left safe-area-right">
        {/* Header section - Responsive typography */}
        <div className="flex justify-between items-start mb-4 sm:mb-6 gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-extrabold text-xl sm:text-2xl md:text-[32px] font-display text-foreground leading-tight sm:leading-none mb-1 uppercase tracking-tight truncate">
              {pet.name}
            </h1>
            <p className="text-primary font-bold text-xs sm:text-sm md:text-[14px] font-body flex items-center gap-1 mt-1 sm:mt-2 truncate">
              <MapPin size={12} className="sm:w-4 sm:h-4 shrink-0" /> 
              <span className="truncate">{pet.distance}</span>
              <span className="mx-1">•</span>
              <span className="truncate">{pet.neighborhood}</span>
            </p>
          </div>
          <button className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-muted flex items-center justify-center text-primary shrink-0 active:scale-90 transition-transform">
            <Heart size={20} strokeWidth={2} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Tags - Responsive */}
        <div className="flex gap-2 sm:gap-3 mb-6 sm:mb-8 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="bg-primary/10 text-primary text-[11px] sm:text-[12px] md:text-[13px] font-bold py-1 sm:py-1.5 px-3 sm:px-5 rounded-full font-body whitespace-nowrap">
            {pet.type === "gato" ? "Gato" : "Cachorro"}
          </div>
          <div className="bg-primary/10 text-primary text-[11px] sm:text-[12px] md:text-[13px] font-bold py-1 sm:py-1.5 px-3 sm:px-5 rounded-full font-body whitespace-nowrap">
            {pet.gender}
          </div>
          <div className="bg-primary/10 text-primary text-[11px] sm:text-[12px] md:text-[13px] font-bold py-1 sm:py-1.5 px-3 sm:px-5 rounded-full font-body whitespace-nowrap">
            {pet.size}
          </div>
        </div>

        {/* About section */}
        <div className="mb-8 sm:mb-10">
          <h4 className="font-extrabold text-base sm:text-lg md:text-[18px] mb-2 sm:mb-3 font-display text-foreground">
            Sobre
          </h4>
          <p className="text-xs sm:text-sm md:text-[14px] text-muted-foreground leading-relaxed sm:leading-[1.6] font-body">
            <strong className="text-foreground">
              Desapareceu em:
            </strong>{" "}
            {new Date(pet.postedAt).toLocaleDateString("pt-BR")}
            <br />
            <strong className="text-foreground">
              Visto por último:
            </strong>{" "}
            {pet.neighborhood}, {pet.city}
            <br />
            <br />
            {pet.description}
          </p>
        </div>

        {/* Contact Info */}
        <div className="mb-8 sm:mb-10">
          <h4 className="font-extrabold text-base sm:text-lg md:text-[18px] flex items-center gap-2 mb-3 sm:mb-4 font-display text-foreground">
            <MessageCircle size={18} className="sm:w-5 sm:h-5 text-primary" />{" "}
            Informações
          </h4>

          <div className="bg-card border border-border/40 rounded-[12px] sm:rounded-[16px] p-3 sm:p-4 flex gap-3 sm:gap-4 items-start sm:items-center min-w-0">
            <div className="w-10 sm:w-12 h-10 sm:h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary shrink-0">
              <User size={20} className="sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] sm:text-[10px] md:text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-display mb-0.5">
                Dono(a)
              </p>
              <p className="font-bold text-xs sm:text-sm md:text-base font-body text-foreground truncate">
                {pet.ownerName}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Responsive size */}
        <div className="flex gap-2 sm:gap-4">
          <button
            type="button"
            onClick={() => {
              if (!canContact) {
                window.alert("Telefone do tutor não disponível neste anúncio.");
                return;
              }
              window.open(whatsappLink, "_blank", "noopener,noreferrer");
            }}
            className="flex-1 bg-[#25D366] h-12 sm:h-[54px] rounded-[10px] sm:rounded-[14px] flex items-center justify-center gap-1 sm:gap-2 text-white font-bold text-xs sm:text-sm md:text-base font-display shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <IconWhatsApp /> 
            <span className="hidden sm:inline">WhatsApp</span>
            <span className="sm:hidden">Chat</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (!canContact) {
                window.alert("Telefone do tutor não disponível neste anúncio.");
                return;
              }
              window.location.href = `tel:+${normalizedPhone}`;
            }}
            className="w-12 sm:w-[54px] h-12 sm:h-[54px] bg-primary rounded-[10px] sm:rounded-[14px] flex items-center justify-center text-white shadow-md hover:opacity-90 active:scale-[0.98] transition-all"
          >
            <Phone size={20} strokeWidth={2} className="sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}

function ReportScreen({
  onSuccess,
  onBack,
  user,
  authUserId,
}: {
  onSuccess: () => void;
  onBack: () => void;
  user: UserData;
  authUserId: string;
}) {
  const [petType, setPetType] = useState<"cachorro" | "gato" | "outro">("cachorro");
  const [porte, setPorte] = useState<"Pequeno" | "Médio" | "Grande">("Médio");
  const [sexo, setSexo] = useState<"Macho" | "Fêmea">("Macho");
  const [reward, setReward] = useState("Não");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [cidade, setCidade] = useState(user.city || "");
  const [bairro, setBairro] = useState(user.bairro || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCidade((current) => (current ? current : user.city || ""));
    setBairro((current) => (current ? current : user.bairro || ""));
  }, [user.city, user.bairro]);

  // Revoke object URL on unmount or when preview changes to avoid memory leaks
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handlePublicar = async () => {
    if (!cidade.trim()) {
      setSubmitError("Informe a cidade onde o pet foi visto por último.");
      return;
    }
    if (!bairro.trim()) {
      setSubmitError("Informe a localização onde o pet foi visto por último.");
      return;
    }
    setLoading(true);
    setSubmitError(null);

    let fotoUrl: string | null = null;
    if (photoFile) {
      const { url, error: uploadErr } = await uploadPetImage(photoFile, authUserId);
      if (uploadErr) {
        setSubmitError(uploadErr.message);
        setLoading(false);
        return;
      }
      fotoUrl = url;
    }

    try {
      const { error } = await createPet({
        user_id: authUserId,
        nome: nome.trim() || "Sem nome",
        tipo: petType,
        descricao: descricao.trim() || null,
        last_seen: bairro.trim(),
        cidade: cidade.trim(),
        bairro: bairro.trim(),
        owner_name: user.name?.trim() || null,
        owner_phone: user.phone?.trim() || null,
        sexo,
        porte,
        recompensa: reward === "Sim",
        status: PET_STATUS.LOST,
        foto_url: fotoUrl,
      });
      if (error) throw new Error(error.message);
      onSuccess();
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Não foi possível publicar. Tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-0 px-6 pt-8 safe-area-container">
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center -ml-2 rounded-full hover:bg-muted transition-colors"
        >
          <ChevronLeft
            size={28}
            className="text-foreground"
            strokeWidth={2}
          />
        </button>
        <h1 className="font-extrabold text-[22px] font-display text-foreground">
          Novo Pet
        </h1>
      </div>

      <div className="bg-card border border-border/40 rounded-[16px] p-1 flex mb-8">
        <button className="flex-1 bg-primary text-primary-foreground font-bold text-[14px] rounded-[12px] py-2.5 font-display shadow-sm">
          Pet Perdido
        </button>
      </div>

      <div className="mb-8">
        <label className="block text-[14px] font-bold font-display mb-3 text-foreground">
          Fotos do Pet
        </label>
        {/* Hidden file input – opens camera/gallery on mobile */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        <div className="grid grid-cols-4 gap-3">
          {/* Main photo button / preview */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="col-span-2 aspect-square bg-primary/5 border-2 border-dashed border-primary/40 rounded-[16px] flex flex-col items-center justify-center text-primary gap-2 active:scale-95 transition-transform cursor-pointer overflow-hidden"
          >
            {photoPreview ? (
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-full object-cover rounded-[14px]"
              />
            ) : (
              <>
                <Camera size={28} strokeWidth={2} />
                <span className="text-[12px] font-bold font-display">
                  Câmera
                </span>
              </>
            )}
          </div>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="aspect-square bg-card border border-border/40 rounded-[16px] flex items-center justify-center"
            >
              <PlusCircle
                size={24}
                className="text-muted-foreground/50"
              />
            </div>
          ))}
        </div>
        {photoFile && (
          <p className="text-[11px] text-muted-foreground font-body mt-2 truncate">
            {photoFile.name}
          </p>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-[13px] font-bold font-display mb-1.5 text-foreground/80">
            Nome do Pet (opcional)
          </label>
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex: Rex, Mel..."
            className="w-full h-[52px] bg-card rounded-[12px] border border-border/60 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-base font-body"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-bold font-display mb-2 text-foreground/80">
              Espécie
            </label>
            <div className="flex gap-4">
              <RadioCircle
                onClick={() => setPetType("cachorro")}
                checked={petType === "cachorro"}
                icon={
                  <Dog
                    size={24}
                    strokeWidth={
                      petType === "cachorro" ? 2.5 : 1.5
                    }
                  />
                }
              />
              <RadioCircle
                onClick={() => setPetType("gato")}
                checked={petType === "gato"}
                icon={
                  <Cat
                    size={24}
                    strokeWidth={petType === "gato" ? 2.5 : 1.5}
                  />
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-bold font-display mb-2 text-foreground/80">
              Sexo
            </label>
            <div className="flex gap-4">
              <RadioCircle
                onClick={() => setSexo("Macho")}
                checked={sexo === "Macho"}
                label="M"
              />
              <RadioCircle
                onClick={() => setSexo("Fêmea")}
                checked={sexo === "Fêmea"}
                label="F"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold font-display mb-2 text-foreground/80">
            Porte
          </label>
          <div className="flex gap-6 bg-card border border-border/60 rounded-[12px] p-3">
            <RadioCircle
              onClick={() => setPorte("Pequeno")}
              checked={porte === "Pequeno"}
              label="P"
            />
            <RadioCircle
              onClick={() => setPorte("Médio")}
              checked={porte === "Médio"}
              label="M"
            />
            <RadioCircle
              onClick={() => setPorte("Grande")}
              checked={porte === "Grande"}
              label="G"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold font-display mb-2 text-foreground/80">
            Oferece recompensa?
          </label>
          <div className="flex gap-6">
            <RadioCircle
              onClick={() => setReward("Sim")}
              checked={reward === "Sim"}
              label="Sim"
            />
            <RadioCircle
              onClick={() => setReward("Não")}
              checked={reward === "Não"}
              label="Não"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold font-display mb-1.5 text-foreground/80">
            Cidade
          </label>
          <input
            value={cidade}
            onChange={(e) => setCidade(e.target.value)}
            placeholder="Cidade"
            className="w-full h-[52px] bg-card rounded-[12px] border border-border/60 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-base font-body"
          />
        </div>

        <div>
          <label className="block text-[13px] font-bold font-display mb-1.5 text-foreground/80">
            Localização (Última vez visto)
          </label>
          <div className="relative">
            <MapPin
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
              size={20}
            />
            <input
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Rua, Bairro, Cidade"
              className="w-full h-[52px] bg-card rounded-[12px] border border-border/60 pl-11 pr-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-base font-body"
            />
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-bold font-display mb-1.5 text-foreground/80">
            Detalhes adicionais
          </label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Coleira, manchas, comportamento..."
            className="w-full rounded-[12px] bg-card border border-border/60 p-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-base h-[100px] resize-none font-body"
          />
        </div>
      </div>

      {submitError && (
        <p className="text-[13px] text-destructive font-semibold font-body text-center mt-6 px-2">
          {submitError}
        </p>
      )}

      <button
        onClick={handlePublicar}
        disabled={loading}
        className="w-full bg-primary text-primary-foreground font-bold text-[16px] font-display h-[56px] rounded-[14px] mt-4 shadow-md active:scale-[0.98] transition-transform flex items-center justify-center disabled:opacity-60"
      >
        {loading ? (
          <span className="w-6 h-6 rounded-full border-2 border-white border-t-transparent animate-spin" />
        ) : (
          "Publicar Alerta"
        )}
      </button>
    </div>
  );
}

function OnboardingScreen({
  onFinish,
}: {
  onFinish: () => void;
}) {
  const [step, setStep] = useState(0);

  // Splash screen timeout
  React.useEffect(() => {
    if (step === 0) {
      const timer = setTimeout(() => {
        setStep(1);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  if (step === 0) {
    return (
      <div className="absolute inset-0 bg-primary flex items-center justify-center w-full overflow-hidden">
        <BuscaPetLogo className="w-[200px] h-[150px] text-white" />
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="min-h-screen bg-white relative w-full overflow-hidden flex flex-col">
        <div className="h-[60vh] w-full relative bg-primary rounded-bl-[120px] overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1629740067905-bd3f515aa739?w=800&fit=crop"
            alt="Puppy"
            className="w-full h-full object-cover"
          />
        </div>
      <div className="flex-1 px-6 pt-10 pb-8 flex flex-col justify-between safe-area-left safe-area-right">
          <div>
            <h2 className="font-extrabold text-[28px] font-display text-primary leading-tight mb-3">
              Bem-vindo ao BuscaPet
            </h2>
            <p className="font-body text-[16px] text-muted-foreground leading-relaxed">
              Um lugarzinho onde ajudamos você e outras pessoas
              a encontrar seu amiguinho
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 mt-8">
            <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <div className="w-2 h-2 rounded-full bg-secondary" />
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full bg-primary text-primary-foreground font-bold text-[16px] font-display h-[56px] rounded-[14px] shadow-md active:scale-[0.98] transition-transform"
            >
              Próximo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white relative w-full overflow-hidden flex flex-col">
      <div className="h-[60vh] w-full relative bg-primary rounded-bl-[120px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1542583479-28899e4763ea?w=800&fit=crop"
          alt="Woman hugging dog"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 px-6 pt-10 pb-8 flex flex-col justify-between safe-area-left safe-area-right">
        <div>
          <h2 className="font-extrabold text-[28px] font-display text-primary leading-tight mb-3">
            Adote um pet
          </h2>
          <p className="font-body text-[16px] text-muted-foreground leading-relaxed">
            Aqui também ajudamos a você adotar um amiguinho
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 mt-8">
          <div className="flex gap-2">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <div className="w-2 h-2 rounded-full bg-secondary" />
            <div className="w-2 h-2 rounded-full bg-secondary" />
          </div>
          <button
            onClick={onFinish}
            className="w-full bg-primary text-primary-foreground font-bold text-[16px] font-display h-[56px] rounded-[14px] shadow-md active:scale-[0.98] transition-transform"
          >
            Começar
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileScreen({
  user,
  onBack,
  onOpenMyPets,
  onSaveProfile,
  onLogout,
}: {
  user: UserData;
  onBack: () => void;
  onOpenMyPets: () => void;
  onSaveProfile: (fields: {
    telefone: string;
    cidade: string;
    bairro: string;
  }) => Promise<void>;
  onLogout: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [telefone, setTelefone] = useState(user.phone);
  const [cidade, setCidade] = useState(user.city);
  const [bairro, setBairro] = useState(user.bairro);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    setTelefone(user.phone);
    setCidade(user.city);
    setBairro(user.bairro);
  }, [user.phone, user.city, user.bairro]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await onSaveProfile({ telefone, cidade, bairro });
      setIsEditing(false);
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar suas informações.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-0 safe-area-top">
      <div className="px-6 pt-10 flex justify-between items-center mb-8 safe-area-left safe-area-right">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-card border border-border/40 flex items-center justify-center text-foreground"
          >
            <ChevronLeft size={20} strokeWidth={2.2} />
          </button>
          <h1 className="font-extrabold text-[28px] font-display text-foreground">
            Perfil
          </h1>
        </div>
        <button
          type="button"
          onClick={onLogout}
          className="w-10 h-10 bg-card border border-border/40 rounded-full flex items-center justify-center text-destructive"
        >
          <LogOut size={20} strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex flex-col items-center mt-4 mb-10">
        <div className="relative mb-4">
          <img
            src={user.avatar}
            className="w-[120px] h-[120px] rounded-full object-cover border-4 border-card shadow-sm"
            alt={user.name}
          />
          <button
            type="button"
            onClick={() => setIsEditing((current) => !current)}
            className="absolute bottom-0 right-0 w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white border-2 border-background shadow-md"
          >
            <Edit size={18} strokeWidth={2} />
          </button>
        </div>
        <h2 className="font-extrabold text-[24px] font-display text-foreground">
          {user.name}
        </h2>
        <p className="font-bold text-[14px] text-primary font-body break-all px-4 text-center">
          {user.email}
        </p>
      </div>

      <div className="px-6 space-y-4 safe-area-left safe-area-right">
        <h3 className="font-extrabold text-[16px] font-display text-muted-foreground uppercase tracking-wider mb-2">
          Dados Pessoais
        </h3>

        {isEditing && (
          <div className="bg-card border border-border/40 rounded-[16px] p-4 space-y-3">
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-display mb-1.5">
                Telefone
              </p>
              <input
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                className="w-full h-[44px] bg-background rounded-[10px] border border-border/60 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[14px] font-body"
                placeholder="(85) 9 9999-9999"
              />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-display mb-1.5">
                Cidade
              </p>
              <input
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full h-[44px] bg-background rounded-[10px] border border-border/60 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[14px] font-body"
                placeholder="Cidade"
              />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-display mb-1.5">
                Bairro
              </p>
              <input
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full h-[44px] bg-background rounded-[10px] border border-border/60 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-[14px] font-body"
                placeholder="Bairro"
              />
            </div>
            {saveError && (
              <p className="text-[13px] text-destructive font-semibold font-body text-center">
                {saveError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setSaveError(null);
                  setTelefone(user.phone);
                  setCidade(user.city);
                  setBairro(user.bairro);
                }}
                className="flex-1 h-[42px] rounded-[10px] border border-border/70 font-bold text-[14px] font-display"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-[42px] rounded-[10px] bg-primary text-primary-foreground font-bold text-[14px] font-display disabled:opacity-60"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        )}

        <div className="bg-card border border-border/40 rounded-[16px] overflow-hidden">
          <div className="flex items-center gap-4 p-4 border-b border-border/40">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <User size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-display mb-0.5">
                Nome
              </p>
              <p className="font-bold text-[15px] font-body text-foreground">
                {user.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 border-b border-border/40">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-display mb-0.5">
                Email
              </p>
              <p className="font-bold text-[15px] font-body text-foreground break-all">
                {user.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 border-b border-border/40">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <MapPin size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-display mb-0.5">
                Localização
              </p>
              <p className="font-bold text-[15px] font-body text-foreground">
                {formatUserLocation(user)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Phone size={20} />
            </div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider font-display mb-0.5">
                Telefone
              </p>
              <p className="font-bold text-[15px] font-body text-foreground">
                {formatUserPhone(user)}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenMyPets}
          className="w-full h-[52px] rounded-[14px] bg-primary text-primary-foreground font-bold font-display shadow-sm"
        >
          Meus Pets
        </button>
      </div>
    </div>
  );
}

function EditPetModal({
  pet,
  open,
  onClose,
  onSave,
}: {
  pet: Pet | null;
  open: boolean;
  onClose: () => void;
  onSave: (payload: {
    descricao: string;
    cidade: string;
    bairro: string;
    last_seen: string;
    owner_phone: string;
  }) => Promise<void>;
}) {
  const [descricao, setDescricao] = useState("");
  const [cidade, setCidade] = useState("");
  const [bairro, setBairro] = useState("");
  const [lastSeen, setLastSeen] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!pet) return;
    setDescricao(pet.description || "");
    setCidade(pet.city || "");
    setBairro(pet.neighborhood || "");
    setLastSeen(pet.lastSeen || "");
    setOwnerPhone(pet.ownerPhone || "");
  }, [pet]);

  if (!open || !pet) return null;

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({
        descricao: descricao.trim(),
        cidade: cidade.trim(),
        bairro: bairro.trim(),
        last_seen: lastSeen.trim(),
        owner_phone: ownerPhone.trim(),
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Não foi possível salvar o anúncio.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/60 px-4 py-6 flex items-end sm:items-center justify-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Editar anúncio"
    >
      <div
        className="w-full max-w-md bg-background rounded-[18px] p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-extrabold text-[20px] font-display text-foreground">
              Editar anúncio
            </h3>
            <p className="text-[13px] text-muted-foreground font-body">
              Ajuste os dados principais do seu pet.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"
            aria-label="Fechar edição"
          >
            <ChevronLeft size={18} className="rotate-180" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[13px] font-bold font-display mb-1.5 text-foreground/80">
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full rounded-[12px] bg-card border border-border/60 p-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-base h-[96px] resize-none font-body"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[13px] font-bold font-display mb-1.5 text-foreground/80">
                Cidade
              </label>
              <input
                value={cidade}
                onChange={(e) => setCidade(e.target.value)}
                className="w-full h-[48px] bg-card rounded-[12px] border border-border/60 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-base font-body"
              />
            </div>
            <div>
              <label className="block text-[13px] font-bold font-display mb-1.5 text-foreground/80">
                Bairro
              </label>
              <input
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                className="w-full h-[48px] bg-card rounded-[12px] border border-border/60 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-base font-body"
              />
            </div>
          </div>
          <div>
            <label className="block text-[13px] font-bold font-display mb-1.5 text-foreground/80">
              Última vez visto
            </label>
            <input
              value={lastSeen}
              onChange={(e) => setLastSeen(e.target.value)}
              className="w-full h-[48px] bg-card rounded-[12px] border border-border/60 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-base font-body"
            />
          </div>
          <div>
            <label className="block text-[13px] font-bold font-display mb-1.5 text-foreground/80">
              Telefone
            </label>
            <input
              value={ownerPhone}
              onChange={(e) => setOwnerPhone(e.target.value)}
              className="w-full h-[48px] bg-card rounded-[12px] border border-border/60 px-4 outline-none focus:border-primary focus:ring-1 focus:ring-primary text-base font-body"
            />
          </div>
        </div>

        {error && (
          <p className="text-[13px] text-destructive font-semibold font-body text-center mt-4">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="w-full h-[50px] rounded-[14px] bg-primary text-primary-foreground font-bold font-display mt-5 disabled:opacity-60"
        >
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}

function MyPetsScreen({
  pets,
  loading,
  error,
  onBack,
  onEdit,
  onDelete,
  onMarkFound,
  busyPetId,
}: {
  pets: Pet[];
  loading: boolean;
  error: string | null;
  onBack: () => void;
  onEdit: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
  onMarkFound: (pet: Pet) => void;
  busyPetId: string | null;
}) {
  return (
    <div className="min-h-screen bg-background pb-0 safe-area-top">
      <div className="px-6 pt-10 flex items-center gap-4 mb-8 safe-area-left safe-area-right">
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-card border border-border/40 flex items-center justify-center text-foreground"
        >
          <ChevronLeft size={20} strokeWidth={2.2} />
        </button>
        <div>
          <h1 className="font-extrabold text-[28px] font-display text-foreground">
            Meus Pets
          </h1>
          <p className="text-[13px] text-muted-foreground font-body">
            Gerencie seus anúncios
          </p>
        </div>
      </div>

      <div className="px-6 space-y-4 safe-area-left safe-area-right">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-card border border-border/40 rounded-[16px] p-6 text-center">
            <p className="font-semibold text-destructive font-body">{error}</p>
          </div>
        ) : pets.length === 0 ? (
          <div className="bg-card border border-dashed border-border rounded-[16px] p-8 text-center">
            <div className="w-[80px] h-[80px] bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto mb-4">
              <PawPrint size={36} strokeWidth={2} />
            </div>
            <h3 className="font-extrabold text-[18px] font-display text-foreground mb-2">
              Você ainda não publicou nenhum pet
            </h3>
            <p className="text-[14px] text-muted-foreground font-body leading-relaxed">
              Publique um anúncio para acompanhar, editar ou marcar como encontrado.
            </p>
          </div>
        ) : (
          pets.map((pet) => (
            <div
              key={pet.id}
              className={`relative bg-card rounded-[12px] shadow-sm overflow-hidden flex h-[160px] border border-border/30 ${pet.status === PET_STATUS.FOUND ? "opacity-75" : ""}`}
            >
              <button
                type="button"
                onClick={() => onEdit(pet)}
                disabled={busyPetId === pet.id}
                aria-label="Editar anúncio"
                className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-muted text-foreground flex items-center justify-center disabled:opacity-60"
              >
                <Edit size={14} />
              </button>

              <div className="w-[120px] shrink-0 bg-muted">
                <img
                  src={pet.photo}
                  alt={pet.name}
                  className={`w-full h-full object-cover ${pet.status === PET_STATUS.FOUND ? "opacity-70 grayscale-[30%]" : ""}`}
                />
              </div>

              <div className="flex-1 p-3 flex flex-col justify-between ml-1 pr-9">
                <div>
                  <h3 className="font-bold text-lg mb-1 font-display uppercase tracking-tight text-foreground truncate">
                    {pet.name}
                  </h3>
                  <p className="text-[12px] leading-snug text-muted-foreground font-body line-clamp-2">
                    {pet.city} · {pet.neighborhood}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-body mt-1">
                    Publicado em {new Date(pet.postedAt).toLocaleDateString("pt-BR")}
                  </p>
                  {pet.lastSeen && (
                    <p className="text-[11px] text-muted-foreground font-body mt-1 line-clamp-1">
                      Última vez visto: {pet.lastSeen}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => onMarkFound(pet)}
                    disabled={pet.status === PET_STATUS.FOUND || busyPetId === pet.id}
                    className="bg-green-600 text-white font-bold text-[12px] font-display py-1.5 px-3 rounded-full shadow-sm hover:opacity-90 disabled:opacity-60"
                  >
                    Encontrado
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(pet)}
                    disabled={busyPetId === pet.id}
                    className="bg-destructive text-destructive-foreground font-bold text-[12px] font-display py-1.5 px-3 rounded-full shadow-sm hover:opacity-90 disabled:opacity-60"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboarding");
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [petActionLoadingId, setPetActionLoadingId] = useState<string | null>(null);
  const {
    user,
    authUser,
    authReady,
    profileLoading,
    profileComplete,
    syncUserFromAuth,
    completeProfile,
    clearUser,
  } = useProfile();
  const { pets: dbPets, loading: petsLoading, refetch: refetchPets } = usePets();
  const { pets: myPets, loading: myPetsLoading, error: myPetsError, refetch: refetchMyPets } = useMyPets(user?.id);
  const displayPets = dbPets.map(mapDbPetToDisplay);
  const displayMyPets = myPets.map(mapDbPetToDisplay);

  useEffect(() => {
    if (!authReady) return;

    if (user) {
      setScreen((current) =>
        current === "onboarding" || current === "login" ? "feed" : current,
      );
      return;
    }

    setScreen((current) =>
      current === "onboarding" ? "onboarding" : "login",
    );
  }, [authReady, user]);

  useEffect(() => {
    if (!authReady || profileLoading || user) return;

    const protectedScreens: Screen[] = [
      "feed",
      "profile",
      "report",
      "detail",
      "my-pets",
    ];

    if (protectedScreens.includes(screen)) {
      setScreen("login");
    }
  }, [authReady, profileLoading, screen, user]);

  useEffect(() => {
    if (!authReady || !user || profileComplete) return;

    const profileRequiredScreens: Screen[] = [
      "profile",
      "report",
      "detail",
      "my-pets",
    ];

    if (profileRequiredScreens.includes(screen)) {
      setScreen("feed");
    }
  }, [authReady, user, profileComplete, screen]);

  useEffect(() => {
    if (screen === "detail" && !selectedPet) {
      setScreen("feed");
    }
  }, [screen, selectedPet]);

  useEffect(() => {
    if (!authUser || !user) return;
    if (!user.name.trim() || !user.phone.trim()) return;
    void syncMyPetContactSnapshot({
      userId: authUser.id,
      nome: user.name,
      telefone: user.phone,
    });
  }, [authUser, user]);

  const handleNavigate = (newScreen: Screen) => {
    setScreen(newScreen);
    window.scrollTo(0, 0);
  };

  const handleDetail = (pet: Pet) => {
    setSelectedPet(pet);
    handleNavigate("detail");
  };

  const handleEditPet = (pet: Pet) => {
    setEditingPet(pet);
    handleNavigate("my-pets");
  };

  const handleSavePet = async (payload: {
    descricao: string;
    cidade: string;
    bairro: string;
    last_seen: string;
    owner_phone: string;
  }) => {
    if (!editingPet) return;
    setPetActionLoadingId(editingPet.id);
    try {
      const { error } = await updatePet(editingPet.id, {
        descricao: payload.descricao,
        cidade: payload.cidade,
        bairro: payload.bairro,
        last_seen: payload.last_seen,
        owner_phone: payload.owner_phone,
        status: editingPet.status,
      });
      if (error) throw new Error(error.message);
      await Promise.all([refetchMyPets(), refetchPets()]);
      setEditingPet(null);
    } catch (err) {
      throw err instanceof Error ? err : new Error("Não foi possível salvar o anúncio.");
    } finally {
      setPetActionLoadingId(null);
    }
  };

  const handleMarkFound = async (pet: Pet) => {
    setPetActionLoadingId(pet.id);
    try {
      const { error } = await markPetAsFound(pet.id);
      if (error) throw new Error(error.message);
      await Promise.all([refetchMyPets(), refetchPets()]);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Não foi possível marcar como encontrado.",
      );
    } finally {
      setPetActionLoadingId(null);
    }
  };

  const handleDeletePet = async (pet: Pet) => {
    const confirmed = window.confirm(`Excluir o anúncio de ${pet.name}?`);
    if (!confirmed) return;
    setPetActionLoadingId(pet.id);
    try {
      const { error } = await deletePet(pet);
      if (error) throw new Error(error.message);
      await Promise.all([refetchMyPets(), refetchPets()]);
      if (editingPet?.id === pet.id) setEditingPet(null);
    } catch (err) {
      window.alert(
        err instanceof Error ? err.message : "Não foi possível excluir o anúncio.",
      );
    } finally {
      setPetActionLoadingId(null);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    clearUser();
    handleNavigate("login");
  };

  const showCompleteProfileModal =
    Boolean(user && !profileLoading && !profileComplete);

  if (!authReady) {
    return (
      <div className="w-full min-h-screen bg-background flex justify-center">
        <div className="w-full max-w-md min-h-screen bg-background flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[100dvh] flex justify-center">
      <div className="w-full max-w-md relative bg-background shadow-2xl min-h-[100dvh] overflow-x-hidden">
        {screen === "onboarding" && (
          <OnboardingScreen
            onFinish={() => handleNavigate("login")}
          />
        )}
        {screen === "login" && (
          <LoginScreen
            onLogin={async () => {
              const {
                data: { session },
              } = await supabase.auth.getSession();
              if (session?.user) {
                await syncUserFromAuth(session.user);
                handleNavigate("feed");
              }
            }}
          />
        )}
        {screen === "feed" && user && (
          <FeedScreen
            pets={displayPets}
            petsLoading={petsLoading}
            onDetail={handleDetail}
            onOpenProfile={() => handleNavigate("profile")}
            onEditLocation={() => handleNavigate("profile")}
            user={user}
          />
        )}
        {screen === "detail" && selectedPet && profileComplete && (
          <DetailScreen
            pet={selectedPet}
            onBack={() => handleNavigate("feed")}
          />
        )}
        {screen === "profile" && user && profileComplete && (
          <ProfileScreen
            user={user}
            onBack={() => handleNavigate("feed")}
            onOpenMyPets={() => handleNavigate("my-pets")}
            onSaveProfile={completeProfile}
            onLogout={handleLogout}
          />
        )}
        {screen === "my-pets" && user && profileComplete && (
          <MyPetsScreen
            pets={displayMyPets}
            loading={myPetsLoading}
            error={myPetsError}
            onBack={() => handleNavigate("profile")}
            onEdit={handleEditPet}
            onDelete={handleDeletePet}
            onMarkFound={handleMarkFound}
            busyPetId={petActionLoadingId}
          />
        )}
        {screen === "report" && user && profileComplete && authUser && (
          <ReportScreen
            onSuccess={async () => {
              await refetchPets();
              handleNavigate("feed");
            }}
            onBack={() => handleNavigate("feed")}
            user={user}
            authUserId={authUser.id}
          />
        )}

        <CompleteProfileModal
          open={showCompleteProfileModal}
          onSubmit={completeProfile}
        />

        <BottomNav
          screen={screen}
          onNavigate={handleNavigate}
          profileComplete={profileComplete}
        />

        <EditPetModal
          pet={editingPet}
          open={Boolean(editingPet)}
          onClose={() => setEditingPet(null)}
          onSave={handleSavePet}
        />
      </div>
    </div>
  );
}