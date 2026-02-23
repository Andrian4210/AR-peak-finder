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

/** Terrain category supported by the recogniser. */
export type TerrainFeatureType = 'peak' | 'hill';

/** Input terrain target record used by the worker. */
export interface TerrainCandidate {
  id: string;
  name: string;
  type: TerrainFeatureType;
  lat: number;
  lon: number;
  /** Summit/top elevation in metres (nullable until fetched from DEM API). */
  elevationM: number | null;
}

/** A mountain or hill detected in the user's field of view. */
export interface DetectedPeak {
  /** Stable identifier for this terrain feature. */
  id: string;
  /** Human-readable name of the feature. */
  name: string;
  /** Whether this is a peak or hill. */
  type: TerrainFeatureType;
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
  /** Whether this feature is currently within the camera's field of view. */
  inFov: boolean;
}

// ─────────────────────────────────────────────────────────────
// Worker message protocol
// ─────────────────────────────────────────────────────────────

/** Payload sent TO the geospatial worker to initialise terrain DB. */
export interface WorkerInitRequest {
  type: 'INIT_TERRAIN';
  terrain: TerrainCandidate[];
}

/** Payload sent TO the geospatial worker for each render frame. */
export interface WorkerDetectRequest {
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

export type WorkerRequest = WorkerInitRequest | WorkerDetectRequest;

/** Worker emits after terrain catalogue is loaded. */
export interface WorkerTerrainReadyResponse {
  type: 'TERRAIN_READY';
  count: number;
}

/** Payload received FROM worker after a detect frame. */
export interface WorkerPeaksDetectedResponse {
  type: 'PEAKS_DETECTED';
  peaks: DetectedPeak[];
  /** Processing time in milliseconds (for performance telemetry). */
  computeMs: number;
}

export type WorkerResponse = WorkerTerrainReadyResponse | WorkerPeaksDetectedResponse;
