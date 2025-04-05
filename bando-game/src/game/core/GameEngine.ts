import * as THREE from 'three';
import { PhysicsEngine } from './PhysicsEngine';
import { GameScene } from './GameScene';

export interface GameEngineOptions {
  container: HTMLElement;
  debug?: boolean;
}

export class GameEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private cube: THREE.Mesh;
  private debug: boolean;
  private animationId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  
  // Physics related
  private physicsEngine: PhysicsEngine;
  private physicsInitialized = false;
  private gameScene: GameScene | null = null;

  constructor(private options: GameEngineOptions) {
    this.debug = options.debug || false;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.cube = this.createCube();
    this.physicsEngine = new PhysicsEngine();
    
    this.init();
    this.initPhysics();
  }

  private init(): void {
    const { container } = this.options;
    
    // Setup renderer
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setClearColor(0x000000);
    container.appendChild(this.renderer.domElement);
    
    // Setup scene
    this.scene.add(this.cube);
    
    // Setup camera
    this.camera.position.z = 10;
    this.camera.position.y = 5;
    this.camera.rotation.x = -Math.PI / 6;
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    this.scene.add(ambientLight, pointLight);
    
    // Setup resize handler
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(container);
    this.onResize();
  }

  private async initPhysics(): Promise<void> {
    // Initialize the physics engine
    await this.physicsEngine.init();
    this.physicsInitialized = true;
    
    // Initialize the game scene
    this.gameScene = new GameScene(this.scene, this.physicsEngine);
    
    // Remove the default cube (it will be replaced with physics objects)
    this.scene.remove(this.cube);
    
    // Create a demo scene
    this.createDemoScene();
  }

  private createDemoScene(): void {
    if (!this.gameScene) return;
    
    // Create ground
    this.gameScene.createGround(
      'ground',
      { width: 20, height: 0.5, depth: 20 },
      { x: 0, y: -0.25, z: 0 },
      { color: 0x666666 }
    );
    
    // Create a physics cube
    this.gameScene.createPhysicsBox(
      'cube1',
      { width: 1, height: 1, depth: 1 },
      { x: 0, y: 5, z: 0 },
      { color: 0x00ff00 }
    );
    
    // Create another physics cube
    this.gameScene.createPhysicsBox(
      'cube2',
      { width: 1, height: 1, depth: 1 },
      { x: 2, y: 7, z: 0 },
      { color: 0x0000ff }
    );
    
    // Create a static platform
    this.gameScene.createPhysicsBox(
      'platform',
      { width: 5, height: 0.5, depth: 2 },
      { x: -5, y: 2, z: 0 },
      { color: 0xffff00, isDynamic: false }
    );
  }

  private createCube(): THREE.Mesh {
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
    return new THREE.Mesh(geometry, material);
  }

  private onResize(): void {
    const { container } = this.options;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = (): void => {
    this.animationId = requestAnimationFrame(this.animate);
    
    // Step the physics simulation if initialized
    if (this.physicsInitialized) {
      this.physicsEngine.step();
    } else {
      // If physics not yet initialized, just rotate the cube as before
      this.cube.rotation.x += 0.01;
      this.cube.rotation.y += 0.01;
    }
    
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * Get game scene - useful for controlling physics objects from outside
   */
  public getGameScene(): GameScene | null {
    return this.gameScene;
  }
  
  /**
   * Apply impulse to a game object (example of physics interaction)
   */
  public jumpCube(): void {
    if (!this.gameScene) return;
    
    this.gameScene.applyImpulse(
      'cube1',
      { x: 0, y: 5, z: 0 }
    );
  }

  public start(): void {
    if (this.animationId === null) {
      this.animate();
    }
  }

  public stop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  public setDebug(debug: boolean): void {
    this.debug = debug;
    
    // In debug mode, you could add visualization of physics shapes, 
    // print object positions in the debug overlay, etc.
    
    // For a simple demo, let's just make "cube1" jump when entering debug mode
    if (debug && this.gameScene) {
      this.jumpCube();
    }
  }

  public cleanup(): void {
    this.stop();
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // Clean up game scene
    if (this.gameScene) {
      this.gameScene.cleanup();
      this.gameScene = null;
    }
    
    // Clean up physics
    if (this.physicsInitialized) {
      this.physicsEngine.cleanup();
    }
    
    // Dispose Three.js resources
    if (this.cube.parent) {
      this.scene.remove(this.cube);
      (this.cube.geometry as THREE.BufferGeometry).dispose();
      (this.cube.material as THREE.Material).dispose();
    }
    
    this.renderer.dispose();
    
    // Remove from DOM
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
} 