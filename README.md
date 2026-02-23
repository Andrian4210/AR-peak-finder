# AR Peak Finder

AR Peak Finder is a browser-based augmented-reality app that overlays nearby **peaks and hills** on top of your phone camera view.

## What it does

- Uses device sensors (camera, GPS, compass/orientation)
- Projects known terrain targets into the camera viewport in real-time
- Detects both mountain peaks and local hills
- Uses a free elevation source (Open-Meteo elevation API) to fill missing terrain heights
- Applies lightweight camera warp correction during projection for more realistic target placement

## Architecture

- **React UI** for AR viewport, compass and HUD
- **Zustand store** for shared sensor/target state
- **Web Worker** for geospatial calculations (distance, bearing, pitch, FOV filtering)
- **Pure math utils** for projection and curvature correction

## Development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```

## Notes

- This app is designed for mobile browsers with sensor support.
- On iOS, orientation permission must be granted from a user gesture.
