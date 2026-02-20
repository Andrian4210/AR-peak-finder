import { useState } from 'react';
import { StartScreen } from './components/ui/StartScreen';
import { ARViewport } from './components/ar/ARViewport';
import { HUD } from './components/ui/HUD';
import { CompassBox } from './components/ui/CompassBox';
import './App.css';

function App() {
  const [started, setStarted] = useState(false);

  if (!started) {
    return <StartScreen onStart={() => setStarted(true)} />;
  }

  return (
    <div className="app">
      <ARViewport />
      <HUD />
      <CompassBox />
    </div>
  );
}

export default App;
