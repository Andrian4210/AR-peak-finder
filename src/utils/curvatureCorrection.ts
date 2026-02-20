// ─────────────────────────────────────────────────────────────
// Curvature correction — accounts for earth curvature and
// atmospheric refraction when computing apparent elevation.
// ─────────────────────────────────────────────────────────────

const EARTH_RADIUS_M = 6_371_000;

/**
 * Standard atmospheric refraction coefficient.
 * A value of ~0.13 is commonly used for visible-light observations.
 */
const REFRACTION_COEFFICIENT = 0.13;

/**
 * Calculates the apparent elevation angle of a distant peak as
 * seen from the observer's position, accounting for earth
 * curvature and atmospheric refraction.
 *
 * @param observerAltitudeM  Observer altitude above sea level (metres).
 * @param peakAltitudeM      Summit altitude above sea level (metres).
 * @param distanceKm         Horizontal distance to the peak (km).
 * @returns Apparent elevation angle in degrees.
 */
export function calculateApparentElevation(
    observerAltitudeM: number,
    peakAltitudeM: number,
    distanceKm: number,
): number {
    const distanceM = distanceKm * 1000;

    // Height difference without curvature
    const heightDiff = peakAltitudeM - observerAltitudeM;

    // Curvature drop (parabolic approximation)
    const curvatureDrop = (distanceM ** 2) / (2 * EARTH_RADIUS_M);

    // Refraction lifts the apparent position back up
    const refractionLift = REFRACTION_COEFFICIENT * curvatureDrop;

    // Net apparent height difference
    const apparentHeightDiff = heightDiff - curvatureDrop + refractionLift;

    // Convert to angle
    const angleRad = Math.atan2(apparentHeightDiff, distanceM);

    return angleRad * (180 / Math.PI);
}

/**
 * Determines whether a peak is geometrically visible from
 * the observer's position (i.e. not hidden below the horizon).
 *
 * @param observerAltitudeM  Observer altitude above sea level (metres).
 * @param peakAltitudeM      Summit altitude above sea level (metres).
 * @param distanceKm         Horizontal distance to the peak (km).
 * @returns `true` if the peak rises above the geometric horizon.
 */
export function isPeakVisible(
    observerAltitudeM: number,
    peakAltitudeM: number,
    distanceKm: number,
): boolean {
    const distanceM = distanceKm * 1000;

    // Maximum line-of-sight distance from observer to horizon
    const observerHorizon = Math.sqrt(2 * EARTH_RADIUS_M * observerAltitudeM);
    // Maximum distance from peak summit to horizon
    const peakHorizon = Math.sqrt(2 * EARTH_RADIUS_M * peakAltitudeM);

    return distanceM <= observerHorizon + peakHorizon;
}
