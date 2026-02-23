import type { TerrainCandidate } from '../types';

const OPEN_METEO_ELEVATION_ENDPOINT = 'https://api.open-meteo.com/v1/elevation';

/**
 * Free elevation enrichment powered by Open-Meteo.
 * API docs: https://open-meteo.com/
 */
export async function enrichTerrainElevations(
  terrain: TerrainCandidate[],
): Promise<TerrainCandidate[]> {
  const unresolved = terrain.filter((t) => t.elevationM === null);
  if (unresolved.length === 0) return terrain;

  const latitudes = unresolved.map((t) => t.lat).join(',');
  const longitudes = unresolved.map((t) => t.lon).join(',');

  try {
    const url = `${OPEN_METEO_ELEVATION_ENDPOINT}?latitude=${latitudes}&longitude=${longitudes}`;
    const res = await fetch(url);
    if (!res.ok) return terrain;

    const data = (await res.json()) as { elevation?: number[] };
    const elevation = data.elevation ?? [];

    const elevationById = new Map<string, number>();
    unresolved.forEach((t, idx) => {
      const val = elevation[idx];
      if (typeof val === 'number' && Number.isFinite(val)) {
        elevationById.set(t.id, Math.round(val));
      }
    });

    return terrain.map((t) => {
      const resolved = elevationById.get(t.id);
      return {
        ...t,
        elevationM: t.elevationM ?? resolved ?? 0,
      };
    });
  } catch {
    return terrain.map((t) => ({ ...t, elevationM: t.elevationM ?? 0 }));
  }
}
