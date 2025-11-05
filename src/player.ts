import * as Phaser from 'phaser';
import { Item } from './items';

/**
 * Configuration constants for Player behavior and appearance
 * These values define the base stats and visual/behavioral parameters for all players
 */
const PLAYER_CONSTANTS = {
    INITIAL_HEALTH: 150,
    INITIAL_GOLD: 10,
    SPRITE_SIZE: 30,
    SPRITE_BORDER_WIDTH: 2,
    BASE_MOVE_SPEED: 50,
    MOVE_INTERVAL_MS: 1000,
    MAX_TURN_ANGLE_RAD: Math.PI / 4, // 45 degrees
    BASE_ATTACK_DAMAGE: 15,
    BASE_DEFENSE: 0,
    BASE_GOLD_PER_HIT: 1,
    INVULNERABILITY_DURATION_MS: 100,
    DAMAGE_FLASH_DURATION_MS: 100,
    DAMAGE_FLASH_ALPHA: 0.3,
    DAMAGE_FLASH_REPEATS: 2,
    DEATH_ANIMATION_DURATION_MS: 1000,
    DEATH_SCALE: 0.5,
    DEATH_ALPHA: 0.3,
    DEAD_COLOR: 0x666666,
    DEAD_ALPHA: 0.5,
    INVULNERABLE_ALPHA: 0.7,
    MIN_SPEED_FACTOR: 0.1
} as const;

/**
 * Represents a player in the battle arena game
 */
export class Player {
    public sprite: Phaser.GameObjects.Rectangle;
    public health: number = PLAYER_CONSTANTS.INITIAL_HEALTH;
    public maxHealth: number = PLAYER_CONSTANTS.INITIAL_HEALTH;
    public gold: number = PLAYER_CONSTANTS.INITIAL_GOLD;
    public isAlive: boolean = true;
    public id: string;
    public color: number;
    /** Flag to indicate if player died in the current frame/update cycle */
    public justDied: boolean = false;
    public isInvulnerable: boolean = false;
    private lastHitTime: number = 0;
    private invulnerabilityDuration: number = PLAYER_CONSTANTS.INVULNERABILITY_DURATION_MS;
    public inventory: Item[] = [];

    private scene: Phaser.Scene;
    /** Base speed, actual speed can be modified by items */
    public moveSpeed: number = PLAYER_CONSTANTS.BASE_MOVE_SPEED;
    private lastMoveTime: number = 0;
    private moveInterval: number = 1000; // Interval to adjust heading
    public currentVelocity: Phaser.Math.Vector2; // Stores current velocity vector
    private maxTurnAngle: number = Math.PI / 4; // Max turn angle per adjustment (45 degrees)
    public attackDamage: number = 15; // Base attack damage
    public defense: number = 0; // Base defense
    public doubleGoldChance: number = 0; // Chance to get double gold on kill (0-1)
    public lifestealPercent: number = 0; // Percentage of damage dealt that heals (0-1)
    public healthRegenPercent: number = 0; // Percentage of max health regenerated periodically (0-1)
    private lastRegenTime: number = 0;
    private regenInterval: number = 10000; // 10 seconds

    constructor(scene: Phaser.Scene, x: number, y: number, id: string, color: number) {
        this.scene = scene;
        this.id = id;
        this.color = color;

        // Create a rectangle sprite for the player
        this.sprite = scene.add.rectangle(x, y, PLAYER_CONSTANTS.SPRITE_SIZE, PLAYER_CONSTANTS.SPRITE_SIZE, color);
        this.sprite.setStrokeStyle(PLAYER_CONSTANTS.SPRITE_BORDER_WIDTH, 0xffffff);
        
        // Add physics body
        scene.physics.add.existing(this.sprite);
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setBounce(1); // Make player bounce with full force off walls
        body.onWorldBounds = true; // Enable world bounds collision event
        
        // Initialize velocity with a random direction
        this.currentVelocity = new Phaser.Math.Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().scale(this.moveSpeed);
        this.setInitialVelocity();

        // Listen for world bounds collision event
        this.scene.physics.world.on('worldbounds', this.handleWorldBoundsCollision, this);
    }

    /**
     * Handle world bounds collision to update velocity after wall bounce
     * @param body - The physics body that collided with world bounds
     */
    private handleWorldBoundsCollision(body: Phaser.Physics.Arcade.Body): void {
        // Check if the collided body belongs to this player
        if (body === this.sprite.body) {
            // Update currentVelocity to reflect the bounce
            this.currentVelocity.set(body.velocity.x, body.velocity.y);
        }
    }

