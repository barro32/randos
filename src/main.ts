import { BattleArenaGame } from './game';

class GameController {
    private game: BattleArenaGame | null = null;

    constructor() {
        this.initializeUI();
    }

    private initializeUI(): void {
        const startButton = document.getElementById('startButton') as HTMLButtonElement;
        const restartButton = document.getElementById('restartButton') as HTMLButtonElement;
        const playerCountInput = document.getElementById('playerCount') as HTMLInputElement;

        startButton.addEventListener('click', () => {
            const playerCount = parseInt(playerCountInput.value);
            if (playerCount >= 2 && playerCount <= 8) {
                this.startGame(playerCount);
            } else {
                alert('Please enter a number between 2 and 8 players.');
            }
        });

        restartButton.addEventListener('click', () => {
            this.restartGame();
        });
    }

    private startGame(playerCount: number): void {
        // Hide menu and show game info
        const menu = document.getElementById('menu');
        const gameInfo = document.getElementById('gameInfo');
        
        if (menu) menu.classList.add('hidden');
        if (gameInfo) gameInfo.classList.remove('hidden');

        // Destroy existing game if any
        if (this.game) {
            this.game.destroy();
        }

        // Create new game
        this.game = new BattleArenaGame(playerCount, this.updateGameInfo.bind(this), this.onGameEnd.bind(this));
    }

    private restartGame(): void {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }

        // Show menu and hide game info
        const menu = document.getElementById('menu');
        const gameInfo = document.getElementById('gameInfo');
        
        if (menu) menu.classList.remove('hidden');
        if (gameInfo) gameInfo.classList.add('hidden');
    }

    private updateGameInfo(playersAlive: number): void {
        const playersAliveElement = document.getElementById('playersAlive');
        if (playersAliveElement) {
            playersAliveElement.textContent = `Players Alive: ${playersAlive}`;
        }
    }

    private onGameEnd(winner: string): void {
        setTimeout(() => {
            alert(`Game Over! ${winner} wins!`);
        }, 500);
    }
}

// Initialize the game controller when the page loads
window.addEventListener('DOMContentLoaded', () => {
    new GameController();
});