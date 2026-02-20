import { Compass, Mountain } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

// ─────────────────────────────────────────────────────────────
// HUD — Heads-up display showing compass heading & altitude.
// ─────────────────────────────────────────────────────────────

export function HUD() {
    const attitude = useAppStore((s) => s.attitude);
    const location = useAppStore((s) => s.location);

    const heading = attitude?.absoluteHeading.toFixed(0) ?? '---';
    const altitude = location?.altitude?.toFixed(0) ?? '---';

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
        </div>
    );
}
