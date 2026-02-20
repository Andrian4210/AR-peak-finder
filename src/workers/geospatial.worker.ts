// ─────────────────────────────────────────────────────────────
// Geospatial Web Worker
// ─────────────────────────────────────────────────────────────
// Runs off the main thread. Receives WorkerRequest messages
// and responds with WorkerResponse containing detected peaks.
// ─────────────────────────────────────────────────────────────

import type { WorkerRequest, WorkerResponse, DetectedPeak } from '../types';

/**
 * Main message handler.
 *
 * In the future this will perform real raycasting against a
 * summit dataset. For now it returns mock peaks so the UI
 * pipeline can be wired end-to-end.
 */
self.onmessage = (event: MessageEvent<WorkerRequest>) => {
    const { type, location, attitude, viewportWidth, viewportHeight } = event.data;

    if (type !== 'DETECT_PEAKS') return;

    const start = performance.now();

    // ── Mock data ────────────────────────────────────────────
    const mockPeaks: DetectedPeak[] = [
        {
            id: 'mt-warning',
            name: 'Mt Warning',
            distanceKm: 42.3,
            elevationM: 1156,
            confidence: 0.92,
            screenX: viewportWidth * 0.35,
            screenY: viewportHeight * 0.25,
            inFov: true,
        },
        {
            id: 'mt-tamborine',
            name: 'Mt Tamborine',
            distanceKm: 18.7,
            elevationM: 525,
            confidence: 0.87,
            screenX: viewportWidth * 0.65,
            screenY: viewportHeight * 0.40,
            inFov: true,
        },
        {
            id: 'flinders-peak',
            name: 'Flinders Peak',
            distanceKm: 30.1,
            elevationM: 680,
            confidence: 0.78,
            screenX: viewportWidth * 1.2, // outside viewport
            screenY: viewportHeight * 0.30,
            inFov: false,
        },
    ];

    // Use location & attitude to suppress "unused" warnings for now
    console.debug('[Worker] Location:', location, 'Attitude:', attitude);

    const computeMs = performance.now() - start;

    const response: WorkerResponse = {
        type: 'PEAKS_DETECTED',
        peaks: mockPeaks,
        computeMs,
    };

    self.postMessage(response);
};
