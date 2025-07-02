import * as Phaser from 'phaser';
import { Player } from './player';

export class BattleArenaGame {
    private game: Phaser.Game;
    private players: Player[] = [];
    private updateCallback: (playersAlive: number) => void;
    private gameEndCallback: (winner: string) => void;
    private gameScene: GameScene;

    constructor(playerCount: number, updateCallback: (playersAlive: number) => void, gameEndCallback: (winner: string) => void) {
        this.updateCallback = updateCallback;
        this.gameEndCallback = gameEndCallback;

        this.gameScene = new GameScene(playerCount, this.updateCallback, this.gameEndCallback);

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            width: 800,
            height: 600,
            parent: 'gameContainer',
            backgroundColor: '#2c3e50',
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            },
            scene: this.gameScene
        };

        this.game = new Phaser.Game(config);
    }

    public destroy(): void {
        if (this.game) {
            this.game.destroy(true);
        }
    }
}

class GameScene extends Phaser.Scene {
    private players: Player[] = [];
    private playerCount: number;
    private updateCallback: (playersAlive: number) => void;
    private gameEndCallback: (winner: string) => void;
    private healthBars: Phaser.GameObjects.Graphics[] = [];
    private goldBars: Phaser.GameObjects.Graphics[] = [];
    private playerLabels: Phaser.GameObjects.Text[] = [];
    private gameEnded: boolean = false;

    constructor(playerCount: number, updateCallback: (playersAlive: number) => void, gameEndCallback: (winner: string) => void) {
        super({ key: 'GameScene' });
        this.playerCount = playerCount;
        this.updateCallback = updateCallback;
        this.gameEndCallback = gameEndCallback;
    }

    public preload(): void {
        // No assets to preload - using primitive shapes
    }

    public create(): void {
        // Create border around the game area
        const border = this.add.graphics();
        border.lineStyle(4, 0xffffff);
        border.strokeRect(20, 20, 760, 560);

        // Generate distinct colors for players
        const colors = this.generatePlayerColors(this.playerCount);

        // Create players at random positions
        for (let i = 0; i < this.playerCount; i++) {
            const x = Phaser.Math.Between(50, 750);
            const y = Phaser.Math.Between(50, 550);
            const player = new Player(this, x, y, `Player ${i + 1}`, colors[i]);
            this.players.push(player);
        }

        // Set up collision detection between players
        for (let i = 0; i < this.players.length; i++) {
            for (let j = i + 1; j < this.players.length; j++) {
                this.physics.add.collider(
                    this.players[i].sprite,
                    this.players[j].sprite,
                    () => this.handlePlayerCollision(this.players[i], this.players[j]),
                    undefined,
                    this
                );
            }
        }

        // Create UI elements
        this.createUI();

        // Initial update
        this.updateCallback(this.getAlivePlayersCount());
    }

    public update(time: number): void {
        if (this.gameEnded) return;

        // Update all players
        this.players.forEach(player => player.update(time));

        // Update UI
        this.updateUI();

        // Check win condition
        this.checkWinCondition();
    }

    private generatePlayerColors(count: number): number[] {
        const colors = [
            0xff6b6b, // Red
            0x4ecdc4, // Teal
            0x45b7d1, // Blue
            0x96ceb4, // Green
            0xffeaa7, // Yellow
            0xdda0dd, // Plum
            0xffa500, // Orange
            0x98d8c8  // Mint
        ];
        return colors.slice(0, count);
    }

    private handlePlayerCollision(player1: Player, player2: Player): void {
        if (!player1.isAlive || !player2.isAlive) return;

        // Determine who is the attacker based on velocity (speed)
        const body1 = player1.sprite.body as Phaser.Physics.Arcade.Body;
        const body2 = player2.sprite.body as Phaser.Physics.Arcade.Body;
        
        const speed1 = Math.sqrt(body1.velocity.x ** 2 + body1.velocity.y ** 2);
        const speed2 = Math.sqrt(body2.velocity.x ** 2 + body2.velocity.y ** 2);
        
        let attacker: Player, victim: Player;
        if (speed1 > speed2) {
            attacker = player1;
            victim = player2;
        } else if (speed2 > speed1) {
            attacker = player2;
            victim = player1;
        } else {
            // If speeds are equal, randomly choose attacker
            if (Math.random() < 0.5) {
                attacker = player1;
                victim = player2;
            } else {
                attacker = player2;
                victim = player1;
            }
        }

        // Attacker steals 1 gold from victim
        const stolenGold = victim.stealGold(1);
        attacker.addGold(stolenGold);

        // Both players take damage
        const damage = 15;
        player1.takeDamage(damage);
        player2.takeDamage(damage);

        // Push players apart to prevent stuck collision
        const angle = Phaser.Math.Angle.Between(player1.sprite.x, player1.sprite.y, player2.sprite.x, player2.sprite.y);
        const force = 100;
        
        body1.setVelocity(-Math.cos(angle) * force, -Math.sin(angle) * force);
        body2.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force);
    }

    private createUI(): void {
        // Create health bars, gold bars and labels for each player
        for (let i = 0; i < this.players.length; i++) {
            const x = 20;
            const y = 30 + i * 35; // Increased spacing for gold bar

            // Player label
            const label = this.add.text(x, y, this.players[i].id, {
                fontSize: '14px',
                color: '#ffffff'
            });
            this.playerLabels.push(label);

            // Health bar background
            const healthBarBg = this.add.graphics();
            healthBarBg.fillStyle(0x333333);
            healthBarBg.fillRect(x + 80, y + 2, 100, 8);

            // Health bar
            const healthBar = this.add.graphics();
            this.healthBars.push(healthBar);

            // Gold bar background
            const goldBarBg = this.add.graphics();
            goldBarBg.fillStyle(0x333333);
            goldBarBg.fillRect(x + 80, y + 12, 100, 8);

            // Gold bar
            const goldBar = this.add.graphics();
            this.goldBars.push(goldBar);

            // Gold label
            this.add.text(x + 185, y + 12, 'Gold', {
                fontSize: '10px',
                color: '#ffffff'
            });
        }
    }

    private updateUI(): void {
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            const healthBar = this.healthBars[i];
            const goldBar = this.goldBars[i];
            const label = this.playerLabels[i];

            // Update health bar
            healthBar.clear();
            if (player.isAlive) {
                const healthPercent = player.getHealthPercentage() / 100;
                const color = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
                healthBar.fillStyle(color);
                healthBar.fillRect(80, 30 + i * 35 + 2, 100 * healthPercent, 8);
            }

            // Update gold bar
            goldBar.clear();
            if (player.isAlive) {
                const goldPercent = Math.min(player.getGold() / 20, 1); // Max display of 20 gold for scale
                goldBar.fillStyle(0xffd700); // Gold color
                goldBar.fillRect(80, 30 + i * 35 + 12, 100 * goldPercent, 8);
            }

            // Update label color based on player status
            if (!player.isAlive) {
                label.setColor('#666666');
            }
        }
    }

    private getAlivePlayersCount(): number {
        return this.players.filter(player => player.isAlive).length;
    }

    private checkWinCondition(): void {
        const alivePlayers = this.players.filter(player => player.isAlive);
        
        // Update the alive count
        this.updateCallback(alivePlayers.length);

        if (alivePlayers.length === 1 && !this.gameEnded) {
            this.gameEnded = true;
            this.gameEndCallback(alivePlayers[0].id);
        } else if (alivePlayers.length === 0 && !this.gameEnded) {
            this.gameEnded = true;
            this.gameEndCallback("No one (Draw)");
        }
    }
}