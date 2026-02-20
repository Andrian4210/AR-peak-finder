import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import type { DeviceAttitude, UserLocation } from '../types';

// ─────────────────────────────────────────────────────────────
// useDeviceSensors — Combined camera + GPS + orientation hook.
// Safari-optimised: handles iOS permission flow and
// webkitCompassHeading for True North.
// ─────────────────────────────────────────────────────────────

export interface DeviceSensorsResult {
    /** Ref to attach to a <video> element for camera preview. */
    videoRef: React.RefObject<HTMLVideoElement | null>;
    /** Human-readable error string, if any sensor failed. */
    error: string | null;
    /** Current permission state for orientation (iOS). */
    orientationPermission: 'prompt' | 'granted' | 'denied' | 'not-required';
}

export function useDeviceSensors(): DeviceSensorsResult {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [orientationPermission, setOrientationPermission] = useState<
        'prompt' | 'granted' | 'denied' | 'not-required'
    >('prompt');

    const setLocation = useAppStore((s) => s.setLocation);
    const setAttitude = useAppStore((s) => s.setAttitude);

    // ── Camera ─────────────────────────────────────────────

    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function startCamera() {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1920 },
                        height: { ideal: 1080 },
                    },
                    audio: false,
                });

                if (cancelled) {
                    mediaStream.getTracks().forEach((t) => t.stop());
                    return;
                }

                streamRef.current = mediaStream;

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err instanceof Error ? err.message : 'Camera access denied');
                }
            }
        }

        startCamera();

        return () => {
            cancelled = true;
            streamRef.current?.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        };
    }, []);

    // ── GPS ────────────────────────────────────────────────

    useEffect(() => {
        if (!('geolocation' in navigator)) {
            setError('Geolocation API not available');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const loc: UserLocation = {
                    lat: pos.coords.latitude,
                    lon: pos.coords.longitude,
                    altitude: pos.coords.altitude,
                    accuracy: pos.coords.accuracy,
                };
                setLocation(loc);
            },
            (err) => {
                setError(`GPS error: ${err.message}`);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 2000,
                timeout: 10000,
            },
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [setLocation]);

    // ── Device orientation ─────────────────────────────────

    const handleOrientation = useCallback(
        (event: DeviceOrientationEvent) => {
            // iOS Safari provides webkitCompassHeading (True North, 0-360).
            // Android provides alpha (0-360, but may be relative — not absolute
            // unless event.absolute === true).
            const iOSEvent = event as DeviceOrientationEvent & {
                webkitCompassHeading?: number;
            };

            let heading: number;
            if (
                iOSEvent.webkitCompassHeading !== undefined &&
                iOSEvent.webkitCompassHeading !== null
            ) {
                // iOS True North — already 0-360, clockwise
                heading = iOSEvent.webkitCompassHeading;
            } else if (event.alpha !== null) {
                // Android: alpha is counter-clockwise from an arbitrary reference.
                // When event.absolute === true, alpha 0 = North, but it runs
                // counter-clockwise, so heading = (360 - alpha) % 360.
                heading = ((360 - event.alpha) % 360 + 360) % 360;
            } else {
                heading = 0;
            }

            const attitude: DeviceAttitude = {
                absoluteHeading: heading,
                // beta = device tilt: 0 = flat, 90 = upright (looking at horizon).
                // Convert to look-angle: 90 - beta, so upright → 0° (horizon).
                pitch: 90 - (event.beta ?? 90),
                roll: event.gamma ?? 0,
            };

            setAttitude(attitude);
        },
        [setAttitude],
    );

    useEffect(() => {
        // Check if the iOS permission dance is needed
        const DOE = DeviceOrientationEvent as unknown as {
            requestPermission?: () => Promise<'granted' | 'denied'>;
        };

        async function initOrientation() {
            if (typeof DOE.requestPermission === 'function') {
                // iOS 13+ — must be triggered by a user gesture.
                // This hook is only mounted after the "Start" button, so
                // we're inside a user-gesture call stack.
                try {
                    const result = await DOE.requestPermission();
                    setOrientationPermission(result);
                    if (result !== 'granted') {
                        setError('Orientation permission denied');
                        return;
                    }
                } catch {
                    setOrientationPermission('denied');
                    setError('Orientation permission request failed');
                    return;
                }
            } else {
                setOrientationPermission('not-required');
            }

            window.addEventListener('deviceorientation', handleOrientation, true);
        }

        initOrientation();

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
        };
    }, [handleOrientation]);

    return { videoRef, error, orientationPermission };
}
