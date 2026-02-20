import { useEffect, useRef, useState } from 'react';

// ─────────────────────────────────────────────────────────────
// useCamera — Manages the rear-facing camera media stream.
// ─────────────────────────────────────────────────────────────

interface UseCameraResult {
    /** Ref to attach to a <video> element. */
    videoRef: React.RefObject<HTMLVideoElement | null>;
    /** The active MediaStream, or null if not yet acquired. */
    stream: MediaStream | null;
    /** Human-readable error message, if any. */
    error: string | null;
}

export function useCamera(): UseCameraResult {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

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

                if (!active) {
                    mediaStream.getTracks().forEach((t) => t.stop());
                    return;
                }

                setStream(mediaStream);

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            } catch (err) {
                if (active) {
                    setError(err instanceof Error ? err.message : 'Camera access denied');
                }
            }
        }

        startCamera();

        return () => {
            active = false;
            stream?.getTracks().forEach((t) => t.stop());
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return { videoRef, stream, error };
}
