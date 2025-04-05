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

  // Handle keyboard events for debug toggle and controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;
      
      // Tab key toggles debug mode
      if (event.key === 'Tab') {
        event.preventDefault(); // Prevent focus change
        setDebugMode(prev => !prev);
        return;
      }
      
      // Get the game scene for physics interactions
      const gameScene = engine.getGameScene();
      if (!gameScene) return;
      
      // Space key makes cube1 jump
      if (event.key === ' ' || event.key === 'Space') {
        event.preventDefault();
        engine.jumpCube();
      }
      
      // WASD keys apply forces to cube2
      const force = { x: 0, y: 0, z: 0 };
      const strength = 2.0;
      
      switch (event.key.toLowerCase()) {
        case 'w':
          force.z = -strength;
          break;
        case 'a':
          force.x = -strength;
          break;
        case 's':
          force.z = strength;
          break;
        case 'd':
          force.x = strength;
          break;
        case 'q':
          gameScene.applyImpulse('cube2', { x: 0, y: 5, z: 0 });
          break;
      }
      
      // Apply force if any direction key was pressed
      if (force.x !== 0 || force.y !== 0 || force.z !== 0) {
        gameScene.applyForce('cube2', force);
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
          <p>Controls:</p>
          <p>Tab: Toggle debug mode</p>
          <p>Space: Make cube1 jump</p>
          <p>WASD: Move cube2</p>
          <p>Q: Make cube2 jump</p>
        </div>
      )}
      <div className="controls-hint">
        Press Tab for debug mode
      </div>
    </div>
  );
};

export default GameView; 