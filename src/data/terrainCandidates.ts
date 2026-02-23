import type { TerrainCandidate } from '../types';

/**
 * Starter terrain catalogue focused on South-East Queensland.
 * Some elevations are intentionally null and filled from a free DEM API.
 */
export const TERRAIN_CANDIDATES: TerrainCandidate[] = [
  { id: 'mt-warning', name: 'Mt Warning', type: 'peak', lat: -28.3976, lon: 153.2709, elevationM: 1156 },
  { id: 'mt-tamborine', name: 'Mt Tamborine', type: 'peak', lat: -27.9389, lon: 153.1717, elevationM: 525 },
  { id: 'flinders-peak', name: 'Flinders Peak', type: 'peak', lat: -27.8203, lon: 152.8081, elevationM: 680 },
  { id: 'mt-barney', name: 'Mt Barney', type: 'peak', lat: -28.2893, lon: 152.6964, elevationM: 1359 },
  { id: 'springbrook', name: 'Springbrook Plateau', type: 'peak', lat: -28.2113, lon: 153.2747, elevationM: 900 },
  { id: 'highgate-hill', name: 'Highgate Hill', type: 'hill', lat: -27.4933, lon: 153.0068, elevationM: null },
  { id: 'observatory-hill', name: 'Observatory Hill', type: 'hill', lat: -27.4688, lon: 153.0256, elevationM: null },
  { id: 'kangaroo-point-cliffs', name: 'Kangaroo Point Cliffs', type: 'hill', lat: -27.4744, lon: 153.0358, elevationM: null },
  { id: 'one-tree-hill', name: 'One Tree Hill', type: 'hill', lat: -27.4628, lon: 152.9887, elevationM: null },
];
