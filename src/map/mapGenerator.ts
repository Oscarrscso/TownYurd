import { Tile, TerrainType } from '../models';

/**
 * Generates a map with various terrain types.
 * @param rows The number of rows in the map.
 * @param cols The number of columns in the map.
 * @returns A 2D array of Tile objects.
 */
export function generateMap(rows: number, cols: number): Tile[][] {
    const map: Tile[][] = [];
    
    // Create a base map of grass
    for (let y = 0; y < rows; y++) {
        map[y] = [];
        for (let x = 0; x < cols; x++) {
            map[y][x] = {
                x,
                y,
                terrainType: TerrainType.GRASS,
            };
        }
    }
    
    // Add some water features (simple algorithm for demonstration)
    addWaterFeatures(map, rows, cols);
    
    // Add some forests
    addForests(map, rows, cols);
    
    // Add some mountains
    addMountains(map, rows, cols);
    
    return map;
}

/**
 * Adds water features to the map.
 */
function addWaterFeatures(map: Tile[][], rows: number, cols: number): void {
    // Add a river that flows from top to bottom
    const riverX = Math.floor(cols * 0.7);
    for (let y = 0; y < rows; y++) {
        map[y][riverX].terrainType = TerrainType.WATER;
        
        // Make the river meander slightly
        const offset = Math.floor(Math.sin(y * 0.5) * 2);
        if (riverX + offset >= 0 && riverX + offset < cols) {
            map[y][riverX + offset].terrainType = TerrainType.WATER;
        }
    }
    
    // Add a small lake
    const lakeX = Math.floor(cols * 0.3);
    const lakeY = Math.floor(rows * 0.3);
    const lakeSize = 3;
    
    for (let y = lakeY - lakeSize; y <= lakeY + lakeSize; y++) {
        for (let x = lakeX - lakeSize; x <= lakeX + lakeSize; x++) {
            if (y >= 0 && y < rows && x >= 0 && x < cols) {
                // Create a circular-ish lake
                const distance = Math.sqrt(Math.pow(y - lakeY, 2) + Math.pow(x - lakeX, 2));
                if (distance <= lakeSize) {
                    map[y][x].terrainType = TerrainType.WATER;
                }
            }
        }
    }
}

/**
 * Adds forests to the map.
 */
function addForests(map: Tile[][], rows: number, cols: number): void {
    // Add a few forest patches
    const forestPatches = 5;
    for (let i = 0; i < forestPatches; i++) {
        const forestX = Math.floor(Math.random() * cols);
        const forestY = Math.floor(Math.random() * rows);
        const forestSize = 2 + Math.floor(Math.random() * 3);
        
        for (let y = forestY - forestSize; y <= forestY + forestSize; y++) {
            for (let x = forestX - forestSize; x <= forestX + forestSize; x++) {
                if (y >= 0 && y < rows && x >= 0 && x < cols) {
                    // Don't overwrite water
                    if (map[y][x].terrainType !== TerrainType.WATER) {
                        // Create forests with random density
                        const distance = Math.sqrt(Math.pow(y - forestY, 2) + Math.pow(x - forestX, 2));
                        if (distance <= forestSize && Math.random() > 0.3) {
                            map[y][x].terrainType = TerrainType.FOREST;
                        }
                    }
                }
            }
        }
    }
}

/**
 * Adds mountains to the map.
 */
function addMountains(map: Tile[][], rows: number, cols: number): void {
    // Add a mountain range
    const mountainRangeStart = Math.floor(cols * 0.1);
    const mountainRangeWidth = Math.floor(cols * 0.2);
    
    for (let y = 0; y < rows; y++) {
        // Make the mountain range follow a slight curve
        const offset = Math.floor(Math.sin(y * 0.2) * 3);
        
        for (let x = mountainRangeStart + offset; x < mountainRangeStart + mountainRangeWidth + offset && x < cols; x++) {
            if (x >= 0 && y >= 0 && y < rows && x < cols) {
                // Don't overwrite water
                if (map[y][x].terrainType !== TerrainType.WATER) {
                    // Create mountains with varying probability to make them look natural
                    const noise = Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.5 + 0.5;
                    if (noise > 0.7 || (x === mountainRangeStart + offset && noise > 0.3)) {
                        map[y][x].terrainType = TerrainType.MOUNTAIN;
                    }
                }
            }
        }
    }
} 