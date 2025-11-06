/**
 * Enemy types available in the game
 */
export enum EnemyType {
    Weak = 'Weak',
    Medium = 'Medium',
    Strong = 'Strong'
}

/**
 * Configuration for an enemy type
 */
export interface EnemyConfig {
    /** Type identifier */
    type: EnemyType;
    /** Initial and maximum health */
    health: number;
    /** Damage dealt per hit */
    damage: number;
    /** Sprite color in hex format */
    color: number;
    /** Size of the sprite in pixels */
    size: number;
    /** Whether the enemy is stationary */
    isStatic: boolean;
    /** Movement speed in pixels per second */
    moveSpeed: number;
    goldReward: number;
}

/**
 * Predefined configurations for each enemy type
 */
export const ENEMY_CONFIGS: { [key in EnemyType]: Omit<EnemyConfig, 'isStatic'> } = {
    [EnemyType.Weak]: {
        type: EnemyType.Weak,
        health: 30,
        damage: 5,
        color: 0x90EE90, // Light green
        size: 25,
        moveSpeed: 30,
        goldReward: 2
    },
    [EnemyType.Medium]: {
        type: EnemyType.Medium,
        health: 60,
        damage: 10,
        color: 0xFFA500, // Orange
        size: 35,
        moveSpeed: 40,
        goldReward: 6
    },
    [EnemyType.Strong]: {
        type: EnemyType.Strong,
        health: 100,
        damage: 15,
        color: 0xFF4500, // Red-orange
        size: 45,
        moveSpeed: 25,
        goldReward: 10
    }
};
