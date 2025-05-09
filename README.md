# TownYurd
Town Builder Roguelike

**TownYurd** is a roguelike town-builder where you manage a nomadic yurt community in a procedurally generated world.

## Features
- Procedurally generated terrain (grass, water, forests, mountains)
- Place yurts to expand your settlement
- Resource management (food, wood)
- Morale system for your yurt dwellers

## Development

To get started with development:

1.  **Install dependencies:**
    ```bash
    npm install
    ```

2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will open the game in your default web browser, typically at `http://localhost:8080`.

## How to Play
- Use WASD or arrow keys to pan the camera around the map
- Press P to enter yurt placement mode, then click on a valid tile to place a yurt (costs 25 wood)
- Click on any tile to select it
- Monitor your resources in the UI panel

## Building for Production

To create a production build:

```bash
npm run build
```
This will compile the TypeScript and bundle the assets into the `dist/` directory.
