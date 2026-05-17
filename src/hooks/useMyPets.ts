import { useCallback, useEffect, useState } from "react";
import { getMyPets } from "@/services/petService";
import type { Pet } from "@/types/pet";

export function useMyPets(userId?: string) {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMyPets = useCallback(async () => {
    if (!userId) {
      setPets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getMyPets(userId);
      if (fetchError) throw new Error(fetchError.message);
      setPets(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar seus pets.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void fetchMyPets();
  }, [fetchMyPets]);

  return { pets, loading, error, refetch: fetchMyPets };
}
