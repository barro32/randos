import * as Phaser from 'phaser';

export enum EnemyType {
    Weak = 'Weak',
    Medium = 'Medium',
    Strong = 'Strong'
}

export interface EnemyConfig {
    type: EnemyType;
    health: number;
    damage: number;
    color: number;
    size: number;
    isStatic: boolean;
    moveSpeed: number;
}

export class Enemy {
    public sprite: Phaser.GameObjects.Rectangle;
    public health: number;
    public maxHealth: number;
    public damage: number;
    public isAlive: boolean = true;
    public type: EnemyType;
    public isStatic: boolean;
    private scene: Phaser.Scene;
    private moveSpeed: number;
    private lastMoveTime: number = 0;
    private moveInterval: number = 1500; // Slower movement interval for enemies
    private currentVelocity: Phaser.Math.Vector2;

    constructor(scene: Phaser.Scene, x: number, y: number, config: EnemyConfig) {
        this.scene = scene;
        this.type = config.type;
        this.health = config.health;
        this.maxHealth = config.health;
        this.damage = config.damage;
        this.isStatic = config.isStatic;
        this.moveSpeed = config.moveSpeed;

        // Create a rectangle sprite for the enemy
        this.sprite = scene.add.rectangle(x, y, config.size, config.size, config.color);
        this.sprite.setStrokeStyle(2, 0x000000);
        
        // Add physics body
        scene.physics.add.existing(this.sprite);
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setCollideWorldBounds(true);
        
        if (this.isStatic) {
            // Static enemies don't move
            body.setImmovable(true);
            this.currentVelocity = new Phaser.Math.Vector2(0, 0);
        } else {
            // Moving enemies have initial random velocity
            body.setBounce(1);
            this.currentVelocity = new Phaser.Math.Vector2(
                Math.random() * 2 - 1, 
                Math.random() * 2 - 1
            ).normalize().scale(this.moveSpeed);
            this.setInitialVelocity();
        }
    }

    private setInitialVelocity(): void {
        if (this.isStatic) return;
        const initialAngle = Math.random() * Math.PI * 2;
        this.currentVelocity.setToPolar(initialAngle, this.moveSpeed);
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        body.setVelocity(this.currentVelocity.x, this.currentVelocity.y);
    }

    private adjustHeading(): void {
        if (this.isStatic) return;
        
        let currentAngle = this.currentVelocity.angle();
        const maxTurnAngle = Math.PI / 6; // 30 degrees max turn
        const turnAdjustment = (Math.random() * 2 - 1) * maxTurnAngle;
        currentAngle += turnAdjustment;

        this.currentVelocity.setToPolar(currentAngle, this.moveSpeed);
    }

    public update(time: number): void {
        if (!this.isAlive || this.isStatic) return;

        // Periodically adjust heading for moving enemies
        if (time - this.lastMoveTime > this.moveInterval) {
            const body = this.sprite.body as Phaser.Physics.Arcade.Body;
            if (body.velocity.lengthSq() < (this.moveSpeed * 0.1) ** 2) {
                this.setInitialVelocity();
            } else {
                this.adjustHeading();
            }
            this.lastMoveTime = time;
        }

        // Apply and maintain velocity
        const body = this.sprite.body as Phaser.Physics.Arcade.Body;
        this.currentVelocity.normalize().scale(this.moveSpeed);
        body.setVelocity(this.currentVelocity.x, this.currentVelocity.y);
    }

    public takeDamage(amount: number): void {
        if (!this.isAlive) return;

        this.health -= amount;
        
        // Flash effect when taking damage
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0.5,
            duration: 100,
            yoyo: true,
            repeat: 1
        });

        if (this.health <= 0) {
            this.health = 0;
            this.die();
        }
    }

    private die(): void {
        this.isAlive = false;
        
        // Visual death effect
        this.scene.tweens.add({
            targets: this.sprite,
            alpha: 0,
            scaleX: 0,
            scaleY: 0,
            duration: 300,
            onComplete: () => {
                this.sprite.destroy();
            }
        });
    }

    public destroy(): void {
        if (this.sprite) {
            this.sprite.destroy();
        }
    }
}

// Enemy type configurations
export const ENEMY_CONFIGS: { [key in EnemyType]: Omit<EnemyConfig, 'isStatic'> } = {
    [EnemyType.Weak]: {
        type: EnemyType.Weak,
        health: 30,
        damage: 5,
        color: 0x90EE90, // Light green
        size: 25,
        moveSpeed: 30
    },
    [EnemyType.Medium]: {
        type: EnemyType.Medium,
        health: 60,
        damage: 10,
        color: 0xFFA500, // Orange
        size: 35,
        moveSpeed: 40
    },
    [EnemyType.Strong]: {
        type: EnemyType.Strong,
        health: 100,
        damage: 15,
        color: 0xFF4500, // Red-orange
        size: 45,
        moveSpeed: 25
    }
};
