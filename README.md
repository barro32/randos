# randos

A collection of random utilities and tools for various development tasks.

## Description

Randos is a project designed to house miscellaneous utilities, scripts, and tools that can be useful for developers. This repository serves as a collection point for various random but potentially useful code snippets and tools.

## Randos Battle Arena

A web-based 2D battle game built with TypeScript and Phaser.js where players fight in an arena until only one remains!

### Game Features

- **Player Selection**: Choose between 2-8 players to battle
- **Random Movement**: Players move randomly around the arena
- **Combat System**: Players deal damage when they collide with each other
- **Health System**: Players are eliminated when their HP reaches zero
- **Win Condition**: Last player standing wins the game
- **Real-time UI**: Live health bars and player count updates

### How to Play

1. Select the number of players (2-8)
2. Click "Start Game" to begin the battle
3. Watch as players move randomly and battle each other
4. The game ends when only one player remains
5. Use "Restart Game" to play again

### Running the Game

**Play Online**: The game is automatically deployed to GitHub Pages and can be played at: https://barro32.github.io/randos/

**Local Development**:
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build:prod
```

The game will be available at `http://localhost:8080` when running the development server.

## Setup

To set up this project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/barro32/randos.git
   ```

2. Navigate to the project directory:
   ```bash
   cd randos
   ```

3. Install dependencies and run the battle arena game:
   ```bash
   npm install
   npm run dev
   ```