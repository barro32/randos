import { describe, it, expect } from 'vitest';

/**
 * Test suite for shopping order functionality
 * Players should be ordered by health + gold (lowest first, highest last)
 */
describe('Shopping Order', () => {
    describe('Player sorting by health + gold', () => {
        it('should sort players by combined health and gold (lowest first)', () => {
            // Mock players with different health and gold values
            const players = [
                { id: 'Player 1', health: 100, gold: 50, getGold: () => 50 }, // Total: 150
                { id: 'Player 2', health: 80, gold: 30, getGold: () => 30 },  // Total: 110
                { id: 'Player 3', health: 120, gold: 60, getGold: () => 60 }, // Total: 180
                { id: 'Player 4', health: 90, gold: 40, getGold: () => 40 },  // Total: 130
            ];

            // Apply the sorting logic that should be used in main.ts
            const sorted = players.sort((a, b) => {
                const scoreA = a.health + a.getGold();
                const scoreB = b.health + b.getGold();
                return scoreA - scoreB;
            });

            // Verify the order: Player 2 (110), Player 4 (130), Player 1 (150), Player 3 (180)
            expect(sorted[0].id).toBe('Player 2');
            expect(sorted[1].id).toBe('Player 4');
            expect(sorted[2].id).toBe('Player 1');
            expect(sorted[3].id).toBe('Player 3');
        });

        it('should handle players with same total score', () => {
            const players = [
                { id: 'Player A', health: 100, gold: 50, getGold: () => 50 }, // Total: 150
                { id: 'Player B', health: 75, gold: 75, getGold: () => 75 },  // Total: 150
                { id: 'Player C', health: 150, gold: 0, getGold: () => 0 },   // Total: 150
            ];

            const sorted = players.sort((a, b) => {
                const scoreA = a.health + a.getGold();
                const scoreB = b.health + b.getGold();
                return scoreA - scoreB;
            });

            // All have same score, so order should be stable (relative order preserved)
            expect(sorted.length).toBe(3);
            sorted.forEach(player => {
                expect(player.health + player.getGold()).toBe(150);
            });
        });

        it('should place player with lowest health and no gold first', () => {
            const players = [
                { id: 'Rich and Healthy', health: 150, gold: 100, getGold: () => 100 }, // Total: 250
                { id: 'Poor and Weak', health: 10, gold: 5, getGold: () => 5 },         // Total: 15
                { id: 'Medium', health: 80, gold: 40, getGold: () => 40 },              // Total: 120
            ];

            const sorted = players.sort((a, b) => {
                const scoreA = a.health + a.getGold();
                const scoreB = b.health + b.getGold();
                return scoreA - scoreB;
            });

            expect(sorted[0].id).toBe('Poor and Weak');
            expect(sorted[1].id).toBe('Medium');
            expect(sorted[2].id).toBe('Rich and Healthy');
        });

        it('should place player with highest health and gold last', () => {
            const players = [
                { id: 'Medium', health: 100, gold: 50, getGold: () => 50 },             // Total: 150
                { id: 'Rich and Healthy', health: 150, gold: 100, getGold: () => 100 }, // Total: 250
                { id: 'Weak', health: 50, gold: 25, getGold: () => 25 },                // Total: 75
            ];

            const sorted = players.sort((a, b) => {
                const scoreA = a.health + a.getGold();
                const scoreB = b.health + b.getGold();
                return scoreA - scoreB;
            });

            expect(sorted[sorted.length - 1].id).toBe('Rich and Healthy');
            expect(sorted[0].id).toBe('Weak');
        });

        it('should work with single player', () => {
            const players = [
                { id: 'Solo Player', health: 100, gold: 50, getGold: () => 50 },
            ];

            const sorted = players.sort((a, b) => {
                const scoreA = a.health + a.getGold();
                const scoreB = b.health + b.getGold();
                return scoreA - scoreB;
            });

            expect(sorted.length).toBe(1);
            expect(sorted[0].id).toBe('Solo Player');
        });

        it('should correctly order players after a round where one took damage', () => {
            const players = [
                { id: 'Player 1', health: 50, gold: 50, getGold: () => 50 },  // Total: 100 (took damage)
                { id: 'Player 2', health: 150, gold: 50, getGold: () => 50 }, // Total: 200 (no damage)
                { id: 'Player 3', health: 100, gold: 30, getGold: () => 30 }, // Total: 130 (some damage)
            ];

            const sorted = players.sort((a, b) => {
                const scoreA = a.health + a.getGold();
                const scoreB = b.health + b.getGold();
                return scoreA - scoreB;
            });

            // Damaged player should go first
            expect(sorted[0].id).toBe('Player 1');
            expect(sorted[1].id).toBe('Player 3');
            expect(sorted[2].id).toBe('Player 2');
        });

        it('should handle zero values correctly', () => {
            const players = [
                { id: 'No Health', health: 0, gold: 50, getGold: () => 50 },    // Total: 50
                { id: 'No Gold', health: 100, gold: 0, getGold: () => 0 },      // Total: 100
                { id: 'Both', health: 25, gold: 25, getGold: () => 25 },        // Total: 50
            ];

            const sorted = players.sort((a, b) => {
                const scoreA = a.health + a.getGold();
                const scoreB = b.health + b.getGold();
                return scoreA - scoreB;
            });

            // No Health and Both have same total (50), should come before No Gold (100)
            expect(sorted[0].health + sorted[0].getGold()).toBe(50);
            expect(sorted[1].health + sorted[1].getGold()).toBe(50);
            expect(sorted[2].id).toBe('No Gold');
        });
    });
});
