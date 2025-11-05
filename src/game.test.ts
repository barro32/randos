import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Player } from './player';

// Mock Phaser at the module level
vi.mock('phaser', () => {
    return {
        default: {},
        AUTO: 'AUTO',
        GameObjects: {
            Rectangle: class {},
            Graphics: class {
                lineStyle = vi.fn().mockReturnThis();
                strokeRect = vi.fn().mockReturnThis();
                fillStyle = vi.fn().mockReturnThis();
                fillRect = vi.fn().mockReturnThis();
                clear = vi.fn().mockReturnThis();
            },
            Container: class {
                add = vi.fn();
                setPosition = vi.fn().mockReturnThis();
                setVisible = vi.fn().mockReturnThis();
            },
            Text: class {
                setText = vi.fn().mockReturnThis();
                setOrigin = vi.fn().mockReturnThis();
            }
        },
        Math: {
            Vector2: class {
                x = 0;
                y = 0;
                constructor(x?: number, y?: number) {
                    this.x = x || 0;
                    this.y = y || 0;
                }
                normalize() {
                    const length = Math.sqrt(this.x * this.x + this.y * this.y);
                    if (length > 0) {
                        this.x /= length;
                        this.y /= length;
                    }
                    return this;
                }
                scale(s: number) {
                    this.x *= s;
                    this.y *= s;
                    return this;
                }
                set(x: number, y: number) {
                    this.x = x;
                    this.y = y;
                    return this;
                }
                setToPolar(angle: number, magnitude: number) {
                    this.x = Math.cos(angle) * magnitude;
                    this.y = Math.sin(angle) * magnitude;
                    return this;
                }
                angle() {
                    return Math.atan2(this.y, this.x);
                }
                lengthSq() {
                    return this.x * this.x + this.y * this.y;
                }
            },
            Between: (min: number, max: number) => {
                return Math.floor(Math.random() * (max - min + 1)) + min;
            },
            Angle: {
                Between: (x1: number, y1: number, x2: number, y2: number) => {
                    return Math.atan2(y2 - y1, x2 - x1);
                }
            }
        },
        Physics: {
            Arcade: {
                Body: class {
                    velocity = { x: 0, y: 0, lengthSq: () => 0 };
                    setCollideWorldBounds = vi.fn();
                    setBounce = vi.fn();
                    setVelocity = vi.fn();
                    onWorldBounds = false;
                }
            }
        },
        Scene: class {
            add = {
                rectangle: vi.fn(),
                graphics: vi.fn(),
                container: vi.fn(),
                text: vi.fn(),
                existing: vi.fn()
            };
            physics = {
                add: {
                    existing: vi.fn(),
                    collider: vi.fn()
                },
                world: {
                    on: vi.fn(),
                    setBounds: vi.fn()
                }
            };
            tweens = {
                add: vi.fn()
            };
            time = {
                now: 0,
                addEvent: vi.fn()
            };
            cameras = {
                main: {
                    width: 1200,
                    height: 900,
                    setBounds: vi.fn(),
                    setZoom: vi.fn()
                }
            };
            scene = {
                key: 'test'
            };
        },
        Game: class {
            destroy = vi.fn();
        },
        Scale: {
            FIT: 'FIT',
            CENTER_BOTH: 'CENTER_BOTH'
        },
        Types: {
            Core: {}
        }
    };
});

