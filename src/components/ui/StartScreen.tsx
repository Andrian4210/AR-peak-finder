import { Mountain, MapPin, Compass } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// StartScreen — Onboarding screen requesting sensor permissions.
// ─────────────────────────────────────────────────────────────

interface StartScreenProps {
    onStart: () => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
    return (
        <div className="start-screen">
            <div className="start-screen__content">
                <Mountain size={64} className="start-screen__icon" />
                <h1 className="start-screen__title">AR Peak Finder</h1>
                <p className="start-screen__subtitle">
                    Point your phone at the horizon to identify mountain peaks.
                </p>

                <ul className="start-screen__permissions">
                    <li>
                        <MapPin size={16} /> GPS Location
                    </li>
                    <li>
                        <Compass size={16} /> Device Orientation
                    </li>
                    <li>
                        <Mountain size={16} /> Camera Access
                    </li>
                </ul>

                <button className="start-screen__button" onClick={onStart}>
                    Start Exploring
                </button>
            </div>
        </div>
    );
}
