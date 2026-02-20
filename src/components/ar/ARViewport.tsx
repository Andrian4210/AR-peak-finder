import { useEffect, useRef, useCallback, useState } from 'react';
import { useDeviceSensors } from '../../hooks/useDeviceSensors';
import { useAppStore } from '../../store/appStore';
import type { DetectedPeak, WorkerRequest, WorkerResponse } from '../../types';

// ─────────────────────────────────────────────────────────────
// ARViewport — Full-screen camera feed with peak overlay labels
// driven by the geospatial Web Worker on a rAF loop.
// ─────────────────────────────────────────────────────────────

/** Assumed horizontal FOV of a typical phone rear camera (degrees). */
const CAMERA_FOV_H = 60;

export function ARViewport() {
    const { videoRef, error } = useDeviceSensors();

    const workerRef = useRef<Worker | null>(null);
    const rafRef = useRef<number>(0);
    const busyRef = useRef(false);

    const [peaks, setPeaksLocal] = useState<DetectedPeak[]>([]);

    const location = useAppStore((s) => s.location);
    const attitude = useAppStore((s) => s.attitude);
    const setPeaks = useAppStore((s) => s.setPeaks);

    // ── Instantiate the worker once ────────────────────────

    useEffect(() => {
        const worker = new Worker(
            new URL('../../workers/geospatial.worker.ts', import.meta.url),
            { type: 'module' },
        );

        worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
            busyRef.current = false;
            if (e.data.type === 'PEAKS_DETECTED') {
                setPeaksLocal(e.data.peaks);
                setPeaks(e.data.peaks);
            }
        };

        workerRef.current = worker;

        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, [setPeaks]);

    // ── rAF loop: send sensor data to worker each frame ────

    const tick = useCallback(() => {
        // Only post if the worker has finished the previous frame
        if (workerRef.current && location && attitude && !busyRef.current) {
            busyRef.current = true;
            const msg: WorkerRequest = {
                type: 'DETECT_PEAKS',
                location,
                attitude,
                fovDeg: CAMERA_FOV_H,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
            };
            workerRef.current.postMessage(msg);
        }
        rafRef.current = requestAnimationFrame(tick);
    }, [location, attitude]);

    useEffect(() => {
        rafRef.current = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafRef.current);
    }, [tick]);

    // ── Render ─────────────────────────────────────────────

    if (error) {
        return (
            <div className="ar-viewport ar-viewport--error">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="ar-viewport">
            {/* Camera feed */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="ar-viewport__video"
            />

            {/* AR overlay (peak labels) */}
            <div className="ar-viewport__overlay">
                {peaks.map((peak) => (
                    <div
                        key={peak.id}
                        className="peak-label"
                        style={{
                            transform: `translate3d(${peak.screenX}px, ${peak.screenY}px, 0)`,
                            opacity: Math.max(0.4, peak.confidence),
                        }}
                    >
                        <div className="peak-label__pip" />
                        <span className="peak-label__name">{peak.name}</span>
                        <span className="peak-label__meta">
                            {peak.distanceKm.toFixed(1)} km · {peak.elevationM} m
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
