import * as Phaser from 'phaser';
import { EnemyType, ENEMY_CONFIGS } from './enemyConfig';
import type { EnemyConfig } from './enemyConfig';

export { EnemyType, ENEMY_CONFIGS } from './enemyConfig';
export type { EnemyConfig } from './enemyConfig';

/**
 * Configuration constants for Enemy behavior and appearance
 * These values define the base behavior patterns and visual effects for all enemies
 */
const ENEMY_CONSTANTS = {
    MOVE_INTERVAL_MS: 1500,
    VELOCITY_THRESHOLD_FACTOR: 0.1,
    MAX_TURN_ANGLE_RAD: Math.PI / 6, // 30 degrees
    DAMAGE_FLASH_ALPHA: 0.5,
    DAMAGE_FLASH_DURATION_MS: 100,
    DAMAGE_FLASH_REPEATS: 1,
    DEATH_ANIMATION_DURATION_MS: 300,
    SPRITE_BORDER_WIDTH: 2,
    SPRITE_BORDER_COLOR: 0x000000
} as const;

/**
 * Represents an enemy in the battle arena
 */
/**
 * Represents an enemy in the battle arena
 */
export class Enemy {
    public sprite: Phaser.GameObjects.Rectangle;
    public health: number;
    public maxHealth: number;
    public damage: number;
    public isAlive: boolean = true;
    public type: EnemyType;
    public isStatic: boolean;
    private scene: Phaser.Scene;
    private moveSpeed: number;
    private lastMoveTime: number = 0;
    private moveInterval: number = ENEMY_CONSTANTS.MOVE_INTERVAL_MS;
    private currentVelocity: Phaser.Math.Vector2;

    /**
     * Creates a new enemy
     * @param scene - The Phaser scene this enemy belongs to
     * @param x - Initial X position
     * @param y - Initial Y position
     * @param config - Enemy configuration (type, stats, etc.)
     */
    constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
        this.scene = scene;
        this.type = config.type;
        this.health = config.health;
        this.maxHealth = config.health;
        this.damage = config.damage;
        this.isStatic = config.isStatic;
        this.moveSpeed = config.moveSpeed;

        // Create a rectangle sprite for the enemy
        this.sprite = scene.add.rectangle(x, y, config.size, config.size, config.color);
        this.sprite.setStrokeStyle(ENEMY_CONSTANTS.SPRITE_BORDER_WIDTH, ENEMY_CONSTANTS.SPRITE_BORDER_COLOR);
        
        // Add physics body
        scene.physics.add.existing(this.sprite);
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        
        if (this.isStatic) {
            // Static enemies don't move
            body.setImmovable(true);
            this.currentVelocity = new Phaser.Math.Vector2(0, 0);
        } else {
            // Moving enemies have initial random velocity
            body.setBounce(1);
            this.currentVelocity = new Phaser.Math.Vector2(
                Math.random() * 2 - 1, 
                Math.random() * 2 - 1
            ).normalize().scale(this.moveSpeed);
            this.setInitialVelocity();
        }
    }

    /**
     * Set initial random velocity for enemy movement
     */
    private setInitialVelocity(): void {
        if (this.isStatic) return;
        const initialAngle = Math.random() * Math.PI * 2;
        this.currentVelocity.setToPolar(initialAngle, this.moveSpeed);
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(this.currentVelocity.x, this.currentVelocity.y);
    }

    /**
     * Adjust the enemy's heading by a random angle
     */
    private adjustHeading(): void {
        if (this.isStatic) return;
        
        let currentAngle = this.currentVelocity.angle();
        const turnAdjustment = (Math.random() * 2 - 1) * ENEMY_CONSTANTS.MAX_TURN_ANGLE_RAD;
        currentAngle += turnAdjustment;

        this.currentVelocity.setToPolar(currentAngle, this.moveSpeed);
    }

    /**
     * Update enemy state each frame
     * @param time - Current game time in milliseconds
     */
    public update(time: number): void {
        if (!this.isAlive || this.isStatic) return;

        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        
        // Periodically adjust heading for moving enemies
        if (time - this.lastMoveTime > this.moveInterval) {
            const velocityThreshold = this.moveSpeed * ENEMY_CONSTANTS.VELOCITY_THRESHOLD_FACTOR;
            if (body.velocity.lengthSq() < velocityThreshold ** 2) {
                this.setInitialVelocity();
            } else {
                this.adjustHeading();
            }
            this.lastMoveTime = time;
            
            // Apply the new velocity after direction change
            body.setVelocity(this.currentVelocity.x, this.currentVelocity.y);
        }
    }

    /**
     * Apply damage to the enemy
     * @param amount - Amount of damage to apply
     */
    public takeDamage(amount: number): void {
        if (!this.isAlive) return;

        this.health -= amount;
        
        // Flash effect when taking damage
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: ENEMY_CONSTANTS.DAMAGE_FLASH_ALPHA,
            duration: ENEMY_CONSTANTS.DAMAGE_FLASH_DURATION_MS,
            yoyo: true,
            repeat: ENEMY_CONSTANTS.DAMAGE_FLASH_REPEATS
        });

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    /**
     * Handle enemy death
     */
    private die(): void {
        this.isAlive = false;
        
        // Visual death effect
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: ENEMY_CONSTANTS.DEATH_ANIMATION_DURATION_MS,
            onComplete: () => {
                this.sprite.destroy();
            }
        });
    }

    /**
     * Destroy the enemy sprite and clean up
     */
    public destroy(): void {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}
