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
    SPRITE_BORDER_COLOR: 0x000000,
    PLAYER_DETECTION_RANGE: 200, // Range at which enemies detect players
    ATTRACTION_INFLUENCE_FACTOR: 0.3, // How much attraction affects enemy movement (0-1)
    MIN_ATTRACTION_THRESHOLD: 0.1, // Minimum attraction strength to influence movement
    MAX_ATTRACTION_VALUE: 10 // Maximum foe attraction value (matches player's range)
    HEALTH_BAR_WIDTH: 40,
    HEALTH_BAR_HEIGHT: 4,
    HEALTH_BAR_Y_OFFSET: -5,
    HEALTH_BAR_VERTICAL_PADDING: 8,
    HEALTH_BAR_BACKGROUND_COLOR: 0x333333,
    HEALTH_BAR_GREEN_COLOR: 0x00ff00,
    HEALTH_BAR_YELLOW_COLOR: 0xffff00,
    HEALTH_BAR_RED_COLOR: 0xff0000,
    HEALTH_BAR_GREEN_THRESHOLD: 0.5,
    HEALTH_BAR_YELLOW_THRESHOLD: 0.25
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
    public goldReward: number;
    private scene: Phaser.Scene;
    private moveSpeed: number;
    private lastMoveTime: number = 0;
    private moveInterval: number = ENEMY_CONSTANTS.MOVE_INTERVAL_MS;
    private currentVelocity: Phaser.Math.Vector2;
    private healthBarContainer: Phaser.GameObjects.Container;
    private healthBarBackground: Phaser.GameObjects.Graphics;
    private healthBar: Phaser.GameObjects.Graphics;

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
        this.goldReward = config.goldReward;

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

        // Create health bar UI
        this.createHealthBar(x, y);
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
     * Create health bar UI for the enemy
     */
    private createHealthBar(x: number, y: number): void {
        // Create container for health bar
        this.healthBarContainer = this.scene.add.container(x, y);

        // Health bar background
        this.healthBarBackground = this.scene.add.graphics();
        this.healthBarBackground.fillStyle(ENEMY_CONSTANTS.HEALTH_BAR_BACKGROUND_COLOR);
        this.healthBarBackground.fillRect(
            -ENEMY_CONSTANTS.HEALTH_BAR_WIDTH / 2,
            ENEMY_CONSTANTS.HEALTH_BAR_Y_OFFSET,
            ENEMY_CONSTANTS.HEALTH_BAR_WIDTH,
            ENEMY_CONSTANTS.HEALTH_BAR_HEIGHT
        );
        this.healthBarContainer.add(this.healthBarBackground);

        // Health bar (actual health)
        this.healthBar = this.scene.add.graphics();
        this.healthBarContainer.add(this.healthBar);

        // Initial health bar render
        this.updateHealthBar();
    }

    /**
     * Get health bar color based on current health percentage
     * @returns Hex color value for the health bar
     */
    private getHealthBarColor(): number {
        const healthPercent = this.health / this.maxHealth;
        if (healthPercent > ENEMY_CONSTANTS.HEALTH_BAR_GREEN_THRESHOLD) {
            return ENEMY_CONSTANTS.HEALTH_BAR_GREEN_COLOR;
        } else if (healthPercent > ENEMY_CONSTANTS.HEALTH_BAR_YELLOW_THRESHOLD) {
            return ENEMY_CONSTANTS.HEALTH_BAR_YELLOW_COLOR;
        } else {
            return ENEMY_CONSTANTS.HEALTH_BAR_RED_COLOR;
        }
    }

    /**
     * Update health bar appearance based on current health
     */
    private updateHealthBar(): void {
        if (!this.healthBar || !this.isAlive) return;

        this.healthBar.clear();
        const healthPercent = this.health / this.maxHealth;
        const barColor = this.getHealthBarColor();
        this.healthBar.fillStyle(barColor);
        this.healthBar.fillRect(
            -ENEMY_CONSTANTS.HEALTH_BAR_WIDTH / 2,
            ENEMY_CONSTANTS.HEALTH_BAR_Y_OFFSET,
            ENEMY_CONSTANTS.HEALTH_BAR_WIDTH * healthPercent,
            ENEMY_CONSTANTS.HEALTH_BAR_HEIGHT
        );

        // Update container position to follow sprite
        if (this.healthBarContainer && this.sprite) {
            this.healthBarContainer.setPosition(
                this.sprite.x,
                this.sprite.y - (this.sprite.height / 2) - ENEMY_CONSTANTS.HEALTH_BAR_VERTICAL_PADDING
            );
        }
    }

    /**
     * Adjust the enemy's heading by a random angle
     */
    private adjustHeading(targetAngle?: number): void {
        if (this.isStatic) return;
        
        let currentAngle = this.currentVelocity.angle();
        
        if (targetAngle !== undefined) {
            // Move towards or away from target angle based on attraction
            // Blend between current angle and target angle
            const angleDiff = targetAngle - currentAngle;
            // Normalize angle difference to -PI to PI range
            const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
            // Apply influence factor to make it a gradual turn
            currentAngle += normalizedDiff * ENEMY_CONSTANTS.ATTRACTION_INFLUENCE_FACTOR;
        } else {
            // Random adjustment as before
            const turnAdjustment = (Math.random() * 2 - 1) * ENEMY_CONSTANTS.MAX_TURN_ANGLE_RAD;
            currentAngle += turnAdjustment;
        }

        this.currentVelocity.setToPolar(currentAngle, this.moveSpeed);
    }

    /**
     * Update enemy state each frame
     * @param time - Current game time in milliseconds
     * @param nearbyPlayers - Optional array of nearby players to react to
     */
    public update(time: number): void {
        if (!this.isAlive) return;

        // Update health bar position
        this.updateHealthBar();

        if (this.isStatic) return;

        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        
        // Periodically adjust heading for moving enemies
        if (time - this.lastMoveTime > this.moveInterval) {
            const velocityThreshold = this.moveSpeed * ENEMY_CONSTANTS.VELOCITY_THRESHOLD_FACTOR;
            if (body.velocity.lengthSq() < velocityThreshold ** 2) {
                this.setInitialVelocity();
            } else {
                // Check for nearby players with attraction
                let targetAngle: number | undefined = undefined;
                
                if (nearbyPlayers && nearbyPlayers.length > 0) {
                    // Find the player with strongest attraction influence (considering both attraction value and distance)
                    let strongestInfluence = 0;
                    let attractionAngle: number | undefined = undefined;
                    
                    for (const player of nearbyPlayers) {
                        if (!player.isAlive || player.foeAttraction === 0) continue;
                        
                        const dx = player.x - this.sprite.x;
                        const dy = player.y - this.sprite.y;
                        const distance = Math.sqrt(dx * dx + dy * dy);
                        
                        // Only consider players within detection range
                        if (distance < ENEMY_CONSTANTS.PLAYER_DETECTION_RANGE && distance > 0) {
                            // Calculate influence: stronger attraction and closer distance = higher influence
                            // Normalize distance: closer = higher value (1 at distance 0, decreasing to 0 at max range)
                            const distanceFactor = 1 - (distance / ENEMY_CONSTANTS.PLAYER_DETECTION_RANGE);
                            const attractionStrength = Math.abs(player.foeAttraction) / ENEMY_CONSTANTS.MAX_ATTRACTION_VALUE; // Normalize to 0-1
                            const influence = attractionStrength * distanceFactor;
                            
                            // Use the player with the strongest influence
                            if (influence > strongestInfluence) {
                                strongestInfluence = influence;
                                const angleToPlayer = Math.atan2(dy, dx);
                                
                                if (player.foeAttraction > 0) {
                                    // Positive attraction - move towards player
                                    attractionAngle = angleToPlayer;
                                } else {
                                    // Negative attraction - move away from player
                                    attractionAngle = angleToPlayer + Math.PI; // Opposite direction
                                }
                            }
                        }
                    }
                    
                    // Only apply if influence is significant
                    if (attractionAngle !== undefined && strongestInfluence > ENEMY_CONSTANTS.MIN_ATTRACTION_THRESHOLD) {
                        targetAngle = attractionAngle;
                    }
                }
                
                this.adjustHeading(targetAngle);
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
        
        // Update health bar immediately
        this.updateHealthBar();
        
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
        
        // Hide health bar
        if (this.healthBarContainer) {
            this.healthBarContainer.setVisible(false);
        }
        
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
        if (this.healthBarContainer) {
            this.healthBarContainer.destroy();
        }
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}
