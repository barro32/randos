import { BattleArenaGame, GameState } from './game'; // Import GameState
import { Player } from './player'; // Import Player type

class GameController {
    private game: BattleArenaGame | null = null;
    private playerCount: number = 2; // Default player count
    private currentPlayerIndexForShop: number = 0; // Added for shopping turns
    private sortedPlayersForShop: Player[] = []; // Added for sorted shopping order

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
    private timerElement: HTMLElement; // Added for countdown timer
    private shopOverlayElement: HTMLElement; // Added for shop overlay
    private shopItemsContainer: HTMLElement; // Added for shop items
    private playerGoldDisplayElement: HTMLElement; // Added for player gold in shop

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
        this.timerElement = document.getElementById('timer') as HTMLElement; // Assign timer element
        this.shopOverlayElement = document.getElementById('shopOverlay') as HTMLElement;
        this.shopItemsContainer = document.getElementById('shopItems') as HTMLElement;
        this.playerGoldDisplayElement = document.getElementById('playerGoldDisplay') as HTMLElement;

        // Add finishShoppingButton
        const finishShoppingButton = document.getElementById('finishShoppingButton') as HTMLButtonElement;
        if (finishShoppingButton) {
            finishShoppingButton.addEventListener('click', () => this.finishShoppingTurn());
        }


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
            if (this.game && (this.game.getCurrentGameState() === GameState.RoundOver || this.game.getCurrentGameState() === GameState.Shop)) {
                // Directly call nextRound as player readiness is now handled by completing shopping turns.
                this.game.nextRound();
            }
        });
    }

    /**
     * Sort players by combined health and gold (lowest first, highest last)
     * This ensures players most in need get shopping priority
     */
    private sortPlayersByHealthAndGold(players: Player[]): Player[] {
        return players.sort((a, b) => {
            const scoreA = a.health + a.getGold();
            const scoreB = b.health + b.getGold();
            return scoreA - scoreB;
        });
    }

    private startGame(playerCount: number): void {
        if (this.game) {
            this.game.destroy();
        }
        // Pass the new updateGameStatus method to BattleArenaGame constructor
        this.game = new BattleArenaGame(playerCount, this.updateGameStatus.bind(this), this.onGameEnd.bind(this));
        // The scene will call setCurrentGameState(GameState.Playing) when it's ready
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
        if (this.game && this.game.gameScene) {
            this.currentPlayerIndexForShop = 0; // Reset for the first player
            const alivePlayers = this.game.gameScene.getAlivePlayers();
            if (alivePlayers) {
                this.sortedPlayersForShop = this.sortPlayersByHealthAndGold(alivePlayers);
            } else {
                this.sortedPlayersForShop = [];
            }
            this.game.setCurrentGameState(GameState.Shop);
            // displayShopUI will be called via updateUIVisibility -> updateGameStatus
        }
    }

    private finishShoppingTurn(): void {
        if (!this.game || this.game.getCurrentGameState() !== GameState.Shop) {
            return;
        }

        // Use the sorted list of players
        // const alivePlayers = this.game.gameScene?.getAlivePlayers() || [];
        this.currentPlayerIndexForShop++;

        if (this.currentPlayerIndexForShop < this.sortedPlayersForShop.length) {
            this.displayShopUI(); // Show shop for the next player
        } else {
            // All players have shopped
            this.shopOverlayElement.classList.add('hidden');
            // Automatically start the next round
            if (this.gameStatusElement) {
                this.gameStatusElement.textContent = `All players finished shopping. Starting next round...`;
            }
            this.sortedPlayersForShop = []; // Clear the sorted list
            this.startNextRound();
        }
    }

    private displayShopUI(): void {
        if (!this.game || !this.game.shopInstance || !this.game.gameScene) {
            this.shopOverlayElement.classList.add('hidden');
            return;
        }

        const shop = this.game.shopInstance;
        // Use the sorted list of players
        // const alivePlayers = this.game.gameScene.getAlivePlayers();

        if (this.currentPlayerIndexForShop >= this.sortedPlayersForShop.length) {
            // This case should now be handled by finishShoppingTurn,
            // which automatically starts the next round.
            // If somehow reached, hide shop.
            this.shopOverlayElement.classList.add('hidden');
            // No longer show "Next Round" button here as it's automatic.
            return;
        }

        const currentPlayer = this.sortedPlayersForShop[this.currentPlayerIndexForShop];
        if (!currentPlayer) { // Should not happen if logic is correct
            this.shopOverlayElement.classList.add('hidden');
            return;
        }

        // Update shop title for current player
        const shopTitleElement = document.getElementById('shopTitle');
        if (shopTitleElement) {
            shopTitleElement.textContent = `${currentPlayer.id}'s Turn to Shop`;
        }

        // Display Player Health, Gold, and Inventory
        const playerInfoElement = document.getElementById('playerShopInfo'); // Assuming an element with this ID exists for this
        if (playerInfoElement) {
            const inventoryIcons = currentPlayer.inventory.map(item => item.icon).join(' ');
            playerInfoElement.innerHTML = `
                Health: ${currentPlayer.health}/${currentPlayer.maxHealth} | Gold: ${currentPlayer.getGold()}
                <br>
                Foe Attraction: ${currentPlayer.foeAttraction} (${currentPlayer.foeAttraction > 0 ? 'Attract' : currentPlayer.foeAttraction < 0 ? 'Repel' : 'Neutral'})
                <br>
                Inventory: ${inventoryIcons || 'Empty'}
            `;
        }


        this.playerGoldDisplayElement.textContent = `Gold: ${currentPlayer.getGold()}`; // This might be redundant if playerShopInfo is comprehensive
        this.shopItemsContainer.innerHTML = ''; // Clear previous items

        const items = shop.getAvailableItems();
        items.forEach((shopItem, index) => {
            if (shopItem.quantity > 0) {
                const itemElement = document.createElement('div');
                itemElement.classList.add('shop-item');

                const itemInfo = document.createElement('div');
                itemInfo.classList.add('shop-item-info');
                // Added item icon to the display
                itemInfo.innerHTML = `
                    <p><strong>${shopItem.item.icon} ${shopItem.item.name}</strong></p>
                    <p>${shopItem.item.description}</p>
                    <p>Cost: ${shopItem.item.cost} Gold | Qty: ${shopItem.quantity}</p>
                `;

                // Special handling for Foe Magnet - show +/- buttons
                if (shopItem.item.requiresAdjustmentValue) {
                    const buttonContainer = document.createElement('div');
                    buttonContainer.style.display = 'flex';
                    buttonContainer.style.gap = '5px';
                    
                    const buyMinusButton = document.createElement('button');
                    buyMinusButton.textContent = 'Buy (-1 Repel)';
                    buyMinusButton.disabled = currentPlayer.getGold() < shopItem.item.cost || currentPlayer.foeAttraction === -10;
                    buyMinusButton.onclick = () => {
                        if (this.game) {
                            this.game.playerAttemptToBuyItem(currentPlayer, index, -1);
                            this.displayShopUI();
                        }
                    };
                    
                    const buyPlusButton = document.createElement('button');
                    buyPlusButton.textContent = 'Buy (+1 Attract)';
                    buyPlusButton.disabled = currentPlayer.getGold() < shopItem.item.cost || currentPlayer.foeAttraction === 10;
                    buyPlusButton.onclick = () => {
                        if (this.game) {
                            this.game.playerAttemptToBuyItem(currentPlayer, index, 1);
                            this.displayShopUI();
                        }
                    };
                    
                    buttonContainer.appendChild(buyMinusButton);
                    buttonContainer.appendChild(buyPlusButton);
                    itemElement.appendChild(itemInfo);
                    itemElement.appendChild(buttonContainer);
                } else {
                    // Regular buy button for other items
                    const buyButton = document.createElement('button');
                    buyButton.textContent = 'Buy';
                    buyButton.disabled = currentPlayer.getGold() < shopItem.item.cost;
                    buyButton.onclick = () => {
                        if (this.game) {
                            // Pass the actual player object and item's original index (or unique ID)
                            this.game.playerAttemptToBuyItem(currentPlayer, index); // Adjust index if needed by shop logic
                            this.displayShopUI(); // Refresh shop UI
                            // Potentially update player gold in main game UI as well if visible
                        }
                    };

                    itemElement.appendChild(itemInfo);
                    itemElement.appendChild(buyButton);
                }
                
                this.shopItemsContainer.appendChild(itemElement);
            }
        });

        this.shopOverlayElement.classList.remove('hidden');
    }


    private startNextRound(): void {
        if (this.game) {
            this.sortedPlayersForShop = []; // Clear the sorted list as a safeguard
            this.game.nextRound(); // This internally sets state to Playing
            // updateUIVisibility will be called by updateGameStatus
        }
    }

    // Combined method to update game info and UI visibility based on game state
    private updateGameStatus(playersAlive: number, gameState: GameState, roundNumber: number, remainingTime: number): void {
        if (this.playersAliveElement) {
            this.playersAliveElement.textContent = `Players Alive: ${playersAlive}`;
        }

        if (this.timerElement) {
            if (gameState === GameState.Playing) {
                this.timerElement.textContent = `Time: ${remainingTime}s`;
                this.timerElement.classList.remove('hidden');
            } else {
                this.timerElement.classList.add('hidden');
            }
        }

        if (this.gameStatusElement) { // Update general status message
            switch (gameState) {
                case GameState.Playing:
                    this.gameStatusElement.textContent = `Round ${roundNumber} - Fighting!`;
                    break;
                case GameState.Shop:
                    // Initialize sorted players list if entering shop state for the first time
                    if (this.sortedPlayersForShop.length === 0 && this.game && this.game.gameScene) {
                        const alivePlayers = this.game.gameScene.getAlivePlayers();
                        if (alivePlayers) {
                            this.sortedPlayersForShop = this.sortPlayersByHealthAndGold(alivePlayers);
                            this.currentPlayerIndexForShop = 0;
                        }
                    }
                    // Message will be handled by displayShopUI for current player, or by finishShoppingTurn when all done.
                    // this.gameStatusElement.textContent = `Round ${roundNumber} - Shop Phase.`;
                    this.displayShopUI(); // This will set the player-specific message.
                    break;
                case GameState.RoundOver:
                    this.gameStatusElement.textContent = `Round ${roundNumber} Over! ${playersAlive} players survived. Choose to shop or start next round.`;
                    break;
                // GameOver is handled by onGameEnd
            }
        }
        this.updateUIVisibility(gameState);
    }

    private updateUIVisibility(gameState: GameState): void {
        // Default all to hidden or disabled, then enable based on state
        this.shopButton.classList.add('hidden');
        this.nextRoundButton.classList.add('hidden'); // Initially hidden, shown after all players shop or if skipping shop
        this.startButton.classList.add('hidden');
        this.restartButton.classList.add('hidden');
        this.playerCountInput.disabled = true;
        this.menuElement.classList.add('hidden');
        this.gameInfoElement.classList.add('hidden');
        this.shopOverlayElement.classList.add('hidden'); // Hide shop by default

        switch (gameState) {
            case GameState.Playing:
                this.gameInfoElement.classList.remove('hidden');
                break;
            case GameState.Shop:
                this.gameInfoElement.classList.remove('hidden');
                this.shopOverlayElement.classList.remove('hidden');
                // this.displayShopUI(); // Called by updateGameStatus -> leads to here.
                // NextRoundButton is hidden until all players finish shopping (handled in finishShoppingTurn)
                this.shopButton.classList.add('hidden');
                break;
            case GameState.RoundOver:
                this.gameInfoElement.classList.remove('hidden');
                this.shopButton.classList.remove('hidden');
                this.nextRoundButton.classList.remove('hidden'); // Can skip shop and go to next round
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