import * as THREE from 'three';
import { PhysicsEngine, PhysicsObject } from './PhysicsEngine';

/**
 * GameScene manages a collection of game objects and their physics
 * This provides a central place to add new game objects with physics
 */
export class GameScene {
  private scene: THREE.Scene;
  private physicsEngine: PhysicsEngine;
  private objects: Map<string, {
    mesh: THREE.Mesh,
    physics?: PhysicsObject
  }> = new Map();

  constructor(scene: THREE.Scene, physicsEngine: PhysicsEngine) {
    this.scene = scene;
    this.physicsEngine = physicsEngine;
  }

  /**
   * Create a box with physics
   */
  createPhysicsBox(
    id: string,
    size: { width: number; height: number; depth: number },
    position: { x: number; y: number; z: number },
    options: {
      color?: number,
      isDynamic?: boolean,
      mass?: number
    } = {}
  ): void {
    // Default options
    const { 
      color = 0x00ff00, 
      isDynamic = true
    } = options;

    // Create Three.js mesh
    const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add to scene
    this.scene.add(mesh);
    
    // Add physics
    const physicsObject = this.physicsEngine.createBox(
      size,
      position,
      mesh,
      isDynamic
    );
    
    // Store in objects map
    this.objects.set(id, {
      mesh,
      physics: physicsObject || undefined
    });
  }

  /**
   * Create a platform/ground with physics
   */
  createGround(
    id: string,
    size: { width: number; height: number; depth: number },
    position: { x: number; y: number; z: number },
    options: {
      color?: number
    } = {}
  ): void {
    const { color = 0x666666 } = options;
    
    // Create visual mesh
    const geometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
    const material = new THREE.MeshStandardMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(position.x, position.y, position.z);
    
    this.scene.add(mesh);
    
    // Create physics ground
    this.physicsEngine.createGround(size);
    
    // Store in objects map
    this.objects.set(id, { mesh });
  }

  /**
   * Get an object by ID
   */
  getObject(id: string): { mesh: THREE.Mesh, physics?: PhysicsObject } | undefined {
    return this.objects.get(id);
  }

  /**
   * Apply a force to a physics object
   */
  applyForce(
    id: string, 
    force: { x: number; y: number; z: number },
    point?: { x: number; y: number; z: number }
  ): void {
    const obj = this.objects.get(id);
    if (!obj || !obj.physics || !obj.physics.rigidBody) return;
    
    // Apply force at center of mass if no point specified
    if (point) {
      obj.physics.rigidBody.addForceAtPoint(
        force,
        point,
        true // wake up the body if it's sleeping
      );
    } else {
      obj.physics.rigidBody.addForce(
        force,
        true // wake up the body if it's sleeping
      );
    }
  }

  /**
   * Apply an impulse to a physics object
   */
  applyImpulse(
    id: string, 
    impulse: { x: number; y: number; z: number },
    point?: { x: number; y: number; z: number }
  ): void {
    const obj = this.objects.get(id);
    if (!obj || !obj.physics || !obj.physics.rigidBody) return;
    
    // Apply impulse at center of mass if no point specified
    if (point) {
      obj.physics.rigidBody.applyImpulseAtPoint(
        impulse,
        point,
        true // wake up the body if it's sleeping
      );
    } else {
      obj.physics.rigidBody.applyImpulse(
        impulse,
        true // wake up the body if it's sleeping
      );
    }
  }

  /**
   * Clean up all objects
   */
  cleanup(): void {
    for (const [, obj] of this.objects.entries()) {
      if (obj.mesh) {
        this.scene.remove(obj.mesh);
        if (obj.mesh.geometry) obj.mesh.geometry.dispose();
        if (obj.mesh.material) {
          if (Array.isArray(obj.mesh.material)) {
            obj.mesh.material.forEach(m => m.dispose());
          } else {
            obj.mesh.material.dispose();
          }
        }
      }
    }
    
    this.objects.clear();
  }
} 