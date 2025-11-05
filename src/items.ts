import type { Player } from './player';

/**
 * Represents an item that can be purchased and used by players
 */
export interface Item {
    /** Display name of the item */
    name: string;
    /** Description of what the item does */
    description: string;
    /** Emoji or symbol icon for the item */
    icon: string;
    /** Function to apply the item's effect to a player */
    applyEffect: (player: Player) => void;
    /** Cost of the item in gold */
    cost: number;
}

/**
 * Collection of all available items in the game
 */
export const items: { [key: string]: Item } = {
    sword: {
        name: "Sword",
        description: "Increases attack damage.",
        icon: "⚔️",
        cost: 10,
        applyEffect: (player) => {
            player.increaseDamage(5); // Assuming a method to increase damage exists on Player
        }
    },
    shield: {
        name: "Shield",
        description: "Reduces damage taken.",
        icon: "🛡️",
        cost: 10,
        applyEffect: (player) => {
            player.increaseDefense(5); // Assuming a method to increase defense exists on Player
        }
    },
    goldMagnet: {
        name: "Gold Magnet",
        description: "Increases gold earned per hit.",
        icon: "🧲",
        cost: 15,
        applyEffect: (player) => {
            player.increaseGoldPerHit(1); // Assuming a method for this exists on Player
        }
    },
    healthPotion: {
        name: "Health Potion",
        description: "Restores a small amount of health.",
        icon: "🧪",
        cost: 5,
        applyEffect: (player) => {
            player.heal(20); // Assuming a method to heal exists on Player
        }
    },
    bootsOfSpeed: {
        name: "Boots of Speed",
        description: "Increases movement speed.",
        icon: "👢",
        cost: 8,
        applyEffect: (player) => {
            player.increaseSpeed(10); // Assuming a method to increase speed exists on Player
        }
    },
    amuletOfVitality: {
        name: "Amulet of Vitality",
        description: "Increases maximum health.",
        icon: "💖",
        cost: 12,
        applyEffect: (player) => {
            player.increaseMaxHealth(25); // Assuming a method to increase max health exists on Player
        }
    }
};
