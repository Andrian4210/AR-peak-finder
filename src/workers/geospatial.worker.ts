// ─────────────────────────────────────────────────────────────
// Geospatial Web Worker — full pipeline
// ─────────────────────────────────────────────────────────────
// Receives WorkerRequest (user location + attitude + viewport),
// computes distance/bearing/pitch/screen-position for each peak,
// filters to FOV, and returns DetectedPeak[].
// ─────────────────────────────────────────────────────────────

import type {
    WorkerRequest,
    WorkerResponse,
    DetectedPeak,
} from '../types';

import {
    calculateDistance,
    calculateBearing,
    calculatePitch,
    calculateScreenPosition,
} from '../utils/geoMath';

// ── Mock peak dataset (SE Queensland summits) ──────────────
// In production this would come from a GeoJSON/DEM tile set.

interface PeakRecord {
    id: string;
    name: string;
    lat: number;
    lon: number;
    elevationM: number;
}

const PEAK_DATABASE: PeakRecord[] = [
    {
        id: 'mt-warning',
        name: 'Mt Warning',
        lat: -28.3976,
        lon: 153.2709,
        elevationM: 1156,
    },
    {
        id: 'mt-tamborine',
        name: 'Mt Tamborine',
        lat: -27.9389,
        lon: 153.1717,
        elevationM: 525,
    },
    {
        id: 'flinders-peak',
        name: 'Flinders Peak',
        lat: -27.8203,
        lon: 152.8081,
        elevationM: 680,
    },
    {
        id: 'mt-barney',
        name: 'Mt Barney',
        lat: -28.2893,
        lon: 152.6964,
        elevationM: 1359,
    },
    {
        id: 'springbrook',
        name: 'Springbrook Plateau',
        lat: -28.2113,
        lon: 153.2747,
        elevationM: 900,
    },
];

// ── Worker message handler ─────────────────────────────────

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    const { type, location, attitude, fovDeg, viewportWidth, viewportHeight } =
        event.data;

    if (type !== 'DETECT_PEAKS') return;

    const start = performance.now();

    const userAlt = location.altitude ?? 0;

    // Derive vertical FOV from horizontal FOV + aspect ratio
    const aspect = viewportWidth / (viewportHeight || 1);
    const fovV = fovDeg / aspect;

    const peaks: DetectedPeak[] = [];

    for (let i = 0; i < PEAK_DATABASE.length; i++) {
        const pk = PEAK_DATABASE[i];

        // Distance in metres
        const distM = calculateDistance(location.lat, location.lon, pk.lat, pk.lon);

        // Skip peaks beyond 100 km (not practically visible)
        if (distM > 100_000) continue;

        // Bearing from user to peak (0-360)
        const bearing = calculateBearing(
            location.lat,
            location.lon,
            pk.lat,
            pk.lon,
        );

        // Curvature-corrected pitch angle
        const pitch = calculatePitch(userAlt, pk.elevationM, distM);

        // Project to screen coordinates
        const screen = calculateScreenPosition(
            bearing,
            pitch,
            attitude.absoluteHeading,
            attitude.pitch,
            fovDeg,
            fovV,
            viewportWidth,
            viewportHeight,
        );

        // Confidence: closer + higher = more confident
        const confidence = Math.max(0, Math.min(1, 1 - distM / 100_000));

        peaks.push({
            id: pk.id,
            name: pk.name,
            distanceKm: distM / 1000,
            elevationM: pk.elevationM,
            confidence,
            screenX: screen.x,
            screenY: screen.y,
            inFov: screen.inFov,
        });
    }

    // Only send peaks within (or near) the viewport
    const visiblePeaks = peaks.filter((p) => p.inFov);

    const response: WorkerResponse = {
        type: 'PEAKS_DETECTED',
        peaks: visiblePeaks,
        computeMs: performance.now() - start,
    };

    self.postMessage(response);
};
