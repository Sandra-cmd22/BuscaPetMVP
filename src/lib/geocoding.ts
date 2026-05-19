import type { Coordinates } from "@/lib/distance";

const GEOCODE_URL = "https://nominatim.openstreetmap.org/search";
const GEOCODE_TIMEOUT_MS = 8000;
const GEOCODE_MIN_INTERVAL_MS = 1100;

const geocodeCache = new Map<string, Coordinates>();
let lastGeocodeAt = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeCityName(city: string): string {
  return normalizeWhitespace(city).toLowerCase();
}

export function normalizeNeighborhood(neighborhood: string): string {
  return normalizeWhitespace(neighborhood).toLowerCase();
}

export function buildGeocodeQuery(city: string, neighborhood: string): string | null {
  const normalizedCity = normalizeCityName(city);
  const normalizedNeighborhood = normalizeNeighborhood(neighborhood);

  if (!normalizedCity) {
    return null;
  }

  const parts = [normalizedNeighborhood, normalizedCity, "ceara", "brasil"].filter(Boolean);
  return parts.join(", ");
}

export async function geocodeAddress(
  city: string,
  neighborhood: string,
): Promise<Coordinates | null> {
  const normalizedCity = normalizeCityName(city);
  const normalizedNeighborhood = normalizeNeighborhood(neighborhood);
  const cacheKey = `${normalizedCity}-${normalizedNeighborhood}`;

  if (geocodeCache.has(cacheKey)) {
    const cached = geocodeCache.get(cacheKey);
    console.info("[geo-debug] cache hit", { cacheKey, cached });
    return cached ?? null;
  }

  const query = buildGeocodeQuery(city, neighborhood);
  if (!query) {
    console.warn("[geo-debug] geocode falhou: query vazia");
    return null;
  }

  const elapsed = Date.now() - lastGeocodeAt;
  if (elapsed < GEOCODE_MIN_INTERVAL_MS) {
    await sleep(GEOCODE_MIN_INTERVAL_MS - elapsed);
  }

  const encodedQuery = encodeURIComponent(query);
  const requestUrl = `${GEOCODE_URL}?q=${encodedQuery}&format=json&limit=1`;

  console.info("[geo-debug] query enviada", { query, requestUrl });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, GEOCODE_TIMEOUT_MS);

  lastGeocodeAt = Date.now();

  try {
    const response = await fetch(requestUrl, {
      signal: controller.signal,
    });

    if (response.status === 429) {
      console.warn("[geo-debug] geocode falhou: rate limit (429)");
      return null;
    }

    if (!response.ok) {
      console.warn("[geo-debug] geocode falhou", { status: response.status });
      return null;
    }

    const payload = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const first = Array.isArray(payload) ? payload[0] : undefined;

    if (!first?.lat || !first?.lon) {
      console.warn("[geo-debug] geocode falhou: resposta vazia");
      return null;
    }

    const latitude = Number(first.lat);
    const longitude = Number(first.lon);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      console.warn("[geo-debug] geocode falhou: coordenadas invalidas", first);
      return null;
    }

    const coordinates = { latitude, longitude };
    geocodeCache.set(cacheKey, coordinates);

    console.info("[geo-debug] coordenadas encontradas", {
      cacheKey,
      latitude,
      longitude,
    });

    return coordinates;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("[geo-debug] geocode falhou: timeout");
      return null;
    }

    console.warn("[geo-debug] geocode falhou", error);
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}
