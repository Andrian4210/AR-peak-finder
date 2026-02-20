import { create } from 'zustand';
import type { UserLocation, DeviceAttitude, DetectedPeak } from '../types';

// ─────────────────────────────────────────────────────────────
// Global application state (Zustand)
// ─────────────────────────────────────────────────────────────

interface AppState {
    /** Current GPS position of the device. */
    location: UserLocation | null;
    /** Current orientation of the device. */
    attitude: DeviceAttitude | null;
    /** Peaks currently visible to the user. */
    peaks: DetectedPeak[];
    /** Whether the app has acquired all required permissions. */
    isReady: boolean;

    // ── Actions ──────────────────────────────────────────────
    setLocation: (location: UserLocation) => void;
    setAttitude: (attitude: DeviceAttitude) => void;
    setPeaks: (peaks: DetectedPeak[]) => void;
    setReady: (ready: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    location: null,
    attitude: null,
    peaks: [],
    isReady: false,

    setLocation: (location) => set({ location }),
    setAttitude: (attitude) => set({ attitude }),
    setPeaks: (peaks) => set({ peaks }),
    setReady: (ready) => set({ isReady: ready }),
}));
