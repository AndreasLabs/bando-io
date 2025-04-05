import * as THREE from 'three';
import * as RAPIER from '@dimforge/rapier3d';

export type PhysicsObject = {
  rigidBody: RAPIER.RigidBody;
  collider: RAPIER.Collider;
  mesh: THREE.Mesh;
  update: () => void;
};

export class PhysicsEngine {
  private world: RAPIER.World | null = null;
  private physicsObjects: PhysicsObject[] = [];
  private rapierModule: typeof RAPIER | null = null;
  private initialized = false;
  
  constructor() {}

  async init(): Promise<void> {
    // Rapier is loaded asynchronously since it's a WebAssembly module
    this.rapierModule = await import('@dimforge/rapier3d');
    
    // Create a physics world with gravity pointing down the y-axis
    const gravity = { x: 0.0, y: -9.81, z: 0.0 };
    this.world = new this.rapierModule.World(gravity);
    this.initialized = true;
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  createGround(size: { width: number; height: number; depth: number }): RAPIER.Collider | null {
    if (!this.world || !this.rapierModule) return null;
    
    // Create a static ground collider
    const groundColliderDesc = this.rapierModule.ColliderDesc.cuboid(
      size.width / 2, 
      size.height / 2, 
      size.depth / 2
    );
    
    return this.world.createCollider(groundColliderDesc);
  }

  createBox(
    size: { width: number; height: number; depth: number },
    position: { x: number; y: number; z: number },
    mesh: THREE.Mesh,
    isDynamic = true
  ): PhysicsObject | null {
    if (!this.world || !this.rapierModule) return null;
    
    // Create rigid body description - dynamic or static
    let rigidBodyDesc = isDynamic
      ? this.rapierModule.RigidBodyDesc.dynamic()
      : this.rapierModule.RigidBodyDesc.fixed();
    
    // Set initial position
    rigidBodyDesc = rigidBodyDesc.setTranslation(position.x, position.y, position.z);
    
    // Create the rigid body
    const rigidBody = this.world.createRigidBody(rigidBodyDesc);
    
    // Create collider attached to the rigid body
    const colliderDesc = this.rapierModule.ColliderDesc.cuboid(
      size.width / 2, 
      size.height / 2, 
      size.depth / 2
    );
    const collider = this.world.createCollider(colliderDesc, rigidBody);
    
    // Create a physics object to track this body and its visual representation
    const physicsObject: PhysicsObject = {
      rigidBody,
      collider,
      mesh,
      update: () => {
        const position = rigidBody.translation();
        mesh.position.set(position.x, position.y, position.z);
        
        const rotation = rigidBody.rotation();
        mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
      }
    };
    
    this.physicsObjects.push(physicsObject);
    
    return physicsObject;
  }

  step(): void {
    if (!this.world) return;
    
    // Step the physics simulation forward
    this.world.step();
    
    // Update all physics objects (sync Three.js meshes with Rapier bodies)
    for (const obj of this.physicsObjects) {
      obj.update();
    }
  }

  cleanup(): void {
    // Clean up physics objects
    this.physicsObjects = [];
    
    // The world gets garbage collected automatically
    this.world = null;
  }
} 