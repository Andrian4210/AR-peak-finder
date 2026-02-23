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

function applyCameraWarp(
    x: number,
    y: number,
    screenW: number,
    screenH: number,
    k1 = 0,
): { x: number; y: number } {
    if (k1 === 0) return { x, y };

    const cx = screenW * 0.5;
    const cy = screenH * 0.5;
    const nx = (x - cx) / cx;
    const ny = (y - cy) / cy;

    const r2 = nx * nx + ny * ny;
    const factor = 1 + k1 * r2;

    return {
        x: cx + nx * factor * cx,
        y: cy + ny * factor * cy,
    };
}

/**
 * Project a peak's world-space bearing/pitch into screen-space
 * pixel coordinates.
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
    cameraWarpK1 = 0,
): ScreenPosition {
    let dBearing = peakBearing - deviceHeading;
    if (dBearing > 180) dBearing -= 360;
    if (dBearing < -180) dBearing += 360;

    const dPitch = peakPitch - devicePitch;

    const halfFovH = fovH * 0.5;
    const halfFovV = fovV * 0.5;

    const x = (dBearing / halfFovH) * (screenW * 0.5) + screenW * 0.5;
    const y = -(dPitch / halfFovV) * (screenH * 0.5) + screenH * 0.5;

    const warped = applyCameraWarp(x, y, screenW, screenH, cameraWarpK1);

    const inFov =
        warped.x >= -40 && warped.x <= screenW + 40 &&
        warped.y >= -40 && warped.y <= screenH + 40;

    return { x: warped.x, y: warped.y, inFov };
}
