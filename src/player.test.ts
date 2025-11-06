import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Player } from './player';
import { items } from './items';

// Mock Phaser at the module level
vi.mock('phaser', () => {
    return {
        default: {},
        GameObjects: {
            Rectangle: class {}
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
            }
        },
        Physics: {
            Arcade: {
                Body: class {}
            }
        },
        Scene: class {}
    };
});

describe('Player Class', () => {
    let mockScene: any;
    let player: Player;

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
        player = new Player(mockScene, 100, 100, 'TestPlayer', 0xff0000);
    });

    describe('Constructor', () => {
        it('should initialize with correct default values', () => {
            expect(player.id).toBe('TestPlayer');
            expect(player.color).toBe(0xff0000);
            expect(player.health).toBe(150);
            expect(player.maxHealth).toBe(150);
            expect(player.gold).toBe(10);
            expect(player.isAlive).toBe(true);
            expect(player.justDied).toBe(false);
            expect(player.isInvulnerable).toBe(false);
            expect(player.inventory).toEqual([]);
            expect(player.moveSpeed).toBe(50);
            expect(player.attackDamage).toBe(15);
            expect(player.defense).toBe(0);
        });

        it('should create a sprite with correct properties', () => {
            expect(player.sprite).toBeDefined();
            expect(player.sprite.setStrokeStyle).toHaveBeenCalledWith(2, 0xffffff);
        });

        it('should set up physics body correctly', () => {
            expect(mockScene.physics.add.existing).toHaveBeenCalledWith(player.sprite);
            expect(player.sprite.body).toBeDefined();
        });

        it('should initialize velocity vector', () => {
            expect(player.currentVelocity).toBeDefined();
            expect(player.currentVelocity.x).toBeDefined();
            expect(player.currentVelocity.y).toBeDefined();
        });
    });

    describe('Health Management', () => {
        it('should calculate health percentage correctly', () => {
            player.health = 75;
            expect(player.getHealthPercentage()).toBe(50);
            
            player.health = 150;
            expect(player.getHealthPercentage()).toBe(100);
            
            player.health = 0;
            expect(player.getHealthPercentage()).toBe(0);
        });

        it('should take damage correctly', () => {
            const initialHealth = player.health;
            player.takeDamage(30);
            expect(player.health).toBe(initialHealth - 30);
            expect(player.isAlive).toBe(true);
        });

        it('should apply defense when taking damage', () => {
            player.defense = 10;
            const initialHealth = player.health;
            player.takeDamage(30);
            expect(player.health).toBe(initialHealth - 20); // 30 - 10 defense
        });

        it('should not take negative damage when defense is higher than attack', () => {
            player.defense = 50;
            const initialHealth = player.health;
            player.takeDamage(30);
            expect(player.health).toBe(initialHealth); // No damage taken
        });

        it('should die when health reaches zero', () => {
            player.takeDamage(150);
            expect(player.health).toBe(0);
            expect(player.isAlive).toBe(false);
            expect(player.justDied).toBe(true);
        });

        it('should not take damage when already dead', () => {
            player.takeDamage(150);
            const healthAfterDeath = player.health;
            player.takeDamage(50);
            expect(player.health).toBe(healthAfterDeath);
        });

        it('should heal correctly', () => {
            player.health = 50;
            player.heal(30);
            expect(player.health).toBe(80);
        });

        it('should not heal above max health', () => {
            player.health = 140;
            player.heal(30);
            expect(player.health).toBe(player.maxHealth);
        });

        it('should increase max health and current health', () => {
            const initialHealth = player.health;
            const initialMaxHealth = player.maxHealth;
            player.increaseMaxHealth(25);
            expect(player.maxHealth).toBe(initialMaxHealth + 25);
            expect(player.health).toBe(initialHealth + 25);
        });
    });

    describe('Gold Management', () => {
        it('should return current gold', () => {
            expect(player.getGold()).toBe(10);
        });

        it('should add gold correctly', () => {
            player.addGold(50);
            expect(player.gold).toBe(60);
        });

        it('should remove gold with negative amount', () => {
            player.addGold(-5);
            expect(player.gold).toBe(5);
        });
    });

    describe('Combat Stats', () => {
        it('should increase damage', () => {
            const initialDamage = player.attackDamage;
            player.increaseDamage(10);
            expect(player.attackDamage).toBe(initialDamage + 10);
        });

        it('should increase defense', () => {
            const initialDefense = player.defense;
            player.increaseDefense(5);
            expect(player.defense).toBe(initialDefense + 5);
        });

        it('should increase speed', () => {
            const initialSpeed = player.moveSpeed;
            player.increaseSpeed(10);
            expect(player.moveSpeed).toBe(initialSpeed + 10);
        });
    });

    describe('Fight or Flight', () => {
        it('should initialize with zero fight or flight', () => {
            expect(player.fightOrFlight).toBe(0);
        });

        it('should adjust fight or flight positively', () => {
            player.adjustFightOrFlight(3);
            expect(player.fightOrFlight).toBe(3);
            player.adjustFightOrFlight(2);
            expect(player.fightOrFlight).toBe(5);
        });

        it('should adjust fight or flight negatively', () => {
            player.adjustFightOrFlight(-4);
            expect(player.fightOrFlight).toBe(-4);
            player.adjustFightOrFlight(-3);
            expect(player.fightOrFlight).toBe(-7);
        });

        it('should clamp fight or flight at +10', () => {
            player.adjustFightOrFlight(8);
            expect(player.fightOrFlight).toBe(8);
            player.adjustFightOrFlight(5);
            expect(player.fightOrFlight).toBe(10); // Clamped at 10
        });

        it('should clamp fight or flight at -10', () => {
            player.adjustFightOrFlight(-8);
            expect(player.fightOrFlight).toBe(-8);
            player.adjustFightOrFlight(-5);
            expect(player.fightOrFlight).toBe(-10); // Clamped at -10
        });

        it('should handle mixed positive and negative adjustments', () => {
            player.adjustFightOrFlight(5);
            expect(player.fightOrFlight).toBe(5);
            player.adjustFightOrFlight(-3);
            expect(player.fightOrFlight).toBe(2);
            player.adjustFightOrFlight(-4);
            expect(player.fightOrFlight).toBe(-2);
        });
    });

    describe('Invulnerability', () => {
        it('should set player as invulnerable', () => {
            player.setInvulnerable(1000);
            expect(player.isInvulnerable).toBe(true);
        });

        it('should remove invulnerability after duration', () => {
            player.setInvulnerable(1000);
            expect(player.isInvulnerable).toBe(true);
            
            // Simulate time passing beyond invulnerability duration
            player.update(1200);
            expect(player.isInvulnerable).toBe(false);
        });
    });

    describe('Inventory', () => {
        it('should start with empty inventory', () => {
            expect(player.inventory).toEqual([]);
        });

        it('should allow adding items to inventory', () => {
            player.inventory.push(items.sword);
            expect(player.inventory).toContain(items.sword);
            expect(player.inventory.length).toBe(1);
        });

        it('should allow multiple items in inventory', () => {
            player.inventory.push(items.sword);
            player.inventory.push(items.shield);
            expect(player.inventory.length).toBe(2);
        });
    });

    describe('Update Method', () => {
        it('should not update when player is dead', () => {
            player.isAlive = false;
            const initialVelocity = { ...player.currentVelocity };
            player.update(1000);
            // Velocity should not change
            expect(player.currentVelocity.x).toBe(initialVelocity.x);
            expect(player.currentVelocity.y).toBe(initialVelocity.y);
        });

        it('should maintain movement speed', () => {
            const speed = player.moveSpeed;
            player.update(1000);
            // After update, velocity magnitude should still be moveSpeed
            const velocityMagnitude = Math.sqrt(
                player.currentVelocity.x ** 2 + player.currentVelocity.y ** 2
            );
            expect(Math.abs(velocityMagnitude - speed)).toBeLessThan(0.01);
        });
    });

    describe('Leveling System', () => {
        it('should initialize with level 1 and 0 XP', () => {
            expect(player.level).toBe(1);
            expect(player.xp).toBe(0);
            expect(player.xpToNextLevel).toBe(100);
            expect(player.availableStatPoints).toBe(0);
        });

        it('should gain XP and not level up if below threshold', () => {
            player.addXP(50);
            expect(player.xp).toBe(50);
            expect(player.level).toBe(1);
            expect(player.availableStatPoints).toBe(0);
        });

        it('should level up when reaching XP threshold', () => {
            player.addXP(100);
            expect(player.level).toBe(2);
            expect(player.xp).toBe(0);
            expect(player.availableStatPoints).toBe(3);
            expect(player.xpToNextLevel).toBe(110); // 10% increase
        });

        it('should handle multiple level ups in one XP gain', () => {
            player.addXP(250); // Should level up twice (100 + 110 = 210)
            expect(player.level).toBe(3);
            expect(player.xp).toBe(40); // 250 - 100 - 110 = 40
            expect(player.availableStatPoints).toBe(6); // 3 points per level * 2 levels
        });

        it('should increase XP requirement by 10% each level', () => {
            player.addXP(100); // Level 2
            expect(player.xpToNextLevel).toBe(110);
            player.addXP(110); // Level 3
            expect(player.xpToNextLevel).toBe(121); // 110 * 1.1 = 121
        });

        it('should not gain XP when dead', () => {
            player.isAlive = false;
            player.addXP(100);
            expect(player.xp).toBe(0);
            expect(player.level).toBe(1);
        });

        it('should allocate stat point to damage', () => {
            player.availableStatPoints = 3;
            const initialDamage = player.attackDamage;
            const result = player.allocateStatPoint('damage');
            expect(result).toBe(true);
            expect(player.attackDamage).toBe(initialDamage + 5);
            expect(player.availableStatPoints).toBe(2);
        });

        it('should allocate stat point to speed', () => {
            player.availableStatPoints = 3;
            const initialSpeed = player.moveSpeed;
            const result = player.allocateStatPoint('speed');
            expect(result).toBe(true);
            expect(player.moveSpeed).toBe(initialSpeed + 5);
            expect(player.availableStatPoints).toBe(2);
        });

        it('should allocate stat point to health', () => {
            player.availableStatPoints = 3;
            const initialMaxHealth = player.maxHealth;
            const initialHealth = player.health;
            const result = player.allocateStatPoint('health');
            expect(result).toBe(true);
            expect(player.maxHealth).toBe(initialMaxHealth + 20);
            expect(player.health).toBe(initialHealth + 20);
            expect(player.availableStatPoints).toBe(2);
        });

        it('should not allocate stat point when none available', () => {
            player.availableStatPoints = 0;
            const initialDamage = player.attackDamage;
            const result = player.allocateStatPoint('damage');
            expect(result).toBe(false);
            expect(player.attackDamage).toBe(initialDamage);
        });

        it('should gain XP over time (1 XP per second)', () => {
            mockScene.time.now = 1000;
            player.updateXPGain(1000);
            
            mockScene.time.now = 2000;
            player.updateXPGain(2000);
            
            expect(player.xp).toBe(1);
            
            mockScene.time.now = 3000;
            player.updateXPGain(3000);
            
            expect(player.xp).toBe(2);
        });

        it('should gain multiple XP if more than 1 second has passed', () => {
            mockScene.time.now = 1000;
            player.updateXPGain(1000);
            
            mockScene.time.now = 4000; // 3 seconds later
            player.updateXPGain(4000);
            
            expect(player.xp).toBe(3);
        });

        it('should not gain XP over time when dead', () => {
            player.isAlive = false;
            mockScene.time.now = 1000;
            player.updateXPGain(1000);
            
            mockScene.time.now = 2000;
            player.updateXPGain(2000);
            
            expect(player.xp).toBe(0);
        });
    });

    describe('Destroy', () => {
        it('should destroy the sprite', () => {
            player.destroy();
            expect(player.sprite.destroy).toHaveBeenCalled();
        });

        it('should handle destroy when sprite is null', () => {
            player.sprite = null as any;
            expect(() => player.destroy()).not.toThrow();
        });
    });
});
