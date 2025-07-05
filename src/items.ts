export interface Item {
    name: string;
    description: string;
    applyEffect: (player: any) => void; // Consider using a more specific player type
    cost: number;
}

export const items: { [key: string]: Item } = {
    sword: {
        name: "Sword",
        description: "Increases attack damage.",
        cost: 10,
        applyEffect: (player) => {
            player.increaseDamage(5); // Assuming a method to increase damage exists on Player
        }
    },
    shield: {
        name: "Shield",
        description: "Reduces damage taken.",
        cost: 10,
        applyEffect: (player) => {
            player.increaseDefense(5); // Assuming a method to increase defense exists on Player
        }
    },
    goldMagnet: {
        name: "Gold Magnet",
        description: "Increases gold earned per hit.",
        cost: 15,
        applyEffect: (player) => {
            player.increaseGoldPerHit(1); // Assuming a method for this exists on Player
        }
    },
    healthPotion: {
        name: "Health Potion",
        description: "Restores a small amount of health.",
        cost: 5,
        applyEffect: (player) => {
            player.heal(20); // Assuming a method to heal exists on Player
        }
    },
    bootsOfSpeed: {
        name: "Boots of Speed",
        description: "Increases movement speed.",
        cost: 8,
        applyEffect: (player) => {
            player.increaseSpeed(10); // Assuming a method to increase speed exists on Player
        }
    },
    amuletOfVitality: {
        name: "Amulet of Vitality",
        description: "Increases maximum health.",
        cost: 12,
        applyEffect: (player) => {
            player.increaseMaxHealth(25); // Assuming a method to increase max health exists on Player
        }
    }
};
