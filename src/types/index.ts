// ─────────────────────────────────────────────────────────────
// AR Peak Finder — Shared Type Contracts
// ─────────────────────────────────────────────────────────────
// This file is the SINGLE SOURCE OF TRUTH for all data shapes.
// Any changes here must be agreed upon by both collaborators.
// ─────────────────────────────────────────────────────────────

/** GPS position of the user's device. */
export interface UserLocation {
  /** Latitude in decimal degrees (WGS-84). */
  lat: number;
  /** Longitude in decimal degrees (WGS-84). */
  lon: number;
  /** Altitude above sea level in metres (may be `null` on some devices). */
  altitude: number | null;
  /** Horizontal accuracy in metres. */
  accuracy: number;
}

/** Orientation of the device in 3-D space. */
export interface DeviceAttitude {
  /** Compass heading in degrees (0-360, 0 = North). */
  absoluteHeading: number;
  /** Pitch in degrees (−90 to 90, positive = looking up). */
  pitch: number;
  /** Roll in degrees (−180 to 180, positive = tilted right). */
  roll: number;
}

/** A mountain peak detected in the user's field of view. */
export interface DetectedPeak {
  /** Stable identifier for this peak (e.g. from the dataset). */
  id: string;
  /** Human-readable name of the peak. */
  name: string;
  /** Distance from the user in kilometres. */
  distanceKm: number;
  /** Summit elevation in metres above sea level. */
  elevationM: number;
  /** Match confidence score (0-1). */
  confidence: number;
  /** Horizontal screen position in CSS pixels (left edge = 0). */
  screenX: number;
  /** Vertical screen position in CSS pixels (top edge = 0). */
  screenY: number;
  /** Whether this peak is currently within the camera's field of view. */
  inFov: boolean;
}

// ─────────────────────────────────────────────────────────────
// Worker message protocol
// ─────────────────────────────────────────────────────────────

/** Payload sent TO the geospatial worker. */
export interface WorkerRequest {
  type: 'DETECT_PEAKS';
  location: UserLocation;
  attitude: DeviceAttitude;
  /** Horizontal field-of-view of the camera in degrees. */
  fovDeg: number;
  /** Viewport width in CSS pixels. */
  viewportWidth: number;
  /** Viewport height in CSS pixels. */
  viewportHeight: number;
}

/** Payload received FROM the geospatial worker. */
export interface WorkerResponse {
  type: 'PEAKS_DETECTED';
  peaks: DetectedPeak[];
  /** Processing time in milliseconds (for performance telemetry). */
  computeMs: number;
}
