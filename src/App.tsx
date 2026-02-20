import { useState } from 'react';
import { StartScreen } from './components/ui/StartScreen';
import { AROverlay } from './components/ar/AROverlay';
import { HUD } from './components/ui/HUD';
import { CompassBox } from './components/ui/CompassBox';
import { useGeolocation } from './hooks/useGeolocation';
import { useDeviceOrientation } from './hooks/useDeviceOrientation';
import './App.css';

function App() {
  const [started, setStarted] = useState(false);

  // Activate sensor hooks only after the user taps "Start"
  if (started) {
    return <ActiveSession />;
  }

  return <StartScreen onStart={() => setStarted(true)} />;
}

/** Inner component that activates sensor hooks. */
function ActiveSession() {
  useGeolocation();
  useDeviceOrientation();

  return (
    <div className="app">
      <AROverlay />
      <HUD />
      <CompassBox />
    </div>
  );
}

export default App;
