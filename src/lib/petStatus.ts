export const PET_STATUS = {
  LOST: "perdido",
  FOUND: "encontrado",
} as const;

export const ACCEPTED_PET_STATUS = [
  PET_STATUS.LOST,
  PET_STATUS.FOUND,
] as const;

export type PetStatus = (typeof ACCEPTED_PET_STATUS)[number];

export function isPetStatus(value: unknown): value is PetStatus {
  return typeof value === "string" && (ACCEPTED_PET_STATUS as readonly string[]).includes(value);
}

export function normalizePetStatus(value: unknown): PetStatus {
  return isPetStatus(value) ? value : PET_STATUS.LOST;
}