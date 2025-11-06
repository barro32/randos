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
    applyEffect: (player: Player, adjustmentValue?: number) => void;
    /** Cost of the item in gold */
    cost: number;
    /** Optional flag to indicate if this item requires custom purchase handling */
    requiresAdjustmentValue?: boolean;
}

/**
 * Collection of all available items in the game
 */
export const items: { [key: string]: Item } = {
    sword: {
        name: "Sword",
        description: "Increases attack damage.",
        icon: "⚔️",
        cost: 5,
        applyEffect: (player) => {
            player.increaseDamage(5); // Assuming a method to increase damage exists on Player
        }
    },
    shield: {
        name: "Shield",
        description: "Reduces damage taken.",
        icon: "🛡️",
        cost: 5,
        applyEffect: (player) => {
            player.increaseDefense(5); // Assuming a method to increase defense exists on Player
        }
    },
    goldMagnet: {
        name: "Gold Magnet",
        description: "Removed - no longer available.",
        icon: "🧲",
        cost: 999,
        applyEffect: (player) => {
            // No effect - item removed
        }
    },
    healthPotion: {
        name: "Health Potion",
        description: "Restores a small amount of health.",
        icon: "🧪",
        cost: 2,
        applyEffect: (player) => {
            player.heal(20); // Assuming a method to heal exists on Player
        }
    },
    bootsOfSpeed: {
        name: "Boots of Speed",
        description: "Increases movement speed.",
        icon: "👢",
        cost: 4,
        applyEffect: (player) => {
            player.increaseSpeed(10); // Assuming a method to increase speed exists on Player
        }
    },
    amuletOfVitality: {
        name: "Amulet of Vitality",
        description: "Increases maximum health.",
        icon: "💖",
        cost: 6,
        applyEffect: (player) => {
            player.increaseMaxHealth(25); // Assuming a method to increase max health exists on Player
        }
    },
    luckyCharm: {
        name: "Lucky Charm",
        description: "10% chance to get double gold on kill.",
        icon: "🍀",
        cost: 3,
        applyEffect: (player) => {
            player.doubleGoldChance = Math.min(1, player.doubleGoldChance + 0.1); // 10% chance, capped at 100%
        }
    },
    vampiricBlade: {
        name: "Vampiric Blade",
        description: "10% lifesteal on damage dealt.",
        icon: "🗡️",
        cost: 7,
        applyEffect: (player) => {
            player.lifestealPercent = Math.min(1, player.lifestealPercent + 0.1); // 10% lifesteal, capped at 100%
        }
    },
    titansBelt: {
        name: "Titan's Belt",
        description: "Decreases max health, increases defense, 1% HP regen/10s.",
        icon: "⚙️",
        cost: 6,
        applyEffect: (player) => {
            // Decrease max health by 15
            player.maxHealth = Math.max(1, player.maxHealth - 15);
            // Decrease current health proportionally to maintain same percentage
            player.health = Math.min(player.health, player.maxHealth);
            // Increase defense by 1
            player.increaseDefense(1);
            // Add 1% health regen every 10 seconds
            player.healthRegenPercent = Math.min(1, player.healthRegenPercent + 0.01);
        }
    },
    fightOrFlight: {
        name: "Fight or Flight",
        description: "Adjust fight or flight +1 to +10 (fight) or -1 to -10 (flight). Free.",
        icon: "🏃",
        cost: 0,
        requiresAdjustmentValue: true,
        applyEffect: (player, adjustmentValue = 1) => {
            // Adjust player's fight or flight by the specified value (default +1)
            // The UI provides +1 or -1 based on which button the player clicks
            player.adjustFightOrFlight(adjustmentValue);
        }
    }
};
