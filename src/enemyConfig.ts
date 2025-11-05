export enum EnemyType {
    Weak = 'Weak',
    Medium = 'Medium',
    Strong = 'Strong'
}

export interface EnemyConfig {
    type: EnemyType;
    health: number;
    damage: number;
    color: number;
    size: number;
    isStatic: boolean;
    moveSpeed: number;
    goldReward: number;
}

// Enemy type configurations
export const ENEMY_CONFIGS: { [key in EnemyType]: Omit<EnemyConfig, 'isStatic'> } = {
    [EnemyType.Weak]: {
        type: EnemyType.Weak,
        health: 30,
        damage: 5,
        color: 0x90EE90, // Light green
        size: 25,
        moveSpeed: 30,
        goldReward: 1
    },
    [EnemyType.Medium]: {
        type: EnemyType.Medium,
        health: 60,
        damage: 10,
        color: 0xFFA500, // Orange
        size: 35,
        moveSpeed: 40,
        goldReward: 3
    },
    [EnemyType.Strong]: {
        type: EnemyType.Strong,
        health: 100,
        damage: 15,
        color: 0xFF4500, // Red-orange
        size: 45,
        moveSpeed: 25,
        goldReward: 5
    }
};