describe('Round HP Regeneration', () => {
    let mockScene: any;
    let players: Player[];
    const playerCount = 4; // Test with 4 players

    beforeEach(() => {
        vi.clearAllMocks();
        mockScene = {
            add: {
                rectangle: vi.fn((x: number, y: number, w: number, h: number, color: number) => ({
                    x,
                    y,
                    body: null,
                    height: h,
                    setStrokeStyle: vi.fn(),
                    setFillStyle: vi.fn(),
                    setAlpha: vi.fn(),
                    setActive: vi.fn(function() { return this; }),
                    setVisible: vi.fn(function() { return this; }),
                    setScale: vi.fn(function() { return this; }),
                    setPosition: vi.fn(function(newX: number, newY: number) {
                        this.x = newX;
                        this.y = newY;
                        return this;
                    }),
                    destroy: vi.fn()
                }))
            },
            physics: {
                add: {
                    existing: vi.fn((obj: any) => {
                        obj.body = {
                            velocity: { x: 0, y: 0, lengthSq: () => 0 },
                            setCollideWorldBounds: vi.fn(),
                            setBounce: vi.fn(),
                            setVelocity: vi.fn((x: number, y: number) => {
                                obj.body.velocity.x = x;
                                obj.body.velocity.y = y;
                            }),
                            onWorldBounds: false
                        };
                        return obj;
                    })
                },
                world: {
                    on: vi.fn()
                }
            },
            tweens: {
                add: vi.fn()
            },
            time: {
                now: 0
            }
        };

        // Create test players
        players = [];
        for (let i = 0; i < playerCount; i++) {
            const player = new Player(mockScene, 100 + i * 50, 100, `Player ${i + 1}`, 0xff0000);
            players.push(player);
        }
    });

    it('should heal each player by 10% of max health per player at round end', () => {
        // Set all players to low health (50 HP)
        players.forEach(player => {
            player.health = 50;
        });

        // Expected healing: 4 players * 10% * 150 max HP = 60 HP
        const expectedHealAmount = playerCount * 0.10 * 150;
        const expectedHealth = 50 + expectedHealAmount; // 50 + 60 = 110

        // Simulate healing that would happen in resetRound
        players.forEach(player => {
            const healAmount = player.maxHealth * playerCount * 0.10;
            player.heal(healAmount);
        });

        // Verify all players have the correct health
        players.forEach(player => {
            expect(player.health).toBe(expectedHealth);
        });
    });

    it('should not exceed max health when healing at round end', () => {
        // Set players to near-max health
        players.forEach(player => {
            player.health = 140;
        });

        // Expected healing: 4 players * 10% * 150 max HP = 60 HP
        // 140 + 60 = 200, but should cap at maxHealth (150)

        // Simulate healing that would happen in resetRound
        players.forEach(player => {
            const healAmount = player.maxHealth * playerCount * 0.10;
            player.heal(healAmount);
        });

        // Verify all players are at max health (capped)
        players.forEach(player => {
            expect(player.health).toBe(player.maxHealth);
        });
    });

    it('should heal by 20% total with 2 players', () => {
        const twoPlayerCount = 2;
        const twoPlayers = [
            new Player(mockScene, 100, 100, 'Player 1', 0xff0000),
            new Player(mockScene, 150, 100, 'Player 2', 0x00ff00)
        ];

        // Set both players to low health
        twoPlayers.forEach(player => {
            player.health = 50;
        });

        // Expected healing: 2 players * 10% * 150 max HP = 30 HP
        const expectedHealAmount = twoPlayerCount * 0.10 * 150;
        const expectedHealth = 50 + expectedHealAmount; // 50 + 30 = 80

        // Simulate healing
        twoPlayers.forEach(player => {
            const healAmount = player.maxHealth * twoPlayerCount * 0.10;
            player.heal(healAmount);
        });

        // Verify
        twoPlayers.forEach(player => {
            expect(player.health).toBe(expectedHealth);
        });
    });

    it('should heal by 80% total with 8 players', () => {
        const eightPlayerCount = 8;
        const eightPlayers = [];
        for (let i = 0; i < eightPlayerCount; i++) {
            const player = new Player(mockScene, 100 + i * 30, 100, `Player ${i + 1}`, 0xff0000);
            eightPlayers.push(player);
        }

        // Set all players to very low health
        eightPlayers.forEach(player => {
            player.health = 10;
        });

        // Expected healing: 8 players * 10% * 150 max HP = 120 HP
        const expectedHealAmount = eightPlayerCount * 0.10 * 150;
        const expectedHealth = 10 + expectedHealAmount; // 10 + 120 = 130

        // Simulate healing
        eightPlayers.forEach(player => {
            const healAmount = player.maxHealth * eightPlayerCount * 0.10;
            player.heal(healAmount);
        });

        // Verify
        eightPlayers.forEach(player => {
            expect(player.health).toBe(expectedHealth);
        });
    });

    it('should work correctly when players have different max health values', () => {
        // Increase one player's max health
        players[0].increaseMaxHealth(50); // Now has 200 max health

        // Set all players to 50 HP
        players.forEach(player => {
            player.health = 50;
        });

        // Player 0: 4 * 10% * 200 = 80 HP healing -> 50 + 80 = 130 HP
        // Other players: 4 * 10% * 150 = 60 HP healing -> 50 + 60 = 110 HP

        // Simulate healing
        players.forEach(player => {
            const healAmount = player.maxHealth * playerCount * 0.10;
            player.heal(healAmount);
        });

        // Verify
        expect(players[0].health).toBe(130); // Player with 200 max health
        expect(players[1].health).toBe(110); // Standard players
        expect(players[2].health).toBe(110);
        expect(players[3].health).toBe(110);
    });
});
