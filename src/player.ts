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
    MIN_SPEED_FACTOR: 0.1,
    // Fight or Flight constants
    FIGHT_OR_FLIGHT_MAX_STAT_VALUE: 10, // Maximum stat value (+/- 10)
    FIGHT_OR_FLIGHT_BASE_RANGE: 100, // Base detection range for enemies
    FIGHT_OR_FLIGHT_MAX_RANGE: 400, // Maximum detection range at +/-10
    FIGHT_OR_FLIGHT_MAX_SPEED_BOOST: 0.5, // Maximum speed boost (50% at +/-10)
    FIGHT_OR_FLIGHT_TURN_SMOOTHING: 0.5 // How smoothly player turns toward/away from enemy
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
    public fightOrFlight: number = 0; // Fight or flight response: positive values make player pursue enemies, negative values make them flee (-10 to +10)
    
    // Leveling system properties
    public level: number = 1; // Current level
    public xp: number = 0; // Current experience points
    public xpToNextLevel: number = 100; // XP required for next level
    public availableStatPoints: number = 0; // Points available to allocate to stats
    private lastXpGainTime: number = 0; // Last time XP was gained from time passing

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
     * @param nearbyEnemies - Optional array of nearby enemies to react to based on fightOrFlight
     */
    public update(time: number, nearbyEnemies?: Array<{ x: number; y: number; isAlive: boolean }>): void {
        if (!this.isAlive) return;

        // Update XP gain from time passing
        this.updateXPGain(time);

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

        // Update outline color based on fight or flight state and enemy proximity
        this.updateOutlineColor(nearbyEnemies);

        // Periodically adjust heading
        if (time - this.lastMoveTime > this.moveInterval) {
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            const minSpeedThreshold = this.moveSpeed * PLAYER_CONSTANTS.MIN_SPEED_FACTOR;
            
            if (body.velocity.lengthSq() < minSpeedThreshold ** 2 && this.isAlive) {
                this.setInitialVelocity();
            } else {
                this.adjustHeading(nearbyEnemies);
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
     * Update the player's outline color based on fight or flight state and enemy proximity
     * @param nearbyEnemies - Optional array of nearby enemies to react to
     */
    private updateOutlineColor(nearbyEnemies?: Array<{ x: number; y: number; isAlive: boolean }>): void {
        // Default to white outline
        let outlineColor = 0xffffff;

        // Check if player has fight or flight response active
        if (this.fightOrFlight !== 0 && nearbyEnemies && nearbyEnemies.length > 0) {
            // Find the closest alive enemy
            let closestDistance = Infinity;
            let hasCloseEnemy = false;
            
            for (const enemy of nearbyEnemies) {
                if (!enemy.isAlive) continue;
                
                const dx = enemy.x - this.sprite.x;
                const dy = enemy.y - this.sprite.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                }
            }
            
            // Calculate detection range based on stat magnitude
            const statMagnitude = Math.abs(this.fightOrFlight);
            const detectionRange = PLAYER_CONSTANTS.FIGHT_OR_FLIGHT_BASE_RANGE + 
                (PLAYER_CONSTANTS.FIGHT_OR_FLIGHT_MAX_RANGE - PLAYER_CONSTANTS.FIGHT_OR_FLIGHT_BASE_RANGE) * 
                (statMagnitude / PLAYER_CONSTANTS.FIGHT_OR_FLIGHT_MAX_STAT_VALUE);
            
            // Check if closest enemy is within detection range
            if (closestDistance < detectionRange) {
                hasCloseEnemy = true;
            }
            
            // Set outline color based on fight or flight state if enemy is nearby
            if (hasCloseEnemy) {
                if (this.fightOrFlight > 0) {
                    // Positive: fight mode (red outline)
                    outlineColor = 0xff0000;
                } else {
                    // Negative: flight mode (orange outline)
                    outlineColor = 0xffa500;
                }
            }
        }

        // Apply the outline color
        this.sprite.setStrokeStyle(PLAYER_CONSTANTS.SPRITE_BORDER_WIDTH, outlineColor);
    }

    /**
     * Adjust the player's heading based on fight or flight response
     * @param nearbyEnemies - Optional array of nearby enemies to react to
     */
    private adjustHeading(nearbyEnemies?: Array<{ x: number; y: number; isAlive: boolean }>): void {
        // Get current angle
        let currentAngle = this.currentVelocity.angle();
        let targetAngle: number | undefined = undefined;

        // Check if player has fight or flight response active
        if (this.fightOrFlight !== 0 && nearbyEnemies && nearbyEnemies.length > 0) {
            // Find the closest alive enemy
            let closestDistance = Infinity;
            let closestEnemy: { x: number; y: number; isAlive: boolean } | undefined;
            
            for (const enemy of nearbyEnemies) {
                if (!enemy.isAlive) continue;
                
                const dx = enemy.x - this.sprite.x;
                const dy = enemy.y - this.sprite.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestEnemy = enemy;
                }
            }
            
            if (closestEnemy) {
                // Calculate base detection range (increases with stat magnitude)
                const statMagnitude = Math.abs(this.fightOrFlight);
                const detectionRange = PLAYER_CONSTANTS.FIGHT_OR_FLIGHT_BASE_RANGE + 
                    (PLAYER_CONSTANTS.FIGHT_OR_FLIGHT_MAX_RANGE - PLAYER_CONSTANTS.FIGHT_OR_FLIGHT_BASE_RANGE) * 
                    (statMagnitude / PLAYER_CONSTANTS.FIGHT_OR_FLIGHT_MAX_STAT_VALUE);
                
                // Only react to enemies within detection range
                if (closestDistance < detectionRange) {
                    const dx = closestEnemy.x - this.sprite.x;
                    const dy = closestEnemy.y - this.sprite.y;
                    const angleToEnemy = Math.atan2(dy, dx);
                    
                    if (this.fightOrFlight > 0) {
                        // Positive: move towards enemy (fight)
                        targetAngle = angleToEnemy;
                    } else {
                        // Negative: move away from enemy (flight)
                        targetAngle = angleToEnemy + Math.PI; // Opposite direction
                    }
                    
                    // Apply speed boost based on stat magnitude
                    const speedBoostFactor = 1 + (statMagnitude / PLAYER_CONSTANTS.FIGHT_OR_FLIGHT_MAX_STAT_VALUE) * 
                        PLAYER_CONSTANTS.FIGHT_OR_FLIGHT_MAX_SPEED_BOOST;
                    const boostedSpeed = this.moveSpeed * speedBoostFactor;
                    
                    // Blend between current angle and target angle based on stat magnitude
                    const influenceFactor = statMagnitude / PLAYER_CONSTANTS.FIGHT_OR_FLIGHT_MAX_STAT_VALUE; // 0 to 1
                    const angleDiff = targetAngle - currentAngle;
                    // Normalize angle difference to -PI to PI range
                    const normalizedDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
                    // Apply influence factor for gradual turn (stronger at higher stat values)
                    currentAngle += normalizedDiff * influenceFactor * PLAYER_CONSTANTS.FIGHT_OR_FLIGHT_TURN_SMOOTHING;
                    
                    // Set velocity with boosted speed
                    this.currentVelocity.setToPolar(currentAngle, boostedSpeed);
                    return;
                }
            }
        }

        // Default random adjustment if no fight or flight response
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
     * Adjust the player's fight or flight value
     * @param amount - Amount to adjust fight or flight by (clamped to -10 to +10 range)
     */
    public adjustFightOrFlight(amount: number): void {
        this.fightOrFlight = Math.max(-10, Math.min(10, this.fightOrFlight + amount));
    }

    /**
     * Add experience points to the player and handle level ups
     * @param amount - Amount of XP to add
     */
    public addXP(amount: number): void {
        if (!this.isAlive) return;
        
        this.xp += amount;
        
        // Check for level up
        while (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    /**
     * Handle player leveling up
     */
    private levelUp(): void {
        this.xp -= this.xpToNextLevel;
        this.level++;
        this.availableStatPoints += 3; // Give 3 stat points per level
        
        // Calculate next level requirement (10% more than current)
        this.xpToNextLevel = Math.floor(this.xpToNextLevel * 1.1);
    }

    /**
     * Allocate a stat point to a specific stat
     * @param stat - The stat to increase ('damage', 'speed', or 'health')
     * @returns True if the stat point was allocated successfully
     */
    public allocateStatPoint(stat: 'damage' | 'speed' | 'health'): boolean {
        if (this.availableStatPoints <= 0) return false;
        
        switch (stat) {
            case 'damage':
                this.increaseDamage(5); // 5 damage per point
                break;
            case 'speed':
                this.increaseSpeed(5); // 5 speed per point
                break;
            case 'health':
                this.increaseMaxHealth(20); // 20 max health per point
                break;
            default:
                return false;
        }
        
        this.availableStatPoints--;
        return true;
    }

    /**
     * Update XP gain from time passing (1 XP per second)
     * @param time - Current game time in milliseconds
     */
    public updateXPGain(time: number): void {
        if (!this.isAlive) return;
        
        // Give 1 XP per second
        if (this.lastXpGainTime === 0) {
            this.lastXpGainTime = time;
        }
        
        const timeSinceLastXpGain = time - this.lastXpGainTime;
        if (timeSinceLastXpGain >= 1000) {
            const xpToGain = Math.floor(timeSinceLastXpGain / 1000);
            this.addXP(xpToGain);
            this.lastXpGainTime = time;
        }
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