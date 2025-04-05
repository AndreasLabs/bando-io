import * as THREE from 'three';

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

  constructor(private options: GameEngineOptions) {
    this.debug = options.debug || false;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.cube = this.createCube();
    
    this.init();
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
    this.camera.position.z = 5;
    
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
    
    // Rotate cube
    this.cube.rotation.x += 0.01;
    this.cube.rotation.y += 0.01;
    
    this.renderer.render(this.scene, this.camera);
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
    // Add debug-specific logic here later
    
    // For now, let's just change the cube color
    if (this.cube) {
      (this.cube.material as THREE.MeshStandardMaterial).color.set(
        debug ? 0xff0000 : 0x00ff00
      );
    }
  }

  public cleanup(): void {
    this.stop();
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    
    // Dispose of resources
    this.scene.remove(this.cube);
    (this.cube.geometry as THREE.BufferGeometry).dispose();
    (this.cube.material as THREE.Material).dispose();
    
    this.renderer.dispose();
    
    // Remove from DOM
    if (this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
  }
} 