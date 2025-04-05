import { useEffect, useRef, useState } from 'react';
import { GameEngine } from '../game/core/GameEngine';
import './GameView.css';

const GameView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [debugMode, setDebugMode] = useState(false);

  // Initialize game engine
  useEffect(() => {
    if (!containerRef.current) return;

    // Create and initialize engine
    const engine = new GameEngine({
      container: containerRef.current,
      debug: debugMode,
    });
    
    engineRef.current = engine;
    engine.start();

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.cleanup();
        engineRef.current = null;
      }
    };
  }, []); // Empty dependency array means this runs once on mount

  // Handle debug mode toggling
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setDebug(debugMode);
    }
  }, [debugMode]);

  // Handle keyboard events for debug toggle
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        event.preventDefault(); // Prevent focus change
        setDebugMode(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="game-container">
      <div ref={containerRef} className="canvas-container" />
      {debugMode && (
        <div className="debug-overlay">
          <h3>Debug Mode</h3>
          <p>FPS: 60</p>
          <p>Objects: 1</p>
          <p>Press Tab to exit debug mode</p>
        </div>
      )}
    </div>
  );
};

export default GameView; 