import Phaser from 'phaser';
import { Tile, TerrainType } from '../models';

// Define colors for different terrain types
const TERRAIN_COLORS = {
    [TerrainType.GRASS]: 0x7CFC00,     // Bright green
    [TerrainType.WATER]: 0x1E90FF,     // Bright blue
    [TerrainType.FOREST]: 0x228B22,    // Forest green
    [TerrainType.MOUNTAIN]: 0x808080,  // Gray
    [TerrainType.EMPTY]: 0x000000      // Black
};

/**
 * Renders the given map data onto the Phaser scene.
 * @param map The 2D array of Tile objects representing the game map.
 * @param scene The Phaser.Scene to render the map on.
 * @param tileSize The size of each tile in pixels.
 * @returns The graphics object created for rendering the map.
 */
export function renderMap(map: Tile[][], scene: Phaser.Scene, tileSize: number = 32): Phaser.GameObjects.Graphics {
    const graphics = scene.add.graphics();
    
    // Draw each tile
    for (let y = 0; y < map.length; y++) {
        for (let x = 0; x < map[y].length; x++) {
            const tile = map[y][x];
            const color = TERRAIN_COLORS[tile.terrainType];
            
            // Fill the tile with the terrain color
            graphics.fillStyle(color, 1);
            graphics.fillRect(x * tileSize, y * tileSize, tileSize, tileSize);
            
            // Draw grid line
            graphics.lineStyle(1, 0x000000, 0.3);
            graphics.strokeRect(x * tileSize, y * tileSize, tileSize, tileSize);
        }
    }
    
    // Return graphics object so the scene can manipulate it if needed
    return graphics;
}

/**
 * Highlights a specific tile on the map.
 * @param tile The tile to highlight.
 * @param scene The Phaser.Scene to draw on.
 * @param tileSize The size of each tile in pixels.
 * @returns The graphics object created for the highlight.
 */
export function highlightTile(tile: Tile, scene: Phaser.Scene, tileSize: number = 32): Phaser.GameObjects.Graphics {
    const highlight = scene.add.graphics();
    highlight.lineStyle(2, 0xFFFF00, 1);
    highlight.strokeRect(tile.x * tileSize, tile.y * tileSize, tileSize, tileSize);
    return highlight;
}

/**
 * Adds a visual indicator for the player's yurt units.
 * @param x The x coordinate of the yurt (in tile coordinates).
 * @param y The y coordinate of the yurt (in tile coordinates).
 * @param scene The Phaser.Scene to add the yurt to.
 * @param tileSize The size of each tile in pixels.
 * @returns The sprite object representing the yurt.
 */
export function addYurtToMap(x: number, y: number, scene: Phaser.Scene, tileSize: number = 32): Phaser.GameObjects.Sprite {
    // Create a yurt sprite at the given tile position
    const yurt = scene.add.sprite(
        x * tileSize + tileSize / 2, 
        y * tileSize + tileSize / 2, 
        'yurt'
    );
    
    // Scale it to fit within the tile
    yurt.setDisplaySize(tileSize * 0.8, tileSize * 0.8);
    
    return yurt;
} 