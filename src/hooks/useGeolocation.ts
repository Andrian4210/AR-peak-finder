import { useEffect } from 'react';
import { useAppStore } from '../store/appStore';

// ─────────────────────────────────────────────────────────────
// useGeolocation — Watches the device GPS position and pushes
// UserLocation updates into global state.
// ─────────────────────────────────────────────────────────────

export function useGeolocation(): void {
    const setLocation = useAppStore((s) => s.setLocation);

    useEffect(() => {
        if (!('geolocation' in navigator)) {
            console.warn('[useGeolocation] Geolocation API not available');
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                    altitude: position.coords.altitude,
                    accuracy: position.coords.accuracy,
                });
            },
            (error) => {
                console.error('[useGeolocation] Error:', error.message);
            },
            {
                enableHighAccuracy: true,
                maximumAge: 1000,
                timeout: 10000,
            },
        );

        return () => {
            navigator.geolocation.clearWatch(watchId);
        };
    }, [setLocation]);
}
