import { Item, items } from './items';
import { Player } from './player';

export class Shop {
    private availableItems: { item: Item, quantity: number }[] = [];
    private scene: Phaser.Scene; // Assuming the shop UI will be part of a Phaser scene

    constructor(scene: Phaser.Scene, playerCount: number) {
        this.scene = scene;
        this.initializeShopItems(playerCount);
    }

    private initializeShopItems(playerCount: number): void {
        // Add potion as per issue #6
        if (items.healthPotion) {
            this.availableItems.push({
                item: items.healthPotion,
                quantity: Math.max(0, playerCount - 1) // Number of players minus one
            });
        }

        // Add other items (can be expanded or randomized)
        // For now, let's add a few more items with a default quantity of 1 or 2
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

    public displayShop(): void {
        // This method will be responsible for rendering the shop UI.
        // For now, it will log to console. Implementation will depend on how the UI is structured.
        console.log("Welcome to the Shop!");
        this.availableItems.forEach((shopItem, index) => {
            if (shopItem.quantity > 0) {
                console.log(`${index + 1}. ${shopItem.item.name} - ${shopItem.item.description} (Cost: ${shopItem.item.cost} Gold) - Quantity: ${shopItem.quantity}`);
            }
        });
        console.log("--------------------");
    }

    public getAvailableItems(): { item: Item, quantity: number }[] {
        return this.availableItems;
    }

    public buyItem(player: Player, itemArrayIndex: number): boolean { // Changed itemIndex to itemArrayIndex
        const shopItem = this.availableItems[itemArrayIndex]; // Use 0-based index directly

        if (!shopItem || shopItem.quantity <= 0) {
            console.log("Invalid item selection or item out of stock.");
            return false;
        }

        if (player.getGold() < shopItem.item.cost) {
            console.log("Not enough gold to purchase this item.");
            return false;
        }

        player.addGold(-shopItem.item.cost); // Deduct gold
        shopItem.item.applyEffect(player);
        shopItem.quantity--;

        console.log(`${player.id} purchased ${shopItem.item.name}.`);
        this.displayShop(); // Refresh shop display
        return true;
    }

    // Method to restock or change items, perhaps between rounds
    public restock(playerCount: number): void {
        this.availableItems = [];
        this.initializeShopItems(playerCount);
        console.log("Shop has been restocked!");
    }
}
