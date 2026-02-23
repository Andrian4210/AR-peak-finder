// ─────────────────────────────────────────────────────────────
// Geospatial Web Worker — full pipeline
// ─────────────────────────────────────────────────────────────

import type {
    WorkerRequest,
    WorkerResponse,
    DetectedPeak,
    TerrainCandidate,
} from '../types';

import {
    calculateDistance,
    calculateBearing,
    calculatePitch,
    calculateScreenPosition,
} from '../utils/geoMath';

let terrainDB: TerrainCandidate[] = [];
const CAMERA_WARP_K1 = 0.08;

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    const data = event.data;

    if (data.type === 'INIT_TERRAIN') {
        terrainDB = data.terrain;
        const response: WorkerResponse = {
            type: 'TERRAIN_READY',
            count: terrainDB.length,
        };
        self.postMessage(response);
        return;
    }

    if (data.type !== 'DETECT_PEAKS') return;

    const { location, attitude, fovDeg, viewportWidth, viewportHeight } = data;
    const start = performance.now();
    const userAlt = location.altitude ?? 0;

    const aspect = viewportWidth / (viewportHeight || 1);
    const fovV = fovDeg / aspect;

    const peaks: DetectedPeak[] = [];

    for (let i = 0; i < terrainDB.length; i++) {
        const target = terrainDB[i];
        const targetAlt = target.elevationM ?? 0;

        const distM = calculateDistance(location.lat, location.lon, target.lat, target.lon);
        if (distM > 120_000) continue;

        const bearing = calculateBearing(location.lat, location.lon, target.lat, target.lon);
        const pitch = calculatePitch(userAlt, targetAlt, distM);

        const screen = calculateScreenPosition(
            bearing,
            pitch,
            attitude.absoluteHeading,
            attitude.pitch,
            fovDeg,
            fovV,
            viewportWidth,
            viewportHeight,
            CAMERA_WARP_K1,
        );

        const distanceScore = Math.max(0, Math.min(1, 1 - distM / 120_000));
        const prominenceScore = Math.max(0, Math.min(1, targetAlt / 1500));
        const confidence = distanceScore * 0.75 + prominenceScore * 0.25;

        peaks.push({
            id: target.id,
            name: target.name,
            type: target.type,
            distanceKm: distM / 1000,
            elevationM: targetAlt,
            confidence,
            screenX: screen.x,
            screenY: screen.y,
            inFov: screen.inFov,
        });
    }

    const visiblePeaks = peaks
        .filter((p) => p.inFov)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 12);

    const response: WorkerResponse = {
        type: 'PEAKS_DETECTED',
        peaks: visiblePeaks,
        computeMs: performance.now() - start,
    };

    self.postMessage(response);
};
