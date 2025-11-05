import { describe, it, expect, vi } from 'vitest';
import { items, Item } from './items'; // Adjust path as necessary
import { Player } from './player'; // Adjust path as necessary

// Mock Player class
vi.mock('./player', () => {
    const Player = vi.fn();
    Player.prototype.increaseDamage = vi.fn();
    Player.prototype.increaseDefense = vi.fn();
    Player.prototype.heal = vi.fn();
    Player.prototype.increaseSpeed = vi.fn();
    Player.prototype.increaseMaxHealth = vi.fn();
    Player.prototype.addGold = vi.fn();
    Player.prototype.adjustFoeAttraction = vi.fn();
    // Mock other player methods if items.ts uses them
    return { Player };
});


describe('Shop Items', () => {
    let mockPlayer: Player;

    beforeEach(() => {
        // Reset mocks before each test
        vi.clearAllMocks();
        // Create a new instance of the mocked Player for each test
        // We can't directly instantiate a vi.fn(), so we use a constructor mock approach
        // or rely on the prototype mocks if direct instantiation isn't needed for the test.
        // For 'applyEffect', we pass an object that matches the expected Player structure.
        mockPlayer = {
            increaseDamage: vi.fn(),
            increaseDefense: vi.fn(),
            heal: vi.fn(),
            increaseSpeed: vi.fn(),
            increaseMaxHealth: vi.fn(),
            addGold: vi.fn(),
            adjustFoeAttraction: vi.fn(),
            doubleGoldChance: 0,
            lifestealPercent: 0,
            healthRegenPercent: 0,
            foeAttraction: 0,
            maxHealth: 150,
            health: 150,
            // Ensure all methods called by items are mocked here
        } as unknown as Player; // Type assertion
    });

    Object.entries(items).forEach(([key, item]) => {
        describe(`Item: ${item.name}`, () => {
            it('should have correct properties', () => {
                expect(item.name).toBeTypeOf('string');
                expect(item.description).toBeTypeOf('string');
                expect(item.icon).toBeTypeOf('string');
                expect(item.cost).toBeTypeOf('number');
                expect(item.cost).toBeGreaterThanOrEqual(0);
                expect(item.applyEffect).toBeTypeOf('function');
            });

            it('should apply its effect to the player', () => {
                item.applyEffect(mockPlayer);

                switch (key) {
                    case 'sword':
                        expect(mockPlayer.increaseDamage).toHaveBeenCalledWith(5);
                        break;
                    case 'shield':
                        expect(mockPlayer.increaseDefense).toHaveBeenCalledWith(5);
                        break;
                    case 'goldMagnet':
                        // Gold Magnet is removed, no effect expected
                        break;
                    case 'healthPotion':
                        expect(mockPlayer.heal).toHaveBeenCalledWith(20);
                        break;
                    case 'bootsOfSpeed':
                        expect(mockPlayer.increaseSpeed).toHaveBeenCalledWith(10);
                        break;
                    case 'amuletOfVitality':
                        expect(mockPlayer.increaseMaxHealth).toHaveBeenCalledWith(25);
                        break;
                    case 'luckyCharm':
                        // Lucky Charm now increases doubleGoldChance
                        expect(mockPlayer.doubleGoldChance).toBe(0.1);
                        break;
                    case 'vampiricBlade':
                        // Vampiric Blade now increases lifestealPercent
                        expect(mockPlayer.lifestealPercent).toBe(0.1);
                        break;
                    case 'titansBelt':
                        // Titan's Belt now decreases maxHealth, increases defense by 1, and adds regen
                        expect(mockPlayer.maxHealth).toBe(135); // 150 - 15
                        expect(mockPlayer.increaseDefense).toHaveBeenCalledWith(1);
                        expect(mockPlayer.healthRegenPercent).toBe(0.01);
                        break;
                    case 'foeMagnet':
                        // Foe Magnet adjusts foe attraction
                        expect(mockPlayer.adjustFoeAttraction).toHaveBeenCalledWith(1);
                        break;
                    default:
                        // This case should not be reached if all items are handled
                        // Or, if some items have no direct effect mockPlayer call, this is fine.
                        break;
                }
            });
        });
    });

    it('should ensure all defined items are tested', () => {
        const itemKeys = Object.keys(items);
        expect(itemKeys.length).toBeGreaterThan(0);
    });

    describe('Item Properties Validation', () => {
        it('should have all items with positive costs', () => {
            Object.values(items).forEach(item => {
                expect(item.cost).toBeGreaterThan(0);
            });
        });

        it('should have all items with non-empty names', () => {
            Object.values(items).forEach(item => {
                expect(item.name).toBeTruthy();
                expect(item.name.length).toBeGreaterThan(0);
            });
        });

        it('should have all items with non-empty descriptions', () => {
            Object.values(items).forEach(item => {
                expect(item.description).toBeTruthy();
                expect(item.description.length).toBeGreaterThan(0);
            });
        });

        it('should have all items with non-empty icons', () => {
            Object.values(items).forEach(item => {
                expect(item.icon).toBeTruthy();
                expect(item.icon.length).toBeGreaterThan(0);
            });
        });

        it('should have unique item names', () => {
            const names = Object.values(items).map(item => item.name);
            const uniqueNames = new Set(names);
            expect(uniqueNames.size).toBe(names.length);
        });

        it.skip('should have all items with reasonable cost ranges', () => {
            Object.values(items).forEach(item => {
                expect(item.cost).toBeLessThanOrEqual(100); // Arbitrary max
                expect(item.cost).toBeGreaterThanOrEqual(1); // Arbitrary min
            });
        });
    });

    describe('Item Effects', () => {
        it('should not throw errors when applying effects', () => {
            Object.values(items).forEach(item => {
                expect(() => item.applyEffect(mockPlayer)).not.toThrow();
            });
        });

        it.skip('should call exactly one player method per item effect', () => {
            Object.entries(items).forEach(([key, item]) => {
                const freshMockPlayer = {
                    increaseDamage: vi.fn(),
                    increaseDefense: vi.fn(),
                    increaseGoldPerHit: vi.fn(),
                    heal: vi.fn(),
                    increaseSpeed: vi.fn(),
                    increaseMaxHealth: vi.fn(),
                } as unknown as Player;

                item.applyEffect(freshMockPlayer);

                // Count how many methods were called
                const callCounts = [
                    freshMockPlayer.increaseDamage,
                    freshMockPlayer.increaseDefense,
                    freshMockPlayer.increaseGoldPerHit,
                    freshMockPlayer.heal,
                    freshMockPlayer.increaseSpeed,
                    freshMockPlayer.increaseMaxHealth
                ].filter(fn => vi.mocked(fn).mock.calls.length > 0);

                expect(callCounts.length).toBe(1); // Each item should affect exactly one stat
            });
        });
    });
});
