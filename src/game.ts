import * as Phaser from 'phaser';
import { Player } from './player';
import { Shop } from './shop'; // Import the Shop class

export enum GameState {
    Playing,
    Shop,
    RoundOver,
    GameOver
}

export class BattleArenaGame {
    private game: Phaser.Game;
    // private players: Player[] = []; // Managed by GameScene
    // Adjusted updateCallback to include remainingTime
    private updateCallback: (playersAlive: number, gameState: GameState, roundNumber: number, remainingTime: number) => void;
    private gameEndCallback: (winner: string) => void;
    public gameScene: GameScene; // Made public for GameController to access players
    public shopInstance: Shop | null = null; // Made public for GameController
    private currentGameState: GameState = GameState.RoundOver; // Changed initial state
    private currentRound: number = 1;
    private roundTimer: Phaser.Time.TimerEvent | null = null;
    private roundDuration: number = 30000; // 30 seconds in milliseconds
    private remainingTime: number = 0; // Added to store remaining time
    // private readyPlayers: Set<string> = new Set(); // Set to store IDs of players who are ready - No longer needed for this flow

    constructor(playerCount: number, updateCallback: (playersAlive: number, gameState: GameState, roundNumber: number, remainingTime: number) => void, gameEndCallback: (winner: string) => void) {
        this.updateCallback = updateCallback;
        this.gameEndCallback = gameEndCallback;
        this.remainingTime = this.roundDuration / 1000; // Initialize remainingTime

        // Pass a new callback to GameScene for state changes
        this.gameScene = new GameScene(
            playerCount,
            (alive, anPlayerIsVictor) => this.handleGameUpdate(alive, anPlayerIsVictor),
            (winner) => this.handleGameEnd(winner),
            (newState) => this.setCurrentGameState(newState) // Callback to change game state
        );

        // Initialize shop - it might be better to do this when needed, e.g., when entering shop state
        // For now, let's assume the GameScene will manage the shop's lifecycle or its UI integration
        // this.shopInstance = new Shop(this.gameScene, playerCount); // This might need adjustment based on UI

        const config: Phaser.Types.Core.GameConfig = {
            type: Phaser.AUTO,
            // Adjusted to use window dimensions for responsiveness
            width: window.innerWidth * 0.9 > 400 ? 400 : window.innerWidth * 0.9, // Max width of 400px or 90% of viewport
            height: window.innerHeight * 0.6 > 533 ? 533 : window.innerHeight * 0.6, // Max height of 533px (maintaining 3:4 for 400 width) or 60% of viewport
            scale: {
                mode: Phaser.Scale.FIT,
                autoCenter: Phaser.Scale.CENTER_BOTH
            },
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

    private handleGameUpdate(playersAlive: number, roundShouldEnd: boolean): void {
        // If roundShouldEnd is true (due to elimination or timer flag from scene)
        // AND we are currently in the Playing state, then transition to RoundOver.
        if (roundShouldEnd && this.currentGameState === GameState.Playing) {
            this.setCurrentGameState(GameState.RoundOver);
            // setCurrentGameState will call updateCallback, so no need to call it again here for this case.
        } else {
            // Otherwise (e.g., regular update during Playing, or game is not in Playing state,
            // or roundShouldEnd is false), just call the updateCallback to refresh UI (like timer).
            this.updateCallback(playersAlive, this.currentGameState, this.currentRound, this.getRemainingTime());
        }
    }

    private handleGameEnd(winner: string): void {
        // Note: setCurrentGameState(GameState.GameOver) is typically called by GameScene.checkWinCondition
        // which then calls this.gameEndCallback.
        // So, this function is more of a reaction to the state already being set.
        // However, if there's a direct call to gameEnd, ensuring state is correct is good.
        if (this.currentGameState !== GameState.GameOver) {
            this.setCurrentGameState(GameState.GameOver);
        }
        this.gameEndCallback(winner); // Inform the UI/controller about the winner
    }

    public nextRound(): void {
        // Player readiness is now handled by the GameController's shopping turn logic.
        // This function is called when the "Next Round" button is clicked after all players have shopped.
        if (this.currentGameState === GameState.Shop || this.currentGameState === GameState.RoundOver) {
            this.currentRound++;
            this.setCurrentGameState(GameState.Playing);
            this.gameScene.resetRound();
            this.startRoundTimer();
            // No need to clear readyPlayers here as it's no longer used for this flow.
            this.updateCallback(this.gameScene.getAlivePlayersCount(), this.currentGameState, this.currentRound, this.getRemainingTime());
        }
    }

    public getCurrentGameState(): GameState { // Added this method - MOVED
        return this.currentGameState;
    }

    public getRemainingTime(): number {
        if (this.roundTimer && this.currentGameState === GameState.Playing && this.roundTimer.getProgress() < 1) {
            // Calculate remaining time based on the timer's progress
            return Math.ceil((this.roundTimer.delay - this.roundTimer.getElapsed()) / 1000);
        }
        // If not playing, or timer completed/not set, remaining time for the active round is 0
        return 0;
    }

    // playerReady is no longer needed as the shopping phase completion gates the next round.
    // public playerReady(playerId: string): void {
    //     if (this.currentGameState === GameState.RoundOver || this.currentGameState === GameState.Shop) {
    //         this.readyPlayers.add(playerId);
    //         console.log(`${playerId} is ready.`);
    //         // Optionally, attempt to start next round if all are now ready
    //         this.nextRound();
    //     }
    // }

    private startRoundTimer(): void {
        if (this.roundTimer) {
            this.roundTimer.remove(false);
        }
        this.roundTimer = this.gameScene.time.addEvent({
            delay: this.roundDuration,
            callback: () => this.endRoundDueToTime(),
            callbackScope: this
        });
    }

    private endRoundDueToTime(): void {
        if (this.currentGameState === GameState.Playing) {
            console.log("Round ended due to time limit.");
            this.setCurrentGameState(GameState.RoundOver);
            // gameScene might need a method to pause players or similar
            this.gameScene.setRoundOver(true); // Notify scene that round is over by time
            this.updateCallback(this.gameScene.getAlivePlayersCount(), this.currentGameState, this.currentRound, 0); // Time is 0 when round ends by timer
        }
    }

    // Override setCurrentGameState to start timer when Playing state begins
    public setCurrentGameState(newState: GameState): void {
        const oldState = this.currentGameState;
        this.currentGameState = newState;

        if (newState === GameState.Playing && oldState !== GameState.Playing) {
            // If resuming from a state where scene might have been paused
            if (this.gameScene.scene.isPaused('GameScene')) {
                this.gameScene.scene.resume('GameScene');
            }
            this.startRoundTimer();
        } else if (newState === GameState.Shop) {
            // Pause game scene when entering shop
            if (this.gameScene.scene.isActive('GameScene') && !this.gameScene.scene.isPaused('GameScene')) {
                this.gameScene.scene.pause('GameScene');
            }
            if (this.roundTimer) {
                this.roundTimer.paused = true;
            }
        } else if (newState !== GameState.Playing && this.roundTimer) {
            // For other non-Playing states like RoundOver, GameOver, ensure timer is paused
            // but don't necessarily pause the scene unless specified (e.g. Game Over might have animations)
            this.roundTimer.paused = true;
            // If moving from Playing to RoundOver, we might want to keep scene active for a moment for effects,
            // or explicitly pause it if needed. For now, just pausing timer.
            // If it was Shop, scene is already paused. If it's RoundOver from Playing, scene remains active.
        }


        if (this.currentGameState === GameState.Shop) {
            if (!this.shopInstance && this.gameScene) {
                const playerCount = this.gameScene.getPlayerCount();
                this.shopInstance = new Shop(this.gameScene, playerCount);
                this.shopInstance.restock(playerCount); // Restock shop at the beginning of shop phase
            }
            // this.shopInstance?.displayShop(); // Removed console log, UI handled by GameController
        }
        this.updateCallback(this.gameScene?.getAlivePlayersCount() || 0, this.currentGameState, this.currentRound, this.getRemainingTime());
    }


    // Method for player to buy an item, called from UI
    public playerAttemptToBuyItem(player: Player, itemArrayIndex: number): void { // itemIndex changed to itemArrayIndex
        if (this.currentGameState === GameState.Shop && this.shopInstance) {
            // itemArrayIndex is already the 0-based index from the UI display.
            const bought = this.shopInstance.buyItem(player, itemArrayIndex);
            if (bought) {
                // Optional: Update player-specific UI in GameScene if needed
                // Also, the main UI (GameController) will refresh the shop display.
            }
        }
    }
}

class GameScene extends Phaser.Scene {
    private players: Player[] = [];
    private playerCount: number;
    private gameUpdateCallback: (playersAlive: number, roundOver: boolean) => void; // Changed signature
    private gameEndCallback: (winner: string) => void;
    private gameStateChangeCallback: (newState: GameState) => void; // Callback to change game state
    private healthBars: Phaser.GameObjects.Graphics[] = [];
    private goldBars: Phaser.GameObjects.Graphics[] = [];
    private playerLabels: Phaser.GameObjects.Text[] = [];
    private gameEnded: boolean = false;
    private roundOverFlag: boolean = false; // Renamed to avoid conflict, controls round logic within scene


    constructor(
        playerCount: number,
        gameUpdateCallback: (playersAlive: number, roundOver: boolean) => void,
        gameEndCallback: (winner: string) => void,
        gameStateChangeCallback: (newState: GameState) => void
    ) {
        super({ key: 'GameScene' });
        this.playerCount = playerCount;
        this.gameUpdateCallback = gameUpdateCallback;
        this.gameEndCallback = gameEndCallback;
        this.gameStateChangeCallback = gameStateChangeCallback;
    }

    public preload(): void {
        // No assets to preload - using primitive shapes
    }

    public create(): void {
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        const borderWidth = 4; // Thickness of the border
        const margin = 20; // Margin from the edge of the game area

        // Create border around the game area
        const border = this.add.graphics();
        border.lineStyle(borderWidth, 0xffffff);
        border.strokeRect(margin, margin, gameWidth - 2 * margin, gameHeight - 2 * margin);

        // Set the physics world bounds to match the visual border
        // The player sprites are 30x30, so their half-width/height is 15.
        // The world bounds need to be inset by this amount from the visual border
        // if we want the *edge* of the sprite to touch the visual border.
        // However, setCollideWorldBounds already prevents the body's bounding box
        // (which is the sprite itself for a rectangle) from exiting the world bounds.
        // So, the world bounds should be set to the visual playable area.
        const effectiveMarginX = margin + borderWidth;
        const effectiveMarginY = margin + borderWidth;
        const effectiveWidth = gameWidth - 2 * (margin + borderWidth);
        const effectiveHeight = gameHeight - 2 * (margin + borderWidth);
        this.physics.world.setBounds(effectiveMarginX, effectiveMarginY, effectiveWidth, effectiveHeight);

        // Generate distinct colors for players
        const colors = this.generatePlayerColors(this.playerCount);

        // Create players at random positions within the playable area
        // Player size is 30x30, so half-size is 15.
        // spawnMargin is the minimum distance from the canvas edge to the player's center.
        // It's calculated as outer margin + border thickness + player's half size.
        const playerHalfSize = 15;
        const spawnMargin = margin + borderWidth + playerHalfSize;
        for (let i = 0; i < this.playerCount; i++) {
            // The random position for the player's center should be between:
            // min: spawnMargin
            // max: gameDimension - spawnMargin
            // This ensures the player's bounding box is entirely within the spawnable area.
            const x = Phaser.Math.Between(spawnMargin, gameWidth - spawnMargin);
            const y = Phaser.Math.Between(spawnMargin, gameHeight - spawnMargin);
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
        this.gameUpdateCallback(this.getAlivePlayersCount(), false);
    }

    public update(time: number): void {
        this.players.forEach(player => player.update(time));
        this.updateUI();

        if (!this.gameEnded) {
            const aliveCount = this.getAlivePlayersCount();
            let playerWasEliminatedThisFrame = this.players.some(p => p.justDied);

            // Always call gameUpdateCallback. BattleArenaGame will use its state to determine if timer should be shown.
            // Pass true for roundOver if an elimination occurred or if timer flag is set.
            this.gameUpdateCallback(aliveCount, this.roundOverFlag || playerWasEliminatedThisFrame);

            if (playerWasEliminatedThisFrame) {
                // Reset flag after checking and sending update, so it's only processed once per elimination event.
                this.players.forEach(p => {
                    if (p.justDied) p.justDied = false;
                });
            }

            // checkWinCondition is primarily for game over.
            // Round over by elimination is handled by BattleArenaGame.handleGameUpdate based on the 'true' passed in gameUpdateCallback.
            // roundOverFlag is set by timer ending, which also triggers a state change via setRoundOver -> gameStateChangeCallback.
            if (!this.roundOverFlag && !playerWasEliminatedThisFrame) { // Avoid redundant checks if round is already ending
                 this.checkWinCondition();
            }
        }
    }

    public resetRound(): void {
        this.roundOverFlag = false;
        this.players.forEach(p => {
            // Revive player if they were dead and it's not game over (more than 1 player to start with)
            // or if only one player remains (they won the game but we are resetting for a new game structure if any)
            // For now, assume reset means full health, reset position for all.
            p.heal(p.maxHealth); // Heal to full
            p.isAlive = true;    // Mark as alive
            p.sprite.setActive(true).setVisible(true);
            p.sprite.setFillStyle(p.color); // Restore original color
            p.sprite.setAlpha(1);           // Restore alpha
            p.sprite.setScale(1);           // Restore scale

            // Reposition players
            const gameWidth = this.cameras.main.width;
            const gameHeight = this.cameras.main.height;
            const borderWidth = 4; // Assuming this is consistent or accessible
            const margin = 20;      // Assuming this is consistent or accessible
            // Player size is 30x30, so half-size is 15.
            const playerHalfSize = 15;
            const spawnMargin = margin + borderWidth + playerHalfSize;

            const x = Phaser.Math.Between(spawnMargin, gameWidth - spawnMargin);
            const y = Phaser.Math.Between(spawnMargin, gameHeight - spawnMargin);
            p.sprite.setPosition(x, y);
            (p.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0); // Reset velocity
        });

        this.gameUpdateCallback(this.getAlivePlayersCount(), false); // Notify that round is reset
    }

    public getPlayerCount(): number {
        return this.playerCount;
    }

    public getAlivePlayersCount(): number {
        return this.players.filter(player => player.isAlive).length;
    }

    public getAlivePlayers(): Player[] {
        return this.players.filter(player => player.isAlive);
    }

    public setRoundOver(isOver: boolean): void {
        this.roundOverFlag = isOver;
        if (isOver) {
            this.players.forEach(p => {
                if (p.sprite.body) {
                    (p.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0,0);
                }
            });
            // Inform BattleArenaGame to change the state to RoundOver.
            // This will then trigger the main updateCallback with correct state and time.
            this.gameStateChangeCallback(GameState.RoundOver);
        }
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

        const body1 = player1.sprite.body as Phaser.Physics.Arcade.Body;
        const body2 = player2.sprite.body as Phaser.Physics.Arcade.Body;

        // Apply damage and effects only if neither player is invulnerable from this collision event
        // Or if this specific pair hasn't just become invulnerable from each other.
        // For simplicity, a global invulnerability flag is used.
        if (!player1.isInvulnerable && !player2.isInvulnerable) {
            // Determine who is the attacker based on velocity (speed)
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
                // If speeds are equal, or both are very slow, they both take some impact
                // For simplicity, let's stick to the random attacker if speeds are equal.
                if (Math.random() < 0.5) {
                    attacker = player1;
                    victim = player2;
                } else {
                    attacker = player2;
                    victim = player1;
                }
            }

            // Attacker steals gold from victim based on attacker's goldPerHit
            const stolenGold = victim.stealGold(attacker.goldPerHit);
            attacker.addGold(stolenGold);

            // Both players take damage from each other.
            player1.takeDamage(player2.attackDamage);
            // Check if player1 died before player2 takes damage or vice-versa, to avoid errors if sprite/body is gone
            if (player1.isAlive) {
                player2.takeDamage(player1.attackDamage);
            }

            // Set both players invulnerable for a short duration
            const currentTime = this.time.now;
            player1.setInvulnerable(currentTime);
            player2.setInvulnerable(currentTime);
        }

        // Push players apart to prevent them from getting stuck and to simulate a bounce.
        // This bounce effect happens regardless of invulnerability status.
        const collisionAngle = Phaser.Math.Angle.Between(player1.sprite.x, player1.sprite.y, player2.sprite.x, player2.sprite.y);

        // --- Player 1 bounce logic ---
        // Reflect player1's velocity based on the collision angle
        // For a simple reversal effect, we can use the collisionAngle directly
        // More advanced reflection would use the current velocity and surface normal
        const newVel1 = new Phaser.Math.Vector2(-Math.cos(collisionAngle), -Math.sin(collisionAngle));
        newVel1.normalize().scale(player1.moveSpeed); // Access moveSpeed from player instance
        body1.setVelocity(newVel1.x, newVel1.y);
        player1.currentVelocity.set(newVel1.x, newVel1.y); // Update player's internal velocity

        // --- Player 2 bounce logic ---
        // Player2 bounces in the opposite direction
        const newVel2 = new Phaser.Math.Vector2(Math.cos(collisionAngle), Math.sin(collisionAngle));
        newVel2.normalize().scale(player2.moveSpeed); // Access moveSpeed from player instance
        body2.setVelocity(newVel2.x, newVel2.y);
        player2.currentVelocity.set(newVel2.x, newVel2.y); // Update player's internal velocity


        // The existing `body.setBounce(1)` on players might also contribute.
        // The explicit setVelocity above provides a more controlled bounce direction and speed.
        // If relying purely on Arcade physics bounce, we might not need to manually setVelocity here,
        // but then controlling the exact bounce direction relative to player properties is harder.
        // This approach gives direct control.
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

    // Renamed from checkRoundOrWinCondition - only checks for overall game win condition.
    // Round ending by elimination or timer is handled by BattleArenaGame based on signals from GameScene.
    private checkWinCondition(): void {
        const alivePlayers = this.players.filter(player => player.isAlive);
        const aliveCount = alivePlayers.length;

        // Check for game over (overall win condition)
        // Considers playerCount > 0 to support potential single player modes later, though current setup is 2+
        if (aliveCount <= 1 && this.playerCount > 0 && !this.gameEnded) {
            this.gameEnded = true;
            // gameEndCallback will be called by BattleArenaGame when it processes the GameOver state.
            this.gameEndCallback(aliveCount === 1 ? alivePlayers[0].id : "No one (Draw)");
            // This call will lead to BattleArenaGame.setCurrentGameState(GameState.GameOver),
            // which then calls the UI updateCallback.
            this.gameStateChangeCallback(GameState.GameOver);
        }
    }
}