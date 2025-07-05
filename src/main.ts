import { BattleArenaGame, GameState } from './game'; // Import GameState

class GameController {
    private game: BattleArenaGame | null = null;
    private playerCount: number = 2; // Default player count

    // UI Elements
    private startButton: HTMLButtonElement;
    private restartButton: HTMLButtonElement;
    private playerCountInput: HTMLInputElement;
    private shopButton: HTMLButtonElement;
    private nextRoundButton: HTMLButtonElement;
    private menuElement: HTMLElement;
    private gameInfoElement: HTMLElement;
    private playersAliveElement: HTMLElement;
    private gameStatusElement: HTMLElement; // For general game status messages

    constructor() {
        // Assign UI elements
        this.startButton = document.getElementById('startButton') as HTMLButtonElement;
        this.restartButton = document.getElementById('restartButton') as HTMLButtonElement;
        this.playerCountInput = document.getElementById('playerCount') as HTMLInputElement;
        this.shopButton = document.getElementById('shopButton') as HTMLButtonElement;
        this.nextRoundButton = document.getElementById('nextRoundButton') as HTMLButtonElement;
        this.menuElement = document.getElementById('menu') as HTMLElement;
        this.gameInfoElement = document.getElementById('gameInfo') as HTMLElement;
        this.playersAliveElement = document.getElementById('playersAlive') as HTMLElement;
        this.gameStatusElement = document.getElementById('gameStatus') as HTMLElement; // Assign new status element

        this.initializeUIEventListeners();
        this.updateUIVisibility(GameState.Playing -1); // Initial UI state (pseudo-state for pre-game)
    }

    private initializeUIEventListeners(): void {
        this.startButton.addEventListener('click', () => {
            this.playerCount = parseInt(this.playerCountInput.value);
            if (this.playerCount >= 2 && this.playerCount <= 8) {
                this.startGame(this.playerCount);
            } else {
                alert('Please enter a number between 2 and 8 players.');
            }
        });

        this.restartButton.addEventListener('click', () => this.restartGame());
        this.shopButton.addEventListener('click', () => this.goToShop());
        // Modify nextRoundButton to handle player ready status
        this.nextRoundButton.addEventListener('click', () => {
            // For simplicity, assume current player (e.g. Player 1) is readying up.
            // In a real multiplayer setup, each player would have their own ready button.
            // This needs a way to identify WHICH player is clicking ready.
            // For now, let's assume a generic "ready up" that tries to advance the game.
            // Or, if we need specific player IDs, the UI needs to be more complex.
            // Let's make a conceptual simplification: clicking "Next Round" implies the "main" player is ready.
            // And then it attempts to start the next round (which checks if all *other* alive players are ready).
            // This part needs a more robust solution for multiple players readying up.
            // A quick fix: assume one player is "Player 1" and they ready up.
            if (this.game) {
                 // Find an alive player to mark as ready. This is a placeholder for actual player input.
                const alivePlayers = this.game.gameScene?.getAlivePlayers();
                if (alivePlayers && alivePlayers.length > 0) {
                     this.game.playerReady(alivePlayers[0].id); // Mark the first alive player as ready
                } else {
                    // If no players are alive, still try to proceed (e.g. if all died simultaneously)
                    this.game.nextRound();
                }
            }
            // this.startNextRound(); // Original call, now handled by playerReady potentially triggering nextRound
        });
    }

    private startGame(playerCount: number): void {
        if (this.game) {
            this.game.destroy();
        }
        // Pass the new updateGameStatus method to BattleArenaGame constructor
        this.game = new BattleArenaGame(playerCount, this.updateGameStatus.bind(this), this.onGameEnd.bind(this));
        this.game.setCurrentGameState(GameState.Playing); // Start in Playing state
        // updateUIVisibility will be called by updateGameStatus
    }

    private restartGame(): void {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
        this.updateUIVisibility(GameState.Playing - 1); // Reset to initial UI
    }

    private goToShop(): void {
        if (this.game) {
            this.game.setCurrentGameState(GameState.Shop);
            // updateUIVisibility will be called by updateGameStatus
        }
    }

    private startNextRound(): void {
        if (this.game) {
            this.game.nextRound(); // This internally sets state to Playing
            // updateUIVisibility will be called by updateGameStatus
        }
    }

    // Combined method to update game info and UI visibility based on game state
    private updateGameStatus(playersAlive: number, gameState: GameState, roundNumber: number): void {
        if (this.playersAliveElement) {
            this.playersAliveElement.textContent = `Players Alive: ${playersAlive}`;
        }

        if (this.gameStatusElement) { // Update general status message
            switch (gameState) {
                case GameState.Playing:
                    this.gameStatusElement.textContent = `Round ${roundNumber} - Fighting!`;
                    break;
                case GameState.Shop:
                    this.gameStatusElement.textContent = `Round ${roundNumber} - Shop Phase. Buy items! Click "Next Round" when ready.`;
                    // Here you would also trigger the actual shop UI display within the Phaser canvas if needed
                    break;
                case GameState.RoundOver:
                    this.gameStatusElement.textContent = `Round ${roundNumber} Over! ${playersAlive} players survived. Click "Next Round" when ready.`;
                    break;
                // GameOver is handled by onGameEnd
            }
        }
        this.updateUIVisibility(gameState);
    }

    private updateUIVisibility(gameState: GameState): void {
        // Default all to hidden or disabled, then enable based on state
        this.shopButton.classList.add('hidden');
        this.nextRoundButton.classList.add('hidden');
        this.startButton.classList.add('hidden');
        this.restartButton.classList.add('hidden');
        this.playerCountInput.disabled = true;
        this.menuElement.classList.add('hidden');
        this.gameInfoElement.classList.add('hidden');

        switch (gameState) {
            case GameState.Playing:
                this.gameInfoElement.classList.remove('hidden');
                break;
            case GameState.Shop:
                this.gameInfoElement.classList.remove('hidden');
                this.nextRoundButton.classList.remove('hidden'); // Option to proceed from shop
                // Potentially show "Leave Shop" or similar instead of generic next round
                break;
            case GameState.RoundOver:
                this.gameInfoElement.classList.remove('hidden');
                this.shopButton.classList.remove('hidden');
                this.nextRoundButton.classList.remove('hidden');
                break;
            case GameState.GameOver:
                this.gameInfoElement.classList.remove('hidden'); // Keep showing info like winner
                this.restartButton.classList.remove('hidden');
                this.menuElement.classList.remove('hidden'); // Show menu to start new game
                this.playerCountInput.disabled = false;
                break;
            default: // Initial pre-game state (using GameState.Playing - 1 as a convention)
                this.menuElement.classList.remove('hidden');
                this.startButton.classList.remove('hidden');
                this.playerCountInput.disabled = false;
                if (this.gameStatusElement) this.gameStatusElement.textContent = 'Select number of players and start the game.';
                if (this.playersAliveElement) this.playersAliveElement.textContent = '';

        }
    }

    private onGameEnd(winner: string): void {
        if (this.gameStatusElement) {
            this.gameStatusElement.textContent = `Game Over! Winner: ${winner}`;
        }
        this.updateUIVisibility(GameState.GameOver);
        // setTimeout(() => { // Alert can be removed if status is displayed well
        //     alert(`Game Over! ${winner} wins!`);
        // }, 500);
    }
}

// Initialize the game controller when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new GameController();
});