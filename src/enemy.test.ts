import { describe, it, expect } from 'vitest';
import { EnemyType, ENEMY_CONFIGS } from './enemyConfig';

describe('Enemy Configurations', () => {
    describe('Weak Enemy', () => {
        it('should have correct weak enemy configuration', () => {
            const weakConfig = ENEMY_CONFIGS[EnemyType.Weak];
            expect(weakConfig.type).toBe(EnemyType.Weak);
            expect(weakConfig.health).toBe(30);
            expect(weakConfig.damage).toBe(5);
            expect(weakConfig.size).toBe(25);
            expect(weakConfig.moveSpeed).toBe(30);
            expect(weakConfig.color).toBe(0x90EE90); // Light green
        });

        it('should have the least health compared to other types', () => {
            expect(ENEMY_CONFIGS[EnemyType.Weak].health).toBeLessThan(ENEMY_CONFIGS[EnemyType.Medium].health);
            expect(ENEMY_CONFIGS[EnemyType.Weak].health).toBeLessThan(ENEMY_CONFIGS[EnemyType.Strong].health);
        });

        it('should have the least damage compared to other types', () => {
            expect(ENEMY_CONFIGS[EnemyType.Weak].damage).toBeLessThan(ENEMY_CONFIGS[EnemyType.Medium].damage);
            expect(ENEMY_CONFIGS[EnemyType.Weak].damage).toBeLessThan(ENEMY_CONFIGS[EnemyType.Strong].damage);
        });

        it('should have the smallest size', () => {
            expect(ENEMY_CONFIGS[EnemyType.Weak].size).toBeLessThan(ENEMY_CONFIGS[EnemyType.Medium].size);
            expect(ENEMY_CONFIGS[EnemyType.Weak].size).toBeLessThan(ENEMY_CONFIGS[EnemyType.Strong].size);
        });
    });

    describe('Medium Enemy', () => {
        it('should have correct medium enemy configuration', () => {
            const mediumConfig = ENEMY_CONFIGS[EnemyType.Medium];
            expect(mediumConfig.type).toBe(EnemyType.Medium);
            expect(mediumConfig.health).toBe(60);
            expect(mediumConfig.damage).toBe(10);
            expect(mediumConfig.size).toBe(35);
            expect(mediumConfig.moveSpeed).toBe(40);
            expect(mediumConfig.color).toBe(0xFFA500); // Orange
        });

        it('should have medium health between weak and strong', () => {
            expect(ENEMY_CONFIGS[EnemyType.Medium].health).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.Weak].health);
            expect(ENEMY_CONFIGS[EnemyType.Medium].health).toBeLessThan(ENEMY_CONFIGS[EnemyType.Strong].health);
        });

        it('should have medium damage between weak and strong', () => {
            expect(ENEMY_CONFIGS[EnemyType.Medium].damage).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.Weak].damage);
            expect(ENEMY_CONFIGS[EnemyType.Medium].damage).toBeLessThan(ENEMY_CONFIGS[EnemyType.Strong].damage);
        });

        it('should have fastest move speed', () => {
            expect(ENEMY_CONFIGS[EnemyType.Medium].moveSpeed).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.Weak].moveSpeed);
            expect(ENEMY_CONFIGS[EnemyType.Medium].moveSpeed).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.Strong].moveSpeed);
        });
    });

    describe('Strong Enemy', () => {
        it('should have correct strong enemy configuration', () => {
            const strongConfig = ENEMY_CONFIGS[EnemyType.Strong];
            expect(strongConfig.type).toBe(EnemyType.Strong);
            expect(strongConfig.health).toBe(100);
            expect(strongConfig.damage).toBe(15);
            expect(strongConfig.size).toBe(45);
            expect(strongConfig.moveSpeed).toBe(25);
            expect(strongConfig.color).toBe(0xFF4500); // Red-orange
        });

        it('should have the most health', () => {
            expect(ENEMY_CONFIGS[EnemyType.Strong].health).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.Weak].health);
            expect(ENEMY_CONFIGS[EnemyType.Strong].health).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.Medium].health);
        });

        it('should have the most damage', () => {
            expect(ENEMY_CONFIGS[EnemyType.Strong].damage).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.Weak].damage);
            expect(ENEMY_CONFIGS[EnemyType.Strong].damage).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.Medium].damage);
        });

        it('should have the largest size', () => {
            expect(ENEMY_CONFIGS[EnemyType.Strong].size).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.Weak].size);
            expect(ENEMY_CONFIGS[EnemyType.Strong].size).toBeGreaterThan(ENEMY_CONFIGS[EnemyType.Medium].size);
        });

        it('should be slower than medium enemies (trade-off for strength)', () => {
            expect(ENEMY_CONFIGS[EnemyType.Strong].moveSpeed).toBeLessThan(ENEMY_CONFIGS[EnemyType.Medium].moveSpeed);
        });
    });

    describe('Enemy Type Relationships', () => {
        it('should have three distinct enemy types', () => {
            const types = Object.keys(ENEMY_CONFIGS);
            expect(types).toHaveLength(3);
            expect(types).toContain(EnemyType.Weak);
            expect(types).toContain(EnemyType.Medium);
            expect(types).toContain(EnemyType.Strong);
        });

        it('should have unique health values for each type', () => {
            const healthValues = Object.values(ENEMY_CONFIGS).map(c => c.health);
            const uniqueHealthValues = new Set(healthValues);
            expect(uniqueHealthValues.size).toBe(3);
        });

        it('should have unique damage values for each type', () => {
            const damageValues = Object.values(ENEMY_CONFIGS).map(c => c.damage);
            const uniqueDamageValues = new Set(damageValues);
            expect(uniqueDamageValues.size).toBe(3);
        });

        it('should have unique colors for each type', () => {
            const colors = Object.values(ENEMY_CONFIGS).map(c => c.color);
            const uniqueColors = new Set(colors);
            expect(uniqueColors.size).toBe(3);
        });

        it('should have positive values for all stats', () => {
            Object.values(ENEMY_CONFIGS).forEach(config => {
                expect(config.health).toBeGreaterThan(0);
                expect(config.damage).toBeGreaterThan(0);
                expect(config.size).toBeGreaterThan(0);
                expect(config.moveSpeed).toBeGreaterThan(0);
            });
        });
    });
});
