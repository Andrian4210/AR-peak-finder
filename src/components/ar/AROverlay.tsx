import { useCamera } from '../../hooks/useCamera';

// ─────────────────────────────────────────────────────────────
// AROverlay — Full-screen camera feed with positioned peak labels.
// ─────────────────────────────────────────────────────────────

export function AROverlay() {
    const { videoRef, error } = useCamera();

    if (error) {
        return (
            <div className="ar-overlay ar-overlay--error">
                <p>Camera error: {error}</p>
            </div>
        );
    }

    return (
        <div className="ar-overlay">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="ar-overlay__video"
            />
            {/* PeakLabel components will be rendered here */}
        </div>
    );
}
