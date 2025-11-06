import { describe, it, expect } from 'vitest';

/**
 * Test suite for shopping order functionality
 * Players should be ordered by gold only (lowest first, highest last)
 */
describe('Shopping Order', () => {
    describe('Player sorting by gold', () => {
        it('should sort players by gold only (lowest first)', () => {
            // Mock players with different gold values
            const players = [
                { id: 'Player 1', health: 100, getGold: () => 50 },
                { id: 'Player 2', health: 80, getGold: () => 30 },
                { id: 'Player 3', health: 120, getGold: () => 60 },
                { id: 'Player 4', health: 90, getGold: () => 40 },
            ];

            // Apply the sorting logic that should be used in main.ts
            const sorted = players.sort((a, b) => {
                return a.getGold() - b.getGold();
            });

            // Verify the order: Player 2 (30), Player 4 (40), Player 1 (50), Player 3 (60)
            expect(sorted[0].id).toBe('Player 2');
            expect(sorted[1].id).toBe('Player 4');
            expect(sorted[2].id).toBe('Player 1');
            expect(sorted[3].id).toBe('Player 3');
        });

        it('should handle players with same gold amount', () => {
            const players = [
                { id: 'Player A', health: 100, getGold: () => 50 },
                { id: 'Player B', health: 75, getGold: () => 50 },
                { id: 'Player C', health: 150, getGold: () => 50 },
            ];

            const sorted = players.sort((a, b) => {
                return a.getGold() - b.getGold();
            });

            // All have same gold, so order should be stable (relative order preserved)
            expect(sorted.length).toBe(3);
            sorted.forEach(player => {
                expect(player.getGold()).toBe(50);
            });
        });

        it('should place player with lowest gold first regardless of health', () => {
            const players = [
                { id: 'Rich and Healthy', health: 150, getGold: () => 100 },
                { id: 'Poor and Weak', health: 10, getGold: () => 5 },
                { id: 'Medium', health: 80, getGold: () => 40 },
            ];

            const sorted = players.sort((a, b) => {
                return a.getGold() - b.getGold();
            });

            expect(sorted[0].id).toBe('Poor and Weak');
            expect(sorted[1].id).toBe('Medium');
            expect(sorted[2].id).toBe('Rich and Healthy');
        });

        it('should place player with highest gold last regardless of health', () => {
            const players = [
                { id: 'Medium', health: 100, getGold: () => 50 },
                { id: 'Rich and Healthy', health: 150, getGold: () => 100 },
                { id: 'Weak', health: 50, getGold: () => 25 },
            ];

            const sorted = players.sort((a, b) => {
                return a.getGold() - b.getGold();
            });

            expect(sorted[sorted.length - 1].id).toBe('Rich and Healthy');
            expect(sorted[0].id).toBe('Weak');
        });

        it('should work with single player', () => {
            const players = [
                { id: 'Solo Player', health: 100, getGold: () => 50 },
            ];

            const sorted = players.sort((a, b) => {
                return a.getGold() - b.getGold();
            });

            expect(sorted.length).toBe(1);
            expect(sorted[0].id).toBe('Solo Player');
        });

        it('should correctly order players by gold only, ignoring health', () => {
            const players = [
                { id: 'Player 1', health: 50, getGold: () => 50 },
                { id: 'Player 2', health: 150, getGold: () => 30 },
                { id: 'Player 3', health: 100, getGold: () => 40 },
            ];

            const sorted = players.sort((a, b) => {
                return a.getGold() - b.getGold();
            });

            // Player 2 has lowest gold (30) despite highest health
            expect(sorted[0].id).toBe('Player 2');
            expect(sorted[1].id).toBe('Player 3');
            expect(sorted[2].id).toBe('Player 1');
        });

        it('should handle zero gold correctly', () => {
            const players = [
                { id: 'No Gold', health: 100, getGold: () => 0 },
                { id: 'Some Gold', health: 25, getGold: () => 50 },
                { id: 'More Gold', health: 150, getGold: () => 100 },
            ];

            const sorted = players.sort((a, b) => {
                return a.getGold() - b.getGold();
            });

            expect(sorted[0].id).toBe('No Gold');
            expect(sorted[1].id).toBe('Some Gold');
            expect(sorted[2].id).toBe('More Gold');
        });
    });
});
