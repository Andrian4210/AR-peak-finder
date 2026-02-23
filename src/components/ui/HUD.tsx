import { Compass, Mountain, Trees } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

// ─────────────────────────────────────────────────────────────
// HUD — Heads-up display showing heading, altitude, and
// currently visible terrain targets.
// ─────────────────────────────────────────────────────────────

export function HUD() {
    const attitude = useAppStore((s) => s.attitude);
    const location = useAppStore((s) => s.location);
    const peaks = useAppStore((s) => s.peaks);

    const heading = attitude?.absoluteHeading.toFixed(0) ?? '---';
    const altitude = location?.altitude?.toFixed(0) ?? '---';

    const visiblePeaks = peaks.filter((p) => p.type === 'peak').length;
    const visibleHills = peaks.filter((p) => p.type === 'hill').length;

    return (
        <div className="hud">
            <div className="hud__item">
                <Compass size={18} />
                <span>{heading}°</span>
            </div>
            <div className="hud__item">
                <Mountain size={18} />
                <span>{altitude} m</span>
            </div>
            <div className="hud__item">
                <Trees size={18} />
                <span>
                    {visiblePeaks} peaks · {visibleHills} hills
                </span>
            </div>
        </div>
    );
}
