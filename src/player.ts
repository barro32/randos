import * as Phaser from 'phaser';

export class Player {
    public sprite: Phaser.GameObjects.Rectangle;
    public health: number = 150; // Increased health
    public maxHealth: number = 150; // Increased maxHealth
    public gold: number = 10;
    public isAlive: boolean = true;
    public id: string;
    public color: number;
    public justDied: boolean = false; // Flag to indicate if player died in the current frame/update cycle
    public isInvulnerable: boolean = false;
    private lastHitTime: number = 0;
    private invulnerabilityDuration: number = 100; // 100ms

    private scene: Phaser.Scene;
    private moveSpeed: number = 50; // Base speed, actual speed can be modified by effects
    private lastMoveTime: number = 0;
    private moveInterval: number = 1000; // Interval to adjust heading
    private currentVelocity: Phaser.Math.Vector2; // Stores current velocity vector
    private maxTurnAngle: number = Math.PI / 4; // Max turn angle per adjustment (45 degrees)
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
        body.setBounce(1); // Make player bounce with full force off walls
        
        // Initialize velocity with a random direction
        this.currentVelocity = new Phaser.Math.Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize().scale(this.moveSpeed);
        this.setInitialVelocity();
    }

    public update(time: number): void {
        if (!this.isAlive) return;

        // Handle invulnerability duration
        if (this.isInvulnerable && time - this.lastHitTime > this.invulnerabilityDuration) {
            this.isInvulnerable = false;
            this.sprite.setAlpha(1); // Restore alpha if changed during invulnerability
        }

        // Periodically adjust heading
        if (time - this.lastMoveTime > this.moveInterval) {
            this.adjustHeading();
            this.lastMoveTime = time;
        }

        // Apply velocity
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(this.currentVelocity.x, this.currentVelocity.y);
    }

    public setInvulnerable(time: number): void {
        this.isInvulnerable = true;
        this.lastHitTime = time;
        // Optional: visual feedback for invulnerability
        this.sprite.setAlpha(0.7);
    }

    private setInitialVelocity(): void {
        const initialAngle = Math.random() * Math.PI * 2;
        this.currentVelocity.setToPolar(initialAngle, this.moveSpeed);
    }

    private adjustHeading(): void {
        // Get current angle
        let currentAngle = this.currentVelocity.angle();

        // Add a random adjustment within maxTurnAngle
        const turnAdjustment = (Math.random() * 2 - 1) * this.maxTurnAngle;
        currentAngle += turnAdjustment;

        // Set new velocity based on the adjusted angle and current speed
        this.currentVelocity.setToPolar(currentAngle, this.moveSpeed);
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
        // Update the magnitude of the current velocity vector to reflect the new speed
        this.currentVelocity.normalize().scale(this.moveSpeed);
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