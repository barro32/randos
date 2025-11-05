import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Shop } from './shop';
import { items as allItems, Item } from './items';
import { Player } from './player';

// Mock Player class
vi.mock('./player', () => {
    // This factory function will be called whenever `new Player()` is used in the test file.
    const mockPlayerInstance = (id: string) => {
        const instance = {
            id: id,
            inventory: [],
            gold: 100, // Initial gold
            getGold: vi.fn(() => instance.gold), // Access instance's own gold
            addGold: vi.fn((amount: number) => { instance.gold += amount; }),
            increaseDamage: vi.fn(),
            increaseDefense: vi.fn(),
            increaseGoldPerHit: vi.fn(),
            heal: vi.fn(),
            increaseSpeed: vi.fn(),
            increaseMaxHealth: vi.fn(),
        };
        return instance;
    };
    // The mock constructor
    const Player = vi.fn(mockPlayerInstance);
    return { Player };
});

// Mock Phaser Scene (very basic)
const mockScene = {} as Phaser.Scene;

describe('Shop Class', () => {
    let shop: Shop;
    let mockPlayer1: ReturnType<typeof Player>; // Use ReturnType for better typing with complex mocks
    let mockPlayer2: ReturnType<typeof Player>;

    beforeEach(() => {
        // Create new mock instances for each test to ensure isolation
        // The mock factory defined in vi.mock will be used here.
        mockPlayer1 = new Player('player1');
        mockPlayer2 = new Player('player2');

        // Reset gold for each player if necessary (or set specific values for tests)
        mockPlayer1.gold = 100;
        mockPlayer2.gold = 100;

        // Clear all mock call history before each test
        vi.clearAllMocks();

        vi.spyOn(console, 'log').mockImplementation(() => {}); // Suppress console.log during tests
    });

    afterEach(() => {
        vi.restoreAllMocks(); // Restore console.log and ensure mocks are clean for next test file if any
    });

    describe('Constructor and Initialization', () => {
        it('should initialize with correct items and quantities for 1 player', () => {
            shop = new Shop(mockScene, 1);
            const availableItems = shop.getAvailableItems();

            const healthPotion = availableItems.find(i => i.item.name === "Health Potion");
            expect(healthPotion).toBeDefined();
            expect(healthPotion?.quantity).toBe(0); // playerCount - 1 = 0

            expect(availableItems.some(i => i.item.name === "Sword" && i.quantity === 2)).toBe(true);
        });

        it('should initialize with correct items and quantities for 2 players', () => {
            shop = new Shop(mockScene, 2);
            const availableItems = shop.getAvailableItems();

            const healthPotion = availableItems.find(i => i.item.name === "Health Potion");
            expect(healthPotion).toBeDefined();
            expect(healthPotion?.quantity).toBe(1); // playerCount - 1 = 1
        });

        it('should include all standard items in the shop', () => {
            shop = new Shop(mockScene, 1);
            const availableItems = shop.getAvailableItems().map(i => i.item.name);
            expect(availableItems).toContain("Sword");
            expect(availableItems).toContain("Shield");
            expect(availableItems).toContain("Gold Magnet");
            expect(availableItems).toContain("Boots of Speed");
            expect(availableItems).toContain("Amulet of Vitality");
            expect(availableItems).toContain("Lucky Charm");
            expect(availableItems).toContain("Vampiric Blade");
            expect(availableItems).toContain("Titan's Belt");
        });
    });

    describe('displayShop', () => {
        it('should log shop items to the console', () => {
            shop = new Shop(mockScene, 1);
            shop.displayShop();
            expect(console.log).toHaveBeenCalledWith("Welcome to the Shop!");
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Sword"));
        });
    });

    describe('getAvailableItems', () => {
        it('should return the current list of available items and quantities', () => {
            shop = new Shop(mockScene, 1);
            const items = shop.getAvailableItems();
            expect(items).toBeInstanceOf(Array);
            expect(items.length).toBeGreaterThan(0);
            expect(items[0]).toHaveProperty('item');
            expect(items[0]).toHaveProperty('quantity');
        });
    });

    describe('buyItem', () => {
        beforeEach(() => {
            shop = new Shop(mockScene, 1); // Player count doesn't affect buy logic directly, only stock
            mockPlayer1.gold = 100; // Ensure player1 has enough gold for most items
            // vi.clearAllMocks() is already in the main beforeEach, so player method calls are cleared.
            // vi.spyOn(console, 'log') is also in the main beforeEach.
        });

        it('should allow a player to buy an item if they have enough gold and item is in stock', () => {
            const swordShopItemIndex = shop.getAvailableItems().findIndex(i => i.item.name === "Sword");
            const initialSwordQuantity = shop.getAvailableItems()[swordShopItemIndex].quantity;

            const result = shop.buyItem(mockPlayer1, swordShopItemIndex);

            expect(result).toBe(true);
            expect(mockPlayer1.addGold).toHaveBeenCalledWith(-allItems.sword.cost);
            expect(mockPlayer1.increaseDamage).toHaveBeenCalledWith(5); // Sword effect
            expect(mockPlayer1.inventory).toContain(allItems.sword);
            expect(shop.getAvailableItems()[swordShopItemIndex].quantity).toBe(initialSwordQuantity - 1);
        });

        it('should not allow buying an item if player has insufficient gold', () => {
            mockPlayer1.gold = 5; // Not enough for a sword (cost 10)

            const swordShopItemIndex = shop.getAvailableItems().findIndex(i => i.item.name === "Sword");
            const result = shop.buyItem(mockPlayer1, swordShopItemIndex);

            expect(result).toBe(false);
            expect(mockPlayer1.addGold).not.toHaveBeenCalled();
            expect(mockPlayer1.inventory).not.toContain(allItems.sword);
            expect(console.log).toHaveBeenCalledWith("Not enough gold to purchase this item.");
        });

        it('should not allow buying an item if it is out of stock', () => {
            const swordShopItemIndex = shop.getAvailableItems().findIndex(i => i.item.name === "Sword");
            // Deplete stock
            shop.getAvailableItems()[swordShopItemIndex].quantity = 0;

            const result = shop.buyItem(mockPlayer1, swordShopItemIndex);

            expect(result).toBe(false);
            expect(mockPlayer1.addGold).not.toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith("Invalid item selection or item out of stock.");
        });

        it('should not allow buying with an invalid item index', () => {
            const result = shop.buyItem(mockPlayer1, 999); // Invalid index
            expect(result).toBe(false);
            expect(console.log).toHaveBeenCalledWith("Invalid item selection or item out of stock.");
        });
         it('should correctly apply health potion effect', () => {
            const potionIndex = shop.getAvailableItems().findIndex(i => i.item.name === "Health Potion");
            if (potionIndex === -1 || shop.getAvailableItems()[potionIndex].quantity === 0) {
                // If health potion is not available or out of stock for this test scenario (e.g. 1 player)
                // we can skip this test or adjust setup. For now, let's ensure it's available.
                shop = new Shop(mockScene, 2); // Ensures health potion is available
                 mockPlayer1.gold = 100; // Reset gold for mockPlayer1
            }
            const potionItemIndex = shop.getAvailableItems().findIndex(i => i.item.name === "Health Potion");

            const result = shop.buyItem(mockPlayer1, potionItemIndex);

            expect(result).toBe(true);
            expect(mockPlayer1.addGold).toHaveBeenCalledWith(-allItems.healthPotion.cost);
            expect(mockPlayer1.heal).toHaveBeenCalledWith(20);
            expect(mockPlayer1.inventory).toContain(allItems.healthPotion);
        });
    });

    describe('restock', () => {
        it('should reset and re-initialize shop items', () => {
            shop = new Shop(mockScene, 1);
            // Simulate buying an item to change stock
            const swordShopItemIndex = shop.getAvailableItems().findIndex(i => i.item.name === "Sword");
            shop.buyItem(mockPlayer1, swordShopItemIndex);
            const quantityAfterBuy = shop.getAvailableItems()[swordShopItemIndex].quantity;

            shop.restock(1); // Restock for 1 player

            const restockedSword = shop.getAvailableItems().find(i => i.item.name === "Sword");
            expect(restockedSword?.quantity).not.toBe(quantityAfterBuy);
            expect(restockedSword?.quantity).toBe(2); // Default quantity for sword

            const healthPotion = shop.getAvailableItems().find(i => i.item.name === "Health Potion");
            expect(healthPotion?.quantity).toBe(0); // For 1 player after restock
            expect(console.log).toHaveBeenCalledWith("Shop has been restocked!");
        });

        it('should restock correctly for a different player count', () => {
            shop = new Shop(mockScene, 1); // Initial shop for 1 player
            let healthPotion = shop.getAvailableItems().find(i => i.item.name === "Health Potion");
            expect(healthPotion?.quantity).toBe(0);

            shop.restock(3); // Restock for 3 players

            healthPotion = shop.getAvailableItems().find(i => i.item.name === "Health Potion");
            expect(healthPotion?.quantity).toBe(2); // 3 - 1 = 2
        });
    });
});
