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

        // Both players take damage
        const damage = 15;
        player1.takeDamage(damage);
        player2.takeDamage(damage);

        // Push players apart to prevent stuck collision
        const body1 = player1.sprite.body as Phaser.Physics.Arcade.Body;
        const body2 = player2.sprite.body as Phaser.Physics.Arcade.Body;
        
        const angle = Phaser.Math.Angle.Between(player1.sprite.x, player1.sprite.y, player2.sprite.x, player2.sprite.y);
        const force = 100;
        
        body1.setVelocity(-Math.cos(angle) * force, -Math.sin(angle) * force);
        body2.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force);
    }

    private createUI(): void {
        // Create health bars and labels for each player
        for (let i = 0; i < this.players.length; i++) {
            const x = 20;
            const y = 30 + i * 25;

            // Player label
            const label = this.add.text(x, y, this.players[i].id, {
                fontSize: '14px',
                color: '#ffffff'
            });
            this.playerLabels.push(label);

            // Health bar background
            const healthBarBg = this.add.graphics();
            healthBarBg.fillStyle(0x333333);
            healthBarBg.fillRect(x + 80, y + 2, 100, 10);

            // Health bar
            const healthBar = this.add.graphics();
            this.healthBars.push(healthBar);
        }
    }

    private updateUI(): void {
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];
            const healthBar = this.healthBars[i];
            const label = this.playerLabels[i];

            // Update health bar
            healthBar.clear();
            if (player.isAlive) {
                const healthPercent = player.getHealthPercentage() / 100;
                const color = healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000;
                healthBar.fillStyle(color);
                healthBar.fillRect(80, 30 + i * 25 + 2, 100 * healthPercent, 10);
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