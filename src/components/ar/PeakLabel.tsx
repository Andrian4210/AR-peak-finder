import type { DetectedPeak } from '../../types';

// ─────────────────────────────────────────────────────────────
// PeakLabel — A positioned label for a single detected peak.
// Uses CSS transforms for sub-pixel positioning on the AR overlay.
// ─────────────────────────────────────────────────────────────

interface PeakLabelProps {
    peak: DetectedPeak;
}

export function PeakLabel({ peak }: PeakLabelProps) {
    if (!peak.inFov) return null;

    return (
        <div
            className="peak-label"
            style={{
                transform: `translate(${peak.screenX}px, ${peak.screenY}px)`,
                opacity: peak.confidence,
            }}
        >
            <span className="peak-label__name">{peak.name}</span>
            <span className="peak-label__meta">
                {peak.distanceKm.toFixed(1)} km · {peak.elevationM} m
            </span>
        </div>
    );
}
