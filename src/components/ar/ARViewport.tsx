import { useEffect, useRef, useState } from 'react';
import { useDeviceSensors } from '../../hooks/useDeviceSensors';
import { useAppStore } from '../../store/appStore';
import { TERRAIN_CANDIDATES } from '../../data/terrainCandidates';
import { enrichTerrainElevations } from '../../services/elevationService';
import type {
    DetectedPeak,
    WorkerDetectRequest,
    WorkerInitRequest,
    WorkerResponse,
} from '../../types';

// ─────────────────────────────────────────────────────────────
// ARViewport — Full-screen camera feed with peak/hill labels
// driven by the geospatial Web Worker on a rAF loop.
// ─────────────────────────────────────────────────────────────

/** Assumed horizontal FOV of a typical phone rear camera (degrees). */
const CAMERA_FOV_H = 60;

export function ARViewport() {
    const { videoRef, error } = useDeviceSensors();

    const workerRef = useRef<Worker | null>(null);
    const rafRef = useRef<number>(0);
    const busyRef = useRef(false);
    const locationRef = useRef(useAppStore.getState().location);
    const attitudeRef = useRef(useAppStore.getState().attitude);

    const [peaks, setPeaksLocal] = useState<DetectedPeak[]>([]);
    const [terrainReady, setTerrainReady] = useState(false);

    const location = useAppStore((s) => s.location);
    const attitude = useAppStore((s) => s.attitude);
    const setPeaks = useAppStore((s) => s.setPeaks);

    useEffect(() => {
        locationRef.current = location;
    }, [location]);

    useEffect(() => {
        attitudeRef.current = attitude;
    }, [attitude]);

    useEffect(() => {
        const worker = new Worker(
            new URL('../../workers/geospatial.worker.ts', import.meta.url),
            { type: 'module' },
        );

        worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
            if (e.data.type === 'TERRAIN_READY') {
                setTerrainReady(true);
                return;
            }

            busyRef.current = false;
            if (e.data.type === 'PEAKS_DETECTED') {
                setPeaksLocal(e.data.peaks);
                setPeaks(e.data.peaks);
            }
        };

        workerRef.current = worker;

        void (async () => {
            const terrain = await enrichTerrainElevations(TERRAIN_CANDIDATES);
            const initMsg: WorkerInitRequest = {
                type: 'INIT_TERRAIN',
                terrain,
            };
            worker.postMessage(initMsg);
        })();

        return () => {
            worker.terminate();
            workerRef.current = null;
        };
    }, [setPeaks]);

    useEffect(() => {
        const frame = () => {
            const liveLocation = locationRef.current;
            const liveAttitude = attitudeRef.current;

            if (
                workerRef.current &&
                terrainReady &&
                liveLocation &&
                liveAttitude &&
                !busyRef.current
            ) {
                busyRef.current = true;
                const msg: WorkerDetectRequest = {
                    type: 'DETECT_PEAKS',
                    location: liveLocation,
                    attitude: liveAttitude,
                    fovDeg: CAMERA_FOV_H,
                    viewportWidth: window.innerWidth,
                    viewportHeight: window.innerHeight,
                };
                workerRef.current.postMessage(msg);
            }

            rafRef.current = requestAnimationFrame(frame);
        };

        rafRef.current = requestAnimationFrame(frame);
        return () => cancelAnimationFrame(rafRef.current);
    }, [terrainReady]);

    if (error) {
        return (
            <div className="ar-viewport ar-viewport--error">
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="ar-viewport">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="ar-viewport__video"
            />

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
                            {peak.type.toUpperCase()} · {peak.distanceKm.toFixed(1)} km ·{' '}
                            {peak.elevationM} m
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
