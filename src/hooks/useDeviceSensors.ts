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
    const [error, setError] = useState<string | null>(() =>
        'geolocation' in navigator ? null : 'Geolocation API not available',
    );
    const [orientationPermission, setOrientationPermission] = useState<
        'prompt' | 'granted' | 'denied' | 'not-required'
    >('prompt');

    const setLocation = useAppStore((s) => s.setLocation);
    const setAttitude = useAppStore((s) => s.setAttitude);

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

    useEffect(() => {
        if (!('geolocation' in navigator)) {
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

    const handleOrientation = useCallback(
        (event: DeviceOrientationEvent) => {
            const iOSEvent = event as DeviceOrientationEvent & {
                webkitCompassHeading?: number;
            };

            let heading: number;
            if (
                iOSEvent.webkitCompassHeading !== undefined &&
                iOSEvent.webkitCompassHeading !== null
            ) {
                heading = iOSEvent.webkitCompassHeading;
            } else if (event.alpha !== null) {
                heading = ((360 - event.alpha) % 360 + 360) % 360;
            } else {
                heading = 0;
            }

            const attitude: DeviceAttitude = {
                absoluteHeading: heading,
                pitch: 90 - (event.beta ?? 90),
                roll: event.gamma ?? 0,
            };

            setAttitude(attitude);
        },
        [setAttitude],
    );

    useEffect(() => {
        const DOE = DeviceOrientationEvent as unknown as {
            requestPermission?: () => Promise<'granted' | 'denied'>;
        };

        async function initOrientation() {
            if (typeof DOE.requestPermission === 'function') {
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

        void initOrientation();

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
        };
    }, [handleOrientation]);

    return { videoRef, error, orientationPermission };
}
