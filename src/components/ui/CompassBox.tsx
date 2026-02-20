import { useAppStore } from '../../store/appStore';

// ─────────────────────────────────────────────────────────────
// CompassBox — A compass rose widget showing current heading.
// ─────────────────────────────────────────────────────────────

export function CompassBox() {
    const heading = useAppStore((s) => s.attitude?.absoluteHeading ?? 0);

    const cardinalDirection = getCardinal(heading);

    return (
        <div className="compass-box">
            <div
                className="compass-box__rose"
                style={{ transform: `rotate(${-heading}deg)` }}
            >
                <span className="compass-box__n">N</span>
                <span className="compass-box__e">E</span>
                <span className="compass-box__s">S</span>
                <span className="compass-box__w">W</span>
            </div>
            <div className="compass-box__readout">
                {heading.toFixed(0)}° {cardinalDirection}
            </div>
        </div>
    );
}

/** Map a numeric heading to a 16-point cardinal abbreviation. */
function getCardinal(deg: number): string {
    const directions = [
        'N', 'NNE', 'NE', 'ENE',
        'E', 'ESE', 'SE', 'SSE',
        'S', 'SSW', 'SW', 'WSW',
        'W', 'WNW', 'NW', 'NNW',
    ];
    const index = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16;
    return directions[index];
}
