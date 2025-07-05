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
    private updateCallback: (playersAlive: number, gameState: GameState, roundNumber: number) => void;
    private gameEndCallback: (winner: string) => void;
    private gameScene: GameScene;
    private shopInstance: Shop | null = null; // To hold the shop instance
    private currentGameState: GameState = GameState.Playing;
    private currentRound: number = 1;
    private roundTimer: Phaser.Time.TimerEvent | null = null;
    private roundDuration: number = 30000; // 30 seconds in milliseconds
    private readyPlayers: Set<string> = new Set(); // Set to store IDs of players who are ready

    constructor(playerCount: number, updateCallback: (playersAlive: number, gameState: GameState, roundNumber: number) => void, gameEndCallback: (winner: string) => void) {
        this.updateCallback = updateCallback;
        this.gameEndCallback = gameEndCallback;

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

    private handleGameUpdate(playersAlive: number, roundOver: boolean): void {
        if (roundOver && this.currentGameState === GameState.Playing) {
            this.setCurrentGameState(GameState.RoundOver);
            // Potentially transition to shop or next round logic here
        }
        this.updateCallback(playersAlive, this.currentGameState, this.currentRound);
    }

    private handleGameEnd(winner: string): void {
        this.setCurrentGameState(GameState.GameOver);
        this.gameEndCallback(winner);
    }

    // public setCurrentGameState(newState: GameState): void { // Simpler version REMOVED
    //     this.currentGameState = newState;
    //     if (this.currentGameState === GameState.Shop) {
    //         if (!this.shopInstance && this.gameScene) {
    //             const playerCount = this.gameScene.getPlayerCount();
    //             this.shopInstance = new Shop(this.gameScene, playerCount);
    //         }
    //         this.shopInstance?.displayShop();
    //     }
    //     this.updateCallback(this.gameScene?.getAlivePlayersCount() || 0, this.currentGameState, this.currentRound);
    // }

    public nextRound(): void {
        if (this.currentGameState === GameState.RoundOver || this.currentGameState === GameState.Shop) {
            // Check if all remaining players are ready
            const alivePlayerIds = this.gameScene.getAlivePlayers().map(p => p.id);
            const allReady = alivePlayerIds.every(id => this.readyPlayers.has(id));

            if (allReady || alivePlayerIds.length === 0) { // Proceed if all alive players are ready or no one is left to ready up
                this.currentRound++;
                this.setCurrentGameState(GameState.Playing);
                this.gameScene.resetRound();
                this.startRoundTimer();
                this.readyPlayers.clear(); // Clear ready status for the new round
                this.updateCallback(this.gameScene.getAlivePlayersCount(), this.currentGameState, this.currentRound);
            } else {
                // Notify UI that not all players are ready
                console.log("Waiting for all players to ready up...");
                // This message should ideally be shown in the game UI
                this.updateCallback(this.gameScene.getAlivePlayersCount(), GameState.Shop, this.currentRound); // Remain in shop/round over state
            }
        }
    }

    public playerReady(playerId: string): void {
        if (this.currentGameState === GameState.RoundOver || this.currentGameState === GameState.Shop) {
            this.readyPlayers.add(playerId);
            console.log(`${playerId} is ready.`);
            // Optionally, attempt to start next round if all are now ready
            this.nextRound();
        }
    }

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
            this.updateCallback(this.gameScene.getAlivePlayersCount(), this.currentGameState, this.currentRound);
        }
    }

    // Override setCurrentGameState to start timer when Playing state begins
    public setCurrentGameState(newState: GameState): void {
        const oldState = this.currentGameState;
        this.currentGameState = newState;

        if (newState === GameState.Playing && oldState !== GameState.Playing) {
            this.startRoundTimer();
        } else if (newState !== GameState.Playing && this.roundTimer) {
            // Stop timer if not in Playing state
            this.roundTimer.paused = true;
        }


        if (this.currentGameState === GameState.Shop) {
            if (!this.shopInstance && this.gameScene) {
                const playerCount = this.gameScene.getPlayerCount();
                this.shopInstance = new Shop(this.gameScene, playerCount);
                this.shopInstance.restock(playerCount); // Restock shop at the beginning of shop phase
            }
            this.shopInstance?.displayShop();
        }
        this.updateCallback(this.gameScene?.getAlivePlayersCount() || 0, this.currentGameState, this.currentRound);
    }


    // Method for player to buy an item, called from UI
    public playerAttemptToBuyItem(player: Player, itemIndex: number): void {
        if (this.currentGameState === GameState.Shop && this.shopInstance) {
            const bought = this.shopInstance.buyItem(player, itemIndex);
            if (bought) {
                // Optional: Update player-specific UI in GameScene if needed
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
        this.gameUpdateCallback(this.getAlivePlayersCount(), false);
    }

    public update(time: number): void {
        // if (this.gameEnded || this.roundOverFlag) return; // Pauses updates if round/game is over
        // Allow player updates for movement effects even if round is over, but not combat logic

        this.players.forEach(player => player.update(time));
        this.updateUI();

        if (!this.gameEnded && !this.roundOverFlag) {
            // Check win/round end condition only if game and round are active
            this.checkRoundOrWinCondition();
        }
    }

    public resetRound(): void {
        this.roundOverFlag = false;
        // Reset players (health, position, etc.)
        // For now, just re-activate them if they died in a previous round (if game is not over)
        this.players.forEach(p => {
            if (!p.isAlive && this.getAlivePlayersCount() > 1) { // Don't revive if it's game over
                // This logic needs refinement based on how rounds progress (e.g. full heal, reset pos)
                // For now, let's assume a simple heal and re-activation
                p.heal(p.maxHealth);
                p.isAlive = true;
                p.sprite.setActive(true).setVisible(true);
                 // Reset visual state from die()
                p.sprite.setFillStyle(p.color);
                p.sprite.setAlpha(1);
                p.sprite.setScale(1);

            }
            // TODO: Reposition players
            const x = Phaser.Math.Between(50, 750);
            const y = Phaser.Math.Between(50, 550);
            p.sprite.setPosition(x,y);
            (p.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0,0);
        });

        this.gameUpdateCallback(this.getAlivePlayersCount(), false);
    }

    public getPlayerCount(): number {
        return this.playerCount;
    }

    public getAlivePlayersCount(): number { // Made public for BattleArenaGame access
        return this.players.filter(player => player.isAlive).length;
    }

    public getAlivePlayers(): Player[] { // Added to get actual player objects
        return this.players.filter(player => player.isAlive);
    }

    public setRoundOver(isOver: boolean): void { // Method to signal round over from BattleArenaGame (timer)
        this.roundOverFlag = isOver;
        if (isOver) {
            // Optionally pause player movements or actions here if needed
            this.players.forEach(p => {
                if (p.sprite.body) { // Check if body exists
                    (p.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(0,0); // Stop movement
                }
            });
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

        // Attacker steals gold from victim based on attacker's goldPerHit
        const stolenGold = victim.stealGold(attacker.goldPerHit);
        attacker.addGold(stolenGold);

        // Both players take damage based on their attackDamage
        // For simplicity in this collision, we'll have them damage each other
        // If only the attacker should deal damage, this logic needs adjustment
        player1.takeDamage(player2.attackDamage);
        player2.takeDamage(player1.attackDamage);


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

    // private getAlivePlayersCount(): number { // Now public
    //     return this.players.filter(player => player.isAlive).length;
    // }

    private checkRoundOrWinCondition(): void { // Renamed and logic adjusted
        const alivePlayers = this.players.filter(player => player.isAlive);
        const aliveCount = alivePlayers.length;
        
        this.gameUpdateCallback(aliveCount, false); // Regular update

        // Check for game over (overall win condition)
        if (aliveCount <= 1 && this.playerCount > 1 && !this.gameEnded) {
            this.gameEnded = true;
            this.roundOverFlag = true; // Current round also ends
            this.gameEndCallback(aliveCount === 1 ? alivePlayers[0].id : "No one (Draw)");
            this.gameStateChangeCallback(GameState.GameOver);
            return; // Exit if game is over
        }

        // If not game over, check if a player was eliminated to potentially end the round
        // This relies on the fact that checkRoundOrWinCondition is called in update loop.
        // If a player is defeated, aliveCount will decrease.
        // We need to compare with previous alive count or number of players at round start.
        // For simplicity, if a player is knocked out and it's not game over, we can consider it a round end.
        // This is a placeholder for more specific round end conditions.
        // The timer in BattleArenaGame is the primary mechanism for ending rounds.
        // This local check can supplement it, e.g. if all but one eliminated before timer.

        // Let's refine: if the number of alive players is less than it was at the start of this check,
        // AND the game is not over, it implies someone was just defeated.
        // This is tricky to manage without storing previous state within this function.
        // The gameUpdateCallback(aliveCount, this.roundOverFlag) is called.
        // The BattleArenaGame class can then decide if this constitutes a round end.

        // For now, this function primarily signals game over. Round over due to player elimination
        // before timer is implicitly handled: if aliveCount drops, BattleArenaGame will be notified.
        // If it drops to 1 or 0, it's game over. If it drops but >1, BattleArenaGame can decide
        // if that means round over (e.g., if only one team left in a team game).
        // With the current timer implementation, this function mainly handles the GAME OVER condition.
        // Round Over by player elimination (not timer) is when aliveCount changes and it's not GameOver.
        // The `gameUpdateCallback(aliveCount, this.roundOverFlag)` will inform BattleArenaGame.
        // If BattleArenaGame sees aliveCount change and state is Playing, it can transition to RoundOver.
        // This is what `handleGameUpdate` in `BattleArenaGame` is for.
        // So, this function in GameScene doesn't need to explicitly set roundOverFlag for this case.
        // It sets roundOverFlag when the *timer* ends the round (via setRoundOver method).

        // No, this is simpler: if any player is eliminated and it's not game over, then the round should end.
        // This means if an elimination happens, we transition to RoundOver state.
        // The check for this should be after player collisions and damage application.
        const previousAliveCount = this.players.length; // Assuming players array isn't changed mid-round
                                                    // This is not good. Need a snapshot at round start.
                                                    // Or, more simply: if a player's health dropped to 0 this frame.
        // This is already implicitly handled by gameUpdateCallback. If aliveCount changes,
        // handleGameUpdate in BattleArenaGame will be called. If it's not a game-ending change,
        // it can decide to set state to RoundOver.

        // The main responsibility here is to call gameUpdateCallback.
        // If aliveCount drops to 1 or 0 --> game over.
        // If aliveCount drops but still > 1 --> gameUpdateCallback is called, BattleArenaGame
        // via handleGameUpdate can then set state to RoundOver. This is the current logic.
        // This means this.roundOverFlag is primarily for timer-based round end.

        // Let's ensure checkRoundOrWinCondition correctly signals to BattleArenaGame
        // when players are eliminated but the game isn't over.
        // The current call `this.gameUpdateCallback(aliveCount, false);` (if not game over)
        // correctly informs BattleArenaGame. BattleArenaGame's `handleGameUpdate`
        // then transitions to `GameState.RoundOver` if `roundOver` (which means a player was eliminated)
        // is true (passed from here based on some condition).

        // The `roundOver` parameter in `gameUpdateCallback(aliveCount, roundOver)`
        // should be true if this check determines the round is over (e.g. player eliminated).
        let wasPlayerEliminatedThisFrame = this.players.some(p => p.justDied);
        if (wasPlayerEliminatedThisFrame) {
            this.players.forEach(p => p.justDied = false); // Reset flag
        }


        // Simpler: if aliveCount < number of players who started the round alive, and not game over.
        // For now, the existing logic where BattleArenaGame.handleGameUpdate transitions based on
        // alive player count changes is sufficient for player elimination ending a round.
        // This function (checkRoundOrWinCondition) primarily handles the GAME OVER state.
        // The roundOverFlag here is for when the timer ends the round.
        if (this.roundOverFlag && !this.gameEnded) { // If round ended by timer
             this.gameStateChangeCallback(GameState.RoundOver);
             return; // Return if round ended by timer
        }

        // If a player was eliminated this frame and it's not game over, it's a round end.
        if (wasPlayerEliminatedThisFrame && !this.gameEnded) {
            this.roundOverFlag = true; // Mark round as over due to elimination
            this.gameUpdateCallback(aliveCount, true); // Signal that round is over
            this.gameStateChangeCallback(GameState.RoundOver); // Change state
        }
    }
}