    /**
     * Update player state each frame
     * @param time - Current game time in milliseconds
     */
    public update(time: number): void {
        if (!this.isAlive) return;

        // Handle invulnerability duration
        if (this.isInvulnerable && time - this.lastHitTime > this.invulnerabilityDuration) {
            this.isInvulnerable = false;
            this.sprite.setAlpha(1);
        }

        // Handle health regeneration
        if (this.healthRegenPercent > 0 && time - this.lastRegenTime > this.regenInterval) {
            const regenAmount = this.maxHealth * this.healthRegenPercent;
            this.heal(regenAmount);
            this.lastRegenTime = time;
        }

        // Periodically adjust heading
        if (time - this.lastMoveTime > this.moveInterval) {
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            const minSpeedThreshold = this.moveSpeed * PLAYER_CONSTANTS.MIN_SPEED_FACTOR;
            
            if (body.velocity.lengthSq() < minSpeedThreshold ** 2 && this.isAlive) {
                this.setInitialVelocity();
            } else {
                this.adjustHeading();
            }
            this.lastMoveTime = time;
        }

        // Apply velocity based on currentVelocity
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(this.currentVelocity.x, this.currentVelocity.y);

        // Ensure the speed is maintained
        this.currentVelocity.normalize().scale(this.moveSpeed);
        body.setVelocity(this.currentVelocity.x, this.currentVelocity.y);
    }

    /**
     * Set the player as temporarily invulnerable
     * @param time - Current game time when invulnerability starts
     */
    public setInvulnerable(time: number): void {
        this.isInvulnerable = true;
        this.lastHitTime = time;
        this.sprite.setAlpha(PLAYER_CONSTANTS.INVULNERABLE_ALPHA);
    }

    /**
     * Set initial random velocity for player movement
     */
    private setInitialVelocity(): void {
        const initialAngle = Math.random() * Math.PI * 2;
        this.currentVelocity.setToPolar(initialAngle, this.moveSpeed);
    }

    /**
     * Adjust the player's heading by a random angle
     */
    private adjustHeading(): void {
        // Get current angle
        let currentAngle = this.currentVelocity.angle();

        // Add a random adjustment within maxTurnAngle
        const turnAdjustment = (Math.random() * 2 - 1) * this.maxTurnAngle;
        currentAngle += turnAdjustment;

        // Set new velocity based on the adjusted angle and current speed
        this.currentVelocity.setToPolar(currentAngle, this.moveSpeed);
    }

    /**
     * Apply damage to the player
     * @param amount - Amount of damage to apply (before defense)
     */
    public takeDamage(amount: number): void {
        if (!this.isAlive) return;

        const actualDamage = Math.max(0, amount - this.defense);
        this.health -= actualDamage;
        
        // Flash effect when taking damage
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: PLAYER_CONSTANTS.DAMAGE_FLASH_ALPHA,
            duration: PLAYER_CONSTANTS.DAMAGE_FLASH_DURATION_MS,
            yoyo: true,
            repeat: PLAYER_CONSTANTS.DAMAGE_FLASH_REPEATS
        });

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    public dealDamage(target: any, amount: number): number {
        // Deal damage and return actual damage dealt (for lifesteal calculation)
        const actualDamage = Math.max(0, amount - (target.defense || 0));
        
        // Apply lifesteal if enabled
        if (this.lifestealPercent > 0 && this.isAlive) {
            const healAmount = actualDamage * this.lifestealPercent;
            this.heal(healAmount);
        }
        
        return actualDamage;
    }

    private die(): void {
        this.isAlive = false;
        this.justDied = true;
        
        // Visual death effect
        this.sprite.setFillStyle(PLAYER_CONSTANTS.DEAD_COLOR);
        this.sprite.setAlpha(PLAYER_CONSTANTS.DEAD_ALPHA);
        
        // Stop movement
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        
        // Shrink animation
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: PLAYER_CONSTANTS.DEATH_SCALE,
            scaleY: PLAYER_CONSTANTS.DEATH_SCALE,
            alpha: PLAYER_CONSTANTS.DEATH_ALPHA,
            duration: PLAYER_CONSTANTS.DEATH_ANIMATION_DURATION_MS
        });
    }

    /**
     * Get the player's current health as a percentage
     * @returns Health percentage (0-100)
     */
    public getHealthPercentage(): number {
        return (this.health / this.maxHealth) * 100;
    }

    /**
     * Get the player's current gold amount
     * @returns Current gold amount
     */
    public getGold(): number {
        return this.gold;
    }

    public addGold(amount: number): void {
        this.gold += amount;
    }

    /**
     * Increase the player's attack damage
     * @param amount - Amount to increase damage by
     */
    public increaseDamage(amount: number): void {
        this.attackDamage += amount;
    }

    /**
     * Increase the player's defense
     * @param amount - Amount to increase defense by
     */
    public increaseDefense(amount: number): void {
        this.defense += amount;
    }

    public heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    /**
     * Increase the player's movement speed
     * @param amount - Amount to increase speed by
     */
    public increaseSpeed(amount: number): void {
        this.moveSpeed += amount;
        // Update the magnitude of the current velocity vector to reflect the new speed
        this.currentVelocity.normalize().scale(this.moveSpeed);
    }

    /**
     * Increase the player's maximum health
     * @param amount - Amount to increase max health by (also increases current health)
     */
    public increaseMaxHealth(amount: number): void {
        this.maxHealth += amount;
        this.health += amount; // Also increase current health by the same amount
    }

    /**
     * Destroy the player sprite and clean up
     */
    public destroy(): void {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}