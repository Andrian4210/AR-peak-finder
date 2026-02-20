// ─────────────────────────────────────────────────────────────
// Geospatial math — fully implemented, pure functions.
// ─────────────────────────────────────────────────────────────

/** Mean Earth radius in metres (WGS-84 approximation). */
const R = 6_371_000;

const DEG2RAD = Math.PI / 180;
const RAD2DEG = 180 / Math.PI;

// ── Conversions ────────────────────────────────────────────

/** Degrees → radians. */
export function toRadians(deg: number): number {
    return deg * DEG2RAD;
}

/** Radians → degrees. */
export function toDegrees(rad: number): number {
    return rad * RAD2DEG;
}

// ── Distance ───────────────────────────────────────────────

/**
 * Haversine distance between two lat/lon pairs.
 * @returns Distance in **metres**.
 */
export function calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const φ1 = lat1 * DEG2RAD;
    const φ2 = lat2 * DEG2RAD;
    const Δφ = (lat2 - lat1) * DEG2RAD;
    const Δλ = (lon2 - lon1) * DEG2RAD;

    const a =
        Math.sin(Δφ * 0.5) * Math.sin(Δφ * 0.5) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ * 0.5) * Math.sin(Δλ * 0.5);

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Bearing ────────────────────────────────────────────────

/**
 * Initial bearing from point A → B.
 * @returns Bearing in degrees, normalised 0–360 (0 = North, 90 = East).
 */
export function calculateBearing(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
): number {
    const φ1 = lat1 * DEG2RAD;
    const φ2 = lat2 * DEG2RAD;
    const Δλ = (lon2 - lon1) * DEG2RAD;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x =
        Math.cos(φ1) * Math.sin(φ2) -
        Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

    return ((Math.atan2(y, x) * RAD2DEG) % 360 + 360) % 360;
}

// ── Curvature-corrected pitch ──────────────────────────────

/**
 * Elevation angle from user to a target, accounting for
 * Earth curvature. The curvature drop is `d² / (2R)`.
 *
 * @param userAltM      Observer altitude (metres above sea level).
 * @param targetAltM    Target summit altitude (metres ASL).
 * @param distanceM     Horizontal distance in metres.
 * @returns Pitch angle in degrees (positive = look up).
 */
export function calculatePitch(
    userAltM: number,
    targetAltM: number,
    distanceM: number,
): number {
    if (distanceM <= 0) return 0;

    // Earth-curvature drop at the target's distance
    const curvatureDrop = (distanceM * distanceM) / (2 * R);

    // Apparent height difference after curvature correction
    const elevationDiff = targetAltM - curvatureDrop - userAltM;

    return Math.atan2(elevationDiff, distanceM) * RAD2DEG;
}

// ── Screen projection ──────────────────────────────────────

export interface ScreenPosition {
    x: number;
    y: number;
    inFov: boolean;
}

/**
 * Project a peak's world-space bearing/pitch into screen-space
 * pixel coordinates.
 *
 * @param peakBearing    Bearing of the peak in degrees (0-360).
 * @param peakPitch      Pitch to the peak in degrees.
 * @param deviceHeading  Current compass heading of the device (0-360).
 * @param devicePitch    Current pitch of the device in degrees.
 * @param fovH           Horizontal field-of-view in degrees.
 * @param fovV           Vertical field-of-view in degrees.
 * @param screenW        Viewport width in CSS pixels.
 * @param screenH        Viewport height in CSS pixels.
 */
export function calculateScreenPosition(
    peakBearing: number,
    peakPitch: number,
    deviceHeading: number,
    devicePitch: number,
    fovH: number,
    fovV: number,
    screenW: number,
    screenH: number,
): ScreenPosition {
    // ── Horizontal delta (handles 359→0 wrap) ────────────
    let dBearing = peakBearing - deviceHeading;
    // Normalise to −180 … +180
    if (dBearing > 180) dBearing -= 360;
    if (dBearing < -180) dBearing += 360;

    // ── Vertical delta ───────────────────────────────────
    const dPitch = peakPitch - devicePitch;

    // ── Map angular deltas to pixel space ────────────────
    const halfFovH = fovH * 0.5;
    const halfFovV = fovV * 0.5;

    // x: centre of screen = heading match, right = positive bearing delta
    const x = (dBearing / halfFovH) * (screenW * 0.5) + screenW * 0.5;
    // y: centre = pitch match, up = positive pitch (inverted in screen coords)
    const y = -(dPitch / halfFovV) * (screenH * 0.5) + screenH * 0.5;

    // In FOV if both axes fall within the viewport (with a small gutter)
    const inFov =
        x >= -40 && x <= screenW + 40 &&
        y >= -40 && y <= screenH + 40;

    return { x, y, inFov };
}
