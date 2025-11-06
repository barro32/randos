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
     * Each item gets a base quantity plus (playerCount - 1) additional items
     * @param playerCount - Number of players in the game
     */
    private initializeShopItems(playerCount: number): void {
        const bonusQuantity = Math.max(0, playerCount - 1);

        // Add health potion
        if (items.healthPotion) {
            this.availableItems.push({
                item: items.healthPotion,
                quantity: bonusQuantity
            });
        }

        // Add other items with base quantities plus bonus
        if (items.sword) {
            this.availableItems.push({ item: items.sword, quantity: 2 + bonusQuantity });
        }
        if (items.shield) {
            this.availableItems.push({ item: items.shield, quantity: 2 + bonusQuantity });
        }
        // Gold Magnet removed - goldPerHit no longer exists
        if (items.bootsOfSpeed) {
            this.availableItems.push({ item: items.bootsOfSpeed, quantity: 1 + bonusQuantity });
        }
        if (items.amuletOfVitality) {
            this.availableItems.push({ item: items.amuletOfVitality, quantity: 1 + bonusQuantity });
        }
        if (items.luckyCharm) {
            this.availableItems.push({ item: items.luckyCharm, quantity: 2 + bonusQuantity });
        }
        if (items.vampiricBlade) {
            this.availableItems.push({ item: items.vampiricBlade, quantity: 1 + bonusQuantity });
        }
        if (items.titansBelt) {
            this.availableItems.push({ item: items.titansBelt, quantity: 1 + bonusQuantity });
        }
        if (items.foeMagnet) {
            // Free adjustment available for each player every round
            this.availableItems.push({ item: items.foeMagnet, quantity: playerCount });
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
     * @param adjustmentValue Optional parameter for items that need additional input (e.g., foeAttraction adjustment)
     * @returns true if purchase was successful, false otherwise
     */
    public buyItem(player: Player, itemArrayIndex: number, adjustmentValue?: number): boolean {
        const shopItem = this.availableItems[itemArrayIndex];

        if (!shopItem || shopItem.quantity <= 0) {
            return false;
        }

        if (player.getGold() < shopItem.item.cost) {
            return false;
        }

        player.addGold(-shopItem.item.cost);
        
        // Apply the item's effect, passing adjustmentValue if provided
        shopItem.item.applyEffect(player, adjustmentValue);
        
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
