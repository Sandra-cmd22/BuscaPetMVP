import { useCallback, useEffect, useState } from "react";
import { getPets } from "@/services/petService";
import type { Pet } from "@/types/pet";

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await getPets();
      if (fetchError) throw new Error(fetchError.message);
      setPets(data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar pets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchPets();
  }, [fetchPets]);

  return { pets, loading, error, refetch: fetchPets };
}
