import * as Phaser from 'phaser';

export class Player {
    public sprite: Phaser.GameObjects.Rectangle;
    public health: number = 100;
    public maxHealth: number = 100;
    public gold: number = 10;
    public isAlive: boolean = true;
    public id: string;
    public color: number;
    public justDied: boolean = false; // Flag to indicate if player died in the current frame/update cycle
    private scene: Phaser.Scene;
    private moveSpeed: number = 50;
    private lastMoveTime: number = 0;
    private moveInterval: number = 1000; // Move every 1 second
    private direction: { x: number; y: number } = { x: 0, y: 0 };
    public attackDamage: number = 15; // Base attack damage
    public defense: number = 0; // Base defense
    public goldPerHit: number = 1; // Base gold per hit

    constructor(scene: Phaser.Scene, x: number, y: number, id: string, color: number) {
        this.scene = scene;
        this.id = id;
        this.color = color;

        // Create a rectangle sprite for the player
        this.sprite = scene.add.rectangle(x, y, 30, 30, color);
        this.sprite.setStrokeStyle(2, 0xffffff);
        
        // Add physics body
        scene.physics.add.existing(this.sprite);
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        body.setBounce(0.8);
        
        // Set initial random direction
        this.setRandomDirection();
    }

    public update(time: number): void {
        if (!this.isAlive) return;

        // Change direction periodically
        if (time - this.lastMoveTime > this.moveInterval) {
            this.setRandomDirection();
            this.lastMoveTime = time;
        }

        // Move the player
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(this.direction.x * this.moveSpeed, this.direction.y * this.moveSpeed);
    }

    private setRandomDirection(): void {
        // Generate random direction
        const angle = Math.random() * Math.PI * 2;
        this.direction.x = Math.cos(angle);
        this.direction.y = Math.sin(angle);
    }

    public takeDamage(amount: number): void {
        if (!this.isAlive) return;

        const actualDamage = Math.max(0, amount - this.defense); // Apply defense
        this.health -= actualDamage;
        
        // Flash effect when taking damage
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.3,
            duration: 100,
            yoyo: true,
            repeat: 2
        });

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    private die(): void {
        this.isAlive = false;
        this.justDied = true; // Set flag when player dies
        
        // Visual death effect
        this.sprite.setFillStyle(0x666666);
        this.sprite.setAlpha(0.5);
        
        // Stop movement
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(0, 0);
        
        // Shrink animation
        this.scene.tweens.add({
            targets: this.sprite,
            scaleX: 0.5,
            scaleY: 0.5,
            alpha: 0.3,
            duration: 1000
        });
    }

    public getHealthPercentage(): number {
        return (this.health / this.maxHealth) * 100;
    }

    public getGold(): number {
        return this.gold;
    }

    public stealGold(amount: number): number {
        const stolenAmount = Math.min(amount, this.gold);
        this.gold -= stolenAmount;
        return stolenAmount;
    }

    public addGold(amount: number): void {
        this.gold += amount;
    }

    public increaseDamage(amount: number): void {
        this.attackDamage += amount;
    }

    public increaseDefense(amount: number): void {
        this.defense += amount;
    }

    public increaseGoldPerHit(amount: number): void {
        this.goldPerHit += amount;
    }

    public heal(amount: number): void {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    public increaseSpeed(amount: number): void {
        this.moveSpeed += amount;
    }

    public increaseMaxHealth(amount: number): void {
        this.maxHealth += amount;
        this.health += amount; // Also increase current health by the same amount
    }

    public destroy(): void {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}