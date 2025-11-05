export interface Item {
    name: string;
    description: string;
    icon: string; // Added icon property
    applyEffect: (player: any) => void; // Consider using a more specific player type
    cost: number;
}

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
    },
    luckyCharm: {
        name: "Lucky Charm",
        description: "Grants bonus gold.",
        icon: "🍀",
        cost: 6,
        applyEffect: (player) => {
            player.addGold(5); // Gives immediate gold bonus
        }
    },
    vampiricBlade: {
        name: "Vampiric Blade",
        description: "Increases damage and gold per hit.",
        icon: "🗡️",
        cost: 14,
        applyEffect: (player) => {
            player.increaseDamage(3);
            player.increaseGoldPerHit(1);
        }
    },
    titansBelt: {
        name: "Titan's Belt",
        description: "Increases max health and defense.",
        icon: "⚙️",
        cost: 13,
        applyEffect: (player) => {
            player.increaseMaxHealth(15);
            player.increaseDefense(3);
        }
    }
};
