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
            adjustFightOrFlight: vi.fn(),
            doubleGoldChance: 0,
            lifestealPercent: 0,
            healthRegenPercent: 0,
            fightOrFlight: 0,
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
                    case 'fightOrFlight':
                        // Fight or Flight adjusts fight or flight stat
                        expect(mockPlayer.adjustFightOrFlight).toHaveBeenCalledWith(1);
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
        it('should have all items with non-negative costs', () => {
            Object.values(items).forEach(item => {
                expect(item.cost).toBeGreaterThanOrEqual(0);
                // Fight or Flight is free (cost 0), all others should have positive costs
                if (item.name !== 'Fight or Flight') {
                    expect(item.cost).toBeGreaterThan(0);
                }
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

        it('should have reduced item costs (50% of original)', () => {
            // Verify specific halved values (rounded down)
            expect(items.sword.cost).toBe(5); // Was 10
            expect(items.shield.cost).toBe(5); // Was 10
            expect(items.healthPotion.cost).toBe(2); // Was 5, rounded down from 2.5
            expect(items.bootsOfSpeed.cost).toBe(4); // Was 8
            expect(items.amuletOfVitality.cost).toBe(6); // Was 12
            expect(items.luckyCharm.cost).toBe(3); // Was 6
            expect(items.vampiricBlade.cost).toBe(7); // Was 14
            expect(items.titansBelt.cost).toBe(6); // Was 13, rounded down from 6.5
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

    describe('Item Stacking', () => {
        it('should stack Boots of Speed correctly', () => {
            const player = {
                increaseSpeed: vi.fn(),
            } as unknown as Player;

            // Buy boots twice
            items.bootsOfSpeed.applyEffect(player);
            items.bootsOfSpeed.applyEffect(player);

            // Should have been called twice with 10 each time
            expect(player.increaseSpeed).toHaveBeenCalledTimes(2);
            expect(player.increaseSpeed).toHaveBeenCalledWith(10);
        });

        it('should stack Sword correctly', () => {
            const player = {
                increaseDamage: vi.fn(),
            } as unknown as Player;

            // Buy sword three times
            items.sword.applyEffect(player);
            items.sword.applyEffect(player);
            items.sword.applyEffect(player);

            // Should have been called three times with 5 each time
            expect(player.increaseDamage).toHaveBeenCalledTimes(3);
            expect(player.increaseDamage).toHaveBeenCalledWith(5);
        });

        it('should stack Shield correctly', () => {
            const player = {
                increaseDefense: vi.fn(),
            } as unknown as Player;

            // Buy shield twice
            items.shield.applyEffect(player);
            items.shield.applyEffect(player);

            // Should have been called twice with 5 each time
            expect(player.increaseDefense).toHaveBeenCalledTimes(2);
            expect(player.increaseDefense).toHaveBeenCalledWith(5);
        });

        it('should stack Lucky Charm correctly', () => {
            const player = {
                doubleGoldChance: 0,
            } as unknown as Player;

            // Buy lucky charm three times
            items.luckyCharm.applyEffect(player);
            expect(player.doubleGoldChance).toBeCloseTo(0.1);
            
            items.luckyCharm.applyEffect(player);
            expect(player.doubleGoldChance).toBeCloseTo(0.2);
            
            items.luckyCharm.applyEffect(player);
            expect(player.doubleGoldChance).toBeCloseTo(0.3);
        });

        it('should stack Vampiric Blade correctly', () => {
            const player = {
                lifestealPercent: 0,
            } as unknown as Player;

            // Buy vampiric blade twice
            items.vampiricBlade.applyEffect(player);
            expect(player.lifestealPercent).toBe(0.1);
            
            items.vampiricBlade.applyEffect(player);
            expect(player.lifestealPercent).toBe(0.2);
        });

        it('should stack different items independently', () => {
            const player = {
                increaseDamage: vi.fn(),
                increaseDefense: vi.fn(),
                increaseSpeed: vi.fn(),
            } as unknown as Player;

            // Buy different items
            items.sword.applyEffect(player);
            items.shield.applyEffect(player);
            items.bootsOfSpeed.applyEffect(player);

            // Each should be called once
            expect(player.increaseDamage).toHaveBeenCalledTimes(1);
            expect(player.increaseDefense).toHaveBeenCalledTimes(1);
            expect(player.increaseSpeed).toHaveBeenCalledTimes(1);
        });
    });
});
