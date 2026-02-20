import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/appStore';
import type { DeviceAttitude } from '../types';

// ─────────────────────────────────────────────────────────────
// useDeviceOrientation — Reads compass heading, pitch & roll
// from the DeviceOrientation API and pushes into global state.
// ─────────────────────────────────────────────────────────────

export function useDeviceOrientation(): void {
    const setAttitude = useAppStore((s) => s.setAttitude);

    const handleOrientation = useCallback(
        (event: DeviceOrientationEvent) => {
            // `alpha` = compass heading (0-360), `beta` = pitch, `gamma` = roll.
            // Values may be null on desktop browsers.
            const attitude: DeviceAttitude = {
                absoluteHeading: event.alpha ?? 0,
                pitch: event.beta ?? 0,
                roll: event.gamma ?? 0,
            };

            setAttitude(attitude);
        },
        [setAttitude],
    );

    useEffect(() => {
        // On iOS 13+ we must explicitly request permission.
        const requestPermission = async () => {
            const DOE = DeviceOrientationEvent as unknown as {
                requestPermission?: () => Promise<'granted' | 'denied'>;
            };

            if (typeof DOE.requestPermission === 'function') {
                const permission = await DOE.requestPermission();
                if (permission !== 'granted') {
                    console.warn('[useDeviceOrientation] Permission denied');
                    return;
                }
            }

            window.addEventListener('deviceorientation', handleOrientation, true);
        };

        requestPermission();

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation, true);
        };
    }, [handleOrientation]);
}
