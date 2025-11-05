import { Item, items } from './items';
import { Player } from './player';

/**
 * Manages the shop system where players can purchase items
 */
export class Shop {
    private availableItems: { item: Item, quantity: number }[] = [];
    private scene: Phaser.Scene;

    /**
     * Creates a new shop instance
     * @param scene - The Phaser scene this shop belongs to
     * @param playerCount - Number of players (affects item quantities)
     * @throws Error if playerCount is less than 1
     */
    constructor(scene: Phaser.Scene, playerCount: number) {
        if (playerCount < 1) {
            throw new Error('Player count must be at least 1');
        }
        this.scene = scene;
        this.initializeShopItems(playerCount);
    }

    /**
     * Initialize shop items based on player count
     * Health potion quantity is calculated as Math.max(0, playerCount - 1)
     * Other items have fixed default quantities
     * @param playerCount - Number of players in the game
     */
    private initializeShopItems(playerCount: number): void {
        // Add health potion
        if (items.healthPotion) {
            this.availableItems.push({
                item: items.healthPotion,
                quantity: Math.max(0, playerCount - 1)
            });
        }

        // Add other items with default quantities
        if (items.sword) {
            this.availableItems.push({ item: items.sword, quantity: 2 });
        }
        if (items.shield) {
            this.availableItems.push({ item: items.shield, quantity: 2 });
        }
        if (items.goldMagnet) {
            this.availableItems.push({ item: items.goldMagnet, quantity: 1 });
        }
        if (items.bootsOfSpeed) {
            this.availableItems.push({ item: items.bootsOfSpeed, quantity: 1 });
        }
        if (items.amuletOfVitality) {
            this.availableItems.push({ item: items.amuletOfVitality, quantity: 1 });
        }
    }

    /**
     * Display shop information to console
     * Useful for debugging and logging shop state
     */
    public displayShop(): void {
        console.log("Welcome to the Shop!");
        this.availableItems.forEach((shopItem, index) => {
            if (shopItem.quantity > 0) {
                console.log(`${index + 1}. ${shopItem.item.name} - ${shopItem.item.description} (Cost: ${shopItem.item.cost} Gold) - Quantity: ${shopItem.quantity}`);
            }
        });
        console.log("--------------------");
    }

    /**
     * Get all available items in the shop
     * @returns Array of items with their quantities
     */
    public getAvailableItems(): { item: Item, quantity: number }[] {
        return this.availableItems;
    }

    /**
     * Attempt to purchase an item for a player
     * @param player The player attempting to purchase
     * @param itemArrayIndex The index of the item in the available items array
     * @returns true if purchase was successful, false otherwise
     */
    public buyItem(player: Player, itemArrayIndex: number): boolean {
        const shopItem = this.availableItems[itemArrayIndex];

        if (!shopItem || shopItem.quantity <= 0) {
            return false;
        }

        if (player.getGold() < shopItem.item.cost) {
            return false;
        }

        player.addGold(-shopItem.item.cost);
        shopItem.item.applyEffect(player);
        player.inventory.push(shopItem.item);
        shopItem.quantity--;

        return true;
    }

    /**
     * Restock the shop with new items
     * @param playerCount Number of players for the new stock
     */
    public restock(playerCount: number): void {
        this.availableItems = [];
        this.initializeShopItems(playerCount);
    }
}
