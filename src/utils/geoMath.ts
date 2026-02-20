// ─────────────────────────────────────────────────────────────
// Geospatial math utilities — pure functions, zero side-effects.
// ─────────────────────────────────────────────────────────────

const EARTH_RADIUS_KM = 6371;

/** Convert degrees to radians. */
export function toRadians(deg: number): number {
    return (deg * Math.PI) / 180;
}

/** Convert radians to degrees. */
export function toDegrees(rad: number): number {
    return (rad * 180) / Math.PI;
}

/**
 * Haversine distance between two lat/lon pairs.
 * @returns Distance in kilometres.
 */
export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
    return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Initial bearing from point A to point B.
 * @returns Bearing in degrees (0-360, 0 = North).
 */
export function calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δλ = toRadians(lon2 - lon1);

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    return ((toDegrees(Math.atan2(y, x)) % 360) + 360) % 360;
}
