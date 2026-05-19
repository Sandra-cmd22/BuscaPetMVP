import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;

const dryRun = process.argv.includes("--dry-run");
const maxRowsArg = process.argv.find((arg) => arg.startsWith("--max="));
const maxRows = maxRowsArg ? Number(maxRowsArg.split("=")[1]) : null;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing env vars. Set SUPABASE_URL (or VITE/NEXT_PUBLIC URL) and SUPABASE_SERVICE_ROLE_KEY.",
  );
  process.exit(1);
}

if (maxRows !== null && (!Number.isFinite(maxRows) || maxRows <= 0)) {
  console.error("Invalid --max value. Use a positive integer, ex: --max=100");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function normalizeText(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function geocodeAddress(query, cache) {
  if (cache.has(query)) {
    return cache.get(query);
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("q", query);

  const response = await fetch(url.toString(), {
    headers: {
      "Accept-Language": "pt-BR,pt;q=0.9",
      "User-Agent": "BuscaPetMVP/1.0 (backfill coordinates)",
    },
  });

  if (!response.ok) {
    const result = { latitude: null, longitude: null, error: `HTTP ${response.status}` };
    cache.set(query, result);
    return result;
  }

  const payload = await response.json();
  const first = Array.isArray(payload) ? payload[0] : null;

  if (!first?.lat || !first?.lon) {
    const result = { latitude: null, longitude: null, error: "no-result" };
    cache.set(query, result);
    return result;
  }

  const latitude = Number(first.lat);
  const longitude = Number(first.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    const result = { latitude: null, longitude: null, error: "invalid-result" };
    cache.set(query, result);
    return result;
  }

  const result = { latitude, longitude, error: null };
  cache.set(query, result);
  return result;
}

async function run() {
  const { data: pets, error: petsError } = await supabase
    .from("pets")
    .select("id,user_id,cidade,bairro,latitude,longitude")
    .order("created_at", { ascending: true });

  if (petsError) {
    throw new Error(`Failed to load pets: ${petsError.message}`);
  }

  const petRows = Array.isArray(pets) ? pets : [];
  const userIds = Array.from(
    new Set(
      petRows
        .map((pet) => pet.user_id)
        .filter((id) => typeof id === "string" && id.length > 0),
    ),
  );

  let profilesByUser = new Map();
  if (userIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id,cidade,bairro")
      .in("id", userIds);

    if (profilesError) {
      throw new Error(`Failed to load profiles: ${profilesError.message}`);
    }

    profilesByUser = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  }

  const needsBackfill = petRows.filter((pet) => {
    const city = normalizeText(pet.cidade);
    const neighborhood = normalizeText(pet.bairro);
    const hasCoordinates =
      typeof pet.latitude === "number" && Number.isFinite(pet.latitude) &&
      typeof pet.longitude === "number" && Number.isFinite(pet.longitude);

    return !city || !neighborhood || !hasCoordinates;
  });

  const scopedRows = maxRows ? needsBackfill.slice(0, maxRows) : needsBackfill;

  let updatedRows = 0;
  let geocodedRows = 0;
  let cityBackfilledRows = 0;
  let neighborhoodBackfilledRows = 0;
  let skippedRows = 0;
  let failedGeocodeRows = 0;
  const geocodeCache = new Map();

  console.log(`Pets loaded: ${petRows.length}`);
  console.log(`Rows needing backfill: ${needsBackfill.length}`);
  if (maxRows) {
    console.log(`Processing limit: ${scopedRows.length}`);
  }

  for (const pet of scopedRows) {
    const profile = profilesByUser.get(pet.user_id);

    const currentCity = normalizeText(pet.cidade);
    const currentNeighborhood = normalizeText(pet.bairro);
    const profileCity = normalizeText(profile?.cidade);
    const profileNeighborhood = normalizeText(profile?.bairro);

    const nextCity = currentCity ?? profileCity;
    const nextNeighborhood = currentNeighborhood ?? profileNeighborhood;

    const hasLatitude = typeof pet.latitude === "number" && Number.isFinite(pet.latitude);
    const hasLongitude = typeof pet.longitude === "number" && Number.isFinite(pet.longitude);

    let nextLatitude = hasLatitude ? pet.latitude : null;
    let nextLongitude = hasLongitude ? pet.longitude : null;

    if ((!hasLatitude || !hasLongitude) && nextCity && nextNeighborhood) {
      const query = `${nextNeighborhood}, ${nextCity}, Brasil`;
      const geocode = await geocodeAddress(query, geocodeCache);

      if (geocode.latitude !== null && geocode.longitude !== null) {
        nextLatitude = geocode.latitude;
        nextLongitude = geocode.longitude;
        geocodedRows += 1;
      } else {
        failedGeocodeRows += 1;
      }

      // Respect Nominatim usage policy and avoid request bursts.
      await wait(1100);
    }

    const cityChanged = nextCity && nextCity !== currentCity;
    const neighborhoodChanged = nextNeighborhood && nextNeighborhood !== currentNeighborhood;
    const latitudeChanged = nextLatitude !== null && !hasLatitude;
    const longitudeChanged = nextLongitude !== null && !hasLongitude;

    if (!cityChanged && !neighborhoodChanged && !latitudeChanged && !longitudeChanged) {
      skippedRows += 1;
      continue;
    }

    const updatePayload = {};
    if (cityChanged) updatePayload.cidade = nextCity;
    if (neighborhoodChanged) updatePayload.bairro = nextNeighborhood;
    if (latitudeChanged) updatePayload.latitude = nextLatitude;
    if (longitudeChanged) updatePayload.longitude = nextLongitude;

    if (dryRun) {
      console.log(`DRY RUN - would update pet ${pet.id}:`, updatePayload);
      updatedRows += 1;
      if (cityChanged) cityBackfilledRows += 1;
      if (neighborhoodChanged) neighborhoodBackfilledRows += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from("pets")
      .update(updatePayload)
      .eq("id", pet.id);

    if (updateError) {
      console.error(`Failed to update pet ${pet.id}: ${updateError.message}`);
      continue;
    }

    updatedRows += 1;
    if (cityChanged) cityBackfilledRows += 1;
    if (neighborhoodChanged) neighborhoodBackfilledRows += 1;
  }

  console.log("Backfill finished.");
  console.log(`Updated rows: ${updatedRows}`);
  console.log(`Rows skipped: ${skippedRows}`);
  console.log(`Rows geocoded: ${geocodedRows}`);
  console.log(`City backfilled: ${cityBackfilledRows}`);
  console.log(`Neighborhood backfilled: ${neighborhoodBackfilledRows}`);
  console.log(`Geocode failed/no-result: ${failedGeocodeRows}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